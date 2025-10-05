import { StringProperty } from "../model/PageItemProperty";
import { IRectangle, PositionWidget } from "./Widget";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

const margin = 8;
export class LabelWidget extends PositionWidget {
  label = "Label";

  text = new StringProperty(this, "text", "Text", "Name");

  get boundingBox(): IRectangle {
    return {
      ...this.position,
      width: getTextWidth(this.text.get()) + 2 * margin,
      height: widgetTheme.fontSize,
    };
  }

  renderContent(): React.ReactNode {
    const box = this.boundingBox;
    const text = this.text.get();
    return (
      <>
        <text
          x={box.x + box.width / 2}
          y={box.y + box.height - 2}
          fontSize={widgetTheme.fontSize}
          textAnchor="middle"
        >
          {text}
        </text>
        {text.length == 0 && (
          <rect {...widgetRectAttrs} {...box} fill="transparent" />
        )}
      </>
    );
  }
  initializeAfterAdd(): void {}
}
