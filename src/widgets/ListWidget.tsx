import { JSX } from "react";
import { StringProperty } from "../Project";
import { Widget } from "../Widget";
import { widgetTheme } from "./widgetTheme";

export class ListWidget extends Widget {
  label = "List";
  text = new StringProperty(this, "text", "").textArea();

  items: { label: string; selected: boolean }[] = [];

  override renderContent(): JSX.Element {
    const box = this.box.get();

    const renderedItems: JSX.Element[] = [];
    let y = box.y;
    let id = 1;
    for (const item of this.items) {
      if (item.selected) {
        renderedItems.push(
          <rect
            key={id++}
            x={box.x}
            y={y - 15}
            width={box.width}
            height={15}
            fill="blue"
          />
        );
      }
      renderedItems.push(
        <text key={id++} x={box.x} y={y} fontSize={24}>
          {item.label}
        </text>
      );
      y += 15;
    }

    return (
      <>
        <rect
          {...widgetTheme}
          fill="none"
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
        />
        {renderedItems}
      </>
    );
  }

  initialize(): void {
    super.initialize();
    this.text.set("Item 1\n Item 2*\nItem 3");
  }
  override recalculate(): void {
    super.recalculate();
    const parts = this.text.get().split("\n");

    this.items = parts.map((t) => {
      const selected = t.endsWith("*");

      if (selected) {
        return { label: t.substring(0, t.length - 1).trim(), selected };
      } else {
        return { label: t, selected: false };
      }
    });
  }

  override palette() {
    return {
      boundingBox: this.box.get(),
    };
  }
}
