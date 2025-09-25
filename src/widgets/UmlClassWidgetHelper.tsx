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
    if (seenSeparator) {
      result.push(<div key={idx}>{line}</div>);
    } else
      result.push(
        <div className="classHeader" key={idx}>
          {line}
        </div>
      );
  });
  return result;
}
