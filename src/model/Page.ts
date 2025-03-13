import { ModelEvent } from "./ModelEvent";
import { PageItem, PageItemData } from "./PageItem";
import { Project } from "./Project";
import { createPageItem } from "./createPageItem";

export interface PageData {
  id: number;
  name: string;
  items: PageItemData[];
  masterPageId?: number;
  propertyValues: { [itemId: number]: { [propertyKey: string]: any } };
  overrideableProperties: { [itemId: number]: { [propertyId: string]: true } };
}

export class Page {
  masterItems: PageItem[];
  ownItems: PageItem[];

  // master from closest to furthest away
  directMasterPageData?: PageData;
  masterPages: PageData[] = [];

  // raised when something on the page changes, mainly if items are added or removed
  onChange = new ModelEvent();

  constructor(
    public data: PageData,
    public project: Project,
    public onDataChanged: () => void
  ) {
    const seen = new Set();
    let id = this.data.masterPageId;

    if (id !== undefined)
      this.directMasterPageData = this.project.pageDataMap[id];

    while (id !== undefined) {
      if (seen.has(id)) break;
      seen.add(id);
      const page = this.project.pageDataMap[id];
      this.masterPages.push(page);
      id = page?.masterPageId;
    }

    this.ownItems = this.data.items.map((item) => this.toPageItem(item, false));

    this.masterItems = [];
    for (let index = this.masterPages.length - 1; index >= 0; index--) {
      const masterPage = this.masterPages[index];
      this.masterItems.push(
        ...masterPage.items.map((i) => this.toPageItem(i, true))
      );
    }
  }

  addItem(data: PageItemData) {
    this.data.items.push(data);
    const item = this.toPageItem(data, false);
    this.ownItems.push(item);
    this.onDataChanged();
    this.onChange.notify();
    return item;
  }

  private toPageItem(data: PageItemData, fromMasterPage: boolean) {
    return createPageItem({ data, page: this, fromMasterPage });
  }
}
