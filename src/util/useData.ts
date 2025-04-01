export interface FetchDataArgs {
  url: string;
  basicAuth?: { username: string; password: string };
}

export async function fetchData<T>({
  url,
  basicAuth,
}: FetchDataArgs): Promise<T> {
  console.log("fetching");
  let headers = new Headers();
  if (basicAuth)
    headers.set(
      "Authorization",
      "Basic " + btoa(basicAuth.username + ":" + basicAuth.password)
    );
  headers.set("Accept", "application/json");
  const response = await fetch(url, {
    headers,
  });
  console.log(response);
  return await response.json();
}

export function cache<TArgs extends any[], TData>(
  func: (...args: TArgs) => Promise<TData>,
  prefetch?: TArgs
): (...args: TArgs) => Promise<TData> {
  let lastArgs: TArgs | undefined = undefined;
  let result: Promise<TData> | undefined = undefined;

  if (prefetch) {
    lastArgs = prefetch;
    result = func(...prefetch);
  }

  return (...args: TArgs) => {
    if (
      lastArgs === undefined ||
      result === undefined ||
      lastArgs.length != args.length ||
      lastArgs.some((last, i) => last != args[i])
    ) {
      lastArgs = args;
      result = func(...args);
    }
    return result;
  };
}
