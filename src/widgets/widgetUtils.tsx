import { CanvasProjection } from "@/editor/Canvas";
import { SVGAttributes } from "react";

let canvas: HTMLCanvasElement | undefined;

export function getTextWidth(
  text: string,
  size: number = 16,
  font: string = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
) {
  if (!canvas) {
    canvas = document.createElement("canvas");
  }
  const context = canvas.getContext("2d")!;
  context.font = size + "px " + font;
  const metrics = context.measureText(text);
  return metrics.width;
}

export function dragPositionRectAttrs(
  projection: CanvasProjection
): SVGAttributes<SVGRectElement> {
  return {
    stroke: "#008800",
    strokeWidth: projection.lengthToWorld(0.5),
  };
}

export function triangleDown(x: number, y: number) {
  return (
    <g transform={`translate(${x} ${y - 8})`}>
      <path fill="#aba9a9ff" strokeWidth="0" d="M0,0 L4.75,6.2 L9.5,0 z"></path>
    </g>
  );
}
