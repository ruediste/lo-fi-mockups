import { Selection } from "@/editor/Selection";
import { SnapResult } from "@/model/Page";
import {
  PageItem,
  PageItemData,
  RenderInteractionArgs,
  SnapBoxesArgs,
  SnapReferencesArgs,
} from "@/model/PageItem";
import { PageItemInteraction } from "@/model/PageItemInteraction";
import { DraggableConnectorSnapBox } from "@/model/PageItemInteractionHelpers";
import { useRerenderOnEvent } from "@/util/hooks";
import { WithHooks } from "@/util/WithHooks";
import { SelectProperty, StringProperty } from "../model/PageItemProperty";
import { Position, Rectangle, Widget } from "./Widget";
import { widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

export type UmlMarkerType =
  | "None"
  | "Association"
  | "Aggregation"
  | "Composition"
  | "Inheritance";

export const UML_MARKER_OPTIONS: [UmlMarkerType, string][] = [
  ["None", "None"],
  ["Association", "Association"],
  ["Inheritance", "Inheritance"],
  ["Aggregation", "Aggregation"],
  ["Composition", "Composition"],
];

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
  labelText = new StringProperty(this, "label", "Label", "");
  sourceMultiplicity = new StringProperty(
    this,
    "sourceMultiplicity",
    "Source Multiplicity",
    ""
  );
  targetMultiplicity = new StringProperty(
    this,
    "targetMultiplicity",
    "Target Multiplicity",
    ""
  );
  sourceMarkerType = new SelectProperty<UmlMarkerType>(
    this,
    "sourceMarkerType",
    "Source Marker",
    () => UML_MARKER_OPTIONS,
    "None"
  );
  targetMarkerType = new SelectProperty<UmlMarkerType>(
    this,
    "targetMarkerType",
    "Target Marker",
    () => UML_MARKER_OPTIONS,
    "Association"
  );

  source!: ConnectorEndpoint;
  target!: ConnectorEndpoint;

  initializeItemReferences(): void {
    this.source = new ConnectorEndpoint(this, this.data_.source);
    this.target = new ConnectorEndpoint(this, this.data_.target);
  }

  initializeAfterAdd(): void {}

  get data_(): ConnectorWidgetData {
    return this.data as ConnectorWidgetData;
  }

  private getMarkerUrl(markerType: UmlMarkerType | null): string | undefined {
    if (markerType === null) return undefined;

    switch (markerType) {
      case "None":
        return undefined;
      case "Association":
        return "url(#connector-association)";
      case "Aggregation":
        return "url(#connector-aggregation)";
      case "Composition":
        return "url(#connector-composition)";
      case "Inheritance":
        return "url(#connector-inheritance)";
      default:
        return undefined;
    }
  }

  renderContent(): React.ReactNode {
    return (
      <WithHooks>
        {() => {
          useRerenderOnEvent(this.page.onItemPositionChange);
          const { source, target } = this;
          const text = this.labelText.get();
          const sourceMulti = this.sourceMultiplicity.get();
          const targetMulti = this.targetMultiplicity.get();
          const sourceMarkerType = this.sourceMarkerType.get();
          const targetMarkerType = this.targetMarkerType.get();

          // Calculate middle position of the connector line
          const midX = (source.position.x + target.position.x) / 2;
          const midY = (source.position.y + target.position.y) / 2;

          // Calculate text dimensions for background
          const textWidth = getTextWidth(text, widgetTheme.fontSize);
          const textHeight = widgetTheme.fontSize;
          const padding = 6;

          // Get marker URLs
          const sourceMarkerUrl = this.getMarkerUrl(sourceMarkerType);
          const targetMarkerUrl = this.getMarkerUrl(targetMarkerType);

          return (
            <>
              <defs>
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
              {/* make sure multiplicity background is behind connector line */}
              {sourceMulti &&
                sourceMulti.length > 0 &&
                this.renderMultiplicity(sourceMulti, source.position, {
                  x: target.position.x - source.position.x,
                  y: target.position.y - source.position.y,
                })}
              {targetMulti &&
                targetMulti.length > 0 &&
                this.renderMultiplicity(targetMulti, target.position, {
                  x: source.position.x - target.position.x,
                  y: source.position.y - target.position.y,
                })}
              <line
                x1={source.position.x}
                y1={source.position.y}
                x2={target.position.x}
                y2={target.position.y}
                stroke="#333"
                strokeWidth="2"
                markerEnd={targetMarkerUrl}
              />
              {/* invisible line to draw the source marker */}
              <line
                x1={target.position.x}
                y1={target.position.y}
                x2={source.position.x}
                y2={source.position.y}
                stroke="none"
                strokeWidth="2"
                markerEnd={sourceMarkerUrl}
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
        }}
      </WithHooks>
    );
  }

  private renderMultiplicity(
    text: string,
    position: Position,
    direction: Position
  ): React.ReactNode {
    const dx = direction.x;
    const dy = direction.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let offsetX = 0;
    let offsetY = 0;
    if (dist > 0) {
      const ux = dx / dist;
      const uy = dy / dist;
      if (ux < 0) {
        offsetX = 10 * ux - 10 * uy;
        offsetY = 10 * uy + 10 * ux;
      } else {
        offsetX = 10 * ux + 10 * uy;
        offsetY = 10 * uy - 10 * ux;
      }
    }

    // Calculate text dimensions for background
    const textWidth = getTextWidth(text, widgetTheme.fontSize);
    const textHeight = widgetTheme.fontSize;
    const padding = 6;
    return (
      <>
        <rect
          x={position.x + offsetX - textWidth / 2 - padding}
          y={position.y + offsetY - textHeight / 2 - padding}
          width={textWidth + 2 * padding}
          height={textHeight + 2 * padding}
          fill="rgba(255, 255, 255, 1)"
          rx="4"
          filter={`url(#blur-${this.data.id})`}
        />
        <text
          x={position.x + offsetX}
          y={position.y + offsetY + widgetTheme.fontSize / 4}
          fontSize={widgetTheme.fontSize}
          textAnchor="middle"
          fill="#333"
        >
          {text}
        </text>
      </>
    );
  }

  get boundingBox(): Rectangle {
    const { source, target } = this;

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

class ConnectorEndpoint {
  connectedItem?: PageItem;
  constructor(
    public widget: ConnectorWidget,
    public data: ConnectorEndpointData
  ) {
    if (data.connectedItemId !== undefined)
      this.connectedItem = widget.page.allItems.get(data.connectedItemId);
  }

  get position() {
    if (this.connectedItem === undefined) {
      return this.data.position;
    } else {
      const box = this.connectedItem.boundingBox;
      return {
        x: box.x + this.data.position.x * box.width,
        y: box.y + this.data.position.y * box.height,
      };
    }
  }

  moveBy(delta: Position) {
    const pos = this.position;
    const newPos = { x: pos.x + delta.x, y: pos.y + delta.y };
    this.data.position = newPos;
    this.data.connectedItemId = undefined;
    this.connectedItem = undefined;
  }

  setPosition(position: Position, snap?: SnapResult) {
    const hSource = snap?.h?.box.sourceItem;
    const vSource = snap?.v?.box.sourceItem;

    const sources = [hSource, vSource].filter((x) => x != undefined);

    if (
      sources.length == 1 ||
      (sources.length == 2 && sources[0] === sources[1])
    ) {
      // snapped to an item
      const source = sources[0];
      const box = source.boundingBox;
      this.connectedItem = source;
      this.data.connectedItemId = source.id;
      this.data.position = {
        x: (position.x - box.x) / box.width,
        y: (position.y - box.y) / box.height,
      };
    } else {
      this.data.position = position;
      this.data.connectedItemId = undefined;
      this.connectedItem = undefined;
    }

    this.widget.onChange.notify();
    this.widget.page.onItemPositionChange.notify();
    this.widget.onDataChanged();
  }
}

class ConnectorInteraction extends PageItemInteraction {
  get item_(): ConnectorWidget {
    return this.item as ConnectorWidget;
  }
  renderEditorInteraction({
    projection,
  }: RenderInteractionArgs): React.ReactNode {
    return (
      <WithHooks>
        {() => {
          useRerenderOnEvent(this.item.page.onItemPositionChange);
          const { source, target } = this.item_;
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
                onDoubleClick={() => this.item.page.duplicateItem(this.item)}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  this.item.page.setSelection(
                    e.ctrlKey
                      ? selection.toggle(this.item)
                      : Selection.of(this.item)
                  );
                  // e.currentTarget.setPointerCapture(e.pointerId);
                  // (this as any).dragState = {
                  //   startEventPos: Vec2d.fromEvent(e),
                  //   lastOffset: new Vec2d(0, 0),
                  // };
                }}
                // onPointerMove={(e) => {
                //   const dragState = (this as any).dragState;
                //   if (dragState) {
                //     const offset = projection.scaleToWorld(
                //       Vec2d.fromEvent(e).sub(dragState.startEventPos)
                //     );
                //     const diff = offset.sub(dragState.lastOffset);
                //     this.moveBy({ x: diff.x, y: diff.y });
                //     dragState.lastOffset = offset;
                //   }
                // }}
                // onPointerUp={(e) => {
                //   if ((this as any).dragState) {
                //     e.currentTarget.releasePointerCapture(e.pointerId);
                //     (this as any).dragState = undefined;
                //   }
                // }}
              />
              <DraggableConnectorSnapBox
                position={source.position}
                item={this.item}
                visible={selection.has(this.item)}
                update={(start, delta, result) => {
                  this.item_.source.setPosition(
                    {
                      x: start.x + delta.x,
                      y: start.y + delta.y,
                    },
                    result
                  );
                }}
                projection={projection}
                cursor="grab"
              />
              <DraggableConnectorSnapBox
                position={target.position}
                item={this.item}
                visible={selection.has(this.item)}
                update={(start, delta, result) => {
                  this.item_.target.setPosition(
                    {
                      x: start.x + delta.x,
                      y: start.y + delta.y,
                    },
                    result
                  );
                }}
                projection={projection}
                cursor="grab"
              />
            </>
          );
        }}
      </WithHooks>
    );
  }
  renderMasterInteraction(props: RenderInteractionArgs): React.ReactNode {
    return <></>;
  }
  moveBy(delta: Position): void {
    this.item_.source.moveBy(delta);
    this.item_.target.moveBy(delta);
    this.item.onChange.notify();
    this.item.onDataChanged();
    this.item.page.onItemPositionChange.notify();
  }
  setPosition(pos: Position): void {
    (this.item_.data_.source.position = { x: pos.x + 10, y: pos.y + 10 }),
      (this.item_.data_.target.position = { x: pos.x + 90, y: pos.y + 10 });
  }
}
