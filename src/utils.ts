export function arraySwapInPlace<T>(array: T[], idx1: number, idx2: number) {
  const tmp = array[idx1];
  array[idx1] = array[idx2];
  array[idx2] = tmp;
}
