import { PageItem } from "../model/PageItem";
import {
  BoxWidgetInteraction,
  PositionWidgetInteraction,
} from "../model/PageItemInteraction";

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
  abstract initializeAfterAdd(): void;
}

export abstract class BoxWidget extends Widget {
  protected boxInteraction = new BoxWidgetInteraction(this);

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
export abstract class WidthWidget extends Widget {
  private boxInteraction = new BoxWidgetInteraction(this).widthOnly();

  get box() {
    return { ...this.boxInteraction.box.get(), height: this.height };
  }

  abstract get height(): number;

  set box(value: Rectangle) {
    this.boxInteraction.box.set(value);
  }

  override get boundingBox(): Rectangle {
    return this.box;
  }
}

export abstract class HeightWidget extends Widget {
  private boxInteraction = new BoxWidgetInteraction(this).heightOnly();

  get box() {
    return { ...this.boxInteraction.box.get(), width: this.width };
  }

  abstract get width(): number;

  set box(value: Rectangle) {
    this.boxInteraction.box.set(value);
  }

  override get boundingBox(): Rectangle {
    return this.box;
  }
}

export const globalSvgContent = (
  <>
    <marker
      id="connector-association"
      markerWidth="10"
      markerHeight="7"
      refX="9"
      refY="3.5"
      orient="auto"
    >
      <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
    </marker>

    {/* Aggregation marker (hollow diamond) */}
    <marker
      id="connector-aggregation"
      markerWidth="12"
      markerHeight="8"
      refX="11"
      refY="4"
      orient="auto"
    >
      <polygon
        points="0 4, 6 0, 12 4, 6 8"
        fill="white"
        stroke="#333"
        strokeWidth="1"
      />
    </marker>

    {/* Composition marker (filled diamond) */}
    <marker
      id="connector-composition"
      markerWidth="12"
      markerHeight="8"
      refX="11"
      refY="4"
      orient="auto"
    >
      <polygon
        points="0 4, 6 0, 12 4, 6 8"
        fill="#333"
        stroke="#333"
        strokeWidth="1"
      />
    </marker>

    {/* Inheritance marker (hollow triangle) */}
    <marker
      id="connector-inheritance"
      markerWidth="12"
      markerHeight="10"
      refX="11"
      refY="5"
      orient="auto"
    >
      <polygon
        points="0 0, 12 5, 0 10"
        fill="white"
        stroke="#333"
        strokeWidth="1"
      />
    </marker>
  </>
);
