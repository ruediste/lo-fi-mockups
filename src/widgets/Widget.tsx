import { PageItem } from "../model/PageItem";
import {
  BoxWidgetInteraction,
  PositionWidgetInteraction,
} from "./PageItemInteraction";

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
  abstract label: string;

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
