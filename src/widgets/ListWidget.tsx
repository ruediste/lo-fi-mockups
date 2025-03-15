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
import { WidgetBox } from "./WidgetHelpers";
import { widgetTheme } from "./widgetTheme";

export class ListWidget extends Widget {
  label = "List";
  fontSize = new NumberProperty(this, "fontSize", "Font Size", 16);
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
    const fontSize = this.fontSize.get();

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
            fill="lightBlue"
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
      <WidgetBox box={box}>
        {renderedItems}
        {lines}
      </WidgetBox>
    );
  }

  initialize(): void {
    super.initialize();
  }

  override palette() {
    return {
      boundingBox: this.box.get(),
    };
  }
}
