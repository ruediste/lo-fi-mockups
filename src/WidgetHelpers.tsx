import { MouseEventHandler, SVGAttributes, useContext, useRef } from "react";
import { ProjectionContext } from "./Contexts";
import { useRerenderOnEvent } from "./Project";
import { Vec2d } from "./Vec2d";
import { Rectangle } from "./Widget";

// class ItemGroup extends PageItem {}

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
        attrs={
          showHandles
            ? {
                fill: "transparent",
                stroke: "#008800",
                strokeWidth: projection.lengthToWorld(0.5),
              }
            : { fill: "transparent" }
        }
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
