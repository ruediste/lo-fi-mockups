import { JSX } from "react";

import {
  PageItem,
  RenderEditorInteractionArgs as RenderInteractionArgs,
} from "./model/PageItem";
import { ObjectProperty } from "./model/PageItemProperty";
import {
  DraggableAndResizableBox,
  SelectableBox,
} from "./widgets/WidgetHelpers";

// class ItemGroup extends PageItem {}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export abstract class Widget extends PageItem {
  box = new ObjectProperty<Rectangle>(this, "box", {
    x: 0,
    y: 0,
    width: 40,
    height: 30,
  }).hidden(() => true);

  abstract label: string;

  override renderEditorInteraction({
    isSelected,
    setSelectedItem,
  }: RenderInteractionArgs): JSX.Element {
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

  override renderMasterInteraction({
    isSelected,
    setSelectedItem,
  }: RenderInteractionArgs): React.ReactNode {
    return (
      <SelectableBox
        box={this.box.get()}
        showHandles={isSelected}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelectedItem(this);
        }}
      />
    );
  }

  // initialize this widget for the palette and return required information
  abstract initializePalette(): void;

  boundingBox() {
    return this.box.get();
  }
}
