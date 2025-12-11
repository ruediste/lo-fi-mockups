import iconImport from "bootstrap-icons/font/bootstrap-icons.json";

export const icons = iconImport;
export const iconsUntyped = iconImport as { [key: string]: number };
export const iconsList = Object.getOwnPropertyNames(iconsUntyped).map(
  (name) => [name, iconsUntyped[name]] as const
);
export const iconNumberToName: { [iconNr: number]: string } =
  Object.fromEntries(
    Object.getOwnPropertyNames(iconsUntyped).map((name) => [
      iconsUntyped[name],
      name,
    ])
  );

export function arraySwapInPlace<T>(array: T[], idx1: number, idx2: number) {
  const tmp = array[idx1];
  array[idx1] = array[idx2];
  array[idx2] = tmp;
}

export function toSet<T>(...items: T[]) {
  return new Set<T>(items);
}
