import {
  HorizontalSnapBox,
  SnapBoxesArgs,
  VerticalSnapBox,
} from "@/model/PageItem";
import { icons } from "@/util/utils";
import {
  PageReferenceProperty,
  SelectProperty,
  StringProperty,
} from "../model/PageItemProperty";
import { PositionWidget, Rectangle } from "./Widget";
import { PageLink, WidgetIcon } from "./WidgetHelpers";
import { snapConfiguration, widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

export const margin = widgetTheme.margin;

export class CheckboxWidget extends PositionWidget {
  label = "Checkbox";

  text = new StringProperty(this, "label", "Label", "Enabled");
  state = new SelectProperty(
    this,
    "state",
    "State",
    () => [
      ["unchecked", "Unchecked"],
      ["indeterminate", "Indeterminate"],
      ["checked", "Checked"],
    ],
    "unchecked"
  );
  link = new PageReferenceProperty(this, "link", "Link");

  get boundingBox(): Rectangle {
    return {
      ...this.position,
      width: Math.max(
        100,
        getTextWidth(this.text.get()) + 3 * margin + widgetTheme.fontSize
      ),
      height: widgetTheme.fontSize + 2 * margin,
    };
  }

  renderContent(): React.ReactNode {
    const box = this.boundingBox;
    let icon: number;
    switch (this.state.get()) {
      case "checked":
        icon = icons["x-square"];
        break;
      case "indeterminate":
        icon = icons["dash-square"];
        break;
      case "unchecked":
        icon = icons["square"];
        break;
      default:
        icon = 0;
    }
    return (
      <>
        {/* <rect {...widgetRectAttrs} {...box} /> */}
        <text
          x={box.x + widgetTheme.fontSize + 2 * widgetTheme.margin}
          y={box.y + box.height - margin - 2}
          fontSize={widgetTheme.fontSize}
          textAnchor="left"
        >
          {this.text.get()}
        </text>
        <WidgetIcon
          x={box.x + widgetTheme.margin}
          y={box.y + box.height - margin}
          size={widgetTheme.fontSize}
          nr={icon}
        />
        <PageLink {...box} pageId={this.link.get().pageId} />
      </>
    );
  }
  override getSnapBoxes(args: SnapBoxesArgs) {
    const box = this.boundingBox;
    const config = snapConfiguration;
    args.horizontal.push(
      new HorizontalSnapBox(
        box.x - config.snapSideLength,
        box.y,
        box.width + 2 * config.snapSideLength,
        config.snapRange
      )
    );
    args.horizontal.push(
      new HorizontalSnapBox(
        box.x - config.snapSideLength,
        box.y + box.height,
        box.width + 2 * config.snapSideLength,
        config.snapRange
      )
    );
    args.vertical.push(
      new VerticalSnapBox(
        box.x,
        box.y - config.snapSideLength,
        box.height + 2 * config.snapSideLength,
        config.snapRange
      )
    );
    args.vertical.push(
      new VerticalSnapBox(
        box.x + box.width,
        box.y - config.snapSideLength,
        box.height + 2 * config.snapSideLength,
        config.snapRange
      )
    );
  }

  initializeAfterAdd(): void {}
}
