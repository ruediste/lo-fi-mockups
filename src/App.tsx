import { CanvasProjection } from "./Canvas";
import { Project } from "./model/Project";

import saveAs from "file-saver";
import { Suspense, use, useMemo, useRef } from "react";
import { Button, Spinner, Stack, Tab, Tabs } from "react-bootstrap";
import Dropzone from "react-dropzone";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { HashRouter, Route, Routes } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Editor } from "./Editor";
import { useConst, useRerenderOnEvent } from "./hooks";
import { ItemProperties } from "./ItemProperties";
import { Pages } from "./Pages";
import { Palette } from "./Palette";
import { repository } from "./repository";
import { Selection } from "./Selection";
import "./widgets/PageItemTypeRegistry";
import { XwikiControls } from "./xwiki/XwikiControls";
import { XwikiPageMockups } from "./xwiki/XwikiPageMockups";

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
  await (await repository).save();
}, 1000);

export function MainApp({ downloadName }: { downloadName?: string }) {
  const repo = use(repository);
  useRerenderOnEvent(repo.onChanged);
  const projectData = repo.projectData;
  const project = useMemo(() => {
    return new Project(projectData, () => save());
  }, [projectData]);

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
        <Stack direction="horizontal" style={{ marginLeft: "auto" }} gap={3}>
          <Button
            onClick={async () => {
              saveAs(
                await (await repository).createZip(),
                downloadName ?? "project.lofi"
              );
            }}
          >
            Download
          </Button>
          <Dropzone
            onDropAccepted={async (acceptedFiles) => {
              if (acceptedFiles.length < 1) {
                return;
              }
              if (acceptedFiles.length > 1) {
                toast.error("Multiple Files Dropped");
                return;
              }
              if (!acceptedFiles[0].name.endsWith(".lofi")) {
                toast.error("File has to end in '.lofi'");
                return;
              }
              try {
                await (await repository).loadZip(acceptedFiles[0]);
              } catch (e) {
                console.log(e);
                toast.error("Loading " + acceptedFiles[0].name + " failed");
              }
              toast.success("File " + acceptedFiles[0].name + " loaded");
            }}
          >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div
                {...getRootProps()}
                style={{
                  margin: "-4px",
                  padding: "4px",
                  ...(isDragActive
                    ? {
                        border: "1px dashed black",
                      }
                    : { border: "1px dashed transparent" }),
                }}
              >
                <input {...getInputProps()} />
                <Button>Upload</Button>
              </div>
            )}
          </Dropzone>
          <XwikiControls />
        </Stack>
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

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/xwiki" element={<XwikiPageMockups />} />
        </Routes>
      </Suspense>
      <ToastContainer autoClose={2000} />
    </HashRouter>
  );
}
