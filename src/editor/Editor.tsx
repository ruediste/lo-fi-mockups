import { Selection } from "@/editor/Selection";
import { Page } from "@/model/Page";
import { PageItem } from "@/model/PageItem";
import { DraggableSnapBox } from "@/model/PageItemInteractionHelpers";
import { useRerenderOnEvent } from "@/util/hooks";
import { Vec2d } from "@/util/Vec2d";
import { Rectangle, Widget } from "@/widgets/Widget";
import { dragPositionRectAttrs } from "@/widgets/widgetUtils";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import Flatbush from "flatbush";
import { useEffect, useRef, useState } from "react";
import { Canvas, CanvasProjection } from "./Canvas";

import useSearchHref from "@/util/useSearchHref";
import "@/widgets/PageItemTypeRegistry";
import { XwikiControls } from "@/xwiki/XwikiControls";
import saveAs from "file-saver";
import DockLayout, { LayoutData } from "rc-dock";
import { Button, Stack } from "react-bootstrap";
import Dropzone from "react-dropzone";
import { toast } from "react-toastify";
import { Pages } from "./Pages";
import { Palette } from "./Palette";

import { ItemProperties } from "@/editor/ItemProperties";
import { confirm } from "@/util/confirm";
import { ThreeDotMenu } from "@/util/Inputs";
import "rc-dock/dist/rc-dock.css";
import { EditorState, useEditorState } from "./EditorState";

function RenderItem({
  item,
  projection,
}: {
  item: PageItem;
  projection: CanvasProjection;
}) {
  useRerenderOnEvent(item.onChange);
  return (
    <>
      {item.renderContent()}
      {item.fromMasterPage
        ? item.interaction.renderMasterInteraction({
            projection,
          })
        : item.interaction.renderEditorInteraction({
            projection,
          })}
    </>
  );
}

function MultiItemSelectionBox({
  projection,
  page,
}: {
  projection: CanvasProjection;
  page: Page;
}) {
  useRerenderOnEvent(page.onItemPositionChange);

  let drawBox: Rectangle | undefined = undefined;
  if (page.selection.size > 1) {
    const margin = projection.lengthToWorld(32);
    const box = Vec2d.boundingBoxRect(
      ...[...page.selection.items.values()].map((item) => item.boundingBox)
    );

    drawBox = {
      x: box.x - margin,
      y: box.y - margin,
      width: box.width + 2 * margin,
      height: box.height + 2 * margin,
    };
  } else drawBox = undefined;

  return (
    drawBox && (
      <DraggableSnapBox
        {...{
          box: drawBox,
          items: () => page.selection.items,
          projection,
          visible: true,
          page,
        }}
      />
    )
  );
}

function RenderPageItems({
  page,
  projection,
}: {
  page: Page;
  projection: CanvasProjection;
}) {
  return page.masterItems
    .concat(page.ownItems)
    .map((item) => <RenderItem key={item.data.id} {...{ item, projection }} />);
}

function EditorCanvas() {
  const state = useEditorState();
  const project = state.project;
  useRerenderOnEvent(project.onChange);

  const page = project.currentPage;

  if (page === undefined) return null;
  return <EditorCanvasInner {...{ state, page }} />;
}

function EditorCanvasInner({
  state,
  page,
}: {
  state: EditorState;
  page: Page;
}) {
  const projection = state.projection;
  useRerenderOnEvent(page.onChange);
  const { setNodeRef } = useDroppable({
    id: "editor",
  });

  useEffect(() => projection.setScaleOneAndAlign(page.boundingBox()), [page]);

  useDndMonitor({
    onDragEnd(event) {
      if (event.over && event.over.id === "editor") {
        const droppableRect = event.over.rect!;
        const draggableRect = event.active!.rect;
        const dragOffset = state.dragOffset;

        const x =
          draggableRect.current.translated!.left -
          droppableRect.left +
          dragOffset.x;
        const y =
          draggableRect.current.translated!.top -
          droppableRect.top +
          dragOffset.y;

        const item = page.addItem({
          id: page.project.data.nextId++,
          type: event.active!.data.current!.itemType,
        }) as Widget;

        item.initializeAfterAdd();

        const worldPos = projection.offset.add(
          projection.scaleToWorld(new Vec2d(x, y))
        );

        item.interaction.setPosition({
          x: worldPos.x,
          y: worldPos.y,
        });
      }
    },
  });

  const dragState = useRef<
    { startPos: Vec2d; index: Flatbush; boundingBoxes: Rectangle[] } | undefined
  >(undefined);

  const [dragSelectionBox, setDragSelectionBox] = useState<Rectangle>();

  const attrs = dragPositionRectAttrs(projection);

  return (
    <Canvas
      projection={projection}
      ref={setNodeRef}
      page={page}
      onPointerDown={(e) => {
        if (e.ctrlKey) {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          const pos = projection.pointToWorld(Vec2d.fromEvent(e));
          setDragSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });

          const index = new Flatbush(page.ownItems.length);
          const boundingBoxes = page.ownItems.map((item) => item.boundingBox);
          boundingBoxes.map((box) => {
            index.add(box.x, box.y, box.x + box.width, box.y + box.height);
          });
          index.finish();

          dragState.current = { startPos: pos, index, boundingBoxes };
          page.setSelection(Selection.empty);
        }
      }}
      onPointerMove={(e) => {
        if (dragState.current) {
          const pos = projection.pointToWorld(Vec2d.fromEvent(e));
          setDragSelectionBox(
            Vec2d.boundingBox(pos, dragState.current.startPos)
          );
        }
      }}
      onPointerUp={() => {
        if (dragState.current) {
          setDragSelectionBox(undefined);
          page.setSelection(
            Selection.of(
              ...dragState.current.index
                .search(
                  dragSelectionBox!.x,
                  dragSelectionBox!.y,
                  dragSelectionBox!.x + dragSelectionBox!.width,
                  dragSelectionBox!.y + dragSelectionBox!.height
                )
                .map((idx) => page.ownItems[idx])
            )
          );
          dragState.current = undefined;
        }
      }}
    >
      <MultiItemSelectionBox {...{ projection, page }} />
      <RenderPageItems {...{ projection, page }} />
      {dragSelectionBox && (
        <rect {...attrs} {...dragSelectionBox} fill="transparent" />
      )}
      {dragSelectionBox &&
        dragState.current &&
        dragState.current.index
          .search(
            dragSelectionBox.x,
            dragSelectionBox.y,
            dragSelectionBox.x + dragSelectionBox.width,
            dragSelectionBox.y + dragSelectionBox.height
          )
          .map((idx) => {
            const box = dragState.current?.boundingBoxes[idx];
            return <rect key={idx} {...box} {...attrs} fill="transparent" />;
          })}
    </Canvas>
  );
}

const defaultLayout: LayoutData = {
  dockbox: {
    mode: "horizontal",
    children: [
      {
        tabs: [
          {
            id: "palette",
            title: "Palette",
            content: <Palette />,
          },
          {
            id: "pages",
            title: "Pages",
            content: <Pages />,
          },
        ],
      },
      {
        tabs: [
          {
            id: "editor",
            title: "Editor",
            content: <EditorCanvas />,
          },
        ],
      },
      {
        tabs: [
          {
            id: "properties",
            title: "Properties",
            content: <ItemProperties />,
          },
        ],
      },
    ],
  },
};

export const editorLayoutKey = "lo-fi-mockups-layout";
export function Editor({ downloadName }: { downloadName?: string }) {
  const state = useEditorState();
  const play = useSearchHref({ pathname: "./play" });

  const dockLayout = useRef<DockLayout | null>(null);

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

        <Stack direction="horizontal" style={{ marginLeft: "auto" }} gap={3}>
          <Button as="a" {...play}>
            Play
          </Button>
          <Button
            onClick={async () => {
              saveAs(
                await state.repository.createZip(),
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
                await state.repository.loadZip(acceptedFiles[0]);
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
          <ThreeDotMenu
            items={[
              {
                label: "Export PDF",
                onClick: async () => {
                  await state.repository.savePdf();
                },
              },
              {
                label: "Clear Project",
                onClick: async () => {
                  if (
                    await confirm({
                      title: "Clear Project",
                      confirmation: "Really clear the project?",
                      okDangerous: true,
                      okLabel: "Clear",
                    })
                  )
                    state.repository.clear();
                },
              },
              {
                label: "Reset Editor Layout",
                onClick: async () => {
                  if (
                    await confirm({
                      title: "Reset Editor Layout",
                      confirmation:
                        "Really set the editor layout back to the default?",
                      okDangerous: true,
                      okLabel: "Reset",
                    })
                  )
                    localStorage.removeItem(editorLayoutKey);
                  dockLayout.current?.loadLayout(defaultLayout);
                },
              },
            ]}
          />
        </Stack>
      </div>

      <DockLayout
        ref={(x) => {
          dockLayout.current = x;
          const layout = localStorage.getItem(editorLayoutKey);
          if (layout !== null) x?.loadLayout(JSON.parse(layout));
        }}
        defaultLayout={defaultLayout}
        onLayoutChange={(layout) =>
          localStorage.setItem(editorLayoutKey, JSON.stringify(layout))
        }
        style={{ flexGrow: 1 }}
      />
    </div>
  );
}
