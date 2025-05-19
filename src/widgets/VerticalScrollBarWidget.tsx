import { CheckboxProperty, RangeProperty } from "@/model/PageItemProperty";
import { JSX } from "react";
import { HeightWidget } from "./Widget";
import { WidgetBounds } from "./WidgetHelpers";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";

const ARROW_HEIGHT = 15;

export class VerticalScrollBarWidget extends HeightWidget {
  label = "V Scroll Bar";

  position = new RangeProperty(this, "position", "Position", 0, 0, 100);
  size = new RangeProperty(this, "size", "Size", 10, 10, 100);
  showWithoutPosition = new CheckboxProperty(
    this,
    "showWithoutPosition",
    "Show without position",
    false
  );

  override renderContent(): JSX.Element {
    const box = this.box;
    const position = this.position.get();
    const size = this.size.get();
    const showWithoutPosition = this.showWithoutPosition.get();

    // Calculate thumb position and height
    const trackHeight = box.height - 2 * ARROW_HEIGHT;
    const thumbHeight = (trackHeight * size) / 100;
    const thumbY =
      box.y + ARROW_HEIGHT + ((trackHeight - thumbHeight) * position) / 100;

    return (
      <WidgetBounds box={box}>
        {/* Scroll bar track */}
        <rect
          {...widgetRectAttrs}
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill={widgetTheme.selectedGray}
        />

        {/* Up arrow */}
        <path
          d="m 10 5 l -4 5 l 8 0 z"
          fill="#808080"
          transform={`translate(${box.x}, ${box.y})`}
        />

        {/* Down arrow */}
        <path
          d="m 10 10 l -4 -5 l 8 0 z"
          fill="#808080"
          transform={`translate(${box.x}, ${
            box.y + box.height - ARROW_HEIGHT
          })`}
        />

        {!showWithoutPosition && (
          <rect
            x={box.x + 2}
            y={thumbY}
            width={box.width - 4}
            height={thumbHeight}
            fill="#808080"
            rx="8"
            ry="8"
          />
        )}
      </WidgetBounds>
    );
  }

  get width(): number {
    return 20;
  }

  override initializeAfterAdd() {
    this.box = { x: 0, y: 0, width: this.width, height: 200 };
  }
}
