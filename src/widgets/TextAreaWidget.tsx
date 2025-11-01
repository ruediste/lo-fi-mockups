import {
  HorizontalSnapBox,
  HorizontalSnapReference,
  SnapBoxesArgs,
  SnapReferencesArgs,
} from "@/model/PageItem";
import { StringProperty } from "../model/PageItemProperty";
import { BoxWidget } from "./Widget";
import { snapConfiguration, widgetRectAttrs, widgetTheme } from "./widgetTheme";
const margin = widgetTheme.margin;

export class TextAreaWidget extends BoxWidget {
  label = "Text Area";

  labelText = new StringProperty(this, "label", "Label", "Description");
  text = new StringProperty(this, "text", "Text", "Lorem ipsum").textArea();

  renderContent(): React.ReactNode {
    const box = this.boundingBox;
    const label = this.labelText.get();
    const hasLabel = label.length > 0;
    const text = this.text.get();
    const fontSize = widgetTheme.fontSize;

    // Resize grip lines in bottom right corner
    const gripSize = 12;
    const gripOffset = 2;
    const bottomRight = {
      x: box.x + box.width - gripOffset,
      y: box.y + box.height - gripOffset,
    };

    return (
      <>
        <rect {...widgetRectAttrs} {...box} fill={"white"} />
        <text x={box.x + 8} fontSize={fontSize} alignmentBaseline="hanging">
          {text.split("\n").map((line, index) => (
            <tspan
              key={index}
              x={box.x + 8}
              y={box.y + fontSize + 4 + index * fontSize}
            >
              {line}
            </tspan>
          ))}
        </text>
        {hasLabel && (
          <text x={box.x} y={box.y - 4} fontSize={widgetTheme.fontSize}>
            {label}
          </text>
        )}
        {/* Resize grip indicator - diagonal lines */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={bottomRight.x - gripSize + i * 3}
            y1={bottomRight.y}
            x2={bottomRight.x}
            y2={bottomRight.y - gripSize + i * 3}
            stroke="#999"
            strokeWidth="1"
          />
        ))}
      </>
    );
  }

  override initializeAfterAdd(): void {
    this.box = {
      x: 0,
      y: 0,
      width: 120,
      height: 50,
    };
  }

  get height(): number {
    return widgetTheme.fontSize + 2 * widgetTheme.margin;
  }

  override getSnapBoxes(args: SnapBoxesArgs): void {
    super.getSnapBoxes(args);
    const box = this.box;
    args.horizontal.push(
      new HorizontalSnapBox(
        box.x,
        box.y - widgetTheme.fontSize - snapConfiguration.snapMargin,
        box.width,
        "margin"
      )
    );
  }
  override getSnapReferences(args: SnapReferencesArgs): void {
    super.getSnapReferences(args);
    const box = this.box;
    args.top.push(
      new HorizontalSnapReference(
        box.x,
        box.y - widgetTheme.fontSize - snapConfiguration.snapMargin,
        box.width,
        "margin"
      )
    );
  }
}
