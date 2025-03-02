import { useContext, useRef } from "react";
import { ProjectionContext } from "./Contexts";
import { Vec2d } from "./Vec2d";
import { Rectangle } from "./Widget";

// class ItemGroup extends PageItem {}

export function DraggableBox<T>({
  box,
  current,
  update,
}: {
  box: Rectangle;
  current: T;
  update: (start: T, delta: Vec2d) => void;
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
      fill="green"
      opacity="0.75"
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragState.current = {
          start: current,
          startEventPos: Vec2d.fromEvent(e),
        };
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

const handleSize = 10;
export function DraggableAndResizableBox({
  box,
  update,
}: {
  box: Rectangle;
  update: (newBox: Rectangle) => void;
}) {
  const minSize = { width: 2 * handleSize, height: 2 * handleSize };
  return (
    <>
      {/* whole box */}
      <DraggableBox
        box={box}
        current={box}
        update={(start, delta) =>
          update({
            x: start.x + delta.x,
            y: start.y + delta.y,
            width: start.width,
            height: start.height,
          })
        }
      />
      {/* corners */}
      <DraggableBox
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
  );
}
