import { Vec2d } from "@/util/Vec2d";
import { Rectangle } from "@/widgets/Widget";
import { Selection } from "../editor/Selection";
import { arraySwapInPlace } from "../util/utils";
import { ModelEvent } from "./ModelEvent";
import {
  HorizontalSnapBox,
  HorizontalSnapReference,
  PageItem,
  PageItemData,
  VerticalSnapBox,
  VerticalSnapReference,
} from "./PageItem";
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

  // raised when only the position of an item changes. onChange is not raised in this case
  onItemPositionChange = new ModelEvent();

  private _selection = Selection.of();
  get selection() {
    return this._selection;
  }

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

  setSelection(value: Selection) {
    this._selection = value;
    this.onChange.notify();
  }

  selectAvailableItemsById(value: Selection) {
    const items = Object.fromEntries(
      this.ownItems.concat(this.masterItems).map((i) => [i.id, i])
    );
    this._selection = Selection.of(
      ...value
        .all()
        .filter((i) => i.id in items)
        .map((i) => items[i.id])
    );
    this.onChange.notify();
  }

  addItem(data: PageItemData) {
    this.data.items.push(data);
    const item = this.toPageItem(data, false);
    this.ownItems.push(item);
    this.onDataChanged();
    this.onChange.notify();
    return item;
  }

  removeItem(id: number) {
    this.removeItemImpl(id);
    this.onDataChanged();
    this.onChange.notify();
  }
  private removeItemImpl(id: number) {
    this.data.items = this.data.items.filter((x) => x.id != id);
    this.ownItems = this.ownItems.filter((x) => x.data.id != id);
  }

  removeSelectedItems() {
    this.selection
      .all()
      .filter((item) => !item.fromMasterPage)
      .forEach((item) => this.removeItemImpl(item.id));
    this.onDataChanged();
    this.setSelection(Selection.empty);
  }

  moveBack(item: PageItem): void {
    this.data.items = [
      item.data,
      ...this.data.items.filter((x) => x !== item.data),
    ];
    this.ownItems = [item, ...this.ownItems.filter((x) => x !== item)];
    this.onDataChanged();
    this.onChange.notify();
  }

  moveDown(item: PageItem): void {
    const idx = this.ownItems.indexOf(item);
    if (idx > 0) {
      arraySwapInPlace(this.data.items, idx, idx - 1);
      arraySwapInPlace(this.ownItems, idx, idx - 1);
      this.onDataChanged();
      this.onChange.notify();
    }
  }

  moveUp(item: PageItem): void {
    const idx = this.ownItems.indexOf(item);
    if (idx >= 0 && idx < this.ownItems.length - 1) {
      arraySwapInPlace(this.data.items, idx, idx + 1);
      arraySwapInPlace(this.ownItems, idx, idx + 1);
      this.onDataChanged();
      this.onChange.notify();
    }
  }

  moveFront(item: PageItem): void {
    this.data.items = [
      ...this.data.items.filter((x) => x !== item.data),
      item.data,
    ];
    this.ownItems = [...this.ownItems.filter((x) => x !== item), item];
    this.onDataChanged();
    this.onChange.notify();
  }

  nextId() {
    return this.project.nextId();
  }

  private toPageItem(data: PageItemData, fromMasterPage: boolean) {
    return createPageItem({ data, page: this, fromMasterPage });
  }

  boundingBox(margin: number = 32) {
    const items = this.masterItems.concat(this.ownItems);
    let drawBox: Rectangle | undefined;
    if (items.length > 0) {
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
    return drawBox;
  }

  boundingViewBox(margin: number = 32) {
    const box = this.boundingBox(margin);
    return `${box.x} ${box.y} ${box.width} ${box.height}`;
  }
}

export interface SnapResult {
  offset: Vec2d;
  h?: { box: HorizontalSnapBox; ref: HorizontalSnapReference };
  v?: { box: VerticalSnapBox; ref: VerticalSnapReference };
}
