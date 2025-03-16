import { CheckboxProperty, StringProperty } from "../model/PageItemProperty";
import { PositionWidget, Rectangle } from "./Widget";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

const margin = 8;

export class ButtonWidget extends PositionWidget {
  label = "Button";

  text = new StringProperty(this, "text", "Text", "OK");
  secondary = new CheckboxProperty(this, "secondary", "Secondary", false);

  get boundingBox(): Rectangle {
    return {
      ...this.position,
      width: Math.max(100, getTextWidth(this.text.get()) + 2 * margin),
      height: widgetTheme.fontSize + 2 * margin,
    };
  }

  renderContent(): React.ReactNode {
    const box = this.boundingBox;

    return (
      <>
        <rect
          {...widgetRectAttrs}
          {...box}
          fill={this.secondary.get() ? "white" : widgetTheme.selectedGray}
        />
        <text
          x={box.x + box.width / 2}
          y={box.y + box.height - margin - 2}
          fontSize={widgetTheme.fontSize}
          textAnchor="middle"
        >
          {this.text.get()}
        </text>
      </>
    );
  }
  initializeAfterAdd(): void {}
}
