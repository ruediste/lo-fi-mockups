import {
  BackgroundColorProperty,
  PageReferenceProperty,
  StringProperty,
} from "@/model/PageItemProperty";
import { JSX } from "react";
import { BoxWidget } from "./Widget";
import { PageLink } from "./WidgetHelpers";
import {
  backgroundPaletteMap,
  snapConfiguration,
  widgetTheme,
} from "./widgetTheme";
import { SnapBoxesArgs, SnapReferencesArgs } from "@/model/PageItem";

export class UmlNodeWidget extends BoxWidget {
  label = "UML Node";

  name = new StringProperty(this, "name", "Name", `Server`);

  stereotype = new StringProperty(this, "stereotype", "Stereotype", "");

  backgroundColor = new BackgroundColorProperty(
    this,
    "backgroundColor",
    "Background Color",
    "White"
  );

  link = new PageReferenceProperty(this, "link", "Link");

  // 3D effect depth
  private readonly depth = 16;

  override renderContent(): JSX.Element {
    const box = this.box;
    const bgColor = backgroundPaletteMap[this.backgroundColor.get()];
    const depth = this.depth;

    return (
      <>
        {/* Main front face */}
        <rect
          x={box.x}
          y={box.y + depth}
          width={box.width - depth}
          height={box.height - depth}
          fill={bgColor}
          stroke="black"
          strokeWidth={widgetTheme.strokeWidth}
        />

        {/* Top face (3D effect) */}
        <path
          d={`M ${box.x} ${box.y + depth} 
              L ${box.x + depth} ${box.y} 
              L ${box.x + box.width} ${box.y} 
              L ${box.x + box.width - depth} ${box.y + depth} 
              Z`}
          fill={bgColor}
          stroke="black"
          strokeWidth={widgetTheme.strokeWidth}
        />

        {/* Right face (3D effect) */}
        <path
          d={`M ${box.x + box.width - depth} ${box.y + depth} 
              L ${box.x + box.width} ${box.y} 
              L ${box.x + box.width} ${box.y + box.height - depth} 
              L ${box.x + box.width - depth} ${box.y + box.height} 
              Z`}
          fill={bgColor}
          stroke="black"
          strokeWidth={widgetTheme.strokeWidth}
          style={{ filter: "brightness(0.7)" }}
        />

        {/* Node stereotype (if present) */}
        {this.stereotype.get() && (
          <text
            x={box.x + (box.width - depth) / 2}
            y={box.y + depth + widgetTheme.fontSize * 0.8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={widgetTheme.fontSize * 0.9}
            fontStyle="italic"
          >
            {`<< ${this.stereotype.get()} >>`}
          </text>
        )}

        {/* Node name */}
        <text
          x={box.x + (box.width - depth) / 2}
          y={
            box.y +
            depth +
            (this.stereotype.get()
              ? widgetTheme.fontSize * 2
              : widgetTheme.fontSize)
          }
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={widgetTheme.fontSize}
          fontWeight="bold"
        >
          {this.name.get()}
        </text>

        <PageLink {...box} pageId={this.link.get().pageId} />
      </>
    );
  }

  private innerSnapBox() {
    const heightOffset =
      this.depth + widgetTheme.fontSize * (this.stereotype.get() ? 2 : 1);
    return {
      x: this.box.x,
      y: this.box.y + heightOffset,
      width: this.box.width - this.depth,
      height: this.box.height - heightOffset,
    };
  }

  override getSnapBoxes(args: SnapBoxesArgs): void {
    super.getSnapBoxes(args);
    args.addMarginBox(this.innerSnapBox(), -snapConfiguration.snapMargin);
  }

  override getSnapReferences(args: SnapReferencesArgs): void {
    super.getSnapReferences(args);
    args.addMarginBox(this.innerSnapBox(), -snapConfiguration.snapMargin);
  }

  initializeAfterAdd(): void {
    this.box = { x: 0, y: 0, width: 150, height: 100 };
  }
}
