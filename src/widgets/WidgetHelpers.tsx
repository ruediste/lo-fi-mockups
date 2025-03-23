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
import { Page, SnapIndex } from "../model/Page";
import { Selection } from "../Selection";
import { Vec2d } from "../Vec2d";
import { Position, Rectangle } from "./Widget";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";

export function DraggableBox<T, TState = undefined>({
  box,
  current,
  update,
  onClick,
  attrs,
  onPointerDown,
  onDragStart,
}: {
  box: Rectangle;
  current: T | (() => T);
  update: (start: T, delta: Vec2d, state: TState) => void;
  onClick?: MouseEventHandler;
  onPointerDown?: MouseEventHandler;
  attrs?: SVGAttributes<SVGRectElement>;
  onDragStart?: () => TState;
}) {
  const dragState = useRef<{
    start: T;
    startEventPos: Vec2d;
    state: TState | undefined;
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
        onPointerDown?.(e);

        dragState.current = {
          start: typeof current === "function" ? (current as any)() : current,
          startEventPos: Vec2d.fromEvent(e),
          state: onDragStart?.(),
        };
      }}
      onPointerMove={(e) => {
        const state = dragState.current;
        if (state) {
          update(
            state.start,
            projection.scaleToWorld(
              Vec2d.fromEvent(e).sub(state.startEventPos)
            ),
            state.state as any
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

// eslint-disable-next-line react-refresh/only-export-components
export function dragPositionRectAttrs(
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
  selection,
  select,
  page,
  isSelected,
}: {
  box: Rectangle;
  selection: Selection;
  update: (pos: Position) => void;
  select?: (toggle: boolean) => void;
  page: Page;
  isSelected: boolean;
}) {
  const projection = useContext(ProjectionContext);
  return (
    <DraggableBox<
      Position,
      { snapIndex: SnapIndex; snapOffset: { x: number; y: number } }
    >
      current={() => box}
      onPointerDown={(e) => select?.(e.ctrlKey)}
      onDragStart={() => ({
        snapIndex: new SnapIndex(
          page,
          projection,
          (item) => !selection.has(item)
        ),
        snapOffset: { x: 0, y: 0 },
      })}
      box={box}
      update={(start, delta, state) => {
        const snapOffset = state.snapIndex.snapItems(
          selection.all(),
          state.snapOffset,
          1 / projection.scale
        );
        console.log(state.snapOffset, delta, snapOffset);
        state.snapOffset = snapOffset;
        return update({
          x: start.x + delta.x + snapOffset.x,
          y: start.y + delta.y + snapOffset.y,
        });
      }}
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
  showBox,
  showHandles,
  onClick,
  onPointerDown,
}: {
  box: Rectangle;
  update: (newBox: Rectangle) => void;
  showBox: boolean;
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
          ...(showBox ? dragPositionRectAttrs(projection) : {}),
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
        <rect {...widgetRectAttrs} fill="white" {...box} />
        {children}
        <rect {...widgetRectAttrs} fill="none" {...box} />
      </g>
    </>
  );
}
