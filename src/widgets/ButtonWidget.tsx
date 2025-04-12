import {
  CheckboxProperty,
  PageReferenceProperty,
  StringProperty,
} from "../model/PageItemProperty";
import { PositionWidget, Rectangle } from "./Widget";
import { PageLink } from "./WidgetHelpers";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

export const margin = widgetTheme.margin;

export class ButtonWidget extends PositionWidget {
  label = "Button";

  text = new StringProperty(this, "text", "Text", "OK");
  secondary = new CheckboxProperty(this, "secondary", "Secondary", false);
  link = new PageReferenceProperty(this, "link", "Link");

  get boundingBox(): Rectangle {
    return {
      ...this.position,
      width: Math.max(100, getTextWidth(this.text.get()) + 2 * margin),
      height: widgetTheme.fontSize + 2 * margin,
    };
  }

  renderContent(): React.ReactNode {
    const box = this.boundingBox;

    return (
      <>
        <rect
          {...widgetRectAttrs}
          {...box}
          fill={this.secondary.get() ? "white" : widgetTheme.selectedGray}
        />
        <text
          x={box.x + box.width / 2}
          y={box.y + box.height - margin - 2}
          fontSize={widgetTheme.fontSize}
          textAnchor="middle"
        >
          {this.text.get()}
        </text>
        <PageLink {...box} pageId={this.link.get().pageId} />
      </>
    );
  }

  override initialize(): void {
    this.snapMiddle = "both";
    this.snapInnerMargins = "vertical";
  }

  initializeAfterAdd(): void {}
}
