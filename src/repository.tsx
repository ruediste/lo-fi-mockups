import JSZip from "jszip";
import { Project, ProjectData } from "./model/Project";

import { RenderPageItems } from "@/editor/Editor";
import { DBSchema, IDBPDatabase, openDB } from "idb";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { CanvasProjection } from "./editor/Canvas";
import { ModelEvent } from "./model/ModelEvent";
import { Vec2d } from "./Vec2d";
import { Rectangle } from "./widgets/Widget";

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

    const data = { ...this.projectData };
    const project = new Project(data, () => {});
    const projection = new CanvasProjection();
    data.pages.forEach((pageData, pageNr) => {
      project.selectPage(pageData);
      const page = project.currentPage!;
      const rootElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      const root = createRoot(rootElement);
      flushSync(() => {
        root.render(<RenderPageItems page={page} projection={projection} />);
      });
      const items = page.masterItems.concat(page.ownItems);
      let drawBox: Rectangle | undefined;
      if (items.length > 0) {
        const margin = 32;
        const box = Vec2d.boundingBoxRect(
          ...items.map((item) => item.boundingBox)
        );

        drawBox = {
          x: box.x - margin,
          y: box.y - margin,
          width: box.width + 2 * margin,
          height: box.height + 2 * margin,
        };
      } else drawBox = { x: 0, y: 0, width: 100, height: 100 };

      zip.file(
        "pages/" + pageNr + ".svg",
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${page.boundingViewBox(
          32
        )}">` +
          rootElement.innerHTML +
          "</svg>"
      );
    });

    return await zip.generateAsync({ type: "blob" });
  }

  async loadZip(data: Blob) {
    const zip = await JSZip.loadAsync(data, {});
    this.projectData = JSON.parse(
      await zip.file("project.json")!.async("string")
    );
    this.onChanged.notify();
  }
}
