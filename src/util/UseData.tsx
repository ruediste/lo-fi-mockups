import { ReactNode } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { FetchDataArgs, useData, useLoader, useMultiData } from "./fetchData";

export function WithLoader<T>({
  data,
  children,
}: {
  data: ReturnType<typeof useLoader<T>>;
  children?: (data: T, refresh: () => void) => ReactNode;
}) {
  if (data.state == "error")
    return <Alert variant="warning">Loading data failed</Alert>;
  if (data.state == "loaded") return children?.(data.data, data.refresh);
  return <Spinner />;
}

export function WithData<T>(
  props: FetchDataArgs & {
    children?: (data: T, refresh: () => void) => ReactNode;
  }
) {
  const data = useData<T>(props);
  return <WithLoader<T> data={data} children={props.children} />;
}

export function WithMultiData<T extends any[]>(props: {
  args: { [key in keyof T]: FetchDataArgs };
  children?: (data: T, refresh: () => void) => ReactNode;
}) {
  const data = useMultiData<T>(props.args);
  return <WithLoader<T> data={data} children={props.children} />;
}
