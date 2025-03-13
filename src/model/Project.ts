import { ModelEvent } from "./ModelEvent";
import { Page, PageData } from "./Page";

export interface ProjectData {
  nextId: number;
  pages: PageData[];
  currentPageId?: number;
}

export class Project {
  pageDataMap: { [id: number]: PageData } = {};
  onChange = new ModelEvent();

  currentPage?: Page;
  constructor(public data: ProjectData, public onDataChanged: () => void) {
    data.pages.forEach((page) => (this.pageDataMap[page.id] = page));
    this.recreateCurrentPage();
  }

  addPage() {
    const page: PageData = {
      id: this.data.nextId++,
      name: "Page " + (this.data.pages.length + 1),
      items: [],
      propertyValues: {},
      overrideableProperties: {},
    };

    this.data.pages.push(page);
    this.pageDataMap[page.id] = page;
    this.selectPage(page);
  }

  selectPage(page?: PageData) {
    this.data.currentPageId = page?.id;
    this.onDataChanged();
    this.recreateCurrentPage();
  }

  removePage(id: number) {
    this.data.pages = this.data.pages.filter((p) => p.id !== id);
    delete this.pageDataMap[id];
    if (this.data.currentPageId === id) this.data.currentPageId = undefined;

    this.onDataChanged();
    this.recreateCurrentPage();
  }

  reorderPages(newPages: PageData[]) {
    this.data.pages = newPages;
    this.onDataChanged();
    this.onChange.notify();
  }

  setMasterPage(pageId: number, masterPageId?: number) {
    console.log("setMasterPage", masterPageId);
    this.pageDataMap[pageId].masterPageId = masterPageId;
    this.recreateCurrentPage();
  }

  private recreateCurrentPage() {
    this.currentPage =
      this.data.currentPageId === undefined
        ? undefined
        : new Page(
            this.pageDataMap[this.data.currentPageId],
            this,
            this.onDataChanged
          );
    this.onChange.notify();
  }
}
