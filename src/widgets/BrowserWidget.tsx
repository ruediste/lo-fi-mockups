import { SnapBoxesArgs, SnapReferencesArgs } from "@/model/PageItem";
import { icons } from "@/util/utils";
import { JSX } from "react";
import { StringProperty } from "../model/PageItemProperty";
import { BoxWidget } from "./Widget";
import { WidgetBounds, WidgetIcon } from "./WidgetHelpers";
import { snapConfiguration, widgetTheme } from "./widgetTheme";

export class BrowserWidget extends BoxWidget {
  label = "Browser Window";

  title = new StringProperty(this, "title", "URL", "http://example.com");

  override renderContent(): JSX.Element {
    const box = this.box;
    const title = this.title.get();
    const headerHeight = widgetTheme.fontSize + 16; // Title text + padding

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
        {/* Navigation buttons */}
        <WidgetIcon
          x={box.x + 8}
          y={box.y + headerHeight / 2 + 8}
          size={16}
          nr={icons["arrow-left"]}
        />
        <WidgetIcon
          x={box.x + 28}
          y={box.y + headerHeight / 2 + 8}
          size={16}
          nr={icons["arrow-right"]}
        />
        <WidgetIcon
          x={box.x + 48}
          y={box.y + headerHeight / 2 + 8}
          size={16}
          nr={icons["arrow-clockwise"]}
        />
        {/* URL bar */}
        <rect
          x={box.x + 70}
          y={box.y + 8}
          width={box.width - 90}
          height={headerHeight - 16}
          fill="white"
          rx="4"
          ry="4"
        />
        <text
          x={box.x + 78}
          y={box.y + headerHeight / 2 + widgetTheme.fontSize / 2 - 2}
          fontSize={widgetTheme.fontSize}
          alignmentBaseline="baseline"
        >
          {title}
        </text>
        {/* Menu icon */}
        <WidgetIcon
          x={box.x + box.width - 18}
          y={box.y + headerHeight / 2 + 8}
          size={16}
          nr={icons["list"]}
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
    this.box = { x: 0, y: 0, width: 300, height: 225 };
  }
}
