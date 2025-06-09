import {
  MemoValue,
  PageReferenceProperty,
  StringProperty,
} from "@/model/PageItemProperty";
import { parseDataGridContents } from "./DataGridWidgetHelper";
import { BoxWidget } from "./Widget";
import { PageLink, WidgetBounds } from "./WidgetHelpers";
import { widgetTheme } from "./widgetTheme";

export class DataGridWidget extends BoxWidget {
  label = "Data Grid";

  contentsText = new StringProperty(
    this,
    "contents",
    "Grid Contents",
    `!
h\tFirst Name\tLast Name
\tJoe\tDoe`
  )
    .textArea()
    .acceptTabs();

  contents = new MemoValue(
    () => parseDataGridContents(this.contentsText.get()),
    [this.contentsText]
  );

  link = new PageReferenceProperty(this, "link", "Link");

  renderContent(): React.ReactNode {
    const box = this.box;
    const contents = this.contents.value;
    return (
      <WidgetBounds box={box}>
        <foreignObject {...box}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: contents.columns
                .map((c) => c.size)
                .join(" "),
              gridTemplateRows: contents.rows.map((c) => c.size).join(" "),
            }}
            {...{ xmlns: "http://www.w3.org/1999/xhtml" }}
          >
            {contents.rows.flatMap((row, rowIdx) =>
              row.cells.map((cell, columnIdx) => (
                <div
                  key={`${rowIdx}-${columnIdx}`}
                  style={{
                    backgroundColor:
                      row.isHeading || contents.columns[columnIdx].isHeading
                        ? widgetTheme.selectedGray
                        : row.isSelected
                        ? widgetTheme.selectedBlue
                        : undefined,
                    borderWidth: widgetTheme.strokeWidth + "px",
                    borderColor: widgetTheme.stroke,
                    borderStyle: "solid",
                    borderTop: rowIdx > 0 ? "none" : undefined,
                    borderRight: columnIdx > 0 ? "none" : undefined,
                    paddingLeft: "4px",
                    paddingRight: "4px",
                    minHeight: cell.text === "" ? "1.56em" : undefined,
                  }}
                >
                  {cell.text}
                </div>
              ))
            )}
          </div>
        </foreignObject>
        <PageLink {...box} pageId={this.link.get().pageId} />
      </WidgetBounds>
    );
  }

  initializeAfterAdd(): void {
    this.box = { x: 0, y: 0, width: 150, height: 80 };
  }
}
