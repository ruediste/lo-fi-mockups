import React from "react";
import { ModelEvent } from "./ModelEvent";
import { Page } from "./Page";
import { PageItemProperty } from "./PageItemProperty";

export interface PageItemData {
  id: number;
  type: string;

  children?: PageItemData[];
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
  overrideableProperties?: { [propertyId: string]: true };
  onChange = new ModelEvent();

  directMasterOverrideableProperties?: { [propertyId: string]: true };

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

  renderEditorInteraction(_args: RenderEditorInteractionArgs): React.ReactNode {
    return null;
  }

  renderMasterInteraction(_args: RenderEditorInteractionArgs): React.ReactNode {
    return null;
  }

  renderProperties(): React.ReactNode {
    return null;
  }

  // invoked after construction
  initialize() {}
}

export interface RenderEditorInteractionArgs {
  isSelected: boolean;
  setSelectedItem: (item: PageItem) => void;
}
