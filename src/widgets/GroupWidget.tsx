import { SnapBoxesArgs, SnapReferencesArgs } from "@/model/PageItem";
import { StringProperty } from "@/model/PageItemProperty";
import { JSX } from "react";
import { BoxWidget } from "./Widget";
import { snapConfiguration, widgetRectAttrs, widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

export class GroupWidget extends BoxWidget {
  label = "Group";

  title = new StringProperty(this, "title", "Title", "Group");

  override renderContent(): JSX.Element {
    const box = this.box;
    const title = this.title.get();
    const fontSize = widgetTheme.fontSize;

    return (
      <>
        <rect {...widgetRectAttrs} fill="none" {...box} />

        {/* Add white background for text */}
        {title && (
          <rect
            x={box.x + 8 - 4}
            y={box.y - fontSize / 2}
            width={getTextWidth(title, fontSize) + 8}
            height={fontSize + 4}
            fill="white"
          />
        )}
        <text
          x={box.x + 8}
          y={box.y + fontSize / 2 - 2}
          fontSize={fontSize}
          alignmentBaseline="baseline"
          fontWeight="bolder"
        >
          {title}
        </text>
      </>
    );
  }

  private get contentBox() {
    const box = this.box;
    const headerHeight = 4;
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
