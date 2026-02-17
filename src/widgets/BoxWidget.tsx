import { SnapBoxesArgs, SnapReferencesArgs } from "@/model/PageItem";
import { JSX } from "react";
import {
  BackgroundColorProperty,
  getLineDashArray,
  lineStyleProperty,
  PageReferenceProperty,
  SelectProperty,
  SelectPropertyOption,
  StringProperty,
} from "../model/PageItemProperty";
import { BoxWidget as BaseBoxWidget } from "./Widget";
import { PageLink } from "./WidgetHelpers";
import {
  backgroundPaletteMap,
  snapConfiguration,
  widgetTheme,
} from "./widgetTheme";

type HorizontalAlignment = "Left" | "Center" | "Right";
type VerticalAlignment = "Top" | "Middle" | "Bottom";

const HORIZONTAL_ALIGNMENT_OPTIONS: SelectPropertyOption<HorizontalAlignment>[] =
  (["Left", "Center", "Right"] as const).map((x) => ({
    value: x,
    label: x,
  }));

const VERTICAL_ALIGNMENT_OPTIONS: SelectPropertyOption<VerticalAlignment>[] = (
  ["Top", "Middle", "Bottom"] as const
).map((x) => ({
  value: x,
  label: x,
}));

export class BoxWidget extends BaseBoxWidget {
  label = "Box";

  text = new StringProperty(this, "text", "Text", "").textArea().autoIndent();

  backgroundColor = new BackgroundColorProperty(
    this,
    "backgroundColor",
    "Background Color",
    "White",
  );

  lineStyle = lineStyleProperty(this, "lineStyle");

  horizontalAlignment = new SelectProperty<HorizontalAlignment>(
    this,
    "horizontalAlignment",
    "Horizontal Alignment",
    () => HORIZONTAL_ALIGNMENT_OPTIONS,
    "Left",
  )
    .buttonGroup()
    .noLabel();

  verticalAlignment = new SelectProperty<VerticalAlignment>(
    this,
    "verticalAlignment",
    "Vertical Alignment",
    () => VERTICAL_ALIGNMENT_OPTIONS,
    "Top",
  )
    .buttonGroup()
    .noLabel();

  link = new PageReferenceProperty(this, "link", "Link");

  override renderContent(): JSX.Element {
    const box = this.box;
    const text = this.text.get();
    const bgColor = backgroundPaletteMap[this.backgroundColor.get()];
    const lineDashArray = getLineDashArray(this.lineStyle.get() || "Normal");
    const hAlign = this.horizontalAlignment.get();
    const vAlign = this.verticalAlignment.get();
    const fontSize = widgetTheme.fontSize;
    const padding = 8;

    // Calculate text position based on alignment
    const textX = (() => {
      switch (hAlign) {
        case "Left":
          return box.x + padding;
        case "Center":
          return box.x + box.width / 2;
        case "Right":
          return box.x + box.width - padding;
        default:
          return box.x + padding;
      }
    })();

    const textAnchor = (() => {
      switch (hAlign) {
        case "Left":
          return "start";
        case "Center":
          return "middle";
        case "Right":
          return "end";
        default:
          return "start";
      }
    })();

    const lines = text.split("\n");
    const totalTextHeight = lines.length * fontSize + (lines.length - 1) * 2;

    const startY = (() => {
      switch (vAlign) {
        case "Top":
          return box.y + padding + fontSize;
        case "Middle":
          return box.y + (box.height - totalTextHeight) / 2 + fontSize;
        case "Bottom":
          return box.y + box.height - totalTextHeight - padding + fontSize;
        default:
          return box.y + padding + fontSize;
      }
    })();

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
          strokeDasharray={lineDashArray}
        />
        {text && (
          <text
            css={{ whiteSpace: "pre" }}
            x={textX}
            y={startY}
            fontSize={fontSize}
            textAnchor={textAnchor}
            alignmentBaseline="hanging"
          >
            {lines.map((line, index) => (
              <tspan key={index} x={textX} dy={index === 0 ? 0 : fontSize + 2}>
                {line === "" ? " " : line}
              </tspan>
            ))}
          </text>
        )}
        <PageLink {...box} pageId={this.link.get().pageId} />
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
    this.box = { x: 0, y: 0, width: 100, height: 60 };
  }
}
