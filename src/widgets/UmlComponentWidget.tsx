import {
  BackgroundColorProperty,
  PageReferenceProperty,
  StringProperty,
} from "@/model/PageItemProperty";
import { JSX } from "react";
import { BoxWidget } from "./Widget";
import { PageLink } from "./WidgetHelpers";
import { backgroundPaletteMap, widgetTheme } from "./widgetTheme";

export class UmlComponentWidget extends BoxWidget {
  label = "UML Component";

  name = new StringProperty(
    this,
    "name",
    "Name",
    "<<stereotype>>\nComponent",
  ).textArea();

  backgroundColor = new BackgroundColorProperty(
    this,
    "backgroundColor",
    "Background Color",
    "White",
  );

  link = new PageReferenceProperty(this, "link", "Link");

  override renderContent(): JSX.Element {
    const box = this.box;
    const bgColor = backgroundPaletteMap[this.backgroundColor.get()];
    const lines = this.name.get().split("\n");
    const fontSize = widgetTheme.fontSize;
    const lineHeight = fontSize + 2;
    const textHeight = lines.length * lineHeight;
    const textY = box.y + (box.height - textHeight) / 2 + lineHeight / 2;

    return (
      <>
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill={bgColor}
          stroke={widgetTheme.stroke}
          strokeWidth={widgetTheme.strokeWidth}
        />
        <text
          x={box.x + box.width / 2}
          y={textY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fontWeight="bold"
        >
          {lines.map((line, index) => {
            const isStereotype = /^<<.*>>$/.test(line.trim());
            return (
              <tspan
                key={index}
                x={box.x + box.width / 2}
                dy={index === 0 ? 0 : lineHeight}
                fontWeight={isStereotype ? "normal" : "bold"}
              >
                {line || " "}
              </tspan>
            );
          })}
        </text>
        <g fill={bgColor} stroke="#222" strokeWidth={widgetTheme.strokeWidth}>
          <rect
            x={box.x + box.width - 18}
            y={box.y + 4}
            width={12}
            height={12}
          />
          <rect x={box.x + box.width - 22} y={box.y + 5} width={4} height={4} />
          <rect
            x={box.x + box.width - 22}
            y={box.y + 11}
            width={4}
            height={4}
          />
        </g>
        <PageLink {...box} pageId={this.link.get().pageId} />
      </>
    );
  }

  initializeAfterAdd(): void {
    this.box = { x: 0, y: 0, width: 150, height: 80 };
  }
}
