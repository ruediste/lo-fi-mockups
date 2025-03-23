import Flatbush from "flatbush";
import { CanvasProjection } from "../Canvas";
import { Selection } from "../Selection";
import { Vec2d } from "../Vec2d";
import { arraySwapInPlace } from "../utils";
import { ModelEvent } from "./ModelEvent";
import {
  HorizontalSnapPosition,
  PageItem,
  PageItemData,
  VerticalSnapPosition,
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

  selection = Selection.of();

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
    this.selection = value;
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
    this.data.items = this.data.items.filter((x) => x.id != id);
    this.ownItems = this.ownItems.filter((x) => x.data.id != id);
    this.onDataChanged();
    this.onChange.notify();
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
}

export class SnapIndex {
  horizontalPositions: HorizontalSnapPosition[] = [];
  verticalPositions: VerticalSnapPosition[] = [];
  horizontal?: Flatbush;
  vertical?: Flatbush;
  constructor(
    page: Page,
    projection: CanvasProjection,
    filter: (item: PageItem) => boolean
  ) {
    [...page.masterItems, ...page.ownItems]
      .filter(filter)
      .forEach((item) =>
        item.getSnapBoxes(
          this.horizontalPositions,
          this.verticalPositions,
          projection.scale
        )
      );

    if (this.horizontalPositions.length > 0) {
      const horizontal = new Flatbush(this.horizontalPositions.length);

      this.horizontalPositions.forEach((p) =>
        horizontal.add(
          p.x - p.snapRange,
          p.y - p.snapRange,
          p.x + p.width + p.snapRange,
          p.y + p.snapRange
        )
      );
      horizontal.finish();
      this.horizontal = horizontal;
    }

    if (this.verticalPositions.length > 0) {
      const vertical = new Flatbush(this.verticalPositions.length);
      this.verticalPositions.forEach((p) =>
        vertical.add(
          p.x - p.snapRange,
          p.y - p.snapRange,
          p.x + p.snapRange,
          p.y + p.height + p.snapRange
        )
      );
      vertical.finish();
      this.vertical = vertical;
    }
  }

  snapItems(
    items: PageItem[],
    currentOffset: { x: number; y: number },
    viewToWorld: number
  ) {
    const h: HorizontalSnapPosition[] = [];
    const v: VerticalSnapPosition[] = [];
    items.forEach((item) => item.getSnapBoxes(h, v, viewToWorld));

    return this.snapBoxes(h, v, currentOffset);
  }

  snapBoxes(
    h: HorizontalSnapPosition[],
    v: VerticalSnapPosition[],
    currentOffset: { x: number; y: number }
  ) {
    let deltaY: number | undefined = undefined;
    let deltaX: number | undefined = undefined;

    for (const pos of h) {
      const indices = this.horizontal?.search(
        pos.x - currentOffset.x,
        pos.y - currentOffset.y,
        pos.x + pos.width - currentOffset.x,
        pos.y - currentOffset.y
      );
      for (const idx of indices ?? []) {
        const otherPos = this.horizontalPositions[idx];
        const delta = otherPos.y - (pos.y - currentOffset.y);
        if (deltaY === undefined || Math.abs(deltaY) > Math.abs(delta))
          deltaY = delta;
      }
    }

    for (const pos of v) {
      const indices = this.vertical?.search(
        pos.x - currentOffset.x,
        pos.y - currentOffset.y,
        pos.x - currentOffset.x,
        pos.y + pos.height - currentOffset.y
      );
      for (const idx of indices ?? []) {
        const otherPos = this.verticalPositions[idx];
        const delta = otherPos.x - (pos.x - currentOffset.x);
        if (deltaX === undefined || Math.abs(deltaX) > Math.abs(delta))
          deltaX = delta;
      }
    }
    return new Vec2d(deltaX ?? 0, deltaY ?? 0);
  }
}
