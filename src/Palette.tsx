import { useMemo, useState } from "react";
import { useDrag } from "react-dnd";
import { CanvasProjection } from "./Canvas";
import { ProjectionContext } from "./Contexts";
import { Page, ProjectData } from "./Project";

export function Palette({
  editorProjection,
}: {
  editorProjection: CanvasProjection;
}) {
  const widget = useMemo(() => {
    const data: ProjectData = {
      nextId: 3,
      currentPageIndex: 0,
      pages: [
        {
          id: 1,
          propertyValues: {},
          items: [
            {
              id: 2,
              type: "list",
            },
          ],
        },
      ],
    };

    const page = new Page(data.pages[0], data);

    return page.ownItems[0];
  }, []);

  const [projection] = useState(() => new CanvasProjection());

  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    // "type" is required. It is used by the "accept" specification of drop targets.
    type: "BOX",
    // The collect function utilizes a "monitor" instance (see the Overview for what this is)
    // to pull important pieces of state from the DnD system.
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: { value: "Hello World" },
  }));

  return (
    <>
      <ProjectionContext.Provider value={projection}>
        <div
          className="widget"
          ref={(e) => {
            drag(e);
          }}
        >
          <svg style={{ top: 0, left: 0 }}>{widget.renderContent()}</svg>
        </div>
        <div
          ref={dragPreview as any}
          style={{ visibility: isDragging ? undefined : "hidden" }}
        >
          Foo
        </div>
      </ProjectionContext.Provider>
    </>
  );
}
