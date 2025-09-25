import { render } from "@testing-library/react";
import { ReactNode } from "react";
import { parseUmlClassWidgetContents } from "./UmlClassWidgetHelper";
describe("Class Element", () => {
  it(
    "should parse simple class",
    testRender(
      "Hello",
      <>
        <div className="classHeader">Hello</div>
      </>
    )
  );
  it(
    "should parse simple class",
    testRender(
      `Entity
--
id: String`,
      <>
        <div className="classHeader">Entity</div>
        <hr />
        <div>id: String</div>
      </>
    )
  );
});

function testRender(input: string, expected: ReactNode): () => void {
  return () => {
    const actual = render(parseUmlClassWidgetContents(input));
    expect(actual.container.innerHTML).toEqual(
      render(expected).container.innerHTML
    );
  };
}
