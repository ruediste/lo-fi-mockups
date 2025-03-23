import { JSX, MouseEventHandler, useContext, useRef } from "react";
import { CanvasProjection } from "../Canvas";
import { ProjectionContext } from "../Contexts";
import { useRerenderOnEvent } from "../hooks";
import { Page, SnapIndex } from "../model/Page";
import {
  HorizontalSnapPosition,
  PageItem,
  VerticalSnapPosition,
} from "../model/PageItem";
import { toSet } from "../utils";
import { Vec2d } from "../Vec2d";
import { Rectangle } from "./Widget";
import { dragPositionRectAttrs } from "./WidgetHelpers";

export function MoveWidgetBox(
  props: { projection: CanvasProjection } & JSX.IntrinsicElements["rect"]
) {
  const { projection, ...others } = props;
  return (
    <rect {...dragPositionRectAttrs(projection)} fill="none" {...others} />
  );
}

type CursorValue = "sw-resize" | "nw-resize" | "se-resize" | "ne-resize";

export function DraggableBox2<TState>({
  box,
  update,
  onDragStart,
  projection,
  visible,
  select,
  cursor,
  filled,
}: {
  box: Rectangle;
  onDragStart: () => TState;
  update: (diff: Vec2d, state: TState) => void;
  projection: CanvasProjection;
  visible: boolean;
  select?: (toggle: boolean) => void;
  cursor?: CursorValue;
  filled?: boolean;
}) {
  const dragState = useRef<{
    startEventPos: Vec2d;
    lastDelta: Vec2d;
    state: TState;
  }>(undefined);

  return (
    <rect
      {...box}
      {...(visible ? dragPositionRectAttrs(projection) : {})}
      cursor={cursor}
      fill={filled === true ? "#00ff00" : "transparent"}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (!visible) {
          select?.(e.ctrlKey);
        }
        e.currentTarget.setPointerCapture(e.pointerId);
        dragState.current = {
          startEventPos: Vec2d.fromEvent(e),
          lastDelta: new Vec2d(0, 0),
          state: onDragStart(),
        };
      }}
      onPointerMove={(e) => {
        const state = dragState.current;
        if (state) {
          const delta = projection.scaleToWorld(
            Vec2d.fromEvent(e).sub(state.startEventPos)
          );
          update(delta.sub(state.lastDelta), state.state);
          state.lastDelta = delta;
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

export function DraggableSnapBox({
  projection,
  box,
  visible,
  page,
  select,
  items,
}: {
  projection: CanvasProjection;
  box: Rectangle;
  visible: boolean;
  page: Page;
  select?: (toggle: boolean) => void;
  items: () => Set<PageItem>;
}): JSX.Element {
  return (
    <DraggableBox2<{
      snapIndex: SnapIndex;
      snapOffset: Vec2d;
    }>
      {...{
        box,
        projection,
        visible,
        select,
        onDragStart: () => {
          const tmp = items();
          return {
            snapIndex: new SnapIndex(
              page,
              projection,
              (item) => !tmp.has(item)
            ),
            snapOffset: new Vec2d(0, 0),
          };
        },
        update: (diff, state) => {
          const snapOffset = state.snapIndex.snapItems(
            [...items()],
            state.snapOffset.sub(diff),
            1 / projection.scale
          );
          items().forEach((i) =>
            i.interaction.moveBy(diff.add(snapOffset).sub(state.snapOffset))
          );
          page.onItemPositionChange.notify();
          state.snapOffset = snapOffset;
        },
      }}
    />
  );
}

export function DraggableSnapCornerBox({
  projection,
  box,
  select,
  item,
  cursor,
  h,
  v,
  update,
}: {
  projection: CanvasProjection;
  box: Rectangle;
  select?: (toggle: boolean) => void;
  item: PageItem;
  cursor?: CursorValue;
  h: HorizontalSnapPosition[];
  v: VerticalSnapPosition[];
  update: (diff: Vec2d) => void;
}): JSX.Element {
  return (
    <DraggableBox2<{
      snapIndex: SnapIndex;
      snapOffset: Vec2d;
    }>
      {...{
        box,
        projection,
        visible: true,
        select,
        cursor,
        filled: true,
        onDragStart: () => ({
          snapIndex: new SnapIndex(item.page, projection, (i) => i != item),
          snapOffset: new Vec2d(0, 0),
        }),
        update: (diff, state) => {
          const snapOffset = state.snapIndex.snapBoxes(
            h,
            v,
            state.snapOffset.sub(diff)
          );
          update(diff.add(snapOffset).sub(state.snapOffset));
          item.page.onItemPositionChange.notify();
          state.snapOffset = snapOffset;
        },
      }}
    />
  );
}

export function DraggableSnapResizeBox({
  projection,
  visible,
  select,
  item,
  update,
}: {
  projection: CanvasProjection;
  visible: boolean;
  select?: (toggle: boolean) => void;
  item: PageItem;
  update: (newBox: Rectangle) => void;
}): JSX.Element {
  const handleSize = projection.lengthToWorld(12);
  const box = item.boundingBox;
  return (
    <>
      <DraggableSnapBox
        {...{
          projection,
          box,
          visible,
          page: item.page,
          select,
          items: () => toSet(item),
        }}
      />
      {visible && (
        <>
          <DraggableSnapCornerBox
            {...{
              cursor: "nw-resize",
              box: {
                x: box.x,
                y: box.y,
                width: handleSize,
                height: handleSize,
              },
              item,
              projection,
              h: [
                {
                  x: box.x,
                  y: box.y,
                  width: box.width,
                  snapRange: 0,
                },
              ],
              v: [
                {
                  x: box.x,
                  y: box.y,
                  height: box.height,
                  snapRange: 0,
                },
              ],
              update: (diff) => {
                update({
                  x: box.x + diff.x,
                  y: box.y + diff.y,
                  width: box.width - diff.x,
                  height: box.height - diff.y,
                });
              },
            }}
          />

          <DraggableSnapCornerBox
            {...{
              cursor: "ne-resize",
              box: {
                x: box.x + box.width - handleSize,
                y: box.y,
                width: handleSize,
                height: handleSize,
              },
              item,
              projection,
              h: [
                {
                  x: box.x,
                  y: box.y,
                  width: box.width,
                  snapRange: 0,
                },
              ],
              v: [
                {
                  x: box.x + box.width,
                  y: box.y,
                  height: box.height,
                  snapRange: 0,
                },
              ],
              update: (diff) => {
                update({
                  x: box.x,
                  y: box.y + diff.y,
                  width: box.width + diff.x,
                  height: box.height - diff.y,
                });
              },
            }}
          />

          <DraggableSnapCornerBox
            {...{
              cursor: "sw-resize",
              box: {
                x: box.x,
                y: box.y + box.height - handleSize,
                width: handleSize,
                height: handleSize,
              },
              item,
              projection,
              h: [
                {
                  x: box.x,
                  y: box.y + box.height,
                  width: box.width,
                  snapRange: 0,
                },
              ],
              v: [
                {
                  x: box.x,
                  y: box.y,
                  height: box.height,
                  snapRange: 0,
                },
              ],
              update: (diff) => {
                update({
                  x: box.x + diff.x,
                  y: box.y,
                  width: box.width - diff.x,
                  height: box.height + diff.y,
                });
              },
            }}
          />

          <DraggableSnapCornerBox
            {...{
              cursor: "se-resize",
              box: {
                x: box.x + box.width - handleSize,
                y: box.y + box.height - handleSize,
                width: handleSize,
                height: handleSize,
              },
              item,
              projection,
              h: [
                {
                  x: box.x,
                  y: box.y + box.height,
                  width: box.width,
                  snapRange: 0,
                },
              ],
              v: [
                {
                  x: box.x + box.width,
                  y: box.y,
                  height: box.height,
                  snapRange: 0,
                },
              ],
              update: (diff) => {
                update({
                  x: box.x,
                  y: box.y,
                  width: box.width + diff.x,
                  height: box.height + diff.y,
                });
              },
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
