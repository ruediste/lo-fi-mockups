import React from "react";
import { ExtensibleItemListProperty } from "../model/ItemListProperty";
import { IRectangle, PositionWidget } from "./Widget";
import { PageLink } from "./WidgetHelpers";
import { widgetTheme } from "./widgetTheme";
import { getTextWidth } from "./widgetUtils";

interface BreadcrumbLayout {
  totalWidth: number;
  elements: {
    type: "item" | "separator";
    id?: string | number; // for items
    x: number;
    width: number;
  }[];
}

export class BreadcrumbWidget extends PositionWidget {
  label = "Breadcrumb";
  private layout!: BreadcrumbLayout;

  itemList = new ExtensibleItemListProperty(this, "items", "Items");

  override initialize(): void {
    super.initialize();
    this.itemList.valueChanged.subscribe(
      () => (this.layout = this.calculateBreadcrumbLayout())
    );
    this.layout = this.calculateBreadcrumbLayout();
  }

  get boundingBox(): IRectangle {
    return {
      ...this.position,
      width: Math.max(20, this.layout.totalWidth),
      height: widgetTheme.fontSize + 4,
    };
  }

  renderContent(): React.ReactNode {
    const layout = this.calculateBreadcrumbLayout();
    const renderedItems: React.ReactNode[] = [];
    const y = this.position.y;

    layout.elements.forEach((element, index) => {
      if (element.type === "item") {
        const item = this.itemList
          .getAll()
          .find((item) => item.id === element.id);
        if (item) {
          renderedItems.push(
            <text
              key={element.id}
              x={this.position.x + element.x}
              y={y + widgetTheme.fontSize}
              fontSize={widgetTheme.fontSize}
              fill={item.link ? "blue" : "black"} // Basic styling: blue if linked
            >
              {item.label}
            </text>
          );

          if (item.link) {
            renderedItems.push(
              <PageLink
                key={`link-${element.id}`}
                x={this.position.x + element.x}
                y={y}
                width={element.width}
                height={widgetTheme.fontSize + 4} // Adjust height as needed
                pageId={item.link}
              />
            );
          }
        }
      } else if (element.type === "separator") {
        renderedItems.push(
          <text
            key={`separator-${index}`} // Use index for separator key as they don't have IDs
            x={this.position.x + element.x + 4}
            y={y + widgetTheme.fontSize}
            fontSize={widgetTheme.fontSize}
            fill="gray" // Separator color
          >
            {" > "}
          </text>
        );
      }
    });

    return <>{renderedItems}</>;
  }

  private calculateBreadcrumbLayout(): BreadcrumbLayout {
    const items = this.itemList.getAll();
    let currentX = 0;
    const separatorWidth = getTextWidth(" > ", widgetTheme.fontSize);
    const elements: BreadcrumbLayout["elements"] = [];

    items.forEach((item, index) => {
      const textWidth = getTextWidth(item.label, widgetTheme.fontSize);
      elements.push({
        type: "item",
        id: item.id,
        x: currentX,
        width: textWidth,
      });
      currentX += textWidth;

      if (index < items.length - 1) {
        elements.push({
          type: "separator",
          x: currentX,
          width: separatorWidth,
        });
        currentX += separatorWidth;
      }
    });

    return { totalWidth: currentX, elements };
  }

  override initializeAfterAdd() {
    this.itemList.set([
      {
        id: this.nextId(),
        label: "Parent",
      },
      {
        id: this.nextId(),
        label: "Child",
      },
    ]);
  }
}
