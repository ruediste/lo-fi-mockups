import { Draft } from "immer";
import { JSX } from "react";
import { DraftFunction, Updater } from "use-immer";
import { DeepKeyMap } from "./DeepKeyMap";
import { markImmutable } from "./deepEquals";

export class PageItemRegistry {
  itemTypes = new Map<
    string,
    new (data: PageItemData, args: PageItemArgs) => PageItem
  >();

  create(data: PageItemData, args: PageItemArgs) {
    const ctor = this.itemTypes.get(data.type)!;
    return new ctor(data, args);
  }
}

export const pageItemRegistry = new PageItemRegistry();

export class Cache {
  items = new DeepKeyMap<any, any>();
}

export class CacheBuilder {
  constructor(private newCache: Cache, private oldCache?: Cache) {}
  get<T, D>(data: D, factory: (data: D) => T): T {
    let result = this.oldCache?.items.get(data);
    if (result === undefined) {
      result = factory(data);
    }
    this.newCache.items.set(data, result);
    return result;
  }
}

export interface ProjectData {
  nextId: number;
  pages: { [id: number]: PageData };
  pageOrder: number[];
  currentPageId: number | undefined;
}

export class Project {
  pages: Page[] = [];
  pageMap = new Map<number, Page>();
  pageDataMap = new Map<number, PageData>();

  constructor(
    public data: ProjectData,
    updater: Updater<ProjectData>,
    cb: CacheBuilder
  ) {
    Object.values(data.pages).forEach((page) =>
      this.pageDataMap.set(page.id, page)
    );

    // determine master pages
    const activePageDatas: PageData[] = [];
    {
      const seen = new Set();
      let id = data.currentPageId;
      while (id !== undefined) {
        if (seen.has(id)) break;
        seen.add(id);
        const page = this.pageDataMap.get(id)!;
        activePageDatas.unshift(page);
        id = page?.masterPageId;
      }
    }

    for (const pageData of activePageDatas) {
      const page = cb.get(
        [pageData.id !== data.currentPageId, markImmutable(pageData)] as const,
        ([isMaster]) =>
          new Page(
            pageData,
            isMaster,
            mapUpdater(updater, (p) => p.pages, pageData.id),
            cb
          )
      );
      this.pages.push(page);
      this.pageMap.set(pageData.id, page);
    }
  }
}

interface PageData {
  id: number;
  items: { [id: number]: PageItemData };
  itemOrder: number[];
  masterPageId?: number;
  valueOverrides: { [itemId: number]: { [propertyKey: string]: any } };
}

function mapUpdater<D, K extends string | number | symbol, V>(
  updater: Updater<D>,
  mapAccessor: (draft: Draft<D>) => { [key in K]: V },
  key: K
): Updater<V> {
  return (arg) => {
    updater((draft) => {
      const map = mapAccessor(draft);
      if (typeof arg === "function") {
        (arg as DraftFunction<V>)(map[key] as Draft<V>);
      } else map[key] = arg;
    });
  };
}

export class Page {
  items: PageItem[] = [];
  itemMap = new Map<number, PageItem>();

  constructor(
    public data: PageData,
    isMasterPage: boolean,
    updater: Updater<PageData>,
    cb: CacheBuilder
  ) {
    const itemContext = { inMasterPage: isMasterPage };
    for (const itemData of Object.values(data.items)) {
      const itemUpdater = mapUpdater(updater, (p) => p.items, itemData.id);
      const item = cb.get([itemData, itemContext], () =>
        pageItemRegistry.create(itemData, {
          ctx: itemContext,
          accessor: new PageItemPropertyValueAccessor(
            itemData,
            itemUpdater,
            []
          ),
          cb,
        })
      );
      this.items.push(item);
      this.itemMap.set(itemData.id, item);
    }
  }
}

export interface PageItemData {
  id: number;
  type: string;

  propertyValues?: { [key: string]: any };
  children?: PageItemData[];
}

class ItemContext {
  inMasterPage = false;
}

export class PageItemProperty<T> {
  constructor(item: PageItem, public id: string) {
    item.properties.push(this);
    item.propertyMap.set(id, this);
  }

  get(accessor: PageItemPropertyValueAccessor): T {
    return accessor.get(this.id);
  }

  set<T>(accessor: PageItemPropertyValueAccessor, value: T): void {
    accessor.set(this.id, value);
  }
}

export class StringPageItemProperty extends PageItemProperty<string> {
  constructor(item: PageItem, public id: string) {
    super(item, id);
  }
}

export class PageItemPropertyValueAccessor {
  constructor(
    private writeData: PageItemData,
    private updater: Updater<PageItemData>,
    private fallbacks: PageItemData[]
  ) {}

  get(key: string): any {
    for (const data of [this.writeData, ...this.fallbacks]) {
      const values = data.propertyValues;
      if (values && Object.prototype.hasOwnProperty.call(values, key)) {
        return values[key];
      }
    }
    return undefined;
  }

  set(key: string, value: any): void {
    this.updater((draft) => (draft.propertyValues![key] = value));
  }
}

export interface PageItemArgs {
  accessor: PageItemPropertyValueAccessor;
  ctx: ItemContext;
  cb: CacheBuilder;
}

export class PageItem {
  properties: PageItemProperty<any>[] = [];
  propertyMap = new Map<string, PageItemProperty<any>>();

  constructor(public data: PageItemData, public args: PageItemArgs) {}

  get<T>(property: PageItemProperty<T>): T {
    return property.get(this.args.accessor);
  }

  set<T>(property: PageItemProperty<T>, value: T): void {
    property.set(this.args.accessor, value);
  }

  hasOverrideableProperties() {
    return false;
  }
  renderContent(args: RenderArgs): JSX.Element {
    return <></>;
  }

  renderProperties(): JSX.Element {
    return <></>;
  }
}

export interface RenderArgs {
  interaction: boolean;
}
