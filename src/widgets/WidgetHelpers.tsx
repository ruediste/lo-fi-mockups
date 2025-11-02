import { PageItemRenderContext } from "@/model/PageItem";
import { useContext, useId } from "react";
import { IRectangle } from "./Widget";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";

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

  if (ctx?.isExport) {
    ctx.links.push({ box: { x, y, width, height }, pageId });
  }

  if (!ctx?.isPlay) return;
  return (
    <rect
      {...{ x, y, width, height }}
      rx={widgetTheme.rx}
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
  background,
}: {
  box: IRectangle;
  children?: React.ReactNode;
  background?: string;
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
        <rect {...widgetRectAttrs} fill={background ?? "white"} {...box} />
        {children}
        <rect {...widgetRectAttrs} fill="none" {...box} />
      </g>
    </>
  );
}

export function WidgetIcon({
  size,
  x,
  y,
  nr,
}: {
  size: number;
  x: number;
  y: number;
  nr: number | null;
}) {
  return (
    <text
      x={x}
      y={y}
      fontFamily="bootstrap-icons"
      fontStyle="normal"
      fontWeight="normal"
      fontVariant="normal"
      fontSize={size}
      dangerouslySetInnerHTML={nr === null ? undefined : { __html: `&#${nr}` }}
    />
  );
}
