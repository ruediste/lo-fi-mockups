import { Splitter } from "antd";
import { useImmer } from "use-immer";
import { Canvas, CanvasProjection } from "./Canvas";
import {
  Cache,
  CacheBuilder,
  Page,
  PageItem,
  Project,
  ProjectData,
} from "./Project";

import { useRef } from "react";
import { useDrop } from "react-dnd";
import { deepEquals } from "./deepEquals";
import "./pageItemRegistry";
import { Palette } from "./Palette";

function useCache<I, O>(input: I, mapper: (cb: CacheBuilder) => O): O {
  const cache = useRef<Cache>(undefined);
  const lastInput = useRef<I>(undefined);
  const result = useRef<O>(undefined);
  if (!deepEquals(input, lastInput.current)) {
    const newCache = new Cache();
    const cb = new CacheBuilder(newCache, cache.current);
    cache.current = newCache;
    lastInput.current = input;
    result.current = mapper(cb);
  }
  return result.current as O;
}

function RenderItem({ item }: { item: PageItem }) {
  return item.renderContent({ interaction: true });
}

function RenderPage({ page }: { page: Page }) {
  return page.items.map((item) => (
    <RenderItem key={item.data.id} item={item} />
  ));
}

function RenderProject({ project }: { project: Project }) {
  return project.pages.map((page) => (
    <RenderPage key={page.data.id} page={page} />
  ));
}

function App() {
  const [projectData, updateProjectData] = useImmer<ProjectData>(() => ({
    nextId: 10,
    currentPageId: 1,
    pageOrder: [1],
    pages: {
      1: {
        id: 1,
        itemOrder: [2],
        items: {
          2: {
            id: 2,
            type: "list",
            propertyValues: {
              text: "foo",
              box: { x: 10, y: 15, width: 100, height: 200 },
            },
          },
        },
        valueOverrides: {},
      },
    },
  }));

  const project = useCache(
    projectData,
    (cb) => new Project(projectData, updateProjectData, cb)
  );

  const [projection, updateProjection] = useImmer(new CanvasProjection());

  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    // The type (or types) to accept - strings or symbols
    accept: "BOX",
    // Props to collect
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    drop: (item, monitor) => {
      console.log(item, monitor.getClientOffset());
    },
  }));

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
          className="palette"
          style={{
            // overflowY: "auto",
            overflow: "visible",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          <Palette />
        </Splitter.Panel>
        <Splitter.Panel
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
          }}
        >
          <Canvas
            projection={projection}
            updateProjection={updateProjection}
            drop={drop}
          >
            <RenderProject project={project} />
          </Canvas>
          <div> Right</div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}

export default App;
