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
