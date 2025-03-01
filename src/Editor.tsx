import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { RefObject } from "react";
import { Canvas, CanvasProjection } from "./Canvas";
import { Page, PageItem, useRerenderOnEvent } from "./Project";
import { Vec2d } from "./Vec2d";
import { Widget } from "./Widget";

function RenderItem({
  item,
  isSelected,
  setSelectedItem,
}: {
  item: PageItem;
  isSelected: boolean;
  setSelectedItem: (item: PageItem) => void;
}) {
  useRerenderOnEvent(item.onChange);
  return (
    <>
      {" "}
      {item.renderContent()}
      {item.renderEditorInteraction({ setSelectedItem, isSelected })}
    </>
  );
}

export function Editor({
  projection,
  page,
  dragOffset,
  selectedItem,
  setSelectedItem,
}: {
  projection: CanvasProjection;
  page: Page;
  dragOffset: RefObject<{ x: number; y: number }>;
  selectedItem?: PageItem;
  setSelectedItem: (item: PageItem | undefined) => void;
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
          id: page.project.nextId++,
          type: event.active!.data.current!.itemType,
        }) as Widget;

        const worldPos = projection.offset.add(
          projection.scaleToWorld(new Vec2d(x, y))
        );
        item.box.set({ ...item.box.get(), x: worldPos.x, y: worldPos.y });
      }
    },
  });

  return (
    <Canvas
      projection={projection}
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedItem(undefined);
      }}
    >
      {page.ownItems.concat(page.masterItems).map((item) => (
        <RenderItem
          key={item.data.id}
          item={item}
          isSelected={selectedItem === item}
          setSelectedItem={setSelectedItem}
        />
      ))}
    </Canvas>
  );
}
