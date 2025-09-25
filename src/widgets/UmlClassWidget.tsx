import {
  MemoValue,
  PageReferenceProperty,
  StringProperty,
} from "@/model/PageItemProperty";
import { parseUmlClassWidgetContents } from "./UmlClassWidgetHelper";
import { BoxWidget } from "./Widget";
import { PageLink, WidgetBounds } from "./WidgetHelpers";

export class UmlClassWidget extends BoxWidget {
  label = "UML Class";

  contentsText = new StringProperty(
    this,
    "contents",
    "Class Contents",
    `Demo
--
id: long
`
  )
    .textArea()
    .acceptTabs();

  contents = new MemoValue(
    () => parseUmlClassWidgetContents(this.contentsText.get()),
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
            css={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              "&>div": {
                marginLeft: 4,
              },
              ".classHeader": { display: "flex", justifyContent: "center" },
              hr: { margin: 0 },
            }}
            className="umlClassWidget"
            {...{ xmlns: "http://www.w3.org/1999/xhtml" }}
          >
            {contents}
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
