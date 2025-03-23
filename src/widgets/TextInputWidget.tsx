import { StringProperty } from "../model/PageItemProperty";
import { WidthWidget } from "./Widget";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";
const margin = widgetTheme.margin;

export class TextInputWidget extends WidthWidget {
  label = "Text Input";

  labelText = new StringProperty(this, "label", "Label", "Name");
  text = new StringProperty(this, "text", "Text", "Joe");

  // get boundingBox(): Rectangle {
  //   return {
  //     ...this.position,
  //     width: Math.max(100, getTextWidth(this.text.get()) + 2 * margin),
  //     height: widgetTheme.fontSize + 2 * margin,
  //   };
  // }

  renderContent(): React.ReactNode {
    const box = this.boundingBox;
    const label = this.labelText.get();
    const hasLabel = label.length > 0;

    return (
      <>
        <rect {...widgetRectAttrs} {...box} fill={"white"} />
        <text
          x={box.x + margin}
          y={box.y + box.height - margin - 2}
          fontSize={widgetTheme.fontSize}
        >
          {this.text.get()}
        </text>
        {hasLabel && (
          <text x={box.x} y={box.y - 4} fontSize={widgetTheme.fontSize}>
            {label}
          </text>
        )}
      </>
    );
  }
  override initializeAfterAdd(): void {
    this.box = {
      x: 0,
      y: 0,
      width: 100,
      height: widgetTheme.fontSize + 2 * margin,
    };
  }
}
