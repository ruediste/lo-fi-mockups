import { PageItem, RenderInteractionArgs } from "../model/PageItem";
import {
  BoxWidgetInteraction,
  PositionWidgetInteraction,
  WidgetInteraction,
} from "./WidgetInteraction";

// class ItemGroup extends PageItem {}

export interface Position {
  x: number;
  y: number;
}
export interface Rectangle extends Position {
  width: number;
  height: number;
}

export abstract class Widget extends PageItem {
  public interaction!: WidgetInteraction;

  abstract label: string;

  override renderEditorInteraction(args: RenderInteractionArgs) {
    return this.interaction.renderEditorInteraction(args);
  }

  override renderMasterInteraction(args: RenderInteractionArgs) {
    return this.interaction.renderMasterInteraction(args);
  }

  override moveBy(delta: Position): void {
    this.interaction.moveBy(delta);
  }

  // initialize this widget for the palette and return required information
  abstract initializeAfterAdd(): void;
}

export abstract class BoxWidget extends Widget {
  private boxInteraction = new BoxWidgetInteraction(this);

  get box() {
    return this.boxInteraction.box.get();
  }
  set box(value: Rectangle) {
    this.boxInteraction.box.set(value);
  }

  override get boundingBox(): Rectangle {
    return this.box;
  }
}

export abstract class PositionWidget extends Widget {
  private positionInteraction = new PositionWidgetInteraction(this);

  get position() {
    return this.positionInteraction.position.get();
  }
  set position(value: Position) {
    this.positionInteraction.position.set(value);
  }
}
