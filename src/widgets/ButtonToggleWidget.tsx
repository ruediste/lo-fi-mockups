import { JSX } from "react";
import {
  ItemListProperty,
  ItemListSelectionProperty,
} from "../model/ItemListProperty";
import { PositionWidget, Rectangle } from "./Widget";
import { PageLink, WidgetBounds } from "./WidgetHelpers";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

export class ButtonToggleWidget extends PositionWidget {
  label = "Button Toggle";

  itemListSelection = new ItemListSelectionProperty(this, "itemSelection");
  itemList = new ItemListProperty(
    this,
    "items",
    "Items",
    this.itemListSelection
  );

  private itemGap = 1;

  get boundingBox(): Rectangle {
    const items = this.itemList.get();
    const itemWidths = items.map(
      (item) => getTextWidth(item.label) + 2 * widgetTheme.margin
    );
    const totalWidth = itemWidths.reduce((sum, width) => sum + width, 0);
    const spacing = (items.length - 1) * this.itemGap; // Add 1px spacing between buttons

    return {
      ...this.position,
      width: totalWidth + spacing,
      height: widgetTheme.fontSize + 2 * widgetTheme.margin,
    };
  }

  renderContent(): JSX.Element {
    const box = this.boundingBox;
    const items = this.itemList.get();
    const selection = this.itemListSelection.get();
    const itemWidths = items.map(
      (item) => getTextWidth(item.label) + 2 * widgetTheme.margin
    );

    let xOffset = box.x;
    const renderedItems: JSX.Element[] = [];

    items.forEach((item, index) => {
      const itemBox = {
        x: xOffset,
        y: box.y,
        width: itemWidths[index],
        height: box.height,
      };

      const isSelected = selection.selectedItems[item.id] ?? false;

      renderedItems.push(
        <rect
          key={`rect-${item.id}`}
          {...widgetRectAttrs}
          rx={0}
          ry={0}
          {...itemBox}
          fill={isSelected ? widgetTheme.selectedBlue : "white"}
          stroke={widgetTheme.stroke}
          strokeWidth={widgetTheme.strokeWidth}
        />
      );

      renderedItems.push(
        <text
          key={`text-${item.id}`}
          x={itemBox.x + itemBox.width / 2}
          y={itemBox.y + itemBox.height - widgetTheme.margin - 2}
          fontSize={widgetTheme.fontSize}
          textAnchor="middle"
          fill={"black"}
        >
          {item.label}
        </text>
      );

      renderedItems.push(
        <PageLink key={`link-${item.id}`} {...itemBox} pageId={item.link} />
      );

      xOffset += itemBox.width + this.itemGap; // Add 1px spacing
    });

    return <WidgetBounds box={box}>{renderedItems}</WidgetBounds>;
  }

  override initializeAfterAdd() {
    this.position = { x: 0, y: 0 };
    const itemId1 = this.nextId();
    const itemId2 = this.nextId();
    const itemId3 = this.nextId();
    this.itemList.set([
      {
        id: itemId1,
        label: "Option 1",
      },
      {
        id: itemId2,
        label: "Option 2",
      },
      {
        id: itemId3,
        label: "Option 3",
      },
    ]);
    this.itemListSelection.setSelection(itemId1, true);
  }
}
