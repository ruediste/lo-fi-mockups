import {
  BackgroundColorProperty,
  PageReferenceProperty,
  StringProperty,
} from "@/model/PageItemProperty";
import { JSX } from "react";
import { IRectangle, PositionWidget } from "./Widget";
import { PageLink } from "./WidgetHelpers";
import { backgroundPaletteMap, widgetTheme } from "./widgetTheme";

export class UmlActorWidget extends PositionWidget {
  label = "UML Actor";

  name = new StringProperty(this, "name", "Name", `User`);

  backgroundColor = new BackgroundColorProperty(
    this,
    "backgroundColor",
    "Background Color",
    "White"
  );

  link = new PageReferenceProperty(this, "link", "Link");

  get boundingBox(): IRectangle {
    return {
      ...this.position,
      width: 80,
      height: 140,
    };
  }

  override renderContent(): JSX.Element {
    const box = this.boundingBox;
    const bgColor = backgroundPaletteMap[this.backgroundColor.get()];

    // Calculate proportions for the stick figure
    const centerX = box.x + box.width / 2;
    const headRadius = Math.min(box.width, box.height) / 8;
    const headY = box.y + headRadius + 10;
    const bodyHeight = box.height * 0.3;
    const bodyStartY = headY + headRadius;
    const bodyEndY = bodyStartY + bodyHeight;
    const armLength = box.width * 0.4;
    const armY = bodyStartY + bodyHeight * 0.3;
    const legLength = box.height * 0.2;
    const legStartY = bodyEndY;
    const legEndY = legStartY + legLength;
    const textY = box.y + box.height - 10;

    return (
      <>
        {/* Background rectangle */}
        <rect {...box} fill={bgColor} stroke="none" />

        {/* Head */}
        <circle
          cx={centerX}
          cy={headY}
          r={headRadius}
          fill="none"
          stroke="black"
          strokeWidth={widgetTheme.strokeWidth}
        />

        {/* Body */}
        <line
          x1={centerX}
          y1={bodyStartY}
          x2={centerX}
          y2={bodyEndY}
          stroke="black"
          strokeWidth={widgetTheme.strokeWidth}
        />

        {/* Arms */}
        <line
          x1={centerX - armLength}
          y1={armY}
          x2={centerX + armLength}
          y2={armY}
          stroke="black"
          strokeWidth={widgetTheme.strokeWidth}
        />

        {/* Left leg */}
        <line
          x1={centerX}
          y1={legStartY}
          x2={centerX - armLength * 0.7}
          y2={legEndY}
          stroke="black"
          strokeWidth={widgetTheme.strokeWidth}
        />

        {/* Right leg */}
        <line
          x1={centerX}
          y1={legStartY}
          x2={centerX + armLength * 0.7}
          y2={legEndY}
          stroke="black"
          strokeWidth={widgetTheme.strokeWidth}
        />

        {/* Label text */}
        <text
          x={centerX}
          y={textY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={widgetTheme.fontSize}
        >
          {this.name.get()}
        </text>

        <PageLink {...box} pageId={this.link.get().pageId} />
      </>
    );
  }

  initializeAfterAdd(): void {}
}
