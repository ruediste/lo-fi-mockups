import JSZip from "jszip";
import { ProjectData } from "./model/Project";

import { DBSchema, IDBPDatabase, openDB } from "idb";
import { ModelEvent } from "./model/ModelEvent";

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

class Repository {
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

export const repository = Repository.create();
