import { IconButton, IconButtonProps } from "@/util/Inputs";
import { Vec2d } from "@/util/Vec2d";
import {
  forwardRef,
  JSX,
  MouseEventHandler,
  ReactElement,
  useContext,
  useId,
  useRef,
  useState,
} from "react";
import { InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Eraser, Lock, Unlock } from "react-bootstrap-icons";
import { CanvasProjection } from "../editor/Canvas";
import { Page, SnapResult } from "../model/Page";
import { PageItem, SnapReferencesArgs } from "../model/PageItem";
import { ProjectionContext } from "../util/Contexts";
import { useRerenderOnEvent } from "../util/hooks";
import { toSet } from "../util/utils";
import { Rectangle } from "../widgets/Widget";
import { dragPositionRectAttrs } from "../widgets/widgetUtils";
import { PageItemPropertyBase } from "./PageItemProperty";
import { SnapIndex } from "./SnapIndex";

export function MoveWidgetBox(
  props: { projection: CanvasProjection } & JSX.IntrinsicElements["rect"]
) {
  const { projection, ...others } = props;
  return (
    <rect {...dragPositionRectAttrs(projection)} fill="none" {...others} />
  );
}

type CursorValue =
  | "sw-resize"
  | "nw-resize"
  | "se-resize"
  | "ne-resize"
  | "n-resize"
  | "s-resize"
  | "w-resize"
  | "e-resize";

export function DraggableBox<TState>({
  box,
  update,
  onDragStart,
  projection,
  visible,
  select,
  cursor,
  filled,
  onDragEnd,
}: {
  box: Rectangle;
  onDragStart: () => TState;
  onDragEnd?: () => void;
  update: (
    offset: Vec2d,
    diff: Vec2d,
    state: TState,
    snapDisabled: boolean
  ) => void;
  projection: CanvasProjection;
  visible: boolean;
  select?: (toggle: boolean) => void;
  cursor?: CursorValue;
  filled?: boolean;
}) {
  const dragState = useRef<{
    startEventPos: Vec2d;
    lastOffset: Vec2d;
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
          lastOffset: new Vec2d(0, 0),
          state: onDragStart(),
        };
      }}
      onPointerMove={(e) => {
        const state = dragState.current;
        if (state) {
          const offset = projection.scaleToWorld(
            Vec2d.fromEvent(e).sub(state.startEventPos)
          );
          update(offset, offset.sub(state.lastOffset), state.state, e.ctrlKey);
          state.lastOffset = offset;
        }
      }}
      onPointerUp={(e) => {
        if (dragState.current) {
          e.currentTarget.releasePointerCapture(e.pointerId);
          onDragEnd?.();
        }
        dragState.current = undefined;
      }}
    />
  );
}

function SnapResultDisplay({ snap }: { snap: SnapResult }) {
  return (
    <>
      {snap.h && (
        <>
          <line
            strokeWidth="1px"
            stroke="black"
            strokeDasharray="4"
            x1={snap.h.box.x}
            x2={snap.h.box.x + snap.h.box.width}
            y1={snap.h.box.y}
            y2={snap.h.box.y}
          />
          <line
            strokeWidth="1px"
            stroke="black"
            strokeDasharray="2"
            x1={snap.h.ref.x}
            x2={snap.h.ref.x + snap.h.ref.width}
            y1={snap.h.ref.y}
            y2={snap.h.ref.y}
          />
        </>
      )}
      {snap.v && (
        <>
          <line
            strokeWidth="1px"
            stroke="black"
            strokeDasharray="4"
            x1={snap.v.box.x}
            x2={snap.v.box.x}
            y1={snap.v.box.y}
            y2={snap.v.box.y + snap.v.box.height}
          />
          <line
            strokeWidth="1px"
            stroke="black"
            strokeDasharray="2"
            x1={snap.v.ref.x}
            x2={snap.v.ref.x}
            y1={snap.v.ref.y}
            y2={snap.v.ref.y + snap.v.ref.height}
          />
        </>
      )}
    </>
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
  const [snapResult, setSnapResult] = useState<SnapResult>();
  return (
    <>
      <DraggableBox<{
        snapIndex: SnapIndex;
        lastSnappedOffset: Vec2d;
        refs: Partial<SnapReferencesArgs>;
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
              lastSnappedOffset: new Vec2d(0, 0),
              refs: PageItem.getSnapReferences(
                [...items()],
                1 / projection.scale
              ),
            };
          },
          update: (offset, diff, state, snapDisabled) => {
            let snappedOffset: Vec2d;
            if (snapDisabled) {
              snappedOffset = offset;
              setSnapResult(undefined);
            } else {
              const snapResult = state.snapIndex.snapBoxes(state.refs, offset);
              snappedOffset = offset.add(snapResult.offset);
              setSnapResult(snapResult);
            }
            const move = snappedOffset.sub(state.lastSnappedOffset);
            state.lastSnappedOffset = snappedOffset;

            items().forEach((i) => i.interaction.moveBy(move));
            page.onItemPositionChange.notify();
          },
          onDragEnd: () => setSnapResult(undefined),
        }}
      />
      {snapResult && <SnapResultDisplay snap={snapResult} />}
    </>
  );
}

export function DraggableSnapCornerBox({
  projection,
  box,
  select,
  item,
  cursor,
  update,
  snapReferences,
}: {
  projection: CanvasProjection;
  box: Rectangle;
  select?: (toggle: boolean) => void;
  item: PageItem;
  cursor?: CursorValue;
  snapReferences: () => Partial<SnapReferencesArgs>;
  update: (box: Rectangle, diff: Vec2d) => void;
}): JSX.Element {
  const [snapResult, setSnapResult] = useState<SnapResult>();
  return (
    <>
      <DraggableBox<{
        snapIndex: SnapIndex;
        startBox: Rectangle;
        appliedOffset: Vec2d;
        refs: Partial<SnapReferencesArgs>;
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
            startBox: item.boundingBox,
            appliedOffset: new Vec2d(0, 0),
            refs: snapReferences(),
          }),
          update: (offset, diff, state, snapDisabled) => {
            let snappedOffset: Vec2d;
            if (snapDisabled) {
              snappedOffset = offset;
              setSnapResult(undefined);
              state.appliedOffset = new Vec2d(0, 0);
            } else {
              const snapResult = state.snapIndex.snapBoxes(
                snapReferences(),
                diff.sub(state.appliedOffset)
              );
              snappedOffset = offset.add(snapResult.offset);
              setSnapResult(snapResult);
              state.appliedOffset = snapResult.offset;
            }

            update(state.startBox, snappedOffset);
            item.page.onItemPositionChange.notify();
          },
          onDragEnd: () => setSnapResult(undefined),
        }}
      />
      {snapResult && <SnapResultDisplay snap={snapResult} />}
    </>
  );
}

function pick<T, K extends (keyof T)[]>(
  value: T,
  ...props: K
): { [P in K[number]]: T[P] } {
  const result: any = {};
  for (const p of props) {
    result[p] = value[p];
  }
  return result;
}

export function DraggableSnapResizeBox({
  projection,
  visible,
  select,
  item,
  update,
  widthOnly,
}: {
  projection: CanvasProjection;
  visible: boolean;
  select?: (toggle: boolean) => void;
  item: PageItem;
  update: (newBox: Rectangle) => void;
  widthOnly: boolean;
}): JSX.Element {
  const handleSize = projection.lengthToWorld(12);
  const minSize = { width: 20, height: 20 };
  const box = item.boundingBox;
  let corners: React.ReactNode = null;
  if (visible) {
    const refs = (corners = (
      <>
        {!widthOnly && (
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
              snapReferences: () =>
                pick(
                  PageItem.getSnapReferences([item], 1 / projection.scale),
                  "top",
                  "left",
                  "otherHorizontal",
                  "otherVertical"
                ),
              update: (start, delta) => {
                const x = Math.min(start.width - minSize.width, delta.x);
                const y = Math.min(start.height - minSize.height, delta.y);
                return update({
                  x: start.x + x,
                  y: start.y + y,
                  width: start.width - x,
                  height: start.height - y,
                });
              },
            }}
          />
        )}
        {!widthOnly && (
          <DraggableSnapCornerBox
            {...{
              cursor: "n-resize",
              box: {
                x: box.x + (box.width - handleSize) / 2,
                y: box.y,
                width: handleSize,
                height: handleSize,
              },
              item,
              projection,
              snapReferences: () =>
                pick(
                  PageItem.getSnapReferences([item], 1 / projection.scale),
                  "top",
                  "otherHorizontal"
                ),
              update: (start, delta) => {
                const y = Math.min(start.height - minSize.height, delta.y);
                return update({
                  x: start.x,
                  y: start.y + y,
                  width: start.width,
                  height: start.height - y,
                });
              },
            }}
          />
        )}
        {!widthOnly && (
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
              snapReferences: () =>
                pick(
                  PageItem.getSnapReferences([item], 1 / projection.scale),
                  "top",
                  "right",
                  "otherHorizontal",
                  "otherVertical"
                ),
              update: (start, delta) => {
                const x = Math.max(minSize.width - start.width, delta.x);
                const y = Math.min(start.height - minSize.height, delta.y);
                return update({
                  x: start.x,
                  y: start.y + y,
                  width: start.width + x,
                  height: start.height - y,
                });
              },
            }}
          />
        )}
        <DraggableSnapCornerBox
          {...{
            cursor: "e-resize",
            box: {
              x: box.x + box.width - handleSize,
              y: box.y + (box.height - handleSize) / 2,
              width: handleSize,
              height: handleSize,
            },
            item,
            projection,
            snapReferences: () =>
              pick(
                PageItem.getSnapReferences([item], 1 / projection.scale),
                "right",
                "otherVertical"
              ),
            update: (start, delta) => {
              const x = Math.max(minSize.width - start.width, delta.x);
              return update({
                x: start.x,
                y: start.y,
                width: start.width + x,
                height: start.height,
              });
            },
          }}
        />
        {!widthOnly && (
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
              snapReferences: () =>
                pick(
                  PageItem.getSnapReferences([item], 1 / projection.scale),
                  "right",
                  "bottom",
                  "otherHorizontal",
                  "otherVertical"
                ),
              update: (start, delta) => {
                const x = Math.max(minSize.width - start.width, delta.x);
                const y = Math.max(minSize.height - start.height, delta.y);
                return update({
                  x: start.x,
                  y: start.y,
                  width: start.width + x,
                  height: start.height + y,
                });
              },
            }}
          />
        )}
        {!widthOnly && (
          <DraggableSnapCornerBox
            {...{
              cursor: "s-resize",
              box: {
                x: box.x + (box.width - handleSize) / 2,
                y: box.y + box.height - handleSize,
                width: handleSize,
                height: handleSize,
              },
              item,
              projection,
              snapReferences: () =>
                pick(
                  PageItem.getSnapReferences([item], 1 / projection.scale),
                  "bottom",
                  "otherHorizontal"
                ),
              update: (start, delta) => {
                const y = Math.max(minSize.height - start.height, delta.y);
                return update({
                  x: start.x,
                  y: start.y,
                  width: start.width,
                  height: start.height + y,
                });
              },
            }}
          />
        )}
        {!widthOnly && (
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
              snapReferences: () =>
                pick(
                  PageItem.getSnapReferences([item], 1 / projection.scale),
                  "bottom",
                  "left",
                  "otherHorizontal",
                  "otherVertical"
                ),
              update: (start, delta) => {
                const x = Math.min(start.width - minSize.width, delta.x);
                const y = Math.max(minSize.height - start.height, delta.y);
                return update({
                  x: start.x + x,
                  y: start.y,
                  width: start.width - x,
                  height: start.height + y,
                });
              },
            }}
          />
        )}
        <DraggableSnapCornerBox
          {...{
            cursor: "w-resize",
            box: {
              x: box.x,
              y: box.y + (box.height - handleSize) / 2,
              width: handleSize,
              height: handleSize,
            },
            item,
            projection,
            snapReferences: () =>
              pick(
                PageItem.getSnapReferences([item], 1 / projection.scale),
                "left",
                "otherVertical"
              ),
            update: (start, delta) => {
              const x = Math.min(start.width - minSize.width, delta.x);
              return update({
                x: start.x + x,
                y: start.y,
                width: start.width - x,
                height: start.height,
              });
            },
          }}
        />
        )
      </>
    ));
  }

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
      {corners}
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

function PropertyOverrideableTooltip(props: {
  isOverrideable: boolean;
  children: ReactElement;
}) {
  const id = useId();
  return (
    <OverlayTrigger
      delay={1000}
      overlay={
        <Tooltip id={id}>
          {props.isOverrideable
            ? "Property can be overridden by pages using this page as master page"
            : "When using this page as master page, this property cannot be overridden"}
        </Tooltip>
      }
    >
      {props.children}
    </OverlayTrigger>
  );
}

const Test = forwardRef<HTMLDivElement, IconButtonProps>((props, ref) => (
  <div ref={ref}>
    <IconButton {...props} />
  </div>
));

export function PropertyOverrideControls({
  property,
}: {
  property: PageItemPropertyBase<any>;
}) {
  return (
    <>
      <span style={{ marginLeft: "auto" }}></span>
      {property.isEditable && property.isOverridden && (
        <IconButton onClick={() => property.clear()}>
          <Eraser />
        </IconButton>
      )}
      <IconButton
        onClick={() => property.setOverrideable(!property.isOverrideable)}
      >
        {property.isOverrideable ? <Unlock /> : <Lock />}
      </IconButton>
    </>
  );
}

export function PropertyOverrideableInputGroupControls({
  property,
}: {
  property: PageItemPropertyBase<any>;
}) {
  property.isEditable;
  return (
    <>
      {property.isEditable && property.isOverridden && (
        <InputGroup.Text
          css={{
            cursor: "pointer",
            "&:hover": { background: "lightGray" },
          }}
          onClick={() => property.clear()}
        >
          <Eraser />
        </InputGroup.Text>
      )}
      <PropertyOverrideableTooltip isOverrideable={property.isOverrideable}>
        <InputGroup.Text
          css={{
            cursor: "pointer",
            "&:hover": { background: "lightGray" },
          }}
          onClick={() => property.setOverrideable(!property.isOverrideable)}
        >
          {property.isOverrideable ? <Unlock /> : <Lock />}
        </InputGroup.Text>
      </PropertyOverrideableTooltip>
    </>
  );
}
