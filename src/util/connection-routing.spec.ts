import { Vec2d } from "./Vec2d";
import { getRoutePoints, simplifyPath } from "./connection-routing";
import { Rectangle } from "./rectangle";

describe("Connection Routing", () => {
  it("should route a simple path", () => {
    // rectangles: 0,0/40,40; 100,20/140,60

    const points = getRoutePoints(
      {
        pos: new Vec2d(40, 20),
        direction: "right",
        inside: false,
        rectangle: new Rectangle(0, 40, 0, 40),
      },
      {
        pos: new Vec2d(100, 40),
        direction: "left",
        inside: false,
        rectangle: new Rectangle(100, 140, 20, 60),
      }
    );

    expect(points).toEqual([
      new Vec2d(40, 20),
      new Vec2d(70, 20),
      new Vec2d(70, 40),
      new Vec2d(100, 40),
    ]);
  });

  it("simplify path should work", () => {
    expect(
      simplifyPath([
        new Vec2d(0, 0),
        new Vec2d(10, 0),
        new Vec2d(10, 10),
        new Vec2d(20, 10),
      ])
    ).toEqual([
      new Vec2d(0, 0),
      new Vec2d(10, 0),
      new Vec2d(10, 10),
      new Vec2d(20, 10),
    ]);
    expect(simplifyPath(null)).toEqual(null);
    expect(simplifyPath([new Vec2d(10, 10)])).toEqual([new Vec2d(10, 10)]);
    expect(simplifyPath([new Vec2d(10, 10), new Vec2d(20, 10)])).toEqual([
      new Vec2d(10, 10),
      new Vec2d(20, 10),
    ]);
    expect(
      simplifyPath([new Vec2d(10, 10), new Vec2d(20, 10), new Vec2d(30, 10)])
    ).toEqual([new Vec2d(10, 10), new Vec2d(30, 10)]);
  });
});
