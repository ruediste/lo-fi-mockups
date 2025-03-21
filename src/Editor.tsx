import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import Flatbush from "flatbush";
import { RefObject, useEffect, useRef, useState } from "react";
import { Canvas, CanvasProjection } from "./Canvas";
import { useRerenderOnEvent } from "./hooks";
import { Page } from "./model/Page";
import { PageItem } from "./model/PageItem";
import { Selection } from "./Selection";
import { Vec2d } from "./Vec2d";
import { Rectangle, Widget } from "./widgets/Widget";
import { DraggableBox, dragPositionRectAttrs } from "./widgets/WidgetHelpers";

function RenderItem({
  item,
  selection,
  setSelection,
}: {
  item: PageItem;
  selection: Selection;
  setSelection: (value: Selection) => void;
}) {
  useRerenderOnEvent(item.onChange);
  return (
    <>
      {item.renderContent()}
      {item.fromMasterPage
        ? item.renderMasterInteraction({ selection, setSelection })
        : item.renderEditorInteraction({ selection, setSelection })}
    </>
  );
}

function MultiItemSelectionBox({
  selection,
  projection,
}: {
  selection: Selection;
  projection: CanvasProjection;
}) {
  const lastDelta = useRef<Vec2d | undefined>(undefined);

  const [drawBox, setDrawBox] = useState<Rectangle>();

  useEffect(() => {
    if (selection.size > 1) {
      const margin = projection.lengthToWorld(32);
      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      selection.all().forEach((item) => {
        const box = item.boundingBox;
        if (minX > box.x) minX = box.x;
        if (maxX < box.x + box.width) maxX = box.x + box.width;
        if (minY > box.y) minY = box.y;
        if (maxY < box.y + box.height) maxY = box.y + box.height;
      });
      setDrawBox({
        x: minX - margin,
        y: minY - margin,
        width: maxX - minX + 2 * margin,
        height: maxY - minY + 2 * margin,
      });
    } else setDrawBox(undefined);
  }, [selection, projection]);
  return drawBox ? (
    <DraggableBox<any>
      current={null}
      onDragStart={() => (lastDelta.current = new Vec2d(0, 0))}
      update={(_start, delta) => {
        const diff = delta.sub(lastDelta.current!);
        setDrawBox({
          ...drawBox,
          x: drawBox.x + diff.x,
          y: drawBox.y + diff.y,
        });
        selection.all().forEach((item) => item.moveBy(diff));
        lastDelta.current = delta;
      }}
      box={drawBox}
      attrs={{
        stroke: "#008800",
        strokeWidth: projection.lengthToWorld(0.5),
        fill: "transparent",
      }}
    />
  ) : null;
}

export function Editor({
  projection,
  page,
  dragOffset,
  selection,
  setSelection,
}: {
  projection: CanvasProjection;
  page: Page;
  dragOffset: RefObject<{ x: number; y: number }>;
  selection: Selection;
  setSelection: (value: Selection) => void;
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
      onClick={() => setSelection(Selection.empty)}
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
          setSelection(Selection.empty);
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
          setSelection(
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
      <MultiItemSelectionBox {...{ selection, projection }} />
      {page.ownItems.concat(page.masterItems).map((item) => (
        <RenderItem key={item.data.id} {...{ selection, setSelection, item }} />
      ))}
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
