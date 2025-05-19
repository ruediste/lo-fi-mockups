import { CheckboxProperty, RangeProperty } from "@/model/PageItemProperty";
import { JSX } from "react";
import { WidthWidget } from "./Widget";
import { WidgetBounds } from "./WidgetHelpers";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";

const ARROW_WIDTH = 15;

export class HorizontalScrollBarWidget extends WidthWidget {
  label = "H Scroll Bar";

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

    // Calculate thumb position and width
    const trackWidth = box.width - 2 * ARROW_WIDTH;
    const thumbWidth = (trackWidth * size) / 100;
    const thumbX =
      box.x + ARROW_WIDTH + ((trackWidth - thumbWidth) * position) / 100;

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

        <path
          d="m 5 10 l 5 -4 l 0 8 z"
          fill="#808080"
          transform={`translate(${box.x}, ${box.y})`}
        />

        <path
          d="m 10 10 l -5 -4 l 0 8 z"
          fill="#808080"
          transform={`translate(${box.x + box.width - ARROW_WIDTH}, ${box.y})`}
        />

        {!showWithoutPosition && (
          <rect
            x={thumbX}
            y={box.y + 2}
            width={thumbWidth}
            height={box.height - 4}
            fill="#808080"
            rx="8"
            ry="8"
          />
        )}
      </WidgetBounds>
    );
  }

  get height(): number {
    return 20;
  }

  override initializeAfterAdd() {
    this.box = { x: 0, y: 0, width: 200, height: this.height };
  }
}
