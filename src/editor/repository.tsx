import JSZip from "jszip";
import { Project, ProjectData } from "../model/Project";

import { Page, PageData } from "@/model/Page";
import {
  PageItemRenderContext,
  PageItemRenderContextType,
} from "@/model/PageItem";
import { toSet } from "@/util/utils";
import * as htmlToImage from "@ruediste/html-to-image";
import { DBSchema, IDBPDatabase, openDB } from "idb";
import jsPDF from "jspdf";
import { Fragment } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { ModelEvent } from "../model/ModelEvent";
import { globalSvgContent, IRectangle } from "../widgets/Widget";

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

    return new Repository(await this.loadFromDb(db), db);
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

  async reload() {
    this.projectData = await Repository.loadFromDb(this.db);
    this.onChanged.notify();
  }

  private static async loadFromDb(db: IDBPDatabase<MyDB>) {
    return (await db.get("project", "default")) ?? Repository.emptyData();
  }

  async loadZip(data: Blob) {
    const zip = await JSZip.loadAsync(data, {});
    this.projectData = JSON.parse(
      await zip.file("project.json")!.async("string")
    );
    this.onChanged.notify();
  }

  async createZip() {
    const zip = new JSZip();
    zip.file("project.json", JSON.stringify(this.projectData));
    zip.file("version.txt", "1");

    await this.generatePageImages(async ({ element, pageNr }) => {
      const dataUrl = await htmlToImage.toPng((await element(1))[0]);
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      zip.file("pages/" + pageNr + ".png", blob);
    });

    return await zip.generateAsync({ type: "blob" });
  }

  async createPng() {
    const data = { ...this.projectData };
    const project = new Project(data, () => {});
    const [root, element] = this.renderPage(project.currentPage!, 2);
    const dataUrl = await htmlToImage.toPng(element);
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    root.remove();
    return blob;
  }

  private renderPage(page: Page, scale: number) {
    const box = page.boundingBox();

    const rootElement = document.createElement("div");
    rootElement.className = "export-helper";
    document.body.append(rootElement);
    const root = createRoot(rootElement);
    const ctx: PageItemRenderContextType = {
      isPlay: false,
      isExport: true,
      links: [],
    };
    flushSync(() => {
      root.render(
        <PageItemRenderContext.Provider value={ctx}>
          <svg
            style={{ background: "white" }}
            viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
            width={box.width * scale}
            height={box.height * scale}
          >
            {globalSvgContent}
            {page.masterItems.concat(page.ownItems).map((item, idx) => (
              <Fragment key={idx}>{item.renderContent()}</Fragment>
            ))}
          </svg>
        </PageItemRenderContext.Provider>
      );
    });
    return [
      rootElement,
      rootElement.firstChild as HTMLElement,
      ctx.links,
    ] as const;
  }

  async generatePageImages(
    handle: (args: {
      pageName: string;
      pageData: PageData;
      element: (
        scale: number
      ) => Promise<[HTMLElement, { box: IRectangle; pageId: number }[]]>;
      pageNr: number;
      box: IRectangle;
    }) => Promise<void>
  ) {
    const data = { ...this.projectData };
    const project = new Project(data, () => {});
    let pageNr = 0;

    for (const pageData of data.pages) {
      project.selectPage(pageData);
      const page = project.currentPage!;
      const box = page.boundingBox();
      const rootElements: HTMLElement[] = [];
      await handle({
        box,
        pageName: page.data.name,
        pageNr,
        pageData: page.data,
        element: async (scale) => {
          const [rootElement, element, links] = this.renderPage(page, scale);
          rootElements.push(rootElement);
          return [element, links];
        },
      });

      rootElements.forEach((x) => x.remove());

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

    const masterPages = toSet(
      ...this.projectData.pages
        .map((p) => p.masterPageId)
        .filter((x) => x !== undefined)
    );
    const pageNrs = Object.fromEntries(
      this.projectData.pages
        .filter((p) => !masterPages.has(p.id))
        .map((p, idx) => [p.id, idx + 1])
    );
    let firstPage = true;
    await this.generatePageImages(
      async ({ element, box, pageName, pageData }) => {
        if (masterPages.has(pageData.id)) return;

        if (!firstPage) doc.addPage();
        firstPage = false;
        const widthRatio = (pageWidth - 2 * padding) / box.width;
        const heightRatio = (pageHeight - 2 * padding) / box.height;
        const ratio = Math.min(widthRatio, heightRatio);
        const width = box.width * ratio;
        const height = box.height * ratio;
        const renderDpi = 300;
        const left = (pageWidth - width) / 2;
        const top = (pageHeight - height) / 2;

        const [exportElement, links] = await element(
          (ratio / 25.1) * renderDpi
        );
        doc.addImage(
          await htmlToImage.toCanvas(exportElement),
          "JPEG",
          left,
          top,
          width,
          height
        );

        const pageNr = pageNrs[pageData.id];

        doc.outline.add(null, pageName, { pageNumber: pageNr });
        doc.text(`${pageNr} - ${pageName}`, padding, pageHeight - 5);
        links.forEach((l) => {
          if (l.pageId in pageNrs)
            doc.link(
              left + (l.box.x - box.x) * ratio,
              top + (l.box.y - box.y) * ratio,
              l.box.width * ratio,
              l.box.height * ratio,
              {
                pageNumber: pageNrs[l.pageId],
              }
            );
        });
      }
    );

    doc.save("export.pdf");
  }
}
