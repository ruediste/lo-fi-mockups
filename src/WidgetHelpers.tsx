import { useContext, useRef } from "react";
import { ProjectionContext } from "./Contexts";
import { Vec2d } from "./Vec2d";
import { Rectangle } from "./Widget";

// class ItemGroup extends PageItem {}

export function ItemInteraction({
  box,
  update,
}: {
  box: Rectangle;
  update: (newBox: Rectangle) => void;
}) {
  const dragState = useRef<{
    startBox: Rectangle;
    startPos: Vec2d;
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
          startBox: box,
          startPos: Vec2d.fromEvent(e),
        };
      }}
      onPointerMove={(e) => {
        const state = dragState.current;
        if (state) {
          const newPos = Vec2d.from(state.startBox).add(
            projection.scaleToWorld(Vec2d.fromEvent(e).sub(state.startPos))
          );
          update({ ...state.startBox, x: newPos.x, y: newPos.y });
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
