import { calculateViewBox } from "./paletteHelper";

describe("Palette Scaling", () => {
  it("should work for tall widgets", () => {
    expect(
      calculateViewBox(4 / 3, { x: 10, y: 10, width: 10, height: 30 })
    ).toEqual({ width: 40, height: 30, x: -5, y: 10 });
    expect(
      calculateViewBox(4 / 3, { x: 10, y: 10, width: 10, height: 90 })
    ).toEqual({ width: 120, height: 90, x: -45, y: 10 });
  });
  it("should work for wide widgets", () => {
    expect(
      calculateViewBox(4 / 3, { x: 10, y: 10, width: 40, height: 10 })
    ).toEqual({ width: 40, height: 30, x: 10, y: 0 });
    expect(
      calculateViewBox(4 / 3, { x: 10, y: 10, width: 120, height: 20 })
    ).toEqual({ width: 120, height: 90, x: 10, y: -25 });
  });
});
