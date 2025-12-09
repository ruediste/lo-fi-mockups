import { Selection } from "@/editor/Selection";
import { Page } from "@/model/Page";
import { Vec2d } from "@/util/Vec2d";
import { globalSvgContent, IRectangle } from "@/widgets/Widget";
import classNames from "classnames";
import { PointerEventHandler, useRef } from "react";
import { Fullscreen, Icon1Square } from "react-bootstrap-icons";
import ObserveSize from "react-observe-size";
import { ModelEvent } from "../model/ModelEvent";
import { ProjectionContext } from "../util/Contexts";
import { useRerenderOnEvent } from "../util/hooks";
export class CanvasProjection {
  onChange = new ModelEvent();

  scale = 1;

  // offset of the top left corner of the view in world coordinates
  offset = new Vec2d(0, 0);

  // size of the view in view coordinates
  viewPortPosition = new Vec2d(0, 0);
  viewPortSize = new Vec2d(100, 100);
  viewPortPositionInitialized = false;

  // size of the view in world
  get worldViewSize(): Vec2d {
    return this.scaleToWorld(this.viewPortSize);
  }

  changeScale(newScale: number, fixedViewPos: Vec2d) {
    const eventPositionWorld = this.pointToWorld(fixedViewPos);
    this.scale = newScale;
    const newEventPositionWorld = this.pointToWorld(fixedViewPos);
    this.offset = this.offset
      .add(eventPositionWorld)
      .sub(newEventPositionWorld);
    this.onChange.notify();
  }

  setScaleOne() {
    this.changeScale(1, this.viewCenterPos);
  }

  setScaleFit(rect: IRectangle) {
    // Calculate the scale needed to fit the rectangle within the viewport
    const scaleX = this.viewPortSize.x / rect.width;
    const scaleY = this.viewPortSize.y / rect.height;

    // Use the smaller scale to ensure the rectangle fits within the viewport
    this.scale = Math.min(scaleX, scaleY);

    this.alignViewPortCenterWithRectCenter(rect);

    this.onChange.notify();
  }

  setScaleOneAndAlign(rect: IRectangle) {
    this.scale = 1;
    this.alignViewPortCenterWithRectCenter(rect);
    this.onChange.notify();
  }

  private alignViewPortCenterWithRectCenter(rect: IRectangle) {
    // Calculate the new offset to center the rectangle in the viewport
    const rectCenter = new Vec2d(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2
    );

    this.offset = rectCenter.sub(
      this.scaleToWorld(this.viewPortSize.scale(0.5))
    );
  }

  private get viewCenterPos() {
    return new Vec2d(
      this.viewPortPosition.x + this.viewPortSize.x / 2,
      this.viewPortPosition.y + this.viewPortSize.y / 2
    );
  }

  lengthToWorld(viewLength: number) {
    return viewLength / this.scale;
  }

  scaleToWorld(point: Vec2d): Vec2d {
    return new Vec2d(this.lengthToWorld(point.x), this.lengthToWorld(point.y));
  }

  lengthToView(worldLength: number) {
    return worldLength * this.scale;
  }

  pointToWorld(worldPos: Vec2d) {
    return this.scaleToWorld(worldPos.sub(this.viewPortPosition)).add(
      this.offset
    );
  }
}

export function Canvas({
  projection,
  children,
  ref,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  className,
  page,
}: {
  projection: CanvasProjection;
  children?: React.ReactNode;
  ref?: (element: HTMLElement | null) => void;
  onPointerDown?: PointerEventHandler<SVGElement>;
  onPointerMove?: PointerEventHandler<SVGElement>;
  onPointerUp?: PointerEventHandler<SVGElement>;
  className?: string;
  page: Page;
}) {
  const dragState = useRef<
    | {
        startPointerPos: Vec2d;
        startOffset: Vec2d;
      }
    | undefined
  >(undefined);

  useRerenderOnEvent(projection.onChange);
  const worldViewSize = projection.worldViewSize;
  const observerRef = useRef<any>(null);

  return (
    <div
      className={classNames(className, "canvas")}
      ref={ref}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Delete") {
          page.removeSelectedItems();
        }
      }}
    >
      <ObserveSize
        ref={observerRef}
        observerFn={(rect) => {
          const elementRect: DOMRect =
            observerRef.current.element.getBoundingClientRect();
          projection.viewPortSize = new Vec2d(rect.width, rect.height);
          projection.viewPortPosition = new Vec2d(
            elementRect.left,
            elementRect.top
          );
          if (!projection.viewPortPositionInitialized) {
            projection.viewPortPositionInitialized = true;
            projection.setScaleOneAndAlign(page.boundingBox());
          }
          projection.onChange.notify();
        }}
      >
        <ProjectionContext.Provider value={projection}>
          <svg
            ref={(svg) => {
              svg?.addEventListener(
                "wheel",
                (e) => {
                  e.preventDefault();
                },
                { passive: false }
              );
            }}
            viewBox={`${projection.offset.x} ${projection.offset.y} ${worldViewSize.x}  ${worldViewSize.y}`}
            onPointerDown={(e) => {
              if (!e.ctrlKey && !e.shiftKey) {
                dragState.current = {
                  startPointerPos: Vec2d.fromEvent(e),
                  startOffset: projection.offset,
                };
                e.currentTarget.setPointerCapture(e.pointerId);
              } else onPointerDown?.(e);
            }}
            onPointerMove={(e) => {
              const state = dragState.current;
              if (state) {
                const pointerPos = Vec2d.fromEvent(e);

                projection.offset = state.startOffset.sub(
                  projection.scaleToWorld(pointerPos.sub(state.startPointerPos))
                );
                projection.onChange.notify();
              } else onPointerMove?.(e);
            }}
            onPointerUp={(e) => {
              const state = dragState.current;
              if (state) {
                e.currentTarget.releasePointerCapture(e.pointerId);
                const pointerPos = Vec2d.fromEvent(e);
                const delta = pointerPos.sub(state.startPointerPos);
                if (delta.length < 10) {
                  page.setSelection(Selection.empty);
                }
                e.nativeEvent.stopImmediatePropagation();
                dragState.current = undefined;
              } else onPointerUp?.(e);
            }}
            onWheel={(event) => {
              event.stopPropagation();
              if (event.ctrlKey) {
                // do a zoom
                const eventPositionView = Vec2d.fromEvent(event);
                const alpha = 500;
                projection.changeScale(
                  projection.scale /
                    Math.max(0.1, Math.min(10, (alpha + event.deltaY) / alpha)),
                  eventPositionView
                );
                return;
              } else {
                // perform a scroll
                projection.offset = projection.offset.add(
                  projection.scaleToWorld(new Vec2d(event.deltaX, event.deltaY))
                );
                projection.onChange.notify();
              }
            }}
          >
            {globalSvgContent}
            {children}
          </svg>
        </ProjectionContext.Provider>
      </ObserveSize>

      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          display: "flex",
          flexDirection: "row",
          gap: "8px",
          flexWrap: "nowrap",
        }}
      >
        <Icon1Square
          size="16px"
          onClick={() => projection.setScaleOneAndAlign(page.boundingBox())}
        />
        <Fullscreen
          size="16px"
          onClick={() => projection.setScaleFit(page.boundingBox())}
        />
      </div>
    </div>
  );
}
