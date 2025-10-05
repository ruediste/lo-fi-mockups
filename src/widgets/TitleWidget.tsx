import { StringProperty } from "../model/PageItemProperty";
import { IRectangle, PositionWidget } from "./Widget";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

const margin = 8;
export class TitleWidget extends PositionWidget {
  label = "Title";

  text = new StringProperty(this, "text", "Text", "Title");

  private get fontSize() {
    return widgetTheme.fontSize * 2;
  }

  get boundingBox(): IRectangle {
    return {
      ...this.position,
      width: getTextWidth(this.text.get(), this.fontSize) + 2 * margin,
      height: this.fontSize + 2 * margin,
    };
  }

  renderContent(): React.ReactNode {
    const box = this.boundingBox;
    const text = this.text.get();
    return (
      <>
        <text
          x={box.x + box.width / 2}
          y={box.y + box.height - margin - 2}
          fontSize={this.fontSize}
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
