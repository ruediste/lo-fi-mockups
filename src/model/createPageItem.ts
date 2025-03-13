import { PageItem, PageItemsArgs } from "./PageItem";

export const pageItemTypeRegistryHolder: {
  registry: {
    create: (args: PageItemsArgs) => PageItem;
  };
} = {} as any;

export function createPageItem(args: PageItemsArgs) {
  const result = pageItemTypeRegistryHolder.registry.create(args);
  return result;
}
