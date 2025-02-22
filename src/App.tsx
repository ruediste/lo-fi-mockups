import { Splitter } from "antd";
import { immerable } from "immer";
import { useRef } from "react";
import ObserveSize from "react-observe-size";
import { useImmer } from "use-immer";
import { Vec2d } from "./Vec2d";

interface Page {
  width: number;
  height: number;
}

class ViewState {
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

function Editor() {
  const page: Page = {
    width: 400,
    height: 300,
  };

  const [viewState, setViewState] = useImmer(new ViewState());
  const dragState = useRef<
    | {
        startPointerPos: Vec2d;
        startOffset: Vec2d;
      }
    | undefined
  >(undefined);

  const worldViewSize = viewState.worldViewSize;

  const observerRef = useRef<any>(null);

  return (
    <div className="editor">
      <ObserveSize
        ref={observerRef}
        observerFn={(rect) =>
          setViewState((s) => {
            const elementRect: DOMRect =
              observerRef.current.element.getBoundingClientRect();
            s.viewPortSize = new Vec2d(rect.width, rect.height);
            s.viewPortPosition = new Vec2d(elementRect.left, elementRect.top);
          })
        }
      >
        <svg
          viewBox={`${viewState.offset.x} ${viewState.offset.y} ${worldViewSize.x}  ${worldViewSize.y}`}
          onMouseDown={(e) => {
            dragState.current = {
              startPointerPos: Vec2d.fromEvent(e),
              startOffset: viewState.offset,
            };
          }}
          onMouseMove={(e) => {
            if (dragState.current) {
              const pointerPos = Vec2d.fromEvent(e);

              setViewState((x) => {
                x.offset = dragState.current!.startOffset.sub(
                  viewState.scaleToWorld(
                    pointerPos.sub(dragState.current!.startPointerPos)
                  )
                );
              });
            }
          }}
          onMouseUp={() => {
            dragState.current = undefined;
          }}
          onWheel={(event) => {
            if (event.ctrlKey) {
              // event is a browser-level zoom, which is handled elsewhere
              return;
            }

            const eventPositionView = Vec2d.fromEvent(event);
            if (event.deltaY > 0) {
              setViewState((x) =>
                x.changeScale(x.scale / scaleFactor, eventPositionView)
              );
            }
            if (event.deltaY < 0) {
              setViewState((x) =>
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
        </svg>
      </ObserveSize>
    </div>
  );
}

function App() {
  return (
    <div
      style={{
        minHeight: "0px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        flexGrow: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          padding: "8px",
        }}
      >
        <span style={{ fontSize: "24px" }}>LoFi Mockup</span>
      </div>

      <Splitter
        style={{
          minHeight: "0px",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Splitter.Panel
          defaultSize="40%"
          min="20%"
          max="70%"
          style={{ overflowY: "auto" }}
        >
          Left
          <div style={{ minHeight: "1500px", background: "red" }}>
            {" "}
            long content
          </div>
        </Splitter.Panel>
        <Splitter.Panel
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
          }}
        >
          <Editor />
          <div> Right</div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}

export default App;
