import {
  HorizontalSnapBox,
  SnapBoxesArgs,
  SnapReferencesArgs,
} from "@/model/PageItem";
import { ReactNode } from "react";
import {
  ItemListProperty,
  ItemListSelectionProperty,
} from "../model/ItemListProperty";
import { BoxWidget } from "./Widget";
import { snapConfiguration, widgetRectAttrs, widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

export class TabsWidget extends BoxWidget {
  label = "Tabs";

  itemListSelection = new ItemListSelectionProperty(this, "itemSelection");
  itemList = new ItemListProperty(
    this,
    "items",
    "Items",
    this.itemListSelection
  );

  renderContent(): React.ReactNode {
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
          height={widgetTheme.fontSize + 4 + widgetTheme.ry}
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

      x += 8 + width;
    }

    const lowerBox = {
      x: box.x,
      y: box.y + widgetTheme.fontSize + 4,
      width: box.width,
      height: box.height - widgetTheme.fontSize - 4,
    };
    return (
      <>
        {renderedItems}
        <rect {...widgetRectAttrs} fill="white" {...lowerBox} />
        {overlay}
      </>
    );
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
    args.horizontal.push(
      new HorizontalSnapBox(
        box.x,
        box.y + widgetTheme.fontSize + 4 + snapConfiguration.snapMargin,
        box.width
      )
    );
  }

  override getSnapReferences(args: SnapReferencesArgs): void {
    super.getSnapReferences(args);
    const box = this.box;
    args.top.push({
      x: box.x,
      y: box.y + widgetTheme.fontSize + 4,
      width: box.width,
    });
  }
}
