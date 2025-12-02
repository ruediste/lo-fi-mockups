import { FetchDataArgs } from "@/util/fetchData";

export function xwiki<T>(args: FetchDataArgs): FetchDataArgs {
  return {
    ...args,
    url: (import.meta.env.DEV ? "/xwikiApi/rest/" : "/rest/") + args.url,
  };
}

export function saveLoFiIdentification(page: string, attachment: string) {
  localStorage.setItem(
    "xwikiLoFiIdentification",
    toXwikiLoFiIdentification(page, attachment)
  );
}

export function getSavedLoFiIdentification() {
  return localStorage.getItem("xwikiLoFiIdentification");
}
export function toXwikiLoFiIdentification(page: string, attachment: string) {
  return `${encodeURIComponent(location.origin)}/${encodeURIComponent(
    page
  )}/${encodeURIComponent(attachment)}`;
}
