import { SnapBoxesArgs, SnapReferencesArgs } from "@/model/PageItem";
import { icons } from "@/util/utils";
import { JSX } from "react";
import { StringProperty } from "../model/PageItemProperty";
import { WidthWidget } from "./Widget";
import { WidgetBounds, WidgetIcon } from "./WidgetHelpers";
import { widgetTheme } from "./widgetTheme";

export class CollapsedCardWidget extends WidthWidget {
  label = "Collapsed Card";

  title = new StringProperty(this, "title", "Title", "Card");

  override renderContent(): JSX.Element {
    const box = this.box;
    const title = this.title.get();
    const fontSize = widgetTheme.fontSize;
    const headerHeight = fontSize + 16; // Title text + padding

    return (
      <WidgetBounds box={box}>
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={headerHeight}
          fill="white"
        />
        <text
          x={box.x + 8}
          y={box.y + headerHeight / 2 + fontSize / 2 - 2}
          fontSize={fontSize}
          alignmentBaseline="baseline"
        >
          {title}
        </text>
        <WidgetIcon
          x={box.x + box.width - 24}
          y={box.y + headerHeight - 10}
          size={16}
          nr={icons["chevron-down"]}
        />
      </WidgetBounds>
    );
  }

  override getSnapBoxes(args: SnapBoxesArgs): void {
    super.getSnapBoxes(args);
  }

  override getSnapReferences(args: SnapReferencesArgs): void {
    super.getSnapReferences(args);
  }

  get height(): number {
    return widgetTheme.fontSize + 16;
  }

  override initializeAfterAdd() {
    this.box = { x: 0, y: 0, width: 200, height: this.height };
  }
}
