import { DragOverlay, useDraggable } from "@dnd-kit/core";
import { memo, RefObject, useEffect, useMemo, useState } from "react";
import { CanvasProjection } from "./Canvas";
import { PageItemData } from "./model/PageItem";
import { Project, ProjectData } from "./model/Project";
import { calculateViewBox } from "./paletteHelper";
import { Widget, WidgetPaletteInfo } from "./Widget";
import { pageItemTypeRegistry } from "./widgets/PageItemTypeRegistry";

const paletteItemSize = { width: 80, height: 60 };

function PaletteEntry({
  widget,
  info,
  editorProjection,
  idx,
  dragOffset,
}: {
  widget: Widget;
  info: WidgetPaletteInfo;
  editorProjection: CanvasProjection;
  idx: number;
  dragOffset: RefObject<{ x: number; y: number }>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    activatorEvent,
    node,
  } = useDraggable({
    id: "palette-" + idx,
    data: { itemType: widget.data.type },
  });

  const viewBox = calculateViewBox(
    paletteItemSize.width / paletteItemSize.height,
    info.boundingBox
  );

  const [overlayTransform, setOverlayTransform] = useState<string>();
  useEffect(() => {
    if (isDragging) {
      if (activatorEvent instanceof PointerEvent && node.current !== null) {
        const rect = node.current.getBoundingClientRect();
        const x = activatorEvent.clientX - rect.left;
        const y = activatorEvent.clientY - rect.top;
        dragOffset.current = { x, y };
        setOverlayTransform(`translate(${x}px,${y}px)`);
      }
    } else {
      setOverlayTransform(undefined);
    }
  }, [isDragging, activatorEvent, node]);

  return (
    <>
      <div className="widget" ref={setNodeRef} {...listeners} {...attributes}>
        <svg
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          width={paletteItemSize.width + "px"}
          height={paletteItemSize.height + "px"}
        >
          {widget.renderContent()}
        </svg>
        <div style={{ textAlign: "center", fontWeight: "bold" }}>
          {widget.label}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {!isDragging ? null : (
          <svg
            style={{ transform: overlayTransform }}
            viewBox={`${info.boundingBox.x} ${info.boundingBox.y} ${info.boundingBox.width} ${info.boundingBox.height}`}
            width={editorProjection.lengthToView(info.boundingBox.width) + "px"}
            height={
              editorProjection.lengthToView(info.boundingBox.height) + "px"
            }
          >
            {widget.renderContent()}
          </svg>
        )}
      </DragOverlay>
    </>
  );
}

export const Palette = memo(function Palette({
  editorProjection,
  dragOffset,
}: {
  editorProjection: CanvasProjection;
  dragOffset: RefObject<{ x: number; y: number }>;
}) {
  const widgets = useMemo(() => {
    let nextId = 1;

    const items: PageItemData[] = pageItemTypeRegistry.palette.map((type) => ({
      id: nextId,
      type: type.key,
    }));

    const projectData: ProjectData = {
      currentPageId: nextId,
      pages: [
        {
          id: nextId++,
          name: "Page 1",
          propertyValues: {},
          overrideableProperties: {},
          items,
        },
      ],
      nextId: nextId++,
    };

    const project = new Project(projectData, () => {});
    const page = project.currentPage!;
    return (page.ownItems as Widget[]).map((widget) => ({
      info: widget.palette(),
      widget,
    }));
  }, []);

  return (
    <>
      {widgets.map(({ widget, info }, idx) => (
        <div key={idx}>
          <PaletteEntry
            widget={widget}
            info={info}
            editorProjection={editorProjection}
            idx={idx}
            dragOffset={dragOffset}
          />
        </div>
      ))}
    </>
  );
});
