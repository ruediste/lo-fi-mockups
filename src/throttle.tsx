export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: [...Parameters<T>]) => void {
  let timeout: NodeJS.Timeout | undefined;
  let currentArgs: [...Parameters<T>] | undefined;
  return (...args: [...Parameters<T>]) => {
    currentArgs = args;
    if (!timeout) {
      timeout = setTimeout(function () {
        func(...currentArgs!);
        timeout = undefined;
      }, limit);
    }
  };
}
