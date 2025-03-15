import { JSX } from "react";
import {
  ItemListProperty,
  ItemListSelectionProperty,
} from "../model/ItemListProperty";
import {
  CheckboxProperty,
  MemoValue,
  NumberProperty,
} from "../model/PageItemProperty";
import { Widget } from "../Widget";
import { WidgetBounds } from "./WidgetHelpers";
import { widgetTheme } from "./widgetTheme";

export class ListWidget extends Widget {
  label = "List";
  gap = new NumberProperty(this, "gap", "Gap", 8).hidden(() =>
    this.justifyItems.get()
  );
  justifyItems = new CheckboxProperty(
    this,
    "justifyItems",
    "Justify Items",
    false
  );
  separatorLine = new CheckboxProperty(
    this,
    "separatorLine",
    "Separator Line",
    false
  );

  itemListSelection = new ItemListSelectionProperty(this, "itemSelection");
  itemList = new ItemListProperty(
    this,
    "items",
    "Items",
    this.itemListSelection
  );

  itemsMemo = new MemoValue<{ label: string; selected: boolean }[]>(() => {
    const selection = this.itemListSelection.get();
    return this.itemList.get().map((item) => ({
      label: item.label,
      selected: selection.selectedItems[item.id] ?? false,
    }));
  }, [this.itemList, this.itemListSelection]);

  override renderContent(): JSX.Element {
    const box = this.box.get();

    const renderedItems: JSX.Element[] = [];
    const lines: JSX.Element[] = [];
    const fontSize = widgetTheme.fontSize;
    const gap = this.gap.get();
    const justify = this.justifyItems.get();
    const separatorLine = this.separatorLine.get();
    const items = this.itemsMemo.value;

    const advance = justify ? box.height / items.length : fontSize + gap;
    let y = box.y;
    let id = 1;
    items.forEach((item, idx) => {
      if (separatorLine && (!justify || idx < items.length - 1)) {
        lines.push(
          <line
            key={id++}
            x1={box.x}
            x2={box.x + box.width}
            y1={y + advance}
            y2={y + advance}
            stroke={widgetTheme.stroke}
            strokeWidth={widgetTheme.strokeWidth}
          />
        );
      }

      if (item.selected) {
        renderedItems.push(
          <rect
            key={id++}
            x={box.x}
            y={y}
            width={box.width}
            height={advance}
            fill={widgetTheme.selectedBlue}
          />
        );
      }
      renderedItems.push(
        <text
          key={id++}
          x={box.x + 4}
          y={y + (advance + fontSize) / 2}
          fontSize={fontSize}
          alignmentBaseline="baseline"
        >
          {item.label}
        </text>
      );
      y += advance;
    });

    return (
      <WidgetBounds box={box}>
        {renderedItems}
        {lines}
      </WidgetBounds>
    );
  }

  override initializePalette() {
    this.box.set({ x: 0, y: 0, width: 70, height: 100 });
    const itemId = this.nextId();
    this.itemList.set([
      {
        id: this.nextId(),
        label: "Item 1",
      },
      {
        id: this.nextId(),
        label: "Item 2",
      },
      {
        id: itemId,
        label: "Item 3",
      },
      {
        id: this.nextId(),
        label: "Item 4",
      },
    ]);

    this.itemListSelection.setSelection(itemId, true);
  }
}
