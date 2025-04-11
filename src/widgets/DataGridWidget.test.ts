import { parseDataGridContents } from "./DataGridWidgetHelper";

describe("DataGrid", () => {
  it("should parse table with specification", () => {
    const input = `!	H 	1fr
h	Hello	World
	foo	bar
	x	1.23`;
    const content = parseDataGridContents(input);
    expect(content).toStrictEqual({
      columns: [
        { isHeading: true, size: "auto" },
        { isHeading: false, size: "1fr" },
      ],
      rows: [
        {
          cells: [{ text: "Hello" }, { text: "World" }],
          isHeading: true,
          size: "auto",
        },
        {
          cells: [{ text: "foo" }, { text: "bar" }],
          isHeading: false,
          size: "auto",
        },
        {
          cells: [{ text: "x" }, { text: "1.23" }],
          isHeading: false,
          size: "auto",
        },
      ],
    });
  });
  it("should parse table without specification", () => {
    const input = `Hello	World
foo	bar
x	1.23`;
    const content = parseDataGridContents(input);
    expect(content).toStrictEqual({
      columns: [
        { isHeading: false, size: "auto" },
        { isHeading: false, size: "auto" },
      ],
      rows: [
        {
          cells: [{ text: "Hello" }, { text: "World" }],
          isHeading: false,
          size: "auto",
        },
        {
          cells: [{ text: "foo" }, { text: "bar" }],
          isHeading: false,
          size: "auto",
        },
        {
          cells: [{ text: "x" }, { text: "1.23" }],
          isHeading: false,
          size: "auto",
        },
      ],
    });
  });
});
