import {
  PageReferenceProperty,
  SelectProperty,
  StringProperty,
} from "../model/PageItemProperty";
import { PositionWidget, Rectangle } from "./Widget";
import { PageLink } from "./WidgetHelpers";
import { widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

export const margin = widgetTheme.margin;

export class RadioButtonWidget extends PositionWidget {
  label = "RadioButton";

  text = new StringProperty(this, "label", "Label", "Enabled");
  state = new SelectProperty(
    this,
    "state",
    "State",
    () => [
      ["unselected", "Unselected"],
      ["selected", "Selected"],
    ],
    "unselected"
  );
  link = new PageReferenceProperty(this, "link", "Link");

  get boundingBox(): Rectangle {
    return {
      ...this.position,
      width: Math.max(
        100,
        getTextWidth(this.text.get()) + 3 * margin + widgetTheme.fontSize
      ),
      height: widgetTheme.fontSize,
    };
  }

  renderContent(): React.ReactNode {
    const box = this.boundingBox;
    return (
      <>
        <text
          x={box.x + widgetTheme.fontSize + 2 * widgetTheme.margin}
          y={box.y + box.height - 2}
          fontSize={widgetTheme.fontSize}
          textAnchor="left"
        >
          {this.text.get()}
        </text>
        <circle
          cx={box.x + widgetTheme.margin + widgetTheme.fontSize / 2}
          cy={box.y + box.height - widgetTheme.fontSize / 2}
          r={widgetTheme.fontSize / 2 - 1}
          stroke="black"
          fill="none"
          strokeWidth="1"
        />
        {this.state.get() === "selected" && (
          <circle
            cx={box.x + widgetTheme.margin + widgetTheme.fontSize / 2}
            cy={box.y + box.height - widgetTheme.fontSize / 2}
            r={widgetTheme.fontSize / 4}
            fill="black"
          />
        )}
        <PageLink {...box} pageId={this.link.get().pageId} />
      </>
    );
  }

  initializeAfterAdd(): void {}
}
