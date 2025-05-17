import { SnapBoxesArgs, SnapReferencesArgs } from "@/model/PageItem";
import { ReactNode } from "react";
import {
  ItemListProperty,
  ItemListSelectionProperty,
} from "../model/ItemListProperty";
import { CheckboxProperty, NumberProperty } from "../model/PageItemProperty";
import { BoxWidget } from "./Widget";
import { PageLink } from "./WidgetHelpers";
import { snapConfiguration, widgetRectAttrs, widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

export class TabsWidget extends BoxWidget {
  label = "Tabs";

  verticalTabs = new CheckboxProperty(
    this,
    "verticalTabs",
    "Vertical Tabs",
    false
  );

  verticalMinWidth = new NumberProperty(
    this,
    "verticalMinWidth",
    "Vertical Minimum Width",
    50
  ).hidden(() => !this.verticalTabs.get());

  itemListSelection = new ItemListSelectionProperty(this, "itemSelection");
  itemList = new ItemListProperty(
    this,
    "items",
    "Items",
    this.itemListSelection
  );

  renderContent(): React.ReactNode {
    if (this.verticalTabs.get()) {
      return this.renderVerticalTabs();
    } else {
      return this.renderHorizontalTabs();
    }
  }

  private renderHorizontalTabs(): React.ReactNode {
    const box = this.box;
    const renderedItems: ReactNode[] = [];
    const overlay: ReactNode[] = [];
    let id = 0;
    let x = box.x + 4;
    const y = box.y;
    const selection = this.itemListSelection.get().selectedItems;
    for (const item of this.itemList.get()) {
      const width = getTextWidth(item.label, widgetTheme.fontSize);
      const selected = selection[item.id] === true;
      renderedItems.push(
        <rect
          key={id++}
          {...widgetRectAttrs}
          x={x}
          y={y}
          width={width + 8}
          height={widgetTheme.fontSize + 4 + widgetTheme.rx}
          fill={selected ? "white" : widgetTheme.selectedGray}
        />
      );

      if (selected) {
        overlay.push(
          <rect
            key={id++}
            x={x + widgetTheme.strokeWidth / 2}
            y={y + 5}
            width={width + 8 - widgetTheme.strokeWidth}
            height={widgetTheme.fontSize + 4}
            fill="white"
          />
        );
      }

      overlay.push(
        <text
          key={id++}
          x={x + 4}
          y={y + widgetTheme.fontSize}
          fontSize={widgetTheme.fontSize}
        >
          {item.label}
        </text>
      );

      overlay.push(
        <PageLink
          key={id++}
          x={x + widgetTheme.strokeWidth / 2}
          y={y + widgetTheme.strokeWidth / 2}
          width={width + 8 - widgetTheme.strokeWidth}
          height={widgetTheme.fontSize + 4 - widgetTheme.strokeWidth}
          pageId={item.link}
        />
      );

      x += 8 + width;
    }

    return (
      <>
        {renderedItems}
        <rect {...widgetRectAttrs} fill="white" {...this.lowerBox} />
        {overlay}
      </>
    );
  }

  private renderVerticalTabs(): React.ReactNode {
    const box = this.box;
    const renderedItems: ReactNode[] = [];
    const overlay: ReactNode[] = [];
    let id = 0;
    const x = box.x;
    let y = box.y + 4;
    const selection = this.itemListSelection.get().selectedItems;
    const tabWidth = this.verticalTabWidth;

    for (const item of this.itemList.get()) {
      const height = widgetTheme.fontSize + 4;
      const selected = selection[item.id] === true;
      renderedItems.push(
        <rect
          key={id++}
          {...widgetRectAttrs}
          x={x}
          y={y}
          width={tabWidth + 4}
          height={height + 8}
          fill={selected ? "white" : widgetTheme.selectedGray}
        />
      );

      if (selected) {
        overlay.push(
          <rect
            key={id++}
            x={x + 5}
            y={y + widgetTheme.strokeWidth / 2}
            width={tabWidth}
            height={height + 8 - widgetTheme.strokeWidth}
            fill="white"
          />
        );
      }

      overlay.push(
        <text
          key={id++}
          x={x + 4}
          y={y + 2 + height / 2 + widgetTheme.fontSize / 2}
          fontSize={widgetTheme.fontSize}
        >
          {item.label}
        </text>
      );

      overlay.push(
        <PageLink
          key={id++}
          x={x + widgetTheme.strokeWidth / 2}
          y={y + widgetTheme.strokeWidth / 2}
          width={tabWidth - widgetTheme.strokeWidth}
          height={height + 8 - widgetTheme.strokeWidth}
          pageId={item.link}
        />
      );

      y += 8 + height;
    }

    return (
      <>
        {renderedItems}
        <rect {...widgetRectAttrs} fill="white" {...this.lowerBox} />
        {overlay}
      </>
    );
  }

  private get verticalTabWidth(): number {
    let maxTextWidth = this.verticalMinWidth.get();
    for (const item of this.itemList.get()) {
      const width = getTextWidth(item.label, widgetTheme.fontSize);
      if (width > maxTextWidth) {
        maxTextWidth = width;
      }
    }
    return maxTextWidth + 8 + widgetTheme.rx;
  }

  private get lowerBox() {
    const box = this.boundingBox;
    if (this.verticalTabs.get()) {
      const tabWidth = this.verticalTabWidth;
      return {
        x: box.x + tabWidth + widgetTheme.strokeWidth,
        y: box.y,
        width: box.width - tabWidth - widgetTheme.strokeWidth,
        height: box.height,
      };
    } else {
      return {
        x: box.x,
        y: box.y + widgetTheme.fontSize + 4,
        width: box.width,
        height: box.height - widgetTheme.fontSize - 4,
      };
    }
  }

  override initializeAfterAdd() {
    this.box = { x: 0, y: 0, width: 180, height: 115 };
    const itemId = this.nextId();
    this.itemList.set([
      {
        id: itemId,
        label: "Tab 1",
      },
      {
        id: this.nextId(),
        label: "Tab 2",
      },
      {
        id: this.nextId(),
        label: "Tab 3",
      },
    ]);

    this.itemListSelection.setSelection(itemId, true);
  }

  override getSnapBoxes(args: SnapBoxesArgs): void {
    super.getSnapBoxes(args);
    const box = this.box;
    args.addMarginBox(this.lowerBox, -snapConfiguration.snapMargin);
  }

  override getSnapReferences(args: SnapReferencesArgs): void {
    super.getSnapReferences(args);
    const box = this.box;
    args.addMarginBox(this.lowerBox, -snapConfiguration.snapMargin);
  }
}
