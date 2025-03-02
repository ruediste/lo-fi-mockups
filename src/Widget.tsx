import { JSX } from "react";
import { PageItem, PageItemProperty, StringPageItemProperty } from "./Project";
import { DraggableAndResizableBox } from "./WidgetHelpers";

// class ItemGroup extends PageItem {}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetPaletteInfo {
  boundingBox: Rectangle;
}

export abstract class Widget extends PageItem {
  box = new PageItemProperty<Rectangle>(this, "box", {
    x: 0,
    y: 0,
    width: 40,
    height: 30,
  });

  abstract label: string;

  override renderEditorInteraction(): JSX.Element {
    return (
      <DraggableAndResizableBox
        box={this.box.get()}
        update={(box) => this.box.set(box)}
      />
    );
  }

  // initialize this widget for the palette and return required information
  abstract palette(): WidgetPaletteInfo;
}

export class ListWidget extends Widget {
  label = "List";
  text = new StringPageItemProperty(this, "text", "");

  override renderContent(): JSX.Element {
    const box = this.box.get();

    return (
      <>
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          style={{ strokeWidth: 2, stroke: "blue", fill: "none" }}
        />
      </>
    );
  }

  override palette() {
    this.text.set("Hello World");
    return {
      boundingBox: this.box.get(),
    };
  }
}
