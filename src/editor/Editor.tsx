import { Selection } from "@/editor/Selection";
import { Page } from "@/model/Page";
import {
  HorizontalSnapReference,
  PageItem,
  VerticalSnapReference,
} from "@/model/PageItem";
import { DraggableSnapBox } from "@/model/PageItemInteractionHelpers";
import { useRerenderOnEvent } from "@/util/hooks";
import { Vec2d } from "@/util/Vec2d";
import { IRectangle, Widget } from "@/widgets/Widget";
import { dragPositionRectAttrs } from "@/widgets/widgetUtils";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import Flatbush from "flatbush";
import { PointerEvent, useEffect, useId, useRef, useState } from "react";
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
import { createPageItemData } from "@/model/createPageItem";
import { SnapIndex } from "@/model/SnapIndex";
import { confirm } from "@/util/confirm";
import { ThreeDotMenu } from "@/util/Inputs";
import { ConnectorWidget } from "@/widgets/ConnectorWidget";
import { snapConfiguration } from "@/widgets/widgetTheme";
import "rc-dock/dist/rc-dock.css";
import { EditorState, useEditorState } from "./EditorState";

function RenderItem({
  item,
  projection,
  globalSvgContentId,
}: {
  item: PageItem;
  projection: CanvasProjection;
  globalSvgContentId: string;
}) {
  useRerenderOnEvent(item.onChange);
  useRerenderOnEvent(projection.onChange);
  const selection = item.page.selection;
  return (
    <>
      {item.renderContent(globalSvgContentId)}
      {selection.size <= 1 ? (
        item.fromMasterPage ? (
          item.interaction.renderMasterInteraction({
            projection,
          })
        ) : (
          item.interaction.renderEditorInteraction({
            projection,
          })
        )
      ) : (
        <rect
          {...item.boundingBox}
          {...dragPositionRectAttrs(projection)}
          fill="transparent"
        />
      )}
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

  let drawBox: IRectangle | undefined = undefined;
  if (page.selection.size > 1) {
    const margin = projection.lengthToWorld(32);
    const box = Vec2d.boundingBoxRect(
      ...[...page.selection.items.values()].map((item) => item.boundingBox),
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
          moveItems: (by) => page.selection.moveBy(by),
          projection,
          visible: true,
          page,
          onDuplicate: () =>
            page.selection.items.forEach((i) => page.duplicateItem(i)),
        }}
      />
    )
  );
}

function RenderPageItems({
  page,
  projection,
  globalSvgContentId,
}: {
  page: Page;
  projection: CanvasProjection;
  globalSvgContentId: string;
}) {
  return (
    <>
      {page.masterItems.concat(page.ownItems).map((item) => (
        <RenderItem
          key={item.data.id}
          {...{ item, projection }}
          globalSvgContentId={globalSvgContentId}
        />
      ))}
    </>
  );
}

function EditorCanvas() {
  const state = useEditorState();
  const project = state.project;
  useRerenderOnEvent(project.onChange);

  const page = project.currentPage;

  if (page === undefined) return null;
  return <EditorCanvasInner {...{ state, page }} />;
}

class SelectBoxDragHandler {
  startPos: Vec2d;
  index: Flatbush;
  boundingBoxes: IRectangle[];

  constructor(
    e: PointerEvent<SVGElement>,
    private projection: CanvasProjection,
    private page: Page,
    private setDragSelectionBox: (
      value: { box: IRectangle; boundingBoxes: IRectangle[] } | undefined,
    ) => void,
  ) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    this.startPos = projection.pointToWorld(Vec2d.fromEvent(e));

    this.index = new Flatbush(page.ownItems.length);
    this.boundingBoxes = page.ownItems.map((item) => item.boundingBox);
    this.boundingBoxes.map((box) => {
      this.index.add(box.x, box.y, box.x + box.width, box.y + box.height);
    });
    this.index.finish();

    page.setSelection(Selection.empty);

    this.updateDragSelectionBox({
      x: this.startPos.x,
      y: this.startPos.y,
      width: 0,
      height: 0,
    });
  }
  onPointerMove(e: PointerEvent<SVGElement>) {
    const pos = this.projection.pointToWorld(Vec2d.fromEvent(e));
    this.updateDragSelectionBox(Vec2d.boundingBox(pos, this.startPos));
  }
  onPointerUp(e: PointerEvent<SVGElement>) {
    const pos = this.projection.pointToWorld(Vec2d.fromEvent(e));
    const dragSelectionBox = Vec2d.boundingBox(pos, this.startPos);
    this.setDragSelectionBox(undefined);
    this.page.setSelection(
      Selection.of(
        ...this.index
          .search(
            dragSelectionBox!.x,
            dragSelectionBox!.y,
            dragSelectionBox!.x + dragSelectionBox!.width,
            dragSelectionBox!.y + dragSelectionBox!.height,
          )
          .map((idx) => this.page.ownItems[idx]),
      ),
    );
  }
  private updateDragSelectionBox(box: IRectangle) {
    this.setDragSelectionBox({
      box,
      boundingBoxes: this.index
        .search(box.x, box.y, box.x + box.width, box.y + box.height)
        .map((idx) => this.boundingBoxes[idx]),
    });
  }
}

class CreateConnectorDragHandler {
  connector: ConnectorWidget;
  private snapIndex: SnapIndex;
  constructor(
    e: PointerEvent<SVGElement>,
    private projection: CanvasProjection,
    private page: Page,
  ) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    // add a connector widget
    this.connector = page.addItem(
      createPageItemData(page.project.data.nextId++, "connector"),
    ) as ConnectorWidget;
    this.connector.initializeAfterAdd();

    // snap the source at the current position
    const startPos = projection.pointToWorld(Vec2d.fromEvent(e));
    this.snapIndex = new SnapIndex(page, projection, () => true);
    const { snapResult, snappedPosition } = e.ctrlKey
      ? { snappedPosition: startPos }
      : this.getSnappedPosition(startPos);
    this.connector.source.setPosition(snappedPosition, snapResult);
    this.connector.target.setPosition(snappedPosition);
  }

  onPointerMove(e: PointerEvent<SVGElement>) {
    const pos = this.projection.pointToWorld(Vec2d.fromEvent(e));
    const { snapResult, snappedPosition } = e.ctrlKey
      ? { snappedPosition: pos }
      : this.getSnappedPosition(pos);
    this.connector.target.setPosition(snappedPosition, snapResult);
  }

  onPointerUp(e: PointerEvent<SVGElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    const pos = this.projection.pointToWorld(Vec2d.fromEvent(e));

    const { snapResult, snappedPosition } = e.ctrlKey
      ? { snappedPosition: pos }
      : this.getSnappedPosition(pos);
    this.connector.target.setPosition(snappedPosition, snapResult);

    this.page.setSelection(Selection.of(this.connector));
  }

  private getSnappedPosition(position: Vec2d): {
    snapResult: any;
    snappedPosition: Vec2d;
  } {
    const refs = {
      otherHorizontal: [
        new HorizontalSnapReference(
          position.x - this.projection.lengthToWorld(6),
          position.y,
          this.projection.lengthToWorld(12),
          "connector",
        ),
      ],
      otherVertical: [
        new VerticalSnapReference(
          position.x,
          position.y - this.projection.lengthToWorld(6),
          this.projection.lengthToWorld(12),
          "connector",
        ),
      ],
    };
    const snapResult = this.snapIndex.snapReferences(refs, new Vec2d(0, 0));

    // snap to source position as well
    const toSource = Vec2d.from(this.connector.source.position).sub(position);
    const snapThreshold = this.projection.lengthToWorld(
      snapConfiguration.snapRange,
    );

    if (
      Math.abs(toSource.x) < snapThreshold &&
      (!snapResult.v || Math.abs(toSource.x) < Math.abs(snapResult.offset.x))
    ) {
      snapResult.offset = new Vec2d(toSource.x, snapResult.offset.y);
      snapResult.v = undefined;
    }

    if (
      Math.abs(toSource.y) < snapThreshold &&
      (!snapResult.h || Math.abs(toSource.y) < Math.abs(snapResult.offset.y))
    ) {
      snapResult.offset = new Vec2d(snapResult.offset.x, toSource.y);
      snapResult.h = undefined;
    }

    const snappedPosition = position.add(snapResult.offset);
    return { snapResult, snappedPosition };
  }
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
  const globalSvgContentId = useId();

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

        const item = page.addItem(
          createPageItemData(
            page.project.data.nextId++,
            event.active!.data.current!.itemType,
          ),
        ) as Widget;

        item.initializeAfterAdd();

        const worldPos = projection.offset.add(
          projection.scaleToWorld(new Vec2d(x, y)),
        );

        item.interaction.setPosition({
          x: worldPos.x,
          y: worldPos.y,
        });
      }
    },
  });

  const dragState = useRef<
    SelectBoxDragHandler | CreateConnectorDragHandler | undefined
  >(undefined);

  const [dragSelectionBox, setDragSelectionBox] = useState<{
    box: IRectangle;
    boundingBoxes: IRectangle[];
  }>();

  const attrs = dragPositionRectAttrs(projection);

  return (
    <Canvas
      projection={projection}
      ref={setNodeRef}
      page={page}
      globalSvgContentId={globalSvgContentId}
      onPointerDown={(e) => {
        if (e.shiftKey) {
          dragState.current = new CreateConnectorDragHandler(
            e,
            projection,
            page,
          );
        } else if (e.ctrlKey) {
          dragState.current = new SelectBoxDragHandler(
            e,
            projection,
            page,
            setDragSelectionBox,
          );
        }
      }}
      onPointerMove={(e) => {
        dragState.current?.onPointerMove(e);
      }}
      onPointerUp={(e) => {
        dragState.current?.onPointerUp(e);
        dragState.current = undefined;
      }}
    >
      <MultiItemSelectionBox {...{ projection, page }} />
      <RenderPageItems {...{ projection, page, globalSvgContentId }} />
      {dragSelectionBox && (
        <rect {...attrs} {...dragSelectionBox.box} fill="transparent" />
      )}
      {dragSelectionBox &&
        dragSelectionBox.boundingBoxes.map((box, idx) => (
          <rect key={idx} {...box} {...attrs} fill="transparent" />
        ))}
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

  const [zipProgress, setZipProgress] = useState<
    { processed: number; total: number } | undefined
  >(undefined);

  const [pdfProgress, setPdfProgress] = useState<
    { processed: number; total: number } | undefined
  >(undefined);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        play.onClick(undefined!);
      }
    };
    const handleCopy = (e: ClipboardEvent) => {
      if (!document.activeElement?.classList.contains("canvas")) return;
      const currentPage = state.project.currentPage;
      if (!currentPage) return;
      const selection = currentPage.selection;
      if (selection && selection.size > 0) {
        e.preventDefault();

        const data = currentPage.copyItems(selection.all());

        e.clipboardData?.setData("application/x-lofi-mockups-page-items", data);
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (!document.activeElement?.classList.contains("canvas")) return;
      const dataStr = e.clipboardData?.getData(
        "application/x-lofi-mockups-page-items",
      );
      if (dataStr) {
        e.preventDefault();
        try {
          const currentPage = state.project.currentPage;
          if (!currentPage) return;
          currentPage.setSelection(
            Selection.of(...currentPage.pasteItems(dataStr)),
          );
        } catch (e) {
          console.error("Error while handling paste", e);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

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
          {pdfProgress && (
            <span>
              Creating PDF: {pdfProgress.processed}/{pdfProgress.total}
            </span>
          )}
          {zipProgress && (
            <span>
              Creating Download: {zipProgress.processed}/{zipProgress.total}
            </span>
          )}
          {!zipProgress && (
            <Button
              onClick={async () => {
                state.repository.projectData.dataVersion++;
                state.project.onDataChanged();
                saveAs(
                  await state.repository.createZip(
                    false,
                    (processed, total) => {
                      setZipProgress({ processed, total });
                    },
                  ),
                  downloadName ?? "project.lofi",
                );
                setZipProgress(undefined);
              }}
            >
              Download
            </Button>
          )}
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
                await state.repository.loadZip(acceptedFiles[0], false);
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
                label: pdfProgress
                  ? `Creating PDF: ${pdfProgress.processed}/${pdfProgress.total}`
                  : "Export PDF",
                onClick: async () => {
                  if (pdfProgress || zipProgress) return;
                  await state.repository.savePdf((processed, total) => {
                    setPdfProgress({ processed, total });
                  });
                  setPdfProgress(undefined);
                },
              },
              {
                label: "Export PNG Image",
                onClick: async () => {
                  saveAs(await state.repository.createPng(), "project.png");
                },
              },
              {
                label: "Copy Image to Clipboard",
                onClick: async () => {
                  const blob = await state.repository.createPng();
                  await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob }),
                  ]);
                  toast.success("Image copied to the clipboard");
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
              {
                label: "Help",
                href: "https://github.com/ruediste/lo-fi-mockups/blob/main/README.md",
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
