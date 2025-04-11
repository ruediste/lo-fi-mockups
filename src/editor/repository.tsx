import JSZip from "jszip";
import { Project, ProjectData } from "../model/Project";

import { toSet } from "@/util/utils";
import * as htmlToImage from "html-to-image";
import { DBSchema, IDBPDatabase, openDB } from "idb";
import jsPDF from "jspdf";
import { Fragment } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { ModelEvent } from "../model/ModelEvent";
import { Rectangle } from "../widgets/Widget";

interface MyDB extends DBSchema {
  project: {
    key: string;
    value: ProjectData;
  };
  images: {
    key: number;
    value: Blob;
  };
}

export class Repository {
  onChanged = new ModelEvent();

  constructor(
    public projectData: ProjectData,
    private db: IDBPDatabase<MyDB>
  ) {}

  static async create(): Promise<Repository> {
    const db = await openDB<MyDB>("test", 1, {
      upgrade(db) {
        db.createObjectStore("project");
        db.createObjectStore("images");
      },
    });

    const projectData =
      (await db.get("project", "default")) ?? Repository.emptyData();

    return new Repository(projectData, db);
  }

  private static emptyData(): ProjectData {
    return {
      nextId: 2,
      currentPageId: 1,
      pages: [
        {
          id: 1,
          name: "Page 1",
          items: [],
          propertyValues: {},
          overrideableProperties: {},
        },
      ],
    };
  }

  clear() {
    this.projectData = Repository.emptyData();
    this.onChanged.notify();
  }

  async save() {
    await this.db!.put("project", await this.projectData, "default");
  }

  async createZip() {
    const zip = new JSZip();
    zip.file("project.json", JSON.stringify(this.projectData));

    await this.generatePageImages(async ({ element, pageNr }) => {
      const dataUrl = await htmlToImage.toPng(await element(1));
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      zip.file("pages/" + pageNr + ".png", blob);
    });

    return await zip.generateAsync({ type: "blob" });
  }

  async generatePageImages(
    handle: (args: {
      pageName: string;
      element: (scale: number) => Promise<HTMLElement>;
      pageNr: number;
      box: Rectangle;
    }) => Promise<void>
  ) {
    const data = { ...this.projectData };
    const project = new Project(data, () => {});
    let pageNr = 0;
    const masterPages = toSet(
      ...data.pages.map((p) => p.masterPageId).filter((x) => x !== undefined)
    );
    for (const pageData of data.pages) {
      if (masterPages.has(pageData.id)) continue;
      project.selectPage(pageData);
      const page = project.currentPage!;
      const box = page.boundingBox();
      const rootElement = document.createElement("div");
      await handle({
        box,
        pageName: page.data.name,
        pageNr,
        element: async (scale) => {
          rootElement.className = "export-helper";
          document.body.append(rootElement);
          const root = createRoot(rootElement);
          flushSync(() => {
            root.render(
              <svg
                style={{ background: "white" }}
                viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
                width={box.width * scale}
                height={box.height * scale}
              >
                {page.masterItems.concat(page.ownItems).map((item, idx) => (
                  <Fragment key={idx}>{item.renderContent()}</Fragment>
                ))}
              </svg>
            );
          });

          return rootElement.firstChild as HTMLElement;
        },
      });

      rootElement.remove();

      pageNr++;
    }
  }

  async savePdf() {
    const pageWidth = 297;
    const pageHeight = 210;
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [pageWidth, pageHeight],
    });
    const padding = 10;

    await this.generatePageImages(
      async ({ element, pageNr, box, pageName }) => {
        if (pageNr > 0) doc.addPage();
        const widthRatio = (pageWidth - 2 * padding) / box.width;
        const heightRatio = (pageHeight - 2 * padding) / box.height;
        const ratio = Math.min(widthRatio, heightRatio);
        const width = box.width * ratio;
        const height = box.height * ratio;
        const renderDpi = 300;

        doc.addImage(
          await htmlToImage.toCanvas(await element((ratio / 25.1) * renderDpi)),
          "JPEG",
          (pageWidth - width) / 2,
          (pageHeight - height) / 2,
          width,
          height
        );

        doc.text(`${pageNr + 1} - ${pageName}`, padding, pageHeight - 5);
      }
    );

    doc.save("export.pdf");
  }

  async loadZip(data: Blob) {
    const zip = await JSZip.loadAsync(data, {});
    this.projectData = JSON.parse(
      await zip.file("project.json")!.async("string")
    );
    this.onChanged.notify();
  }
}
