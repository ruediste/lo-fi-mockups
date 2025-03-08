import { CanvasProjection } from "./Canvas";
import {
  PageItem,
  Project,
  ProjectData,
  useConst,
  useRerenderOnEvent,
} from "./Project";

import { DBSchema, openDB } from "idb";
import { useMemo, useRef, useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Editor } from "./Editor";
import { ItemProperties } from "./ItemProperties";
import "./PageItemTypeRegistry";
import { Pages } from "./Pages";
import { Palette } from "./Palette";

function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: [...Parameters<T>]) => void {
  let timeout: NodeJS.Timeout | undefined;
  let currentArgs: [...Parameters<T>] | undefined;
  return (...args: [...Parameters<T>]) => {
    currentArgs = args;
    if (!timeout) {
      timeout = setTimeout(function () {
        func(...currentArgs!);
        timeout = undefined;
      }, limit);
    }
  };
}

interface MyDB extends DBSchema {
  project: {
    key: string;
    value: ProjectData;
  };
  images: {
    key: number;
    value: Blob;
  };
}

const db = await openDB<MyDB>("test", 1, {
  upgrade(db, oldVersion, newVersion, transaction, event) {
    db.createObjectStore("project");
    db.createObjectStore("images");
  },
  blocked(currentVersion, blockedVersion, event) {
    // …
  },
  blocking(currentVersion, blockedVersion, event) {
    // …
  },
  terminated() {
    // …
  },
});

const save = throttle(async (data: ProjectData) => {
  await db.put("project", data, "default");
}, 1000);

const projectData = await (async () => {
  let result = await db.get("project", "default");
  if (result === undefined) {
    result = {
      nextId: 2,
      currentPageId: 1,
      pages: [
        {
          id: 1,
          items: [],
          propertyValues: {},
        },
      ],
    };
  }
  return result;
})();

export default function App() {
  const project = useMemo(() => {
    const result = new Project(projectData, () => save(projectData));
    return result;
  }, []);

  useRerenderOnEvent(project.onChange);

  const projection = useConst(() => new CanvasProjection());

  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [selectedItem, setSelectedItem] = useState<PageItem>();

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

      <PanelGroup
        autoSaveId="main"
        direction="horizontal"
        style={{
          minHeight: "0px",
          flexGrow: 1,
        }}
      >
        <Panel
          style={{
            // overflowY: "auto",
            overflow: "visible",
            // display: "flex",
            // flexDirection: "row",
            // flexWrap: "wrap",
          }}
        >
          <Tabs defaultActiveKey="palette">
            <Tab title="Palette" style={{}} eventKey="palette">
              <Palette editorProjection={projection} dragOffset={dragOffset} />
            </Tab>
            <Tab title="Pages" eventKey="pages">
              <Pages project={project} />
            </Tab>
          </Tabs>
        </Panel>
        <PanelResizeHandle className="panel-resize-handle" />
        <Panel
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
          }}
        >
          {project.currentPage === undefined ? null : (
            <Editor
              projection={projection}
              page={project.currentPage}
              dragOffset={dragOffset}
              selectedItem={selectedItem}
              setSelectedItem={(item) => setSelectedItem(item)}
            />
          )}
        </Panel>
        <PanelResizeHandle className="panel-resize-handle" />
        <Panel
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
          }}
        >
          <div>
            <ItemProperties item={selectedItem} />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
