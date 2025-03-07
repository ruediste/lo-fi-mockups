import { JSX } from "react";
import {
  ObjectProperty,
  PageItem,
  RenderEditorInteractionArgs,
} from "./Project";
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
  box = new ObjectProperty<Rectangle>(this, "box", {
    x: 0,
    y: 0,
    width: 40,
    height: 30,
  }).hidden();

  abstract label: string;

  override renderEditorInteraction({
    isSelected,
    setSelectedItem,
  }: RenderEditorInteractionArgs): JSX.Element {
    return (
      <DraggableAndResizableBox
        showHandles={isSelected}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelectedItem(this);
        }}
        box={this.box.get()}
        update={(box) => this.box.set(box)}
      />
    );
  }

  // initialize this widget for the palette and return required information
  abstract palette(): WidgetPaletteInfo;
}
