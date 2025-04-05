import { useEffect, useState } from "react";

export type FetchDataArgs = {
  url: string;
  basicAuth?: { username: string; password: string };
  data?: Blob;
  method?: "GET" | "POST" | "PUT" | "DELETE";
};

export async function fetchDataRaw<T>({
  url,
  basicAuth,
  data,
  method,
}: FetchDataArgs): Promise<Response> {
  let headers = new Headers();
  if (basicAuth)
    headers.set(
      "Authorization",
      "Basic " + btoa(basicAuth.username + ":" + basicAuth.password)
    );
  headers.set("Accept", "application/json");
  return await fetch(url, {
    headers,
    method: method ?? (data === undefined ? "GET" : "POST"),
    body: data,
  });
}

export async function fetchData<T>(args: FetchDataArgs): Promise<T> {
  return await (await fetchDataRaw(args)).json();
}

export function useLoader<T>(load: () => Promise<T>, deps?: any[]) {
  const [refreshTrigger, setRefreshTrigger] = useState({});
  const refresh = () => setRefreshTrigger({});

  const [state, setState] = useState<
    { refresh: () => void } & (
      | { state: "loading" | "error" }
      | { state: "loaded"; data: T }
    )
  >({ state: "loading", refresh });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tmp = await load();
        if (!cancelled) setState({ state: "loaded", data: tmp, refresh });
      } catch {
        setState({ state: "error", refresh });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshTrigger, ...(deps ?? [])]);
  return state;
}

export function useData<T>(args: FetchDataArgs) {
  return useLoader(() => fetchData<T>(args), [args.url]);
}

export function useMultiData<T extends any[]>(args: {
  [key in keyof T]: FetchDataArgs;
}) {
  return useLoader<T>(
    () => Promise.all(args.map((arg) => fetchData<T>(arg))) as Promise<T>,
    args.flatMap((arg) => [arg.url])
  );
}
