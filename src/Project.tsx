import { Input } from "antd";
import TextArea from "antd/es/input/TextArea";
import { JSX, useEffect, useRef, useState } from "react";

export class DomainEvent<T = void> {
  private listeners = new Set<{ value: (arg: T) => void }>();
  subscribe(listener: (arg: T) => void): () => void {
    const entry = { value: listener };
    this.listeners.add(entry);
    return () => this.listeners.delete(entry);
  }

  notify(arg: T) {
    this.listeners.forEach((l) => l.value(arg));
  }
}

export function useRerenderOnEvent(event: DomainEvent<any> | undefined) {
  const [, trigger] = useState({});
  useEffect(() => {
    if (event === undefined) return;
    return event.subscribe(() => trigger({}));
  }, [event]);
}

export function useConst<T>(valueFactory: () => T): T {
  const result = useRef<{ value?: T; initialized: boolean }>({
    initialized: false,
  });
  if (!result.current.initialized) {
    result.current.value = valueFactory();
    result.current.initialized = true;
  }
  return result.current.value!;
}

export const pageItemTypeRegistryHolder: {
  registry: {
    create: (data: PageItemData, page: Page) => PageItem;
  };
} = {} as any;

export function createPageItem(data: PageItemData, page: Page) {
  const result = pageItemTypeRegistryHolder.registry.create(data, page);
  result.initialize();
  return result;
}

export interface ProjectData {
  nextId: number;
  pages: PageData[];
  currentPageIndex: number;
}

export interface PageData {
  id: number;
  items: PageItemData[];
  masterPageId?: number;
  propertyValues: { [itemId: number]: { [propertyKey: string]: any } };
}

export class Page {
  masterItems: PageItem[];
  ownItems: PageItem[];

  // master from closest to furthest away
  masterPages: PageData[] = [];
  pageDataMap: { [id: number]: PageData } = {};
  onChange = new DomainEvent();

  constructor(public data: PageData, public project: ProjectData) {
    this.project.pages.forEach((page) => (this.pageDataMap[page.id] = page));

    const seen = new Set();
    let id = this.data.masterPageId;
    while (id !== undefined) {
      if (seen.has(id)) break;
      seen.add(id);
      const page = this.project.pages[id];
      this.masterPages.push(page);
      id = page?.masterPageId;
    }

    this.ownItems = this.data.items.map((item) => this.toPageItem(item));

    this.masterItems = [];
    for (let index = this.masterPages.length - 1; index >= 0; index--) {
      const masterPage = this.masterPages[index];
      this.masterItems.push(...masterPage.items.map((i) => this.toPageItem(i)));
    }
  }

  addItem(data: PageItemData) {
    this.data.propertyValues[data.id] = {};
    this.data.items.push(data);
    const item = this.toPageItem(data);
    this.ownItems.push(item);
    this.onChange.notify();
    return item;
  }

  private toPageItem(data: PageItemData) {
    return createPageItem(data, this);
  }
}

export interface PageItemData {
  id: number;
  type: string;

  children?: PageItemData[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export abstract class PageItemProperty<T extends {} | null> {
  private masterValue?: T;
  private value: T;
  isOverrideable = false;
  isHidden = false;

  constructor(
    private item: PageItem,
    public id: string,
    private defaultValue: T
  ) {
    item.properties.push(this);
    item.propertyMap.set(id, this);

    // find the first master value
    for (const values of item.masterDataPropertyValues) {
      this.masterValue = values[id];
      if (this.masterValue !== undefined) {
        break;
      }
    }

    let value = item.propertyValues?.[id];
    if (value === undefined) {
      value = this.masterValue;
    }
    if (value === undefined) {
      value = defaultValue;
    }
    this.value = value;
  }

  get(): T {
    return this.value;
  }

  set(value: T): void {
    if (this.item.propertyValues === undefined) {
      this.item.propertyValues = {};
      this.item.page.data.propertyValues[this.item.data.id] =
        this.item.propertyValues;
    }
    this.item.propertyValues[this.id] = value;
    this.value = value;
    this.item.onChange.notify();
  }

  clear() {
    if (this.item.propertyValues !== undefined) {
      delete this.item.propertyValues[this.id];
      if (Object.keys(this.item.propertyValues).length == 0) {
        this.item.propertyValues = undefined;
        delete this.item.page.data.propertyValues[this.item.data.id];
      }
    }

    let value = this.masterValue;
    if (value === undefined) {
      value = this.defaultValue;
    }
    this.value = value;
  }

  overrideable() {
    this.isOverrideable = true;
    return this;
  }

  hidden() {
    this.isHidden = true;
    return this;
  }

  render(): React.ReactNode {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export class ObjectProperty<T extends {} | null> extends PageItemProperty<T> {
  constructor(item: PageItem, id: string, defaultValue: T) {
    super(item, id, defaultValue);
    this.isHidden = true;
  }

  render(): JSX.Element {
    throw new Error("Method not implemented.");
  }
}
export class StringProperty extends PageItemProperty<string> {
  isTextArea = false;
  constructor(item: PageItem, id: string, defaultValue: string) {
    super(item, id, defaultValue);
  }

  render(): JSX.Element {
    if (this.isTextArea)
      return (
        <TextArea
          value={this.get()}
          onChange={(e) => this.set(e.target.value)}
        />
      );
    return (
      <Input value={this.get()} onChange={(e) => this.set(e.target.value)} />
    );
  }

  textArea() {
    this.isTextArea = true;
    return this;
  }
}

export interface RenderEditorInteractionArgs {
  isSelected: boolean;
  setSelectedItem: (item: PageItem) => void;
}

export abstract class PageItem {
  properties: PageItemProperty<any>[] = [];
  propertyMap = new Map<string, PageItemProperty<any>>();
  masterDataPropertyValues: { [propertyId: string]: any }[] = [];
  propertyValues?: { [propertyId: string]: any };
  onChange = new DomainEvent();

  // do not provide a custom constructor in derived types. use initialize() instead
  constructor(public data: PageItemData, public page: Page) {
    for (const masterPage of page.masterPages) {
      const values = masterPage.propertyValues[this.data.id];
      if (values !== undefined) {
        this.masterDataPropertyValues.push(values);
      }
    }

    this.propertyValues = page.data.propertyValues[data.id];
  }

  hasOverrideableProperties() {
    return this.properties.some((x) => x.isOverrideable);
  }
  abstract renderContent(): React.ReactNode;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renderEditorInteraction(args: RenderEditorInteractionArgs): React.ReactNode {
    return <></>;
  }

  renderProperties(): React.ReactNode {
    return <></>;
  }

  // invoked after construction
  initialize() {}
}
