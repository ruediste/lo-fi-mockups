import { JSX } from "react";
import { RenderInteractionArgs } from "../model/PageItem";
import { ObjectProperty } from "../model/PageItemProperty";
import { Position, Rectangle, Widget } from "./Widget";
import {
  DraggableAndResizableBox,
  DraggablePositionBox,
  SelectableBox,
} from "./WidgetHelpers";

export abstract class WidgetInteraction {
  constructor(protected widget: Widget) {
    widget.interaction = this;
  }

  renderEditorInteraction(_args: RenderInteractionArgs): React.ReactNode {
    return null;
  }

  renderMasterInteraction(_args: RenderInteractionArgs): React.ReactNode {
    return null;
  }

  abstract setPosition(pos: Position): void;
}

export class BoxWidgetInteraction extends WidgetInteraction {
  box = new ObjectProperty<Rectangle>(this.widget, "box", {
    x: 0,
    y: 0,
    width: 40,
    height: 30,
  }).hidden(() => true);

  override setPosition(pos: Position): void {
    this.box.set({ ...this.box.get(), ...pos });
  }

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
          setSelectedItem(this.widget);
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
    if (!this.widget.properties.some((x) => x.isEditable)) return null;
    return (
      <SelectableBox
        box={this.box.get()}
        showHandles={isSelected}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelectedItem(this.widget);
        }}
      />
    );
  }
}

export class PositionWidgetInteraction extends WidgetInteraction {
  position = new ObjectProperty<Position>(this.widget, "position", {
    x: 0,
    y: 0,
  }).hidden(() => true);

  override setPosition(pos: Position): void {
    this.position.set({ ...pos });
  }

  override renderEditorInteraction({
    isSelected,
    setSelectedItem,
  }: RenderInteractionArgs): JSX.Element {
    return (
      <DraggablePositionBox
        select={() => {
          setSelectedItem(this.widget);
        }}
        box={this.widget.boundingBox}
        update={(box) => this.position.set(box)}
        isSelected={isSelected}
      />
    );
  }

  override renderMasterInteraction({
    isSelected,
    setSelectedItem,
  }: RenderInteractionArgs): React.ReactNode {
    if (!this.widget.properties.some((x) => x.isEditable)) return null;

    return (
      <SelectableBox
        box={this.widget.boundingBox}
        showHandles={isSelected}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelectedItem(this.widget);
        }}
      />
    );
  }
}
