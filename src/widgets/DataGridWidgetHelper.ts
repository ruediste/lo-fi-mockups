export function parseDataGridContents(text: string): DataGridContents {
  const result: DataGridContents = {
    columns: [],
    rows: [],
  };

  const lines = text.split("\n");
  if (lines.length == 0) return result;

  const firstLineCells = lines[0].split("\t");
  if (firstLineCells.length == 0) {
    parseSimpleDataGrid(lines, result);
  } else {
    const firstCell = firstLineCells[0];
    if (firstCell === "!") {
      parseComplexDataGrid(lines, firstLineCells, result);
    } else {
      if (firstCell.startsWith("!!")) lines[0] = lines[0].substring(1);
      parseSimpleDataGrid(lines, result);
    }
  }

  for (const row of result.rows) {
    while (row.cells.length < result.columns.length) {
      row.cells.push({ text: "" });
    }
  }

  return result;
}

function parseSimpleDataGrid(lines: string[], result: DataGridContents) {
  result.rows.push(
    ...lines
      .filter((line) => line !== "")
      .map((line) => {
        const row: DataGridRow = {
          isHeading: false,
          isSelected: false,
          size: "auto",
          cells: [],
        };
        const cells = line.split("\t");
        cells.forEach((text, idx) => {
          row.cells.push({ text });
          if (result.columns.length <= idx) {
            result.columns.push({ isHeading: false, size: "auto" });
          }
        });
        return row;
      })
  );
}

function parseComplexDataGrid(
  lines: string[],
  firstLineCells: string[],
  result: DataGridContents
) {
  // build columns
  firstLineCells.slice(1).forEach((cell, idx) => {
    const column: DataGridColumn = { isHeading: false, size: "auto" };
    const parts = cell.split(/[^a-zA-z0-9]/);
    parts.forEach((part) => {
      const groups =
        /^((?<auto>auto)|(?<size>\d+(fr|px))|(?<header>[hH]))$/.exec(
          part
        )?.groups;
      if (!groups) return;
      if (groups["size"] !== undefined) column.size = groups["size"];
      column.isHeading ||= groups["header"] !== undefined;
    });
    result.columns.push(column);
  });

  // build rows and cells
  lines.slice(1).forEach((line, idx) => {
    const row: DataGridRow = {
      isHeading: false,
      isSelected: false,
      size: "auto",
      cells: [],
    };
    const cells = line.split("\t");
    if (cells.length > 0) {
      const parts = cells[0].split(/[^a-zA-z0-9]/);

      parts.forEach((part) => {
        const groups =
          /^((?<auto>auto)|(?<size>\d+(fr|px))|(?<header>[hH])|(?<selected>[sS]))$/.exec(
            part
          )?.groups;
        if (!groups) return;
        if (groups["size"] !== undefined) {
          row.size = groups["size"];
        }
        row.isHeading ||= groups["header"] !== undefined;
        row.isSelected ||= groups["selected"] !== undefined;
      });
    }
    result.rows.push(row);

    cells.slice(1).forEach((text, idx) => {
      row.cells.push({ text });
      if (result.columns.length <= idx) {
        result.columns.push({ isHeading: false, size: "auto" });
      }
    });
  });
}
export interface DataGridContents {
  columns: DataGridColumn[];
  rows: DataGridRow[];
}

export interface DataGridColumn {
  size: string;
  isHeading: boolean;
}
export interface DataGridRow {
  size: string;
  isHeading: boolean;
  isSelected: boolean;
  cells: DataGridCell[];
}
export interface DataGridCell {
  text: string;
}
