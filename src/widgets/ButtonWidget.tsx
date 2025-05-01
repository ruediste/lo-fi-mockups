import {
  CheckboxProperty,
  IconProperty,
  PageReferenceProperty,
  StringProperty,
} from "../model/PageItemProperty";
import { PositionWidget, Rectangle } from "./Widget";
import { PageLink, WidgetIcon } from "./WidgetHelpers";
import { widgetRectAttrs, widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

export const margin = widgetTheme.margin;

export class ButtonWidget extends PositionWidget {
  label = "Button";

  text = new StringProperty(this, "text", "Text", "OK");
  secondary = new CheckboxProperty(this, "secondary", "Secondary", false);
  link = new PageReferenceProperty(this, "link", "Link");
  icon = new IconProperty(this, "icon", "Icon", null).clearable();

  get boundingBox(): Rectangle {
    const icon = this.icon.get();
    return {
      ...this.position,
      width: Math.max(
        100,
        getTextWidth(this.text.get()) +
          2 * margin +
          (icon == null ? 0 : widgetTheme.fontSize)
      ),
      height: widgetTheme.fontSize + 2 * margin,
    };
  }

  renderContent(): React.ReactNode {
    const box = this.boundingBox;
    const icon = this.icon.get();
    return (
      <>
        <rect
          {...widgetRectAttrs}
          {...box}
          fill={this.secondary.get() ? "white" : widgetTheme.selectedGray}
        />
        <text
          x={
            box.x +
            box.width / 2 +
            (icon == null ? 0 : widgetTheme.fontSize / 2)
          }
          y={box.y + box.height - margin - 2}
          fontSize={widgetTheme.fontSize}
          textAnchor="middle"
        >
          {this.text.get()}
        </text>
        {icon != null && (
          <WidgetIcon
            x={box.x + widgetTheme.margin}
            y={box.y + box.height - margin - 2}
            size={widgetTheme.fontSize}
            nr={icon}
          />
        )}
        <PageLink {...box} pageId={this.link.get().pageId} />
      </>
    );
  }

  override initialize(): void {
    this.snapMiddle = "both";
  }

  initializeAfterAdd(): void {}
}
