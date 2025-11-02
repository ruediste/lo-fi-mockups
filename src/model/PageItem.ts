import { snapConfiguration } from "@/widgets/widgetTheme";
import React, { createContext } from "react";
import { CanvasProjection } from "../editor/Canvas";
import { IRectangle } from "../widgets/Widget";
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

export type PageItemRenderContextType =
  | ({ isExport: false } & (
      | { isPlay: true; openPage: (pageId: number) => void }
      | { isPlay: false }
    ))
  | {
      isExport: true;
      isPlay: false;
      links: { box: IRectangle; pageId: number }[];
    }
  | undefined;
export const PageItemRenderContext =
  createContext<PageItemRenderContextType>(undefined);

type MiddleSnapSpecification = "horizontal" | "vertical" | "both" | "none";

export abstract class PageItem {
  public interaction!: PageItemInteraction;
  protected snapMiddle: MiddleSnapSpecification = "none";

  properties: PageItemProperty[] = [];
  propertyMap = new Map<string, PageItemProperty>();
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

  // Return the property values map for this item.
  // Changes to the returned map will be persisted.
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

  cloneData(): PageItemData {
    // serialization roundtrip to deep clone the data
    return {
      ...JSON.parse(JSON.stringify(this.data)),
      id: this.nextId(),
    };
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

  abstract get boundingBox(): IRectangle;

  renderProperties(): React.ReactNode {
    return null;
  }

  // invoked after construction
  initialize() {}

  // invoked after all items have been created
  initializeItemReferences(): void {}

  getSnapBoxes(args: SnapBoxesArgs) {
    this.createSnapBoxes(args, this.boundingBox, this.snapMiddle);
  }

  protected createSnapBoxes(
    args: SnapBoxesArgs,
    box: IRectangle,
    middle: MiddleSnapSpecification
  ) {
    args.addEdges(box);
    args.addMarginBox(box);
    args.addMiddle(box, middle);
    args.addConnector(box, this);
  }

  static getSnapReferences(items: PageItem[], viewToWorld: number) {
    const args = new SnapReferencesArgs(viewToWorld);
    items.forEach((item) => item.getSnapReferences(args));
    return args;
  }

  getSnapReferences(args: SnapReferencesArgs) {
    this.createSnapReferences(args, this.boundingBox, this.snapMiddle);
  }

  protected createSnapReferences(
    args: SnapReferencesArgs,
    box: IRectangle,
    middle: MiddleSnapSpecification
  ) {
    args.addEdges(box);
    args.addMarginBox(box);
    args.addMiddle(box, middle);
  }
}

export class SnapBoxesArgs {
  horizontal: HorizontalSnapBox[] = [];
  vertical: VerticalSnapBox[] = [];
  constructor(public viewToWorld: number) {}

  addEdges(box: IRectangle) {
    this.horizontal.push(
      new HorizontalSnapBox(
        box.x - snapConfiguration.snapSideLength,
        box.y,
        snapConfiguration.snapSideLength,
        "edge",
        snapConfiguration.snapRange
      ),
      new HorizontalSnapBox(
        box.x + box.width,
        box.y,
        snapConfiguration.snapSideLength,
        "edge",
        snapConfiguration.snapRange
      ),
      new HorizontalSnapBox(
        box.x - snapConfiguration.snapSideLength,
        box.y + box.height,
        snapConfiguration.snapSideLength,
        "edge",
        snapConfiguration.snapRange
      ),
      new HorizontalSnapBox(
        box.x + box.width,
        box.y + box.height,
        snapConfiguration.snapSideLength,
        "edge",
        snapConfiguration.snapRange
      )
    );
    this.vertical.push(
      new VerticalSnapBox(
        box.x,
        box.y - snapConfiguration.snapSideLength,
        snapConfiguration.snapSideLength,
        "edge",
        snapConfiguration.snapRange
      ),
      new VerticalSnapBox(
        box.x,
        box.y + box.height,
        snapConfiguration.snapSideLength,
        "edge",
        snapConfiguration.snapRange
      ),
      new VerticalSnapBox(
        box.x + box.width,
        box.y - snapConfiguration.snapSideLength,
        snapConfiguration.snapSideLength,
        "edge",
        snapConfiguration.snapRange
      ),
      new VerticalSnapBox(
        box.x + box.width,
        box.y + box.height,
        snapConfiguration.snapSideLength,
        "edge",
        snapConfiguration.snapRange
      )
    );
  }
  addMiddle(box: IRectangle, spec: MiddleSnapSpecification) {
    (spec == "both" || spec == "horizontal") &&
      this.horizontal.push(
        new HorizontalSnapBox(
          box.x - snapConfiguration.snapSideLength,
          box.y,
          box.width + 2 * snapConfiguration.snapSideLength,
          "middle",
          snapConfiguration.snapRange
        )
      );

    (spec == "both" || spec == "vertical") &&
      this.vertical.push(
        new VerticalSnapBox(
          box.x,
          box.y - snapConfiguration.snapSideLength,
          box.height + 2 * snapConfiguration.snapSideLength,
          "middle",
          snapConfiguration.snapRange
        )
      );
  }
  addMarginBox(box: IRectangle, margin = snapConfiguration.snapMargin) {
    this.horizontal.push(
      new HorizontalSnapBox(
        box.x,
        box.y - margin,
        box.width,
        "margin",
        snapConfiguration.snapRange
      ),
      new HorizontalSnapBox(
        box.x,
        box.y + box.height + margin,
        box.width,
        "margin",
        snapConfiguration.snapRange
      )
    );
    this.vertical.push(
      new VerticalSnapBox(
        box.x - margin,
        box.y,
        box.height,
        "margin",
        snapConfiguration.snapRange
      ),
      new VerticalSnapBox(
        box.x + box.width + margin,
        box.y,
        box.height,
        "margin",
        snapConfiguration.snapRange
      )
    );
  }

  addConnector(box: IRectangle, source: PageItem) {
    this.horizontal.push(
      new HorizontalSnapBox(
        box.x,
        box.y,
        box.width,
        "connector",
        snapConfiguration.snapRange,
        source
      ),
      new HorizontalSnapBox(
        box.x,
        box.y + box.height,
        box.width,
        "connector",
        snapConfiguration.snapRange,
        source
      )
    );
    this.vertical.push(
      new VerticalSnapBox(
        box.x,
        box.y,
        box.height,
        "connector",
        snapConfiguration.snapRange,
        source
      ),
      new VerticalSnapBox(
        box.x + box.width,
        box.y,
        box.height,
        "connector",
        snapConfiguration.snapRange,
        source
      )
    );
  }
}

export class SnapReferencesArgs {
  top: HorizontalSnapReference[] = [];
  bottom: HorizontalSnapReference[] = [];
  otherHorizontal: HorizontalSnapReference[] = [];
  left: VerticalSnapReference[] = [];
  right: VerticalSnapReference[] = [];
  otherVertical: VerticalSnapReference[] = [];
  constructor(public viewToWorld: number) {}

  addEdges(box: IRectangle) {
    this.top.push(new HorizontalSnapReference(box.x, box.y, box.width, "edge"));
    this.bottom.push(
      new HorizontalSnapReference(box.x, box.y + box.height, box.width, "edge")
    );
    this.left.push(new VerticalSnapReference(box.x, box.y, box.height, "edge"));
    this.right.push(
      new VerticalSnapReference(box.x + box.width, box.y, box.height, "edge")
    );
  }
  addMiddle(box: IRectangle, spec: MiddleSnapSpecification) {
    (spec == "both" || spec == "horizontal") &&
      this.otherHorizontal.push(
        new HorizontalSnapReference(box.x, box.y, box.width, "middle")
      );

    (spec == "both" || spec == "vertical") &&
      this.otherVertical.push(
        new VerticalSnapReference(box.x, box.y, box.height, "middle")
      );
  }

  addMarginBox(box: IRectangle, margin = snapConfiguration.snapMargin) {
    this.top.push(
      new HorizontalSnapReference(box.x, box.y - margin, box.width, "margin")
    );
    this.bottom.push(
      new HorizontalSnapReference(
        box.x,
        box.y + box.height + margin,
        box.width,
        "margin"
      )
    );
    this.left.push(
      new VerticalSnapReference(box.x - margin, box.y, box.height, "margin")
    );
    this.right.push(
      new VerticalSnapReference(
        box.x + box.width + margin,
        box.y,
        box.height,
        "margin"
      )
    );
  }
}

export interface RenderInteractionArgs {
  projection: CanvasProjection;
}

export class HorizontalSnapBox {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public type: SnapType,
    public snapRange: number = snapConfiguration.snapRange,
    public sourceItem?: PageItem
  ) {}
}
export class VerticalSnapBox {
  constructor(
    public x: number,
    public y: number,
    public height: number,
    public type: SnapType,
    public snapRange: number = snapConfiguration.snapRange,
    public sourceItem?: PageItem
  ) {}
}
export type SnapType = "margin" | "edge" | "middle" | "connector";
export class HorizontalSnapReference {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public type: SnapType
  ) {}

  withOffset(offset: { x: number; y: number }) {
    return new HorizontalSnapReference(
      this.x + offset.x,
      this.y + offset.y,
      this.width,
      this.type
    );
  }
}
export class VerticalSnapReference {
  constructor(
    public x: number,
    public y: number,
    public height: number,
    public type: SnapType
  ) {}

  withOffset(offset: { x: number; y: number }) {
    return new VerticalSnapReference(
      this.x + offset.x,
      this.y + offset.y,
      this.height,
      this.type
    );
  }
}
