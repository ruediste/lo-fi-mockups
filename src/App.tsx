import { Splitter, Tabs } from "antd";
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
  console.log("save");
  await db.put("project", data, "default");
}, 1000);

const projectData = await (async () => {
  console.log("load");
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
    console.log("memo", projectData);
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
          <Tabs
            type="card"
            items={[
              {
                key: "palette",
                label: "Palette",
                children: (
                  <Palette
                    editorProjection={projection}
                    dragOffset={dragOffset}
                  />
                ),
              },
              {
                key: "pages",
                label: "Pages",
                children: <Pages project={project} />,
              },
            ]}
          />
        </Splitter.Panel>
        <Splitter.Panel
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
        </Splitter.Panel>
        <Splitter.Panel
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
          }}
        >
          <div>
            <ItemProperties item={selectedItem} />
          </div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}
