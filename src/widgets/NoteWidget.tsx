import { SnapBoxesArgs, SnapReferencesArgs } from "@/model/PageItem";
import { JSX } from "react";
import { StringProperty } from "../model/PageItemProperty";
import { BoxWidget } from "./Widget";
import { snapConfiguration, widgetTheme } from "./widgetTheme";

export class NoteWidget extends BoxWidget {
  label = "Note";

  text = new StringProperty(this, "text", "Text", "Note").textArea();

  override renderContent(): JSX.Element {
    const box = this.box;
    const text = this.text.get();
    const fontSize = widgetTheme.fontSize;
    const foldSize = 20; // Size of the folded corner (increased)

    return (
      <>
        {/* Main Note Body */}
        <path
          d={`M ${box.x} ${box.y}
              L ${box.x + box.width - foldSize} ${box.y}
              L ${box.x + box.width} ${box.y + foldSize}
              L ${box.x + box.width} ${box.y + box.height}
              L ${box.x} ${box.y + box.height} Z`}
          fill="yellow"
          stroke={widgetTheme.stroke}
          strokeWidth={widgetTheme.strokeWidth}
        />
        {/* Folded Corner */}
        <path
          d={`M ${box.x + box.width - foldSize} ${box.y}
              L ${box.x + box.width - foldSize} ${box.y + foldSize}
              L ${box.x + box.width} ${box.y + foldSize} Z`}
          fill="#808080"
          stroke="#808080"
          strokeWidth={1}
        />
        {/* Text */}
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
      </>
    );
  }

  override getSnapBoxes(args: SnapBoxesArgs): void {
    super.getSnapBoxes(args);
    args.addMarginBox(this.box, -snapConfiguration.snapMargin);
  }

  override getSnapReferences(args: SnapReferencesArgs): void {
    super.getSnapReferences(args);
    args.addMarginBox(this.box, -snapConfiguration.snapMargin);
  }

  override initializeAfterAdd() {
    this.box = { x: 0, y: 0, width: 150, height: 100 };
  }
}
