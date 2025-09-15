import { FetchDataArgs } from "@/util/fetchData";

export function xwiki<T>(args: FetchDataArgs): FetchDataArgs {
  return {
    ...args,
    url: (import.meta.env.DEV ? "/xwikiApi/rest/" : "/rest/") + args.url,
  };
}
