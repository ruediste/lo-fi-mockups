import {
  MouseEventHandler,
  SVGAttributes,
  useContext,
  useId,
  useRef,
} from "react";
import { CanvasProjection } from "../Canvas";
import { ProjectionContext } from "../Contexts";
import { useRerenderOnEvent } from "../hooks";
import { Vec2d } from "../Vec2d";
import { Position, Rectangle } from "./Widget";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";

export function DraggableBox<T>({
  box,
  current,
  update,
  onClick,
  attrs,
  onPointerDown,
}: {
  box: Rectangle;
  current: T;
  update: (start: T, delta: Vec2d) => void;
  onClick?: MouseEventHandler;
  onPointerDown?: MouseEventHandler;
  attrs?: SVGAttributes<SVGRectElement>;
}) {
  const dragState = useRef<{
    start: T;
    startEventPos: Vec2d;
  }>(undefined);

  const projection = useContext(ProjectionContext);

  return (
    <rect
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      {...attrs}
      onClick={onClick}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragState.current = {
          start: current,
          startEventPos: Vec2d.fromEvent(e),
        };
        onPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        const state = dragState.current;
        if (state) {
          update(
            state.start,
            projection.scaleToWorld(Vec2d.fromEvent(e).sub(state.startEventPos))
          );
        }
      }}
      onPointerUp={(e) => {
        if (dragState.current) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        dragState.current = undefined;
      }}
    />
  );
}

function dragPositionRectAttrs(
  projection: CanvasProjection
): SVGAttributes<SVGRectElement> {
  return {
    stroke: "#008800",
    strokeWidth: projection.lengthToWorld(0.5),
  };
}

export function DraggablePositionBox({
  box,
  update,
  isSelected,
  select,
}: {
  box: Rectangle;
  isSelected: boolean;
  update: (pos: Position) => void;
  select?: () => void;
}) {
  const projection = useContext(ProjectionContext);
  return (
    <DraggableBox<Position>
      current={box}
      onPointerDown={(e) => {
        e.stopPropagation();
        select?.();
      }}
      box={box}
      update={(start, delta) =>
        update({ x: start.x + delta.x, y: start.y + delta.y })
      }
      attrs={{
        fill: "transparent",
        ...(isSelected ? dragPositionRectAttrs(projection) : {}),
      }}
    />
  );
}

const handleSizeView = 12;
export function DraggableAndResizableBox({
  box,
  update,
  showHandles,
  onClick,
  onPointerDown,
}: {
  box: Rectangle;
  update: (newBox: Rectangle) => void;
  showHandles: boolean;
  onClick?: MouseEventHandler;
  onPointerDown?: MouseEventHandler;
}) {
  const projection = useContext(ProjectionContext);
  useRerenderOnEvent(projection.onChange);
  const handleSize = projection.lengthToWorld(handleSizeView);

  const minSize = { width: 2 * handleSize, height: 2 * handleSize };
  const cornerAttrs: SVGAttributes<SVGRectElement> = {
    fill: "#00ff00",
    stroke: "#008800",
    strokeWidth: projection.lengthToWorld(0.5),
  };
  return (
    <>
      {/* whole box */}
      <DraggableBox
        box={box}
        current={box}
        onClick={onClick}
        onPointerDown={onPointerDown}
        update={(start, delta) =>
          update({
            x: start.x + delta.x,
            y: start.y + delta.y,
            width: start.width,
            height: start.height,
          })
        }
        attrs={{
          fill: "transparent",
          ...(showHandles ? dragPositionRectAttrs(projection) : {}),
        }}
      />
      {/* corners */}
      {!showHandles ? null : (
        <>
          <DraggableBox
            attrs={{ ...cornerAttrs, cursor: "nw-resize" }}
            onClick={(e) => e.stopPropagation()}
            box={{ x: box.x, y: box.y, width: handleSize, height: handleSize }}
            current={box}
            update={(start, delta) => {
              const x = Math.min(start.width - minSize.width, delta.x);
              const y = Math.min(start.height - minSize.height, delta.y);
              return update({
                x: start.x + x,
                y: start.y + y,
                width: start.width - x,
                height: start.height - y,
              });
            }}
          />
          <DraggableBox
            attrs={{ ...cornerAttrs, cursor: "ne-resize" }}
            onClick={(e) => e.stopPropagation()}
            box={{
              x: box.x + box.width - handleSize,
              y: box.y,
              width: handleSize,
              height: handleSize,
            }}
            current={box}
            update={(start, delta) => {
              const x = Math.max(minSize.width - start.width, delta.x);
              const y = Math.min(start.height - minSize.height, delta.y);
              return update({
                x: start.x,
                y: start.y + y,
                width: start.width + x,
                height: start.height - y,
              });
            }}
          />
          <DraggableBox
            attrs={{ ...cornerAttrs, cursor: "sw-resize" }}
            onClick={(e) => e.stopPropagation()}
            box={{
              x: box.x,
              y: box.y + box.height - handleSize,
              width: handleSize,
              height: handleSize,
            }}
            current={box}
            update={(start, delta) => {
              const x = Math.min(start.width - minSize.width, delta.x);
              const y = Math.max(minSize.height - start.height, delta.y);
              return update({
                x: start.x + x,
                y: start.y,
                width: start.width - x,
                height: start.height + y,
              });
            }}
          />
          <DraggableBox
            attrs={{ ...cornerAttrs, cursor: "se-resize" }}
            onClick={(e) => e.stopPropagation()}
            box={{
              x: box.x + box.width - handleSize,
              y: box.y + box.height - handleSize,
              width: handleSize,
              height: handleSize,
            }}
            current={box}
            update={(start, delta) => {
              const x = Math.max(minSize.width - start.width, delta.x);
              const y = Math.max(minSize.height - start.height, delta.y);
              return update({
                x: start.x,
                y: start.y,
                width: start.width + x,
                height: start.height + y,
              });
            }}
          />
        </>
      )}
    </>
  );
}

export function SelectableBox({
  box,
  showHandles,
  onClick,
  onPointerDown,
  onContextMenu,
}: {
  box: Rectangle;
  showHandles: boolean;
  onClick?: MouseEventHandler;
  onPointerDown?: MouseEventHandler;
  onContextMenu?: MouseEventHandler;
}) {
  const projection = useContext(ProjectionContext);
  useRerenderOnEvent(projection.onChange);
  const strokeWidth = showHandles ? projection.lengthToWorld(5) : 0;
  return (
    <>
      <rect
        x={box.x - strokeWidth / 2}
        y={box.y - strokeWidth / 2}
        width={box.width + strokeWidth}
        height={box.height + strokeWidth}
        {...{ onClick, onPointerDown, onContextMenu }}
        {...(showHandles
          ? {
              fill: "transparent",
              stroke: "#00fff0",
              strokeWidth,
            }
          : { fill: "transparent" })}
      />
    </>
  );
}

export function WidgetBounds({
  box,
  children,
}: {
  box: Rectangle;
  children?: React.ReactNode;
}) {
  const id = useId();
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect
            {...widgetRectAttrs}
            x={box.x - widgetTheme.strokeWidth / 2}
            y={box.y - widgetTheme.strokeWidth / 2}
            width={box.width + widgetTheme.strokeWidth}
            height={box.height + widgetTheme.strokeWidth}
          />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id})`}>
        {children}
        <rect
          {...widgetRectAttrs}
          fill="none"
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
        />
      </g>
    </>
  );
}
