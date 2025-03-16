import React from "react";
import { Selection } from "../Selection";
import { Position, Rectangle } from "../widgets/Widget";
import { ModelEvent } from "./ModelEvent";
import { Page } from "./Page";
import { PageItemProperty } from "./PageItemProperty";

export interface PageItemData {
  id: number;
  type: string;
}

export interface PageItemsArgs {
  data: PageItemData;
  page: Page;
  fromMasterPage: boolean;
}

export abstract class PageItem {
  properties: PageItemProperty<any>[] = [];
  propertyMap = new Map<string, PageItemProperty<any>>();
  masterPropertyValues: { [propertyId: string]: any }[] = [];
  propertyValues?: { [propertyId: string]: any };

  // properties marked as overrideable in this page
  overrideableProperties?: { [propertyId: string]: true };

  // properties marked as overrideable on the master page, used to determine editability
  directMasterOverrideableProperties?: { [propertyId: string]: true };

  // raised if something specific to this item changes, such as a property
  onChange = new ModelEvent();

  // do not provide a custom constructor in derived types. use initialize() instead
  constructor(
    public data: PageItemData,
    public page: Page,
    public fromMasterPage: boolean
  ) {
    for (const masterPage of page.masterPages) {
      const values = masterPage.propertyValues[this.data.id];
      if (values !== undefined) {
        this.masterPropertyValues.push(values);
      }
    }

    this.propertyValues = page.data.propertyValues[data.id];
    this.overrideableProperties = page.data.overrideableProperties[data.id];
    this.directMasterOverrideableProperties =
      page.directMasterPageData?.overrideableProperties[data.id];
  }

  get editablePropertyValues() {
    if (this.propertyValues === undefined) {
      this.propertyValues = {};
      this.page.data.propertyValues[this.data.id] = this.propertyValues;
    }
    return this.propertyValues;
  }

  get id() {
    return this.data.id;
  }

  nextId() {
    return this.page.nextId();
  }

  get onDataChanged() {
    return this.page.onDataChanged;
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

  abstract get boundingBox(): Rectangle;
  abstract moveBy(delta: Position): void;

  renderEditorInteraction(_args: RenderInteractionArgs): React.ReactNode {
    return null;
  }

  renderMasterInteraction(_args: RenderInteractionArgs): React.ReactNode {
    return null;
  }

  renderProperties(): React.ReactNode {
    return null;
  }

  // invoked after construction
  initialize() {}
}

export interface RenderInteractionArgs {
  selection: Selection;
  setSelection: (value: Selection) => void;
}
