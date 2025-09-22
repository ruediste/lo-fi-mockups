import { ReactNode } from "react";

export function WithHooks(props: { children: () => ReactNode }) {
  return props.children();
}
