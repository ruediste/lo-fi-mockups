import { useCallback, useEffect, useRef, useState } from "react";
import { ModelEvent } from "../model/ModelEvent";

export function useRerenderTrigger() {
  const [, trigger] = useState({});
  return useCallback(() => trigger({}), []);
}

export function useRerenderOnEvent(event: ModelEvent<any> | undefined) {
  const trigger = useRerenderTrigger();
  useEffect(() => {
    if (event === undefined) return;
    return event.subscribe(() => trigger());
  }, [event, trigger]);
}

export function useConst<T>(valueFactory: () => T): T {
  const result = useRef<{ value?: T; initialized: boolean }>({
    initialized: false,
  });
  if (!result.current.initialized) {
    result.current.value = valueFactory();
    result.current.initialized = true;
  }
  return result.current.value!;
}
