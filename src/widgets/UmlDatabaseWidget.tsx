import {
  PageReferenceProperty,
  StringProperty,
} from "@/model/PageItemProperty";
import { JSX } from "react";
import { BoxWidget } from "./Widget";
import { PageLink } from "./WidgetHelpers";
import { widgetTheme } from "./widgetTheme";

export class UmlDatabaseWidget extends BoxWidget {
  label = "UML Database";

  name = new StringProperty(this, "name", "Name", `MariaDB`);

  link = new PageReferenceProperty(this, "link", "Link");

  override renderContent(): JSX.Element {
    const box = this.box;

    const ellipseHeight = box.width / 4;
    const remainingHeight = box.height - ellipseHeight;

    return (
      <>
        {/* Cylinder Bottom */}
        <path
          d={`M ${box.x} ${box.y + ellipseHeight / 2} 
            L ${box.x} ${box.y + box.height - ellipseHeight / 2} 
            A ${box.width / 2} ${ellipseHeight / 2} 0 0 0 ${
            box.x + box.width
          } ${box.y + box.height - ellipseHeight / 2}
          L ${box.x + box.width} ${box.y + ellipseHeight / 2} `}
          fill="lightgray"
          stroke="black"
          strokeWidth={widgetTheme.strokeWidth}
        />
        {/* Cylinder Top */}
        <ellipse
          cx={box.x + box.width / 2}
          cy={box.y + ellipseHeight / 2}
          rx={box.width / 2}
          ry={ellipseHeight / 2}
          fill="lightgray"
          stroke="black"
          strokeWidth={widgetTheme.strokeWidth}
        />
        {/* place text in the middle */}
        <text
          x={box.x + box.width / 2}
          y={box.y + ellipseHeight + remainingHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={widgetTheme.fontSize}
        >
          {this.name.get()}
        </text>

        <PageLink {...box} pageId={this.link.get().pageId} />
      </>
    );
  }

  initializeAfterAdd(): void {
    this.box = { x: 0, y: 0, width: 200, height: 120 };
  }
}
