import JSZip from "jszip";
import { Project, ProjectData } from "../model/Project";

import { Page, PageData } from "@/model/Page";
import {
  PageItemRenderContext,
  PageItemRenderContextType,
} from "@/model/PageItem";
import { toSet } from "@/util/utils";
import * as htmlToImage from "@ruediste/html-to-image";
import {
  parseBlobEntry,
  toBlobChunk,
  transformPng,
} from "@ruediste/png-transformer";
import { DBSchema, IDBPDatabase, openDB } from "idb";
import jsPDF from "jspdf";
import { Fragment } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { ModelEvent } from "../model/ModelEvent";
import { globalSvgContent, IRectangle } from "../widgets/Widget";

const migrators: ((data: any) => void)[] = [
  // add data version
  (data) => {
    data.dataVersion = 0;
  },
];

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

export type LofiFileType = "lofi" | "png";

export class Repository {
  onChanged = new ModelEvent();

  constructor(
    public projectData: ProjectData,
    private db: IDBPDatabase<MyDB>,
  ) {}

  static async create(): Promise<Repository> {
    const db = await openDB<MyDB>("lo-fi-current", 1, {
      upgrade(db) {
        db.createObjectStore("project");
        db.createObjectStore("images");
      },
    });
    if (import.meta.env.VITE_VARIANT === "native") {
      db.clear("project");
      db.clear("images");
    }

    var result = new Repository(await this.loadFromDb(db), db);

    return result;
  }

  private static createEmptyData(): ProjectData {
    return {
      schemaVersion: migrators.length,
      dataVersion: 0,
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
    this.projectData = Repository.createEmptyData();
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
    return (await db.get("project", "default")) ?? Repository.createEmptyData();
  }

  async loadProject(
    data: Blob,
    skipIfDataVersionMatches: boolean,
    pageNr?: number,
  ): Promise<LofiFileType> {
    let type: LofiFileType = "lofi";
    const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const header = new Uint8Array(await data.slice(0, 8).arrayBuffer());
    if (header.every((byte, index) => byte === PNG_SIGNATURE[index])) {
      // this is a PNG file, try to extract the zip from the "lofi" chunk

      let foundData: ArrayBuffer | undefined = undefined;
      await transformPng(data, async (args) => {
        const blobEntry = parseBlobEntry(args.chunk);
        if (blobEntry?.key === "lofi") {
          foundData = blobEntry.data;
        }
      });

      if (!foundData) {
        throw new Error("PNG file does not contain a 'lofi' chunk");
      }
      data = new Blob([foundData]);
      type = "png";
    }

    const zip = await JSZip.loadAsync(data, {});
    const loadedData: ProjectData = JSON.parse(
      await zip.file("project.json")!.async("string"),
    );

    // apply migrators
    for (
      let schemaVersion = loadedData.schemaVersion ?? 0; // version 0 did not yet have the schemaVersion field
      schemaVersion < migrators.length;
      schemaVersion++
    ) {
      migrators[schemaVersion](loadedData);
    }
    loadedData.schemaVersion = migrators.length;

    if (
      !skipIfDataVersionMatches ||
      loadedData.dataVersion != this.projectData.dataVersion
    )
      this.projectData = loadedData;

    if (pageNr !== undefined) {
      if (pageNr < this.projectData.pages.length) {
        this.projectData.currentPageId = this.projectData.pages[pageNr].id;
      }
    }
    this.onChanged.notify();
    return type;
  }

  async createZip(
    includeImages: boolean,
    progress?: (processed: number, total: number) => void,
  ) {
    const zip = new JSZip();
    zip.file("project.json", JSON.stringify(this.projectData));
    zip.file("version.txt", "1");
    progress?.(0, this.projectData.pages.length);
    if (includeImages)
      await this.generatePageImages(async ({ element, pageNr }) => {
        const dataUrl = await htmlToImage.toPng((await element(1))[0]);
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        zip.file("pages/" + pageNr + ".png", blob);
        progress?.(pageNr + 1, this.projectData.pages.length);
      });

    return await zip.generateAsync({ type: "blob" });
  }

  async createPng() {
    const data = { ...this.projectData };
    const project = new Project(data, () => {});
    const [root, element] = this.renderPage(project.currentPage!, 2);
    const blob = await htmlToImage.toBlob(element);
    // const dataUrl = await htmlToImage.toPng(element);
    // const response = await fetch(dataUrl);
    // const blob = await response.blob();
    root.remove();
    return blob!;
  }

  async createLofiPng(): Promise<Blob> {
    const zip = await this.createZip(false);
    const blob = await this.createPng();
    return (await transformPng(blob, async (args) => {
      args.passThrough(); // keep existing chunks

      if (args.chunk.type === "IHDR") {
        args.addChunk(toBlobChunk("lofi", await zip.arrayBuffer()));
      }
    })) as Blob;
  }

  private renderPage(page: Page, scale: number) {
    const box = page.boundingBox();
    const globalSvgContentId = "export-" + Math.random().toString(16).slice(2);
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
            {globalSvgContent(globalSvgContentId)}
            {page.masterItems.concat(page.ownItems).map((item, idx) => (
              <Fragment key={idx}>
                {item.renderContent(globalSvgContentId)}
              </Fragment>
            ))}
          </svg>
        </PageItemRenderContext.Provider>,
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
        scale: number,
      ) => Promise<[HTMLElement, { box: IRectangle; pageId: number }[]]>;
      pageNr: number;
      box: IRectangle;
    }) => Promise<void>,
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

  async createPdf(progress?: (processed: number, total: number) => void) {
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
        .filter((x) => x !== undefined),
    );
    const pageNrs = Object.fromEntries(
      this.projectData.pages
        .filter((p) => !masterPages.has(p.id))
        .map((p, idx) => [p.id, idx + 1]),
    );
    let firstPage = true;
    let processedPages = 0;
    const totalPages = this.projectData.pages.filter(
      (p) => !masterPages.has(p.id),
    ).length;
    progress?.(0, totalPages);
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
          (ratio / 25.1) * renderDpi,
        );
        doc.addImage(
          await htmlToImage.toCanvas(exportElement),
          "JPEG",
          left,
          top,
          width,
          height,
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
              },
            );
        });
        processedPages++;
        progress?.(processedPages, totalPages);
      },
    );

    return doc.output("blob");
  }
}
