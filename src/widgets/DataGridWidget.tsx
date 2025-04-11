import { BoxWidget } from "./Widget";
import { WidgetBounds } from "./WidgetHelpers";

export class DataGridWidget extends BoxWidget {
  label = "Data Grid";
  initializeAfterAdd(): void {}
  renderContent(): React.ReactNode {
    const box = this.box;
    return (
      <WidgetBounds box={box}>
        <foreignObject {...box}>
          <table {...{ xmlns: "http://www.w3.org/1999/xhtml" }}>
            <tbody>
              <tr>
                <th>Foo</th>
                <th>Bar</th>
              </tr>
              <tr>
                <td>Hello</td>
                <td>World</td>
              </tr>
            </tbody>
          </table>
        </foreignObject>
      </WidgetBounds>
    );
  }
}
