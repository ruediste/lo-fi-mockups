import Flatbush from "flatbush";
import { CanvasProjection } from "../Canvas";
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
  horizontal: Flatbush;
  vertical: Flatbush;
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

    this.horizontal = new Flatbush(this.horizontalPositions.length);
    this.vertical = new Flatbush(this.verticalPositions.length);

    this.horizontalPositions.forEach((p) =>
      this.horizontal.add(
        p.x - p.snapRange,
        p.y - p.snapRange,
        p.x + p.width + p.snapRange,
        p.y + p.snapRange
      )
    );
    this.verticalPositions.forEach((p) =>
      this.vertical.add(
        p.x - p.snapRange,
        p.y - p.snapRange,
        p.x + p.snapRange,
        p.y + p.height + p.snapRange
      )
    );

    this.horizontal.finish();
    this.vertical.finish();
  }

  snapItems(
    items: PageItem[],
    currentOffset: { x: number; y: number },
    viewToWorld: number
  ) {
    const h: HorizontalSnapPosition[] = [];
    const v: VerticalSnapPosition[] = [];
    items.forEach((item) => item.getSnapBoxes(h, v, viewToWorld));

    let deltaY: number | undefined = undefined;
    let deltaX: number | undefined = undefined;

    for (const pos of h) {
      const indices = this.horizontal.search(
        pos.x - currentOffset.x,
        pos.y - currentOffset.y,
        pos.x + pos.width - currentOffset.x,
        pos.y - currentOffset.y
      );
      for (const idx of indices) {
        const otherPos = this.horizontalPositions[idx];
        const delta = otherPos.y - (pos.y - currentOffset.y);
        if (deltaY === undefined || Math.abs(deltaY) > Math.abs(delta))
          deltaY = delta;
      }
    }

    for (const pos of v) {
      const indices = this.vertical.search(
        pos.x - currentOffset.x,
        pos.y - currentOffset.y,
        pos.x - currentOffset.x,
        pos.y + pos.height - currentOffset.y
      );
      for (const idx of indices) {
        const otherPos = this.horizontalPositions[idx];
        const delta = otherPos.x - (pos.x - currentOffset.x);
        if (deltaX === undefined || Math.abs(deltaX) > Math.abs(delta))
          deltaX = delta;
      }
    }
    return { x: deltaX ?? 0, y: deltaY ?? 0 };
  }
}
