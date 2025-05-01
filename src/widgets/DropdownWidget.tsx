import {
  HorizontalSnapBox,
  HorizontalSnapReference,
  SnapBoxesArgs,
  SnapReferencesArgs,
} from "@/model/PageItem";
import { MemoValue, StringProperty } from "@/model/PageItemProperty";
import { Fragment } from "react";
import { margin } from "./ButtonWidget";
import { WidthWidget } from "./Widget";
import { WidgetBounds } from "./WidgetHelpers";
import { snapConfiguration, widgetRectAttrs, widgetTheme } from "./widgetTheme";
import { triangleDown } from "./widgetUtils";

abstract class DropdownWidgetBase extends WidthWidget {
  label = "Dropdown";

  labelText = new StringProperty(this, "label", "Label", "Color");
  text = new StringProperty(this, "text", "Text", "Blue").textArea();

  items = new MemoValue(() => this.text.get().split("\n"), [this.text]);
  private advance = widgetTheme.fontSize + margin;

  get isCombobox() {
    return false;
  }

  renderContent(): React.ReactNode {
    const box = this.boundingBox;
    const label = this.labelText.get();
    const hasLabel = label.length > 0;

    const items = this.items.value;
    const fontSize = widgetTheme.fontSize;

    return (
      <>
        {items.length > 1 && (
          <rect {...widgetRectAttrs} {...box} height={box.height} fill="none" />
        )}
        {this.isCombobox ? (
          <>
            <WidgetBounds box={{ ...box, height: fontSize + 2 * margin }}>
              <rect
                {...widgetRectAttrs}
                x={box.x + box.width - 22}
                width={22}
                y={box.y}
                rx={undefined}
                height={fontSize + 2 * margin}
                fill={widgetTheme.selectedGray}
              />
            </WidgetBounds>
          </>
        ) : (
          <rect
            {...widgetRectAttrs}
            {...box}
            height={fontSize + 2 * margin}
            fill={widgetTheme.selectedGray}
          />
        )}
        {items.length > 0 && (
          <text
            x={box.x + margin}
            y={box.y + margin + fontSize - 2}
            fontSize={widgetTheme.fontSize}
          >
            {this.extractText(items[0])}
          </text>
        )}
        {hasLabel && (
          <text x={box.x} y={box.y - 4} fontSize={fontSize}>
            {label}
          </text>
        )}
        {triangleDown(
          box.x + box.width - margin - 8,
          box.y + margin + fontSize - 2
        )}

        {items.slice(1).map((item, idx) => {
          const y = box.y + fontSize + 2 * margin + this.advance * idx;
          return (
            <Fragment key={idx}>
              {this.isSelected(item) && (
                <rect
                  x={box.x}
                  y={y}
                  width={box.width}
                  height={this.advance}
                  stroke={widgetTheme.selectedBlue}
                  strokeWidth={widgetTheme.strokeWidth}
                  fill={widgetTheme.selectedBlue}
                  // rx={widgetTheme.rx}
                />
              )}
              <text
                x={box.x + margin}
                y={y + margin / 2 + fontSize - 2}
                fontSize={fontSize}
              >
                {this.extractText(item)}
              </text>
            </Fragment>
          );
        })}
      </>
    );
  }

  get height(): number {
    return (
      widgetTheme.fontSize +
      2 * margin +
      Math.max(0, this.items.value.length - 1) * this.advance
    );
  }

  override initializeAfterAdd(): void {
    this.box = {
      x: 0,
      y: 0,
      width: 100,
      height: widgetTheme.fontSize + 2 * widgetTheme.margin,
    };
  }

  override getSnapBoxes(args: SnapBoxesArgs): void {
    super.getSnapBoxes(args);
    const box = this.box;
    args.horizontal.push(
      new HorizontalSnapBox(
        box.x,
        box.y - widgetTheme.fontSize - snapConfiguration.snapMargin,
        box.width,
        "margin"
      )
    );
  }

  override getSnapReferences(args: SnapReferencesArgs): void {
    super.getSnapReferences(args);
    const box = this.box;
    args.top.push(
      new HorizontalSnapReference(
        box.x,
        box.y - widgetTheme.fontSize - snapConfiguration.snapMargin,
        box.width,
        "margin"
      )
    );
  }

  private isSelected(item: string) {
    return item.endsWith("*");
  }
  private extractText(item: string) {
    if (item.endsWith("*")) return item.substring(0, item.length - 1);
    return item;
  }
}

export class DropdownWidget extends DropdownWidgetBase {}
export class ComboboxWidget extends DropdownWidgetBase {
  label = "Combobox";
  override get isCombobox() {
    return true;
  }
}
