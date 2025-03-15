import { DragOverlay, useDraggable } from "@dnd-kit/core";
import { memo, RefObject, useEffect, useMemo, useState } from "react";
import { CanvasProjection } from "./Canvas";
import { PageItemData } from "./model/PageItem";
import { Project, ProjectData } from "./model/Project";
import { calculateViewBox } from "./paletteHelper";
import { Widget } from "./Widget";
import { pageItemTypeRegistry } from "./widgets/PageItemTypeRegistry";

const paletteItemSize = { width: 120, height: 90 };

function PaletteEntry({
  widget,
  editorProjection,
  idx,
  dragOffset,
}: {
  widget: Widget;
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

  const boundingBox = widget.boundingBox();
  const viewBox = calculateViewBox(
    paletteItemSize.width / paletteItemSize.height,
    boundingBox
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
  }, [isDragging, activatorEvent, node, dragOffset]);

  return (
    <>
      <div
        style={{ display: "inline-block", margin: "4px" }}
        ref={setNodeRef}
        {...listeners}
        {...attributes}
      >
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
            viewBox={`${boundingBox.x} ${boundingBox.y} ${boundingBox.width} ${boundingBox.height}`}
            width={editorProjection.lengthToView(boundingBox.width) + "px"}
            height={editorProjection.lengthToView(boundingBox.height) + "px"}
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
    const result = page.ownItems as Widget[];
    result.forEach((w) => w.initializePalette());
    return result;
  }, []);

  return (
    <>
      {widgets.map((widget, idx) => (
        <PaletteEntry
          key={idx}
          widget={widget}
          editorProjection={editorProjection}
          idx={idx}
          dragOffset={dragOffset}
        />
      ))}
    </>
  );
});
