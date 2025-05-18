import { SnapBoxesArgs, SnapReferencesArgs } from "@/model/PageItem";
import { icons } from "@/util/utils";
import { JSX } from "react";
import { StringProperty } from "../model/PageItemProperty";
import { BoxWidget } from "./Widget";
import { WidgetBounds, WidgetIcon } from "./WidgetHelpers";
import { snapConfiguration, widgetTheme } from "./widgetTheme";

export class ExpandedCardWidget extends BoxWidget {
  label = "Expanded Card";

  title = new StringProperty(this, "title", "Title", "Card");

  override renderContent(): JSX.Element {
    const box = this.box;
    const title = this.title.get();
    const fontSize = widgetTheme.fontSize;
    const headerHeight = fontSize + 16; // Title text + padding

    return (
      <WidgetBounds box={box}>
        {/* Header */}
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={headerHeight}
          fill={widgetTheme.selectedGray}
        />
        <text
          x={box.x + 8}
          y={box.y + headerHeight / 2 + fontSize / 2 - 2}
          fontSize={fontSize}
          alignmentBaseline="baseline"
        >
          {title}
        </text>
        {/* Icon */}
        <WidgetIcon
          x={box.x + box.width - 24}
          y={box.y + headerHeight - 10}
          size={16}
          nr={icons["chevron-up"]}
        />

        {/* Content Area */}
        <rect
          x={this.contentBox.x}
          y={this.contentBox.y}
          width={this.contentBox.width}
          height={this.contentBox.height}
          fill="white"
        />
      </WidgetBounds>
    );
  }

  private get contentBox() {
    const box = this.box;
    const headerHeight = widgetTheme.fontSize + 16;
    return {
      x: box.x,
      y: box.y + headerHeight,
      width: box.width,
      height: box.height - headerHeight,
    };
  }

  override getSnapBoxes(args: SnapBoxesArgs): void {
    super.getSnapBoxes(args);
    args.addMarginBox(this.contentBox, -snapConfiguration.snapMargin);
  }

  override getSnapReferences(args: SnapReferencesArgs): void {
    super.getSnapReferences(args);
    args.addMarginBox(this.contentBox, -snapConfiguration.snapMargin);
  }

  override initializeAfterAdd() {
    this.box = { x: 0, y: 0, width: 200, height: 150 };
  }
}
