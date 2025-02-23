import { immerable } from "immer";
import { useRef } from "react";
import ObserveSize from "react-observe-size";
import { Updater } from "use-immer";
import { ProjectionContext } from "./Contexts";
import { Vec2d } from "./Vec2d";

export class CanvasProjection {
  [immerable] = true;

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
  updateProjection,
  children,
}: {
  projection: CanvasProjection;
  updateProjection: Updater<CanvasProjection>;
  children?: React.ReactNode;
}) {
  const dragState = useRef<
    | {
        startPointerPos: Vec2d;
        startOffset: Vec2d;
      }
    | undefined
  >(undefined);

  const worldViewSize = projection.worldViewSize;

  const observerRef = useRef<any>(null);

  return (
    <div className="editor">
      <ObserveSize
        ref={observerRef}
        observerFn={(rect) =>
          updateProjection((s) => {
            const elementRect: DOMRect =
              observerRef.current.element.getBoundingClientRect();
            s.viewPortSize = new Vec2d(rect.width, rect.height);
            s.viewPortPosition = new Vec2d(elementRect.left, elementRect.top);
          })
        }
      >
        <ProjectionContext.Provider value={projection}>
          <svg
            viewBox={`${projection.offset.x} ${projection.offset.y} ${worldViewSize.x}  ${worldViewSize.y}`}
            onPointerDown={(e) => {
              dragState.current = {
                startPointerPos: Vec2d.fromEvent(e),
                startOffset: projection.offset,
              };
            }}
            onPointerMove={(e) => {
              const state = dragState.current;
              if (state) {
                const pointerPos = Vec2d.fromEvent(e);

                updateProjection((draft) => {
                  draft.offset = state.startOffset.sub(
                    draft.scaleToWorld(pointerPos.sub(state.startPointerPos))
                  );
                });
              }
            }}
            onPointerUp={() => {
              dragState.current = undefined;
            }}
            onWheel={(event) => {
              if (event.ctrlKey) {
                // event is a browser-level zoom, which is handled elsewhere
                return;
              }

              const eventPositionView = Vec2d.fromEvent(event);
              if (event.deltaY > 0) {
                updateProjection((x) =>
                  x.changeScale(x.scale / scaleFactor, eventPositionView)
                );
              }
              if (event.deltaY < 0) {
                updateProjection((x) =>
                  x.changeScale(x.scale * scaleFactor, eventPositionView)
                );
              }
            }}
          >
            <rect
              x="0"
              y="0"
              width="100"
              height="150"
              fill="tomato"
              opacity="0.75"
            />
            {children}
          </svg>
        </ProjectionContext.Provider>
      </ObserveSize>
    </div>
  );
}
