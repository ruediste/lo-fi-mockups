import classNames from "classnames";
import { MouseEventHandler, PointerEventHandler, useRef } from "react";
import ObserveSize from "react-observe-size";
import { ProjectionContext } from "../Contexts";
import { useRerenderOnEvent } from "../hooks";
import { ModelEvent } from "../model/ModelEvent";
import { Vec2d } from "../Vec2d";

export class CanvasProjection {
  onChange = new ModelEvent();

  scale = 1;

  // offset of the top left corner of the view in world coordinates
  offset = new Vec2d(0, 0);

  // size of the view in view coordinates
  viewPortPosition = new Vec2d(0, 0);
  viewPortSize = new Vec2d(100, 100);

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

const scaleFactor = 1.1;

export function Canvas({
  projection,
  children,
  ref,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  className,
}: {
  projection: CanvasProjection;
  children?: React.ReactNode;
  ref?: (element: HTMLElement | null) => void;
  onClick?: MouseEventHandler;
  onPointerDown?: PointerEventHandler<SVGElement>;
  onPointerMove?: PointerEventHandler<SVGElement>;
  onPointerUp?: PointerEventHandler<SVGElement>;
  className?: string;
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
    <div className={classNames(className, "canvas")} ref={ref}>
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
          projection.onChange.notify();
        }}
      >
        <ProjectionContext.Provider value={projection}>
          <svg
            viewBox={`${projection.offset.x} ${projection.offset.y} ${worldViewSize.x}  ${worldViewSize.y}`}
            onPointerDown={(e) => {
              if (!e.ctrlKey) {
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
                  onClick?.(e);
                }
                e.nativeEvent.stopImmediatePropagation();
                dragState.current = undefined;
              } else onPointerUp?.(e);
            }}
            onWheel={(event) => {
              if (event.ctrlKey) {
                // event is a browser-level zoom, which is handled elsewhere
                return;
              }

              const eventPositionView = Vec2d.fromEvent(event);
              if (event.deltaY > 0) {
                projection.changeScale(
                  projection.scale / scaleFactor,
                  eventPositionView
                );
              }
              if (event.deltaY < 0) {
                projection.changeScale(
                  projection.scale * scaleFactor,
                  eventPositionView
                );
              }
            }}
          >
            {children}
          </svg>
        </ProjectionContext.Provider>
      </ObserveSize>
    </div>
  );
}
