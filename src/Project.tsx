import { JSX } from "react";
import { Form } from "react-bootstrap";
import { NumberInput } from "./Inputs";

export class ModelEvent<T = void> {
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
  currentPageId?: number;
}

export class Project {
  pageDataMap: { [id: number]: PageData } = {};
  onChange = new ModelEvent();

  currentPage?: Page;
  constructor(public data: ProjectData, public onDataChanged: () => void) {
    data.pages.forEach((page) => (this.pageDataMap[page.id] = page));
    this.recreateCurrentPage();
  }

  addPage() {
    const page: PageData = {
      id: this.data.nextId++,
      name: "Page " + (this.data.pages.length + 1),
      items: [],
      propertyValues: {},
      overrideableProperties: {},
    };

    this.data.pages.push(page);
    this.pageDataMap[page.id] = page;
    this.selectPage(page);
  }

  selectPage(page?: PageData) {
    this.data.currentPageId = page?.id;
    this.onDataChanged();
    this.recreateCurrentPage();
  }

  removePage(id: number) {
    this.data.pages = this.data.pages.filter((p) => p.id !== id);
    delete this.pageDataMap[id];
    if (this.data.currentPageId === id) this.data.currentPageId = undefined;

    this.onDataChanged();
    this.recreateCurrentPage();
  }

  reorderPages(newPages: PageData[]) {
    this.data.pages = newPages;
    this.onDataChanged();
    this.onChange.notify();
  }

  setMasterPage(pageId: number, masterPageId?: number) {
    this.pageDataMap[pageId].masterPageId = masterPageId;
    this.recreateCurrentPage();
  }

  private recreateCurrentPage() {
    this.currentPage =
      this.data.currentPageId === undefined
        ? undefined
        : new Page(
            this.pageDataMap[this.data.currentPageId],
            this,
            this.onDataChanged
          );
    this.onChange.notify();
  }
}

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
  masterPages: PageData[] = [];
  onChange = new ModelEvent();

  constructor(
    public data: PageData,
    public project: Project,
    public onDataChanged: () => void
  ) {
    const seen = new Set();
    let id = this.data.masterPageId;
    while (id !== undefined) {
      if (seen.has(id)) break;
      seen.add(id);
      const page = this.project.pageDataMap[id];
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
    this.onDataChanged();
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

export abstract class PageItemProperty<T extends {} | null> {
  private masterValue?: T;
  private value: T;
  isHidden = false;

  isOverrideable: boolean;
  valueChanged = new ModelEvent();

  constructor(
    protected item: PageItem,
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

    this.isOverrideable = item.overrideableProperties?.[id] ?? false;
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

    this.notify();
  }

  setOverrideable(value: boolean): void {
    if (this.item.overrideableProperties === undefined) {
      this.item.overrideableProperties = {};
      this.item.page.data.overrideableProperties[this.item.data.id] =
        this.item.overrideableProperties;
    }
    if (value) this.item.overrideableProperties[this.id] = true;
    else delete this.item.overrideableProperties[this.id];

    this.isOverrideable = value;

    this.notify();
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
    this.notify();
  }

  protected notify() {
    this.item.page.onDataChanged();
    this.valueChanged.notify();
    this.item.notifyChange();
  }

  hidden() {
    this.isHidden = true;
    return this;
  }

  render(): React.ReactNode {
    return null;
  }
}

export class MemoValue<T> {
  private _value?: T;
  private valid = false;

  invalidated = new ModelEvent();

  constructor(
    private factory: () => T,
    events: (ModelEvent | PageItemProperty<any> | MemoValue<any>)[] = []
  ) {
    for (const e of events) {
      if (e instanceof ModelEvent) {
        e.subscribe(() => this.invalidate());
      } else if (e instanceof MemoValue) {
        e.invalidated.subscribe(() => this.invalidate());
      } else {
        e.valueChanged.subscribe(() => this.invalidate());
      }
    }
  }

  get value(): T {
    if (!this.valid) {
      this._value = this.factory();
      this.valid = true;
    }
    return this._value!;
  }

  invalidate() {
    if (this.valid) {
      this.valid = false;
      this._value = undefined;
      this.invalidated.notify();
    }
  }
}

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
  constructor(
    item: PageItem,
    id: string,
    private label: string,
    defaultValue: string
  ) {
    super(item, id, defaultValue);
  }

  render(): JSX.Element {
    return (
      <Form.Group className="mb-3">
        <Form.Label>{this.label}</Form.Label>
        <Form.Control
          value={this.get()}
          onChange={(e) => this.set(e.target.value)}
          as={this.isTextArea ? "textarea" : undefined}
          rows={5}
        />
      </Form.Group>
    );
  }

  textArea() {
    this.isTextArea = true;
    return this;
  }
}

export class NumberProperty extends PageItemProperty<number> {
  constructor(
    item: PageItem,
    id: string,
    private label: string,
    defaultValue: number
  ) {
    super(item, id, defaultValue);
  }

  render(): JSX.Element {
    return (
      <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
        <Form.Label>{this.label}</Form.Label>
        <NumberInput value={this.get()} onChange={(e) => this.set(e)} />
      </Form.Group>
    );
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
  overrideableProperties?: { [propertyId: string]: true };
  onChange = new ModelEvent();

  // do not provide a custom constructor in derived types. use initialize() instead
  constructor(public data: PageItemData, public page: Page) {
    for (const masterPage of page.masterPages) {
      const values = masterPage.propertyValues[this.data.id];
      if (values !== undefined) {
        this.masterDataPropertyValues.push(values);
      }
    }

    this.propertyValues = page.data.propertyValues[data.id];
    this.overrideableProperties = page.data.overrideableProperties[data.id];
  }

  notifyChange() {
    this.onChange.notify();
  }

  hasOverrideableProperties() {
    return (
      this.overrideableProperties &&
      Object.keys(this.overrideableProperties).length > 0
    );
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
