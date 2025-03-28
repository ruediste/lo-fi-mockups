import {
  HorizontalSnapBox,
  SnapBoxesArgs,
  SnapReferencesArgs,
} from "@/model/PageItem";
import { StringProperty } from "../model/PageItemProperty";
import { WidthWidget } from "./Widget";
import { snapConfiguration, widgetRectAttrs, widgetTheme } from "./widgetTheme";
const margin = widgetTheme.margin;

export class TextInputWidget extends WidthWidget {
  label = "Text Input";

  labelText = new StringProperty(this, "label", "Label", "Name");
  text = new StringProperty(this, "text", "Text", "Joe");

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
      height: widgetTheme.fontSize + 2 * widgetTheme.margin,
    };
  }

  override getSnapBoxes(args: SnapBoxesArgs): void {
    super.getSnapBoxes(args);
    const box = this.box;
    args.horizontal.push(
      new HorizontalSnapBox(
        box.x,
        box.y - widgetTheme.fontSize - snapConfiguration.snapMargin,
        box.width
      )
    );
  }
  override getSnapReferences(args: SnapReferencesArgs): void {
    super.getSnapReferences(args);
    const box = this.box;
    args.top.push({
      x: box.x,
      y: box.y - widgetTheme.fontSize,
      width: box.width,
    });
  }
}
