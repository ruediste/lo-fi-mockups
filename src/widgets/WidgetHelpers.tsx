import { PageItemRenderContext } from "@/model/PageItem";
import { SVGAttributes, useContext, useId } from "react";
import { CanvasProjection } from "../editor/Canvas";
import { Rectangle } from "./Widget";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";

// eslint-disable-next-line react-refresh/only-export-components
export function dragPositionRectAttrs(
  projection: CanvasProjection
): SVGAttributes<SVGRectElement> {
  return {
    stroke: "#008800",
    strokeWidth: projection.lengthToWorld(0.5),
  };
}

export function PageLink({
  pageId,
  x,
  y,
  width,
  height,
}: {
  pageId?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const ctx = useContext(PageItemRenderContext);

  if (pageId === undefined) return;

  if (!ctx?.isPlay) return;
  return (
    <rect
      {...{ x, y, width, height }}
      rx={widgetTheme.rx}
      ry={widgetTheme.ry}
      css={{
        fill: "transparent",
        "&:hover": {
          fill: "green",
          opacity: 0.5,
        },
      }}
      onClick={(e) => {
        e.stopPropagation();
        ctx.openPage(pageId);
      }}
    ></rect>
  );
}

export function WidgetBounds({
  box,
  children,
}: {
  box: Rectangle;
  children?: React.ReactNode;
}) {
  const id = useId();
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect
            {...widgetRectAttrs}
            x={box.x - widgetTheme.strokeWidth / 2}
            y={box.y - widgetTheme.strokeWidth / 2}
            width={box.width + widgetTheme.strokeWidth}
            height={box.height + widgetTheme.strokeWidth}
          />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id})`}>
        <rect {...widgetRectAttrs} fill="white" {...box} />
        {children}
        <rect {...widgetRectAttrs} fill="none" {...box} />
      </g>
    </>
  );
}
