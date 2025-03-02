import { Splitter } from "antd";
import { CanvasProjection } from "./Canvas";
import { Page, ProjectData, useConst } from "./Project";

import { useMemo, useRef } from "react";
import { Editor } from "./Editor";
import "./PageItemTypeRegistry";
import { Palette } from "./Palette";

function App() {
  const projectData = useConst<ProjectData>(() => ({
    nextId: 10,
    currentPageIndex: 0,
    pages: [
      {
        id: 1,
        items: [
          {
            id: 2,
            type: "list",
          },
        ],
        propertyValues: {},
      },
    ],
  }));

  const page = useMemo(
    () => new Page(projectData.pages[0], projectData),
    [projectData]
  );

  const projection = useConst(() => new CanvasProjection());

  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
          flexGrow: 1,
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Splitter.Panel
          defaultSize="40%"
          min="20%"
          max="70%"
          className="palette"
          style={{
            // overflowY: "auto",
            overflow: "visible",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          <Palette editorProjection={projection} dragOffset={dragOffset} />
        </Splitter.Panel>
        <Splitter.Panel
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
          }}
        >
          <Editor projection={projection} page={page} dragOffset={dragOffset} />
          <div> Right</div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}

export default App;
