import { useMemo } from "react";
import { useDrag } from "react-dnd";
import { CanvasProjection } from "./Canvas";
import { ProjectionContext } from "./Contexts";
import {
  Cache,
  CacheBuilder,
  PageItemData,
  PageItemPropertyValueAccessor,
} from "./Project";
import { ListWidget } from "./Widget";

export function Palette() {
  const widget = useMemo(() => {
    const cache = new Cache();

    const data: PageItemData = {
      id: 1,
      type: "list",
      propertyValues: {
        text: "foo",
        box: { x: 0, y: 0, width: 20, height: 20 },
      },
    };

    const accessor = new PageItemPropertyValueAccessor(data, (arg) => {}, []);
    return new ListWidget(data, {
      accessor,
      ctx: { inMasterPage: false },
      cb: new CacheBuilder(cache, undefined),
    });
  }, []);

  const projection = useMemo(() => new CanvasProjection(), []);

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
        <div className="widget" ref={(e) => drag(e)}>
          <svg style={{ top: 0, left: 0 }}>
            {widget.renderContent({ interaction: false })}
          </svg>
        </div>
      </ProjectionContext.Provider>
    </>
  );
}
