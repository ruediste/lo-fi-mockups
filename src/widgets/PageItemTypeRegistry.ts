import { pageItemTypeRegistryHolder } from "../model/createPageItem";
import { Page } from "../model/Page";
import { PageItem, PageItemData, PageItemsArgs } from "../model/PageItem";
import { Widget } from "../Widget";
import { ListWidget } from "./ListWidget";

export class PageItemTypeRegistry {
  itemTypes = new Map<string, (args: PageItemsArgs) => PageItem>();

  palette: {
    key: string;
    ctor: new (data: PageItemData, page: Page, fromMaster: boolean) => Widget;
  }[] = [];

  create(args: PageItemsArgs): PageItem {
    const ctor = this.itemTypes.get(args.data.type)!;
    const result = ctor(args);
    result.initialize();
    return result;
  }
}

export const pageItemTypeRegistry = new PageItemTypeRegistry();
pageItemTypeRegistryHolder.registry = pageItemTypeRegistry;

function register(
  key: string,
  ctor: new (
    data: PageItemData,
    page: Page,
    fromMasterPage: boolean
  ) => PageItem
) {
  pageItemTypeRegistry.itemTypes.set(
    key,
    (args) => new ctor(args.data, args.page, args.fromMasterPage)
  );
  if (ctor.prototype instanceof Widget) {
    pageItemTypeRegistry.palette.push({ key, ctor: ctor as any });
  }
}

register("list", ListWidget);
