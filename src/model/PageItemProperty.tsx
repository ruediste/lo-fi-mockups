import React, { JSX } from "react";
import { Form } from "react-bootstrap";
import { NumberInput } from "../Inputs";
import { ModelEvent } from "./ModelEvent";
import { PageItem } from "./PageItem";

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
  isHidden = false;

  isOverrideable: boolean;
  isEditable: boolean;
  valueChanged = new ModelEvent();

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

    let value = item.propertyValues?.[id];
    if (value === undefined) {
      value = this.masterValue;
    }
    if (value === undefined) {
      value = defaultValue;
    }
    this.value = value;

    this.isOverrideable = item.overrideableProperties?.[id] ?? false;

    if (item.fromMasterPage) {
      this.isEditable = item.directMasterOverrideableProperties?.[id] ?? false;
    } else this.isEditable = true;
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

  shouldRender(): boolean {
    return !this.isHidden && this.isEditable;
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
