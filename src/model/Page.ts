import { Vec2d } from "@/util/Vec2d";
import { ConnectorWidget } from "@/widgets/ConnectorWidget";
import { pageItemTypeRegistry } from "@/widgets/PageItemTypeRegistry";
import { IRectangle } from "@/widgets/Widget";
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

export type ClipboardData = {
  sourceProjectId: string;
  sourcePageId: number;
} & Pick<PageData, "propertyValues" | "overrideableProperties" | "items">;

export class Page {
  masterItems: PageItem[];
  ownItems: PageItem[];
  allItems = new Map<number, PageItem>();

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
    public onDataChanged: () => void,
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
        ...masterPage.items.map((i) => this.toPageItem(i, true)),
      );
    }

    const allItemList = [...this.masterItems, ...this.ownItems];
    allItemList.forEach((x) => this.allItems.set(x.id, x));
    allItemList.forEach((x) => x.initializeItemReferences());
  }

  get keepSnapshot() {
    return this.project.keepSnapshot;
  }

  setSelection(value: Selection) {
    this._selection = value;
    this.onChange.notify();
  }

  selectAvailableItemsById(value: Selection) {
    const items = Object.fromEntries(
      this.ownItems.concat(this.masterItems).map((i) => [i.id, i]),
    );
    this._selection = Selection.of(
      ...value
        .all()
        .filter((i) => i.id in items)
        .map((i) => items[i.id]),
    );
    this.onChange.notify();
  }

  addItem(data: PageItemData) {
    this.data.items.push(data);
    const item = this.toPageItem(data, false);
    this.allItems.set(item.id, item);
    item.initializeItemReferences();
    this.ownItems.push(item);
    this.onDataChanged();
    this.onChange.notify();
    return item;
  }

  copyItems(items: PageItem[]): string {
    const ownItemIds = new Set(this.ownItems.map((i) => i.id));
    const itemIds = new Set(
      items.map((i) => i.id).filter((id) => ownItemIds.has(id)),
    );

    const propertyValues: ClipboardData["propertyValues"] = {};
    const overrideableProperties: ClipboardData["overrideableProperties"] = {};

    for (const itemId of itemIds) {
      if (this.data.propertyValues[itemId] !== undefined)
        propertyValues[itemId] = this.data.propertyValues[itemId];
      if (this.data.overrideableProperties[itemId] !== undefined)
        overrideableProperties[itemId] =
          this.data.overrideableProperties[itemId];
    }

    const data = {
      sourceProjectId: this.project.uniqueId,
      sourcePageId: this.data.id,
      propertyValues,
      overrideableProperties,
      items: this.ownItems
        .filter((i) => itemIds.has(i.id))
        .map((i) => i.mapDataBeforePaste()),
    } satisfies ClipboardData;

    return JSON.stringify(data, undefined, 2);
  }

  /// Paste the items in the clipboard data. The data must have already have gone through
  /// a serialization/deserialization roundtrip.
  pasteItems(dataStr: string) {
    const data: ClipboardData = JSON.parse(dataStr);
    const idMap = new Map(
      data.items.map((item) => [item.id, this.project.nextId()]),
    );
    const isFromSamePage =
      data.sourceProjectId == this.project.uniqueId &&
      data.sourcePageId == this.data.id;

    const mapId = (id: number) =>
      idMap.has(id) ? idMap.get(id) : isFromSamePage ? id : undefined;

    const itemDataMap = new Map(
      data.items.map((item) => [
        item.id,
        pageItemTypeRegistry.mapDataAfterPaste(item, mapId),
      ]),
    );

    const copiedItems: PageItem[] = [];
    for (const originalData of data.items) {
      const copiedData = itemDataMap.get(originalData.id)!;
      this.data.propertyValues[copiedData.id] =
        data.propertyValues[originalData.id];
      this.data.overrideableProperties[copiedData.id] =
        data.overrideableProperties[originalData.id];

      const copy = this.toPageItem(copiedData, false);

      copy.properties.forEach((property) => {
        property.initializeDataAfterCopy(mapId);
      });

      copy.initialize();
      this.data.items.push(copiedData);
      this.ownItems.push(copy);
      this.allItems.set(copy.id, copy);
      copiedItems.push(copy);
    }

    for (const copiedItem of copiedItems) {
      copiedItem.initializeItemReferences();
    }

    if (isFromSamePage) {
      if (
        copiedItems.length == 1 &&
        copiedItems[0] instanceof ConnectorWidget
      ) {
        // detach single connector when copying within the same page, to avoid confusion
        const connector = copiedItems[0] as ConnectorWidget;
        connector.source.disconnect();
        connector.target.disconnect();
      }
      copiedItems.forEach((copy) => copy.interaction.moveBy({ x: 20, y: 20 }));
    }

    this.onDataChanged();
    this.onChange.notify();
    return copiedItems;
  }

  duplicateItem(item: PageItem, selectCopy = true) {
    const copiedItems = this.duplicateItems([item], selectCopy);
    return copiedItems.length > 0 ? copiedItems[0] : undefined;
  }

  duplicateItems(items: PageItem[], selectCopy = true) {
    const clipboardData = this.copyItems(items);
    const copiedItems = this.pasteItems(clipboardData);
    if (selectCopy) {
      this.setSelection(Selection.of(...copiedItems));
    }
    return copiedItems;
  }

  removeItem(id: number) {
    this.removeItemImpl(id);
    this.onDataChanged();
    this.onChange.notify();
  }

  private removeItemImpl(id: number) {
    this.data.items = this.data.items.filter((x) => x.id != id);
    this.ownItems = this.ownItems.filter((x) => x.data.id != id);
    this.allItems.delete(id);
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
    let drawBox: IRectangle | undefined;
    if (items.length > 0) {
      const box = Vec2d.boundingBoxRect(
        ...items.map((item) => item.boundingBox),
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
