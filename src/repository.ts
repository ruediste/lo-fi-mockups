import JSZip from "jszip";
import { ModelEvent } from "./model/ModelEvent";
import { ProjectData } from "./model/Project";

import { DBSchema, IDBPDatabase, openDB } from "idb";

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
  onChange = new ModelEvent();

  db?: IDBPDatabase<MyDB>;
  projectData: ProjectData | undefined;

  constructor() {
    this.initialize();
  }

  async initialize() {
    this.db = await openDB<MyDB>("test", 1, {
      upgrade(db) {
        db.createObjectStore("project");
        db.createObjectStore("images");
      },
    });

    this.projectData = await this.db.get("project", "default");
    if (this.projectData === undefined) {
      this.projectData = {
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

    this.onChange.notify();
  }

  async createZip() {
    const zip = new JSZip();
    zip.file("project.json", JSON.stringify(this.projectData));
    return await zip.generateAsync({ type: "blob" });
  }
}

export const repository = new Repository();
