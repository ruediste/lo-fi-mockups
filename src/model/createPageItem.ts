import { PageItem, PageItemData, PageItemsArgs } from "./PageItem";

export interface PageItemRegistry {
  create: (args: PageItemsArgs) => PageItem;
  createData: (id: number, type: string) => PageItemData;
}
export const pageItemTypeRegistryHolder: {
  registry: PageItemRegistry;
} = {} as any;

export function createPageItem(args: PageItemsArgs) {
  const result = pageItemTypeRegistryHolder.registry.create(args);
  return result;
}

export function createPageItemData(id: number, type: string): PageItemData {
  return pageItemTypeRegistryHolder.registry.createData(id, type);
}
