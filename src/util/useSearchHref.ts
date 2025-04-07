import { MouseEventHandler } from "react";
import {
  RelativeRoutingType,
  To,
  useHref,
  useLocation,
  useNavigate,
} from "react-router";

export default function useSearchHref(
  to: To | ({ search?: { [key: string]: string | null } } & Omit<To, "search">),
  relative?: {
    relative?: RelativeRoutingType;
  }
): { href: string; onClick: MouseEventHandler<HTMLElement> } {
  const location = useLocation();
  const navigate = useNavigate();
  if (typeof to === "object" && typeof to.search === "object") {
    const search = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(to.search)) {
      if (value !== null) search.set(key, value);
      else search.delete(key);
    }
    to = { ...to, search: search.toString() };
  } else {
    to.search = location.search;
  }
  const href = useHref(to as any, relative);
  return {
    href,
    onClick: (e) => {
      e.stopPropagation();
      e.preventDefault();
      navigate(to as any, relative);
    },
  };
}
