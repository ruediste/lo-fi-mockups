import { JSX } from "react";
import {
  PageItem,
  PageItemProperty,
  RenderArgs,
  StringPageItemProperty,
} from "./Project";
import { DraggableAndResizableBox } from "./WidgetHelpers";

// class ItemGroup extends PageItem {}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ListWidget extends PageItem {
  box = new PageItemProperty<Rectangle>(this, "box");
  text = new StringPageItemProperty(this, "text");

  override renderContent({ interaction }: RenderArgs): JSX.Element {
    const box = this.get(this.box);

    return (
      <>
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          style={{ strokeWidth: 2, stroke: "blue", fill: "none" }}
        />
        {interaction && (
          <DraggableAndResizableBox
            box={box}
            update={(box) => this.set(this.box, box)}
          />
        )}
      </>
    );
  }
}
