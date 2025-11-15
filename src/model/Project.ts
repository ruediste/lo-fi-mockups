import { Selection } from "@/editor/Selection";
import { getOwnPropertyNames } from "@/util/utils";
import { ModelEvent } from "./ModelEvent";
import { Page, PageData } from "./Page";
import { PageItemData } from "./PageItem";

export interface ProjectData {
  nextId: number;
  pages: PageData[];
  currentPageId?: number;
}

export class Project {
  pageDataMap: { [id: number]: PageData } = {};

  /// raised when there are any changes to the page list or when the current page switches to a different page
  onChange = new ModelEvent();

  currentPage?: Page;
  constructor(public data: ProjectData, public onDataChanged: () => void) {
    data.pages.forEach((page) => (this.pageDataMap[page.id] = page));
    this.updateMasterPages();
    this.recreateCurrentPage();
  }

  /// ids of all pages, which are a master page of another page
  masterPageIds = new Set<number>();

  nextId() {
    return this.data.nextId++;
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

  duplicatePage(page: PageData) {
    const itemMap: { [key: number]: PageItemData } = Object.fromEntries(
      page.items.map((item) => [
        item.id,
        { id: this.data.nextId++, type: item.type },
      ])
    );
    const mapItemId = (id: number) =>
      itemMap.hasOwnProperty(id) ? itemMap[id].id : id;
    let copy: PageData = {
      id: this.data.nextId++,
      name: page.name + " (copy)",
      items: Object.values(itemMap),
      masterPageId: page.masterPageId,
      propertyValues: Object.fromEntries(
        getOwnPropertyNames(page.propertyValues).map((itemId) => [
          mapItemId(itemId),
          { ...page.propertyValues[itemId] },
        ])
      ),
      overrideableProperties: Object.fromEntries(
        getOwnPropertyNames(page.propertyValues).map((itemId) => [
          mapItemId(itemId),
          { ...page.overrideableProperties[itemId] },
        ])
      ),
    };

    // serialization roundtrip to copy the property values
    copy = JSON.parse(JSON.stringify(copy));
    this.data.pages.push(copy);
    this.pageDataMap[copy.id] = copy;
    this.selectPage(copy);
  }

  selectPreviousPage() {
    if (this.data.pages.length == 0) return;
    const idx = this.data.pages.findIndex(
      (x) => x.id === this.data.currentPageId
    );
    this.selectPage(this.data.pages[idx < 1 ? 0 : idx - 1]);
  }

  selectNextPage() {
    const pageCount = this.data.pages.length;
    if (pageCount == 0) return;
    const idx = this.data.pages.findIndex(
      (x) => x.id == this.data.currentPageId
    );
    this.selectPage(
      this.data.pages[idx < 0 || idx >= pageCount - 1 ? pageCount - 1 : idx + 1]
    );
  }

  selectPage(page?: PageData) {
    this.selectPageId(page?.id);
  }

  selectPageId(pageId?: number) {
    const oldSelection = this.currentPage?.selection;
    this.data.currentPageId = pageId;
    this.onDataChanged();
    this.recreateCurrentPage(oldSelection);
  }

  removePage(id: number) {
    this.data.pages = this.data.pages.filter((p) => p.id !== id);
    delete this.pageDataMap[id];
    if (this.data.currentPageId === id) this.data.currentPageId = undefined;

    this.data.pages.forEach((p) => {
      if (p.masterPageId === id) p.masterPageId = undefined;
    });

    this.onDataChanged();
    this.updateMasterPages();
    this.recreateCurrentPage();
  }

  reorderPages(newPages: PageData[]) {
    this.data.pages = newPages;
    this.onDataChanged();
    this.onChange.notify();
  }

  setMasterPage(pageId: number, masterPageId?: number) {
    this.pageDataMap[pageId].masterPageId = masterPageId;
    this.updateMasterPages();
    this.recreateCurrentPage();
  }

  private updateMasterPages() {
    this.masterPageIds.clear();
    this.data.pages.forEach((page) => {
      if (page.masterPageId !== undefined)
        this.masterPageIds.add(page.masterPageId);
    });
  }

  private recreateCurrentPage(oldSelection?: Selection) {
    this.currentPage =
      this.data.currentPageId === undefined
        ? undefined
        : new Page(
            this.pageDataMap[this.data.currentPageId],
            this,
            this.onDataChanged
          );
    if (oldSelection) {
      this.currentPage?.selectAvailableItemsById(oldSelection);
    }
    this.onChange.notify();
  }
}
