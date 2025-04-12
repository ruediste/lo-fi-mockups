import { SnapBoxesArgs, SnapReferencesArgs } from "@/model/PageItem";
import { IconProperty, NumberProperty } from "@/model/PageItemProperty";
import { icons } from "@/util/utils";
import { PositionWidget, Rectangle } from "./Widget";
import { widgetTheme } from "./widgetTheme";

export class IconWidget extends PositionWidget {
  label = "Icon";

  icon = new IconProperty(this, "icon", "Icon", icons["info-square"]);
  size = new NumberProperty(this, "size", "Size", widgetTheme.fontSize);

  get boundingBox(): Rectangle {
    const size = Math.max(24, this.size.get());
    return {
      ...this.position,
      width: size,
      height: size,
    };
  }
  initializeAfterAdd(): void {}
  renderContent(): React.ReactNode {
    const box = this.boundingBox;
    const nr = this.icon.get();
    const size = Math.max(10, this.size.get());
    return (
      <text
        x={box.x + (box.width - size) / 2}
        y={box.y + size + (box.height - size) / 2}
        fontFamily="bootstrap-icons"
        fontStyle="normal"
        fontWeight="normal"
        fontVariant="normal"
        fontSize={size}
        dangerouslySetInnerHTML={
          nr === null ? undefined : { __html: `&#${nr}` }
        }
      />
    );
  }

  get iconBox(): Rectangle {
    const box = this.boundingBox;
    const size = Math.max(10, this.size.get());
    return {
      x: box.x + (box.width - size) / 2,
      y: box.y + (box.height - size) / 2,
      width: size,
      height: size,
    };
  }

  override getSnapBoxes(args: SnapBoxesArgs): void {
    this.createSnapBoxes(args, this.iconBox, "both");
  }

  override getSnapReferences(args: SnapReferencesArgs): void {
    this.createSnapReferences(args, this.iconBox, "both");
  }
}
