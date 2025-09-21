import { Selection } from "@/editor/Selection";
import {
  PageItemData,
  RenderInteractionArgs,
  SnapBoxesArgs,
  SnapReferencesArgs,
} from "@/model/PageItem";
import { PageItemInteraction } from "@/model/PageItemInteraction";
import { DraggableBoundingBoxSnapBox } from "@/model/PageItemInteractionHelpers";
import { Vec2d } from "@/util/Vec2d";
import { StringProperty } from "../model/PageItemProperty";
import { Position, Rectangle, Widget } from "./Widget";
import { widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

export interface ConnectorWidgetData extends PageItemData {
  source: ConnectorEndpointData;
  target: ConnectorEndpointData;
}

interface ConnectorEndpointData {
  position: { x: number; y: number };
  connectedItemId?: number;
}
export class ConnectorWidget extends Widget {
  label = "Connector";
  protected connectorInteraction = new ConnectorInteraction(this);

  text = new StringProperty(this, "text", "Label", "");

  initializeAfterAdd(): void {}

  get data_(): ConnectorWidgetData {
    return this.data as ConnectorWidgetData;
  }

  renderContent(): React.ReactNode {
    const { source, target } = this.data_;
    const text = this.text.get();

    // Calculate middle position of the connector line
    const midX = (source.position.x + target.position.x) / 2;
    const midY = (source.position.y + target.position.y) / 2;

    // Calculate text dimensions for background
    const textWidth = getTextWidth(text, widgetTheme.fontSize);
    const textHeight = widgetTheme.fontSize;
    const padding = 6;

    return (
      <>
        <defs>
          <marker
            id={`arrowhead-${this.data.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
          </marker>
          <filter
            id={`blur-${this.data.id}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        <line
          x1={source.position.x}
          y1={source.position.y}
          x2={target.position.x}
          y2={target.position.y}
          stroke="#333"
          strokeWidth="2"
          markerEnd={`url(#arrowhead-${this.data.id})`}
        />
        {text && text.length > 0 && (
          <>
            <rect
              x={midX - textWidth / 2 - padding}
              y={midY - textHeight / 2 - padding}
              width={textWidth + 2 * padding}
              height={textHeight + 2 * padding}
              fill="rgba(255, 255, 255, 1)"
              rx="4"
              filter={`url(#blur-${this.data.id})`}
            />
            <text
              x={midX}
              y={midY + textHeight / 4}
              fontSize={widgetTheme.fontSize}
              textAnchor="middle"
              fill="#333"
            >
              {text}
            </text>
          </>
        )}
      </>
    );
  }

  get boundingBox(): Rectangle {
    const { source, target } = this.data_;

    const minX = Math.min(source.position.x, target.position.x);
    const minY = Math.min(source.position.y, target.position.y);
    const maxX = Math.max(source.position.x, target.position.x);
    const maxY = Math.max(source.position.y, target.position.y);

    return {
      x: minX - 10,
      y: minY - 10,
      width: maxX - minX + 20,
      height: maxY - minY + 20,
    };
  }

  override getSnapBoxes(args: SnapBoxesArgs): void {}

  override getSnapReferences(args: SnapReferencesArgs): void {}
}

class ConnectorInteraction extends PageItemInteraction {
  get item_(): ConnectorWidget {
    return this.item as ConnectorWidget;
  }
  renderEditorInteraction({
    projection,
  }: RenderInteractionArgs): React.ReactNode {
    const { source, target } = this.item_.data_;
    const selection = this.item.page.selection;
    const handleSize = projection.lengthToWorld(12);

    const visible = selection.has(this.item);

    return (
      <>
        <line
          x1={source.position.x}
          y1={source.position.y}
          x2={target.position.x}
          y2={target.position.y}
          stroke={visible ? "#00FF0040" : "transparent"}
          strokeWidth={projection.lengthToWorld(20)}
          style={{ cursor: "move" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            this.item.page.setSelection(
              e.ctrlKey ? selection.toggle(this.item) : Selection.of(this.item)
            );
            e.currentTarget.setPointerCapture(e.pointerId);
            (this as any).dragState = {
              startEventPos: Vec2d.fromEvent(e),
              lastOffset: new Vec2d(0, 0),
            };
          }}
          onPointerMove={(e) => {
            const dragState = (this as any).dragState;
            if (dragState) {
              const offset = projection.scaleToWorld(
                Vec2d.fromEvent(e).sub(dragState.startEventPos)
              );
              const diff = offset.sub(dragState.lastOffset);
              this.moveBy({ x: diff.x, y: diff.y });
              dragState.lastOffset = offset;
            }
          }}
          onPointerUp={(e) => {
            if ((this as any).dragState) {
              e.currentTarget.releasePointerCapture(e.pointerId);
              (this as any).dragState = undefined;
            }
          }}
        />
        <DraggableBoundingBoxSnapBox
          box={{
            x: source.position.x - handleSize / 2,
            y: source.position.y - handleSize / 2,
            width: handleSize,
            height: handleSize,
          }}
          onDragStart={() => ({ startPosition: { ...source.position } })}
          update={(offset, diff, state, snapDisabled) => {
            this.item_.data_.source.position = {
              x: state.startPosition.x + offset.x,
              y: state.startPosition.y + offset.y,
            };
            this.item.onChange.notify();
            this.item.page.onItemPositionChange.notify();
            this.item.onDataChanged();
          }}
          projection={projection}
          visible={visible}
          page={this.item.page}
          excludeItems={new Set([this.item])}
          onDragEnd={() => {}}
        />
        <DraggableBoundingBoxSnapBox
          box={{
            x: target.position.x - handleSize / 2,
            y: target.position.y - handleSize / 2,
            width: handleSize,
            height: handleSize,
          }}
          onDragStart={() => ({ startPosition: { ...target.position } })}
          update={(offset, diff, state, snapDisabled) => {
            this.item_.data_.target.position = {
              x: state.startPosition.x + offset.x,
              y: state.startPosition.y + offset.y,
            };
            this.item.onChange.notify();
            this.item.page.onItemPositionChange.notify();
            this.item.onDataChanged();
          }}
          projection={projection}
          visible={visible}
          page={this.item.page}
          excludeItems={new Set([this.item])}
          onDragEnd={() => {}}
        />
      </>
    );
  }
  renderMasterInteraction(props: RenderInteractionArgs): React.ReactNode {
    return <></>;
  }
  moveBy(delta: Position): void {
    this.item_.data_.source.position = {
      x: this.item_.data_.source.position.x + delta.x,
      y: this.item_.data_.source.position.y + delta.y,
    };
    this.item_.data_.target.position = {
      x: this.item_.data_.target.position.x + delta.x,
      y: this.item_.data_.target.position.y + delta.y,
    };
    this.item.onChange.notify();
    this.item.onDataChanged();
    this.item.page.onItemPositionChange.notify();
  }
  setPosition(pos: Position): void {
    (this.item_.data_.source.position = { x: pos.x + 10, y: pos.y + 10 }),
      (this.item_.data_.target.position = { x: pos.x + 90, y: pos.y + 10 });
  }
}
