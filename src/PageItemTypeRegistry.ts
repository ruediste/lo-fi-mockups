import {
  Page,
  PageItem,
  PageItemData,
  pageItemTypeRegistryHolder,
} from "./Project";
import { ListWidget, Widget } from "./Widget";

export class PageItemTypeRegistry {
  itemTypes = new Map<
    string,
    new (data: PageItemData, page: Page) => PageItem
  >();

  palette: {
    key: string;
    ctor: new (data: PageItemData, page: Page) => Widget;
  }[] = [];

  create(data: PageItemData, page: Page): PageItem {
    const ctor = this.itemTypes.get(data.type)!;
    return new ctor(data, page);
  }
}

export const pageItemTypeRegistry = new PageItemTypeRegistry();
pageItemTypeRegistryHolder.registry = pageItemTypeRegistry;

function register(
  key: string,
  ctor: new (data: PageItemData, page: Page) => PageItem
) {
  pageItemTypeRegistry.itemTypes.set(key, ctor);
  if (ctor.prototype instanceof Widget) {
    pageItemTypeRegistry.palette.push({ key, ctor: ctor as any });
  }
}

register("list", ListWidget);
