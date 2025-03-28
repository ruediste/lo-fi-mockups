import { snapConfiguration, SnapConfiguration } from "@/widgets/widgetTheme";
import React from "react";
import { CanvasProjection } from "../Canvas";
import { Rectangle } from "../widgets/Widget";
import { ModelEvent } from "./ModelEvent";
import { Page } from "./Page";
import { PageItemInteraction } from "./PageItemInteraction";
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
  public interaction!: PageItemInteraction;

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

  renderProperties(): React.ReactNode {
    return null;
  }

  // invoked after construction
  initialize() {}

  getSnapBoxes(args: SnapBoxesArgs) {
    this.createSnapBoxes(args, this.boundingBox);
  }

  protected createSnapBoxes(args: SnapBoxesArgs, box: Rectangle) {
    args.horizontal.push(
      ...HorizontalSnapBox.from(box.x, box.y, box.width, "both")
    );
    args.horizontal.push(
      ...HorizontalSnapBox.from(box.x, box.y + box.height, box.width, "both")
    );
    args.vertical.push(
      ...VerticalSnapBox.from(box.x, box.y, box.height, "both")
    );
    args.vertical.push(
      ...VerticalSnapBox.from(box.x + box.width, box.y, box.height, "both")
    );
  }

  static getSnapReferences(items: PageItem[], viewToWorld: number) {
    const args: SnapReferencesArgs = {
      top: [],
      bottom: [],
      left: [],
      right: [],
      viewToWorld,
    };
    items.forEach((item) => item.getSnapReferences(args));
    return args;
  }

  getSnapReferences(args: SnapReferencesArgs) {
    this.createSnapReferences(args, this.boundingBox);
  }

  protected createSnapReferences(args: SnapReferencesArgs, box: Rectangle) {
    args.top.push({ x: box.x, y: box.y, width: box.width });
    args.bottom.push({ x: box.x, y: box.y + box.height, width: box.width });
    args.left.push({ x: box.x, y: box.y, height: box.height });
    args.right.push({ x: box.x + box.width, y: box.y, height: box.height });
  }
}

export interface SnapBoxesArgs {
  horizontal: HorizontalSnapBox[];
  vertical: VerticalSnapBox[];
  viewToWorld: number;
}
export interface SnapReferencesArgs {
  top: HorizontalSnapReference[];
  bottom: HorizontalSnapReference[];
  left: VerticalSnapReference[];
  right: VerticalSnapReference[];
  viewToWorld: number;
}

export interface RenderInteractionArgs {
  projection: CanvasProjection;
}

export class HorizontalSnapBox {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public snapRange: number = snapConfiguration.snapRange
  ) {}

  static from(
    x: number,
    y: number,
    width: number,
    marginSide: "above" | "below" | "both",
    config?: SnapConfiguration
  ): HorizontalSnapBox[] {
    config = { ...snapConfiguration, ...config };
    const result: HorizontalSnapBox[] = [];
    result.push(
      new HorizontalSnapBox(
        x - config.snapSideLength,
        y,
        config.snapSideLength,
        config.snapRange
      )
    );
    result.push(
      new HorizontalSnapBox(
        x + width,
        y,
        config.snapSideLength,
        config.snapRange
      )
    );

    if (marginSide === "above" || marginSide === "both") {
      result.push(
        new HorizontalSnapBox(x, y - config.snapMargin, width, config.snapRange)
      );
    }
    if (marginSide === "below" || marginSide === "both") {
      result.push(
        new HorizontalSnapBox(x, y + config.snapMargin, width, config.snapRange)
      );
    }
    return result;
  }
}
export class VerticalSnapBox {
  constructor(
    public x: number,
    public y: number,
    public height: number,
    public snapRange: number
  ) {}

  static from(
    x: number,
    y: number,
    height: number,
    marginSide: "left" | "right" | "both",
    config?: SnapConfiguration
  ): VerticalSnapBox[] {
    config = { ...snapConfiguration, ...config };
    const result: VerticalSnapBox[] = [];
    result.push(
      new VerticalSnapBox(
        x,
        y - config.snapSideLength,
        config.snapSideLength,
        config.snapRange
      )
    );
    result.push(
      new VerticalSnapBox(
        x,
        y + height,
        config.snapSideLength,
        config.snapRange
      )
    );

    if (marginSide === "left" || marginSide === "both") {
      result.push(
        new VerticalSnapBox(x - config.snapMargin, y, height, config.snapRange)
      );
    }
    if (marginSide === "right" || marginSide === "both") {
      result.push(
        new VerticalSnapBox(x + config.snapMargin, y, height, config.snapRange)
      );
    }
    return result;
  }
}
export interface HorizontalSnapReference {
  y: number;
  x: number;
  width: number;
}
export interface VerticalSnapReference {
  y: number;
  x: number;
  height: number;
}
