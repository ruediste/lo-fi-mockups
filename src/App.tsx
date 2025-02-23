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
import { deepEquals } from "./deepEquals";
import "./pageItemRegistry";

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
  return item.renderContent();
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
              box: { x: 10, y: 15, width: 10, height: 20 },
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
          <Canvas projection={projection} updateProjection={updateProjection}>
            <RenderProject project={project} />
          </Canvas>
          <div> Right</div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}

export default App;
