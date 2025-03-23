import { SVGAttributes, useId } from "react";
import { CanvasProjection } from "../Canvas";
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
