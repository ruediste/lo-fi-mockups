import { JSX } from "react";
import { Selection } from "../editor/Selection";
import { PageItem, RenderInteractionArgs } from "../model/PageItem";
import { ObjectProperty } from "../model/PageItemProperty";
import { IRectangle, IVec2d } from "../widgets/Widget";
import {
  DraggableSnapBox,
  DraggableSnapResizeBox,
  SelectableBox,
} from "./PageItemInteractionHelpers";

export abstract class PageItemInteraction {
  constructor(protected item: PageItem) {
    item.interaction = this;
  }

  abstract renderEditorInteraction(
    props: RenderInteractionArgs,
  ): React.ReactNode;

  abstract renderMasterInteraction(
    props: RenderInteractionArgs,
  ): React.ReactNode;

  abstract moveBy(delta: IVec2d, allItemsBeingMoved?: Set<PageItem>): void;

  abstract setPosition(pos: IVec2d): void;
}

export class BoxWidgetInteraction extends PageItemInteraction {
  box = new ObjectProperty<IRectangle>(this.item, "box", {
    x: 0,
    y: 0,
    width: 40,
    height: 30,
  }).hidden(() => true);

  private _widthOnly = false;
  private _heightOnly = false;

  override setPosition(pos: IVec2d): void {
    this.box.set({ ...this.box.get(), ...pos });
  }

  override renderEditorInteraction({
    projection,
  }: RenderInteractionArgs): React.ReactNode {
    const selection = this.item.page.selection;
    return (
      <DraggableSnapResizeBox
        {...{
          projection,
          visible: selection.has(this.item),
          item: this.item,
          select: (toggle) =>
            this.item.page.setSelection(
              toggle ? selection.toggle(this.item) : Selection.of(this.item),
            ),
          update: (value) => {
            this.box.set(value);
            this.item.page.onItemPositionChange.notify();
          },
          widthOnly: this._widthOnly,
          heightOnly: this._heightOnly,
          onDuplicate: () => this.item.page.duplicateItem(this.item),
        }}
      />
    );
  }

  override renderMasterInteraction({}: RenderInteractionArgs): React.ReactNode {
    if (!this.item.properties.some((x) => x.shouldRender)) return null;
    return (
      <SelectableBox
        box={this.box.get()}
        showHandles={this.item.page.selection.hasSingle(this.item)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          if (!e.ctrlKey && !e.shiftKey) {
            e.stopPropagation();
            this.item.page.setSelection(Selection.of(this.item));
          }
        }}
      />
    );
  }

  widthOnly() {
    this._widthOnly = true;
    return this;
  }

  heightOnly() {
    this._heightOnly = true;
    return this;
  }

  override moveBy(delta: IVec2d): void {
    const box = this.box.get();
    this.box.set({ ...box, x: box.x + delta.x, y: box.y + delta.y });
  }
}

export class PositionWidgetInteraction extends PageItemInteraction {
  position = new ObjectProperty<IVec2d>(this.item, "position", {
    x: 0,
    y: 0,
  }).hidden(() => true);

  override setPosition(pos: IVec2d): void {
    this.position.set({ ...pos });
  }

  movePosition(delta: { x: number; y: number }) {
    const pos = this.position.get();
    this.position.set({ x: pos.x + delta.x, y: pos.y + delta.y });
  }

  override renderEditorInteraction({
    projection,
  }: RenderInteractionArgs): JSX.Element {
    const selection = this.item.page.selection;
    return (
      <DraggableSnapBox
        {...{
          box: this.item.boundingBox,
          projection,
          visible: selection.has(this.item),
          page: this.item.page,
          select: (toggle) =>
            this.item.page.setSelection(
              toggle ? selection.toggle(this.item) : Selection.of(this.item),
            ),
          items: () => this.item.page.selection.items,
          moveItems: (by) => this.item.page.selection.moveBy(by),
          onDuplicate: () => this.item.page.duplicateItem(this.item),
        }}
      />
    );
  }

  override renderMasterInteraction({}: RenderInteractionArgs): React.ReactNode {
    if (!this.item.properties.some((x) => x.shouldRender)) return null;

    return (
      <SelectableBox
        box={this.item.boundingBox}
        showHandles={this.item.page.selection.hasSingle(this.item)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          if (!e.ctrlKey && !e.shiftKey) {
            e.stopPropagation();
            this.item.page.setSelection(Selection.of(this.item));
          }
        }}
      />
    );
  }

  override moveBy(delta: IVec2d): void {
    const position = this.position.get();
    this.position.set({ x: position.x + delta.x, y: position.y + delta.y });
  }
}
