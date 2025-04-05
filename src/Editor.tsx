import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import Flatbush from "flatbush";
import { RefObject, useRef, useState } from "react";
import { Canvas, CanvasProjection } from "./Canvas";
import { useRerenderOnEvent } from "./hooks";
import { Page } from "./model/Page";
import { PageItem } from "./model/PageItem";
import { DraggableSnapBox } from "./model/PageItemInteractionHelpers";
import { Selection } from "./Selection";
import { Vec2d } from "./Vec2d";
import { Rectangle, Widget } from "./widgets/Widget";
import { dragPositionRectAttrs } from "./widgets/WidgetHelpers";

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

export function RenderPageItems({
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

export function Editor({
  projection,
  page,
  dragOffset,
}: {
  projection: CanvasProjection;
  page: Page;
  dragOffset: RefObject<{ x: number; y: number }>;
}) {
  useRerenderOnEvent(page.onChange);
  const { setNodeRef } = useDroppable({
    id: "editor",
  });

  useDndMonitor({
    onDragEnd(event) {
      if (event.over && event.over.id === "editor") {
        const droppableRect = event.over.rect!;
        const draggableRect = event.active!.rect;

        const x =
          draggableRect.current.translated!.left -
          droppableRect.left +
          dragOffset.current.x;
        const y =
          draggableRect.current.translated!.top -
          droppableRect.top +
          dragOffset.current.y;

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
      onClick={() => page.setSelection(Selection.empty)}
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
