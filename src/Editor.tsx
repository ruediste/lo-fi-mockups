import { useDrop } from "react-dnd";
import { Canvas, CanvasProjection } from "./Canvas";
import { Page, PageItem, useRedrawOnEvent } from "./Project";

function RenderItem({ item }: { item: PageItem }) {
  useRedrawOnEvent(item.onChange);
  return (
    <>
      {" "}
      {item.renderContent()}
      {item.renderEditorInteraction()}
    </>
  );
}

export function RenderPage({ page }: { page: Page }) {
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
}: {
  projection: CanvasProjection;
  page: Page;
}) {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    // The type (or types) to accept - strings or symbols
    accept: "BOX",
    // Props to collect
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    drop: (item, monitor) => {
      console.log(item, monitor.getClientOffset());
    },
  }));
  return (
    <Canvas projection={projection} drop={drop}>
      <RenderPage page={page} />
    </Canvas>
  );
}
