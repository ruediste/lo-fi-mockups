import { IRectangle } from "../widgets/Widget";

export function calculateViewBox(
  targetAspectRatio: number,
  widgetBox: IRectangle
): IRectangle {
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
