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
