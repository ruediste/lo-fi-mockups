import { PageReferenceInput } from "@/util/PageReferenceInput";
import React, { JSX } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { NumberInput } from "../Inputs";
import { ModelEvent } from "./ModelEvent";
import { PageItem } from "./PageItem";
import { PropertyOverrideableInputGroupControls } from "./PageItemInteractionHelpers";

/*
The value comes from 
- property values of the current page
- property values of any master page
- default value

If the property is overrideable is defined by the current page.

A property is editable if either the containing item is defined in the current page or
if the direct master page defines the property as overrideable.
*/
export abstract class PageItemProperty<T extends {} | null> {
  private masterValue?: T;
  private value: T;
  isHidden: () => boolean = () => false;

  isOverrideable: boolean;
  isEditable: boolean;
  valueChanged = new ModelEvent();

  isOverridden: boolean;

  constructor(
    protected item: PageItem,
    public id: string,
    private defaultValue: T
  ) {
    item.properties.push(this);
    item.propertyMap.set(id, this);

    // find the first master value
    for (const values of item.masterPropertyValues) {
      this.masterValue = values[id];
      if (this.masterValue !== undefined) {
        break;
      }
    }

    if (item.fromMasterPage) {
      this.isEditable = item.directMasterOverrideableProperties?.[id] ?? false;
    } else this.isEditable = true;

    this.isOverridden =
      item.fromMasterPage && item.propertyValues?.[id] !== undefined;

    let value = this.isEditable ? item.propertyValues?.[id] : undefined;
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
    this.item.editablePropertyValues[this.id] = value;
    this.value = value;
    this.isOverridden = this.item.fromMasterPage;
    this.notify();
  }

  // used for mutable values. clone() needs to be implemented to use this
  modify(action: (value: T) => void): void {
    const values = this.item.editablePropertyValues;

    if (this.id in values) action(this.value);
    else {
      const newValue = this.clone(this.value);
      action(newValue);
      values[this.id] = newValue;
      this.value = newValue;
    }
    this.isOverridden = this.item.fromMasterPage;
    this.notify();
  }

  clone(_value: T): T {
    throw new Error("Not Implemented");
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
    if (this.item.propertyValues !== undefined)
      delete this.item.propertyValues[this.id];

    let value = this.masterValue;
    if (value === undefined) {
      value = this.defaultValue;
    }
    this.value = value;
    this.isOverridden = false;
    this.notify();
  }

  protected notify() {
    this.item.onDataChanged();
    this.valueChanged.notify();
    this.item.notifyChange();
  }

  nextId() {
    return this.item.nextId();
  }

  hidden(value: () => boolean) {
    this.isHidden = value;
    return this;
  }

  render(): React.ReactNode {
    return null;
  }

  shouldRender(): boolean {
    return !this.isHidden() && this.isEditable;
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
    this.isHidden = () => true;
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
        <InputGroup>
          <Form.Control
            value={this.get()}
            onChange={(e) => this.set(e.target.value)}
            as={this.isTextArea ? "textarea" : undefined}
            rows={5}
          />
          <PropertyOverrideableInputGroupControls property={this} />
        </InputGroup>
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
      <Form.Group className="mb-3">
        <Form.Label>{this.label}</Form.Label>
        <InputGroup>
          <NumberInput value={this.get()} onChange={(e) => this.set(e)} />
          <PropertyOverrideableInputGroupControls property={this} />
        </InputGroup>
      </Form.Group>
    );
  }
}

export class CheckboxProperty extends PageItemProperty<boolean> {
  constructor(
    item: PageItem,
    id: string,
    private label: string,
    defaultValue: boolean
  ) {
    super(item, id, defaultValue);
  }

  render(): JSX.Element {
    return (
      <div style={{ display: "flex" }}>
        <Form.Check
          style={{ display: "inline-block" }}
          type="checkbox"
          id={this.item.data.id + "-" + this.id + "-checkbox"}
          label={this.label}
          checked={this.get()}
          onChange={(e) => this.set(e.target.checked)}
        />
        <span style={{ marginLeft: "auto" }}></span>
        <PropertyOverrideableInputGroupControls property={this} />
      </div>
    );
  }
}

export class PageReferenceProperty extends PageItemProperty<{
  pageId?: number;
}> {
  constructor(item: PageItem, id: string, private label: string) {
    super(item, id, {});
  }

  render(): JSX.Element {
    return (
      <Form.Group className="mb-3">
        <Form.Label>{this.label}</Form.Label>
        <InputGroup>
          <PageReferenceInput
            style={{ flex: "1 1 auto" }}
            project={this.item.page.project}
            pageId={this.get().pageId}
            setPageId={(e) => this.set({ pageId: e })}
          />
          <PropertyOverrideableInputGroupControls property={this} />
        </InputGroup>
      </Form.Group>
    );
  }
}
