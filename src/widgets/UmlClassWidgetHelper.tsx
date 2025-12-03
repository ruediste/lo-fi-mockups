import { ReactNode } from "react";

export function parseUmlClassWidgetContents(text: string): React.ReactNode {
  const lines = text.split("\n");
  const result: ReactNode[] = [];
  let seenSeparator = false;
  lines.forEach((line, idx) => {
    if (line.trim() === "--") {
      seenSeparator = true;
      result.push(<hr key={idx} />);
      return;
    }
    const nonEmptyLine = line === "" ? " " : line;
    if (seenSeparator) {
      result.push(<pre key={idx}>{nonEmptyLine}</pre>);
    } else
      result.push(
        <div className="classHeader" key={idx}>
          <pre>{nonEmptyLine}</pre>
        </div>
      );
  });
  return result;
}
