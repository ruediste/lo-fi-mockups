import { JSX } from "react";
import { RenderInteractionArgs } from "../model/PageItem";
import { ObjectProperty } from "../model/PageItemProperty";
import { Selection } from "../Selection";
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

  abstract moveBy(delta: Position): void;

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
    selection,
    setSelection,
  }: RenderInteractionArgs): JSX.Element {
    return (
      <DraggableAndResizableBox
        showHandles={selection.hasSingle(this.widget)}
        showBox={selection.has(this.widget)}
        onPointerDown={(e) => {
          setSelection(
            e.ctrlKey
              ? selection.toggle(this.widget)
              : Selection.of(this.widget)
          );
        }}
        box={this.box.get()}
        update={(box) => this.box.set(box)}
      />
    );
  }

  override renderMasterInteraction({
    selection,
    setSelection,
  }: RenderInteractionArgs): React.ReactNode {
    if (!this.widget.properties.some((x) => x.isEditable)) return null;
    return (
      <SelectableBox
        box={this.box.get()}
        showHandles={selection.hasSingle(this.widget)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelection(Selection.of(this.widget));
        }}
      />
    );
  }

  override moveBy(delta: Position): void {
    const box = this.box.get();
    this.box.set({ ...box, x: box.x + delta.x, y: box.y + delta.y });
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
    selection,
    setSelection,
  }: RenderInteractionArgs): JSX.Element {
    return (
      <DraggablePositionBox
        select={(add) =>
          setSelection(
            add ? selection.toggle(this.widget) : Selection.of(this.widget)
          )
        }
        box={this.widget.boundingBox}
        update={(box) => this.position.set(box)}
        isSelected={selection.has(this.widget)}
      />
    );
  }

  override renderMasterInteraction({
    selection,
    setSelection,
  }: RenderInteractionArgs): React.ReactNode {
    if (!this.widget.properties.some((x) => x.isEditable)) return null;

    return (
      <SelectableBox
        box={this.widget.boundingBox}
        showHandles={selection.hasSingle(this.widget)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelection(Selection.of(this.widget));
        }}
      />
    );
  }

  override moveBy(delta: Position): void {
    const position = this.position.get();
    this.position.set({ x: position.x + delta.x, y: position.y + delta.y });
  }
}
