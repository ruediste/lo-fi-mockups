import { DragOverlay, useDraggable } from "@dnd-kit/core";
import { RefObject, useEffect, useMemo, useState } from "react";
import { CanvasProjection } from "./Canvas";
import { pageItemTypeRegistry } from "./PageItemTypeRegistry";
import { Page, ProjectData } from "./Project";
import { Rectangle, Widget, WidgetPaletteInfo } from "./Widget";

export function calculateViewBox(
  targetAspectRatio: number,
  widgetBox: Rectangle
): Rectangle {
  const boxRatio = widgetBox.width / widgetBox.height;

  let width: number;
  let height: number;
  if (targetAspectRatio > boxRatio) {
    height = widgetBox.height;
    width = targetAspectRatio * height;
  } else {
    width = widgetBox.width;
    height = width / targetAspectRatio;
  }

  return {
    x: widgetBox.x + (widgetBox.width - width) / 2,
    y: widgetBox.y + (widgetBox.height - height) / 2,
    width,
    height,
  };
}
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

export function Palette({
  editorProjection,
  dragOffset,
}: {
  editorProjection: CanvasProjection;
  dragOffset: RefObject<{ x: number; y: number }>;
}) {
  const widgets = useMemo(() => {
    let nextId = 1;
    const projectData: ProjectData = {
      currentPageIndex: 0,
      pages: [
        {
          id: nextId++,
          propertyValues: {},
          items: pageItemTypeRegistry.palette.map((type) => ({
            id: 2,
            type: type.key,
          })),
        },
      ],
      nextId: nextId++,
    };

    const page = new Page(projectData.pages[0], projectData);
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
}
