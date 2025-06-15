import { useState } from "react";

export function InlineEdit(props: {
  edit: (stopEditing: () => void) => React.ReactNode;
  text: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) return props.edit(() => setEditing(false));
  return (
    <span
      style={props.style}
      css={{
        margin: "-4px",
        padding: "4px",
        minHeight: "2em",
        borderRadius: "4px",
        ...(props.disabled
          ? {}
          : {
              "&:hover": {
                background: "lightgray",
              },
            }),
      }}
      onClick={() => props.disabled !== true && setEditing(true)}
    >
      {props.text}
    </span>
  );
}
