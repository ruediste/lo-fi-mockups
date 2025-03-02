import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { RefObject } from "react";
import { Canvas, CanvasProjection } from "./Canvas";
import { Page, PageItem, useRerenderOnEvent } from "./Project";
import { Vec2d } from "./Vec2d";
import { Widget } from "./Widget";

function RenderItem({ item }: { item: PageItem }) {
  useRerenderOnEvent(item.onChange);
  return (
    <>
      {" "}
      {item.renderContent()}
      {item.renderEditorInteraction()}
    </>
  );
}

export function RenderPage({ page }: { page: Page }) {
  useRerenderOnEvent(page.onChange);
  console.log(page.ownItems);
  return (
    <>
      {page.ownItems.concat(page.masterItems).map((item) => (
        <RenderItem key={item.data.id} item={item} />
      ))}
    </>
  );
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

        console.log(x, y, event.active!.data.current!);

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
    <Canvas projection={projection} ref={setNodeRef}>
      <RenderPage page={page} />
    </Canvas>
  );
}
