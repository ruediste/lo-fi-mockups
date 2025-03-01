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

export class Widget extends PageItem {
  box = new PageItemProperty<Rectangle>(this, "box", {
    x: 0,
    y: 0,
    width: 40,
    height: 40,
  });

  override renderEditorInteraction(): JSX.Element {
    return (
      <DraggableAndResizableBox
        box={this.box.get()}
        update={(box) => this.box.set(box)}
      />
    );
  }
}
export class ListWidget extends Widget {
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
}
