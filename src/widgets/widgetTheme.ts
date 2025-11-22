export interface SnapConfiguration {
  snapRange: number;
  snapMargin: number;
  snapSideLength: number;
}

export const snapConfiguration: SnapConfiguration = {
  snapRange: 16,
  snapMargin: 6,
  snapSideLength: 100,
};

export const widgetTheme = {
  strokeWidth: 1,
  stroke: "#c9c9c9",
  rx: 4,
  fontSize: 16,
  selectedGray: "#f0f0f0",
  selectedBlue: "lightBlue",
  margin: 8,
};

export const widgetRectAttrs = {
  strokeWidth: widgetTheme.strokeWidth,
  stroke: widgetTheme.stroke,
  rx: widgetTheme.rx,
};

export const backgroundPalette = [
  { name: "White", color: "#fff" },
  { name: "Transparent", color: "transparent" },
  { name: "Red", color: "#fef2f2" },
  { name: "Blue", color: "#eff6ff" },
  { name: "Green", color: "#f0fdf4" },
  { name: "Yellow", color: "#fefce8" },
  { name: "Purple", color: "#faf5ff" },
  { name: "Pink", color: "#fdf2f8" },
  { name: "Gray", color: "#f9fafb" },
  { name: "Orange", color: "#fff7ed" },
] as const;

export type BackgroundColor = (typeof backgroundPalette)[number]["name"];
export const backgroundPaletteMap: { [key in BackgroundColor]: string } =
  Object.fromEntries(backgroundPalette.map((x) => [x.name, x.color])) as any;
