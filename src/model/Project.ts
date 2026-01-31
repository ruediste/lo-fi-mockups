import { generateUUID } from "@/editor/generateUUID";
import { Selection } from "@/editor/Selection";
import { pageItemTypeRegistry } from "@/widgets/PageItemTypeRegistry";
import { ModelEvent } from "./ModelEvent";
import { Page, PageData } from "./Page";

export interface ProjectData {
  /// version of the data schema. Used for data migrations
  schemaVersion: number;

  /// incremented whenever the project is saved
  dataVersion: number;

  nextId: number;
  pages: PageData[];
  currentPageId?: number;
}

export class Project {
  // transient ID, to identify the project during Copy&Paste
  public uniqueId = generateUUID();

  pageDataMap: { [id: number]: PageData } = {};

  /// raised when there are any changes to the page list or when the current page switches to a different page
  onChange = new ModelEvent();

  currentPage?: Page;
  constructor(
    public data: ProjectData,
    public onDataChanged: () => void,
  ) {
    data.pages.forEach((page) => (this.pageDataMap[page.id] = page));
    this.updateMasterPages();
    this.recreateCurrentPage();
  }

  /// ids of all pages, which are a master page of another page
  masterPageIds = new Set<number>();

  nextId() {
    return this.data.nextId++;
  }

  addPage(idx?: number) {
    const page: PageData = {
      id: this.data.nextId++,
      name: "Page " + (this.data.pages.length + 1),
      items: [],
      propertyValues: {},
      overrideableProperties: {},
    };

    if (idx === undefined || idx < 0 || idx > this.data.pages.length) {
      this.data.pages.push(page);
    } else {
      this.data.pages.splice(idx, 0, page);
    }
    this.pageDataMap[page.id] = page;
    this.selectPage(page);
  }

  duplicatePage(pageData: PageData, pageIndex: number) {
    const page = new Page(pageData, this, this.onDataChanged);

    const idMap = new Map<number, number>(
      pageData.items.map((item) => [item.id, this.data.nextId++]),
    );

    const mapItemId = (id: number) => idMap.get(id) ?? id;

    let copy: PageData = {
      id: this.data.nextId++,
      name: pageData.name + " (copy)",
      items: pageData.items
        .map((item) => page.allItems.get(item.id)!)
        .map((i) =>
          pageItemTypeRegistry.mapDataAfterPaste(
            JSON.parse(JSON.stringify(i.mapDataBeforePaste())),
            mapItemId,
          ),
        ),
      masterPageId: pageData.masterPageId,
      propertyValues: Object.fromEntries(
        Object.getOwnPropertyNames(pageData.propertyValues)
          .map((x) => parseInt(x))
          .map((itemId) => {
            const res = [mapItemId(itemId), pageData.propertyValues[itemId]];
            return res;
          }),
      ),
      overrideableProperties: Object.fromEntries(
        Object.getOwnPropertyNames(pageData.overrideableProperties)
          .map((x) => parseInt(x))
          .map((itemId) => [
            mapItemId(itemId),
            pageData.overrideableProperties[itemId],
          ]),
      ),
    };

    // serialization roundtrip to copy the property values
    copy = JSON.parse(JSON.stringify(copy));
    this.data.pages.splice(pageIndex + 1, 0, copy);
    this.pageDataMap[copy.id] = copy;
    this.selectPage(copy);
  }

  selectPreviousPage() {
    if (this.data.pages.length == 0) return;
    const idx = this.data.pages.findIndex(
      (x) => x.id === this.data.currentPageId,
    );
    this.selectPage(this.data.pages[idx < 1 ? 0 : idx - 1]);
  }

  selectNextPage() {
    const pageCount = this.data.pages.length;
    if (pageCount == 0) return;
    const idx = this.data.pages.findIndex(
      (x) => x.id == this.data.currentPageId,
    );
    this.selectPage(
      this.data.pages[
        idx < 0 || idx >= pageCount - 1 ? pageCount - 1 : idx + 1
      ],
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
            this.onDataChanged,
          );
    if (oldSelection) {
      this.currentPage?.selectAvailableItemsById(oldSelection);
    }
    this.onChange.notify();
  }
}
