import { CanvasProjection } from "./Canvas";
import { Project, ProjectData } from "./model/Project";

import saveAs from "file-saver";
import { useMemo, useRef } from "react";
import { Button, Spinner, Tab, Tabs } from "react-bootstrap";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { BrowserRouter, Route, Routes } from "react-router";
import { Editor } from "./Editor";
import { useConst, useRerenderOnEvent } from "./hooks";
import { ItemProperties } from "./ItemProperties";
import { Pages } from "./Pages";
import { Palette } from "./Palette";
import { repository } from "./repository";
import { Selection } from "./Selection";
import "./widgets/PageItemTypeRegistry";
import { XwikiPageMockups } from "./XwikiPageMockups";

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

const save = throttle(async () => {
  await repository.db!.put("project", repository.projectData!, "default");
}, 1000);

function MainApp({ projectData }: { projectData: ProjectData }) {
  const project = useMemo(() => {
    const result = new Project(projectData, () => save());
    return result;
  }, []);

  useRerenderOnEvent(project.onChange);
  useRerenderOnEvent(project.currentPage?.onChange);

  const projection = useConst(() => new CanvasProjection());

  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const selection = project.currentPage?.selection;

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
        <span style={{ fontSize: "24px" }}>LoFi Mockup</span>{" "}
        <Button
          onClick={async () => {
            saveAs(await repository.createZip(), "download.zip");
          }}
        >
          Download
        </Button>
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
            overflow: "visible",
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
          <div style={{ flexGrow: 1 }}>
            {selection?.size === 0 && <h1> No selected Item </h1>}
            {selection?.size === 1 && (
              <ItemProperties
                item={selection.single}
                clearSelection={() =>
                  project.currentPage?.setSelection(Selection.empty)
                }
              />
            )}
            {selection !== undefined && selection.size > 1 && (
              <h1> Multiple selected Items </h1>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

function WaitForRepository() {
  useRerenderOnEvent(repository.onChange);
  if (repository.projectData === undefined)
    return (
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    );
  else return <MainApp projectData={repository.projectData} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WaitForRepository />} />
        <Route path="/xwiki" element={<XwikiPageMockups />} />
      </Routes>
    </BrowserRouter>
  );
}
