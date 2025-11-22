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
import {
  ConnectionEndConfiguration,
  getRoutePoints,
} from "@/util/connection-routing";
import { useRerenderOnEvent } from "@/util/hooks";
import { Rectangle } from "@/util/rectangle";
import { getDirectionOutside, Vec2d } from "@/util/Vec2d";
import { WithHooks } from "@/util/WithHooks";
import {
  CheckboxProperty,
  getLineDashArray,
  lineStyleProperty,
  MemoValue,
  SelectProperty,
  SelectPropertyOption,
  StringProperty,
} from "../model/PageItemProperty";
import { globalSvgContent, IRectangle, IVec2d, Widget } from "./Widget";
import { widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

type UmlMarkerType = "None" | "Association" | "Composition" | "Inheritance";

const UML_MARKER_OPTIONS: SelectPropertyOption<UmlMarkerType>[] = (
  ["None", "Association", "Composition", "Inheritance"] as const
).map((x) => ({
  value: x,
  label: x,
  icon: () => (
    <svg width="32" height="16" viewBox="0 0 40 20">
      {globalSvgContent}
      <line
        x1="2"
        y1="10"
        x2="36"
        y2="10"
        stroke="#666"
        strokeWidth="2"
        markerEnd={getMarkerUrl(x)}
      />
    </svg>
  ),
}));

function getMarkerUrl(markerType: UmlMarkerType | null): string | undefined {
  if (markerType === null) return undefined;

  switch (markerType) {
    case "None":
      return undefined;
    case "Association":
      return "url(#connector-association)";
    case "Composition":
      return "url(#connector-composition)";
    case "Inheritance":
      return "url(#connector-inheritance)";
    default:
      return undefined;
  }
}

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
  )
    .buttonGroup()
    .noLabel();

  targetMarkerType = new SelectProperty<UmlMarkerType>(
    this,
    "targetMarkerType",
    "Target Marker",
    () => UML_MARKER_OPTIONS,
    "Association"
  )
    .buttonGroup()
    .noLabel();

  lineStyle = lineStyleProperty(this, "lineStyle");

  orthogonalRouting = new CheckboxProperty(
    this,
    "orthogonalRouting",
    "OrthogonalRouting",
    true
  );

  routePointsMemo = new MemoValue<Vec2d[]>(() => {
    const orthogonalRouting = this.orthogonalRouting.get();
    let routePoints: Vec2d[] | null = null;

    if (orthogonalRouting) {
      // Calculate route
      const sourceBoundingBox =
        this.source.connectedItem &&
        Rectangle.fromRect(this.source.connectedItem.boundingBox);

      const sourceConf: ConnectionEndConfiguration = sourceBoundingBox
        ? {
            pos: Vec2d.from(this.source.position),
            inside: false,
            direction: getDirectionOutside(
              sourceBoundingBox,
              Vec2d.from(this.source.position).sub(
                this.source.connectedItem!.boundingBox
              )
            ),
            rectangle: sourceBoundingBox,
          }
        : { pos: Vec2d.from(this.source.position) };

      const targetBoundingBox =
        this.target.connectedItem &&
        Rectangle.fromRect(this.target.connectedItem.boundingBox);

      const targetConf: ConnectionEndConfiguration = targetBoundingBox
        ? {
            pos: Vec2d.from(this.target.position),
            inside: false,
            direction: getDirectionOutside(
              targetBoundingBox,
              Vec2d.from(this.target.position).sub(
                this.target.connectedItem!.boundingBox
              )
            ),
            rectangle: targetBoundingBox,
          }
        : { pos: Vec2d.from(this.target.position) };

      routePoints = getRoutePoints(sourceConf, targetConf);
    }
    if (!routePoints) {
      routePoints = [
        new Vec2d(this.source.position.x, this.source.position.y),
        new Vec2d(this.target.position.x, this.target.position.y),
      ];
    }

    return routePoints;
  }, [this.page.onItemPositionChange, this.orthogonalRouting]);

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

  renderContent(): React.ReactNode {
    return (
      <WithHooks>
        {() => {
          useRerenderOnEvent(this.routePointsMemo.invalidated);
          const { source, target } = this;
          const text = this.labelText.get();
          const sourceMulti = this.sourceMultiplicity.get();
          const targetMulti = this.targetMultiplicity.get();
          const sourceMarkerType = this.sourceMarkerType.get();
          const targetMarkerType = this.targetMarkerType.get();
          const lineDashArray = getLineDashArray(
            this.lineStyle.get() || "Normal"
          );
          const routePoints = this.routePointsMemo.value;

          // Find the center by segment length
          let midX = 0;
          let midY = 0;
          if (routePoints.length >= 2) {
            // Calculate total path length
            let totalLength = 0;
            const segmentLengths: number[] = [];
            for (let i = 0; i < routePoints.length - 1; i++) {
              const p1 = routePoints[i];
              const p2 = routePoints[i + 1];
              const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
              segmentLengths.push(length);
              totalLength += length;
            }

            // Find the point at half the total length
            const halfLength = totalLength / 2;
            let accumulatedLength = 0;
            for (let i = 0; i < segmentLengths.length; i++) {
              const p1 = routePoints[i];
              const p2 = routePoints[i + 1];
              const segmentLength = segmentLengths[i];
              if (accumulatedLength + segmentLength >= halfLength) {
                // Interpolate along this segment
                const remaining = halfLength - accumulatedLength;
                const ratio = remaining / segmentLength;
                midX = p1.x + (p2.x - p1.x) * ratio;
                midY = p1.y + (p2.y - p1.y) * ratio;
                break;
              }
              accumulatedLength += segmentLength;
            }
          }

          // Calculate text dimensions for background
          const textWidth = getTextWidth(text, widgetTheme.fontSize);
          const textHeight = widgetTheme.fontSize;
          const padding = 6;

          // Get marker URLs
          const sourceMarkerUrl = getMarkerUrl(sourceMarkerType);
          const targetMarkerUrl = getMarkerUrl(targetMarkerType);

          // Calculate direction from first segment for source multiplicity
          const sourceDirection = routePoints[1].sub(routePoints[0]);

          // Calculate direction from last segment for target multiplicity
          const targetDirection = routePoints[routePoints.length - 2].sub(
            routePoints[routePoints.length - 1]
          );

          return (
            <>
              {/* make sure multiplicity background is behind connector line */}
              {sourceMulti &&
                sourceMulti.length > 0 &&
                this.renderMultiplicity(
                  sourceMulti,
                  source.position,
                  sourceDirection
                )}
              {targetMulti &&
                targetMulti.length > 0 &&
                this.renderMultiplicity(
                  targetMulti,
                  target.position,
                  targetDirection
                )}

              {/* Draw connector lines using route points */}
              {routePoints.slice(0, -1).map((point, index) => (
                <line
                  key={index}
                  x1={point.x}
                  y1={point.y}
                  x2={routePoints[index + 1].x}
                  y2={routePoints[index + 1].y}
                  stroke="#333"
                  strokeWidth="2"
                  strokeDasharray={lineDashArray}
                  markerEnd={
                    index === routePoints.length - 2
                      ? targetMarkerUrl
                      : undefined
                  }
                />
              ))}
              {/* Invisible line to draw the source marker */}
              <line
                x1={routePoints[1].x}
                y1={routePoints[1].y}
                x2={routePoints[0].x}
                y2={routePoints[0].y}
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
                    filter={`url(#connector-text-background-blur)`}
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
    position: IVec2d,
    direction: IVec2d
  ): React.ReactNode {
    const dx = direction.x;
    const dy = direction.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let offsetX = 0;
    let offsetY = 0;
    const l1 = 10;
    const l2 = 15;
    if (dist > 0) {
      const ux = dx / dist;
      const uy = dy / dist;
      if (ux < 0) {
        offsetX = l1 * ux - l2 * uy;
        offsetY = l1 * uy + l2 * ux;
      } else {
        offsetX = l1 * ux + l2 * uy;
        offsetY = l1 * uy - l2 * ux;
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

  get boundingBox(): IRectangle {
    // For bounding box, use a simple fallback since routing is done in render
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

  get position(): IVec2d {
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

  moveBy(delta: IVec2d) {
    const pos = this.position;
    const newPos = { x: pos.x + delta.x, y: pos.y + delta.y };
    this.data.position = newPos;
    this.data.connectedItemId = undefined;
    this.connectedItem = undefined;
  }

  setPosition(position: IVec2d, snap?: SnapResult) {
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
          useRerenderOnEvent(this.item_.routePointsMemo.invalidated);
          const { source, target } = this.item_;
          const selection = this.item.page.selection;
          const handleSize = projection.lengthToWorld(12);

          const visible = selection.has(this.item);

          const routePoints = this.item_.routePointsMemo.value;

          return (
            <>
              <polyline
                points={routePoints.map((p) => `${p.x},${p.y}`).join(" ")}
                stroke={visible ? "#00FF0040" : "transparent"}
                fill="none"
                strokeWidth={projection.lengthToWorld(20)}
                style={{ cursor: "move" }}
                onDoubleClick={() => this.item.page.duplicateItem(this.item)}
                onPointerDown={(e) => {
                  if (e.shiftKey) return;

                  e.stopPropagation();
                  this.item.page.setSelection(
                    e.ctrlKey
                      ? selection.toggle(this.item)
                      : Selection.of(this.item)
                  );
                }}
              />
              {selection.size == 1 && (
                <>
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
              )}
            </>
          );
        }}
      </WithHooks>
    );
  }
  renderMasterInteraction(props: RenderInteractionArgs): React.ReactNode {
    return <></>;
  }
  moveBy(delta: IVec2d): void {
    this.item_.source.moveBy(delta);
    this.item_.target.moveBy(delta);
    this.item.onChange.notify();
    this.item.onDataChanged();
    this.item.page.onItemPositionChange.notify();
  }
  setPosition(pos: IVec2d): void {
    (this.item_.data_.source.position = { x: pos.x + 10, y: pos.y + 10 }),
      (this.item_.data_.target.position = { x: pos.x + 90, y: pos.y + 10 });
  }
}
