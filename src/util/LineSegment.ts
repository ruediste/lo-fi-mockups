import { Vec2d } from "./Vec2d";

export class LineSegment {
  constructor(readonly a: Vec2d, readonly b: Vec2d) {}

  get vector() {
    return this.b.sub(this.a);
  }

  intersectionPoint(other: LineSegment): Vec2d | undefined {
    const det = Vec2d.determinant(this.vector, other.vector);
    if (det === 0) return undefined;
    const ad = Vec2d.from(other.b).sub(this.a);
    const lambda = Vec2d.determinant(ad, other.vector) / det;
    const gamma = Vec2d.determinant(this.vector, ad) / det;
    if (0 < lambda && lambda < 1 && 0 < gamma && gamma < 1) {
      return Vec2d.from(this.a).add(Vec2d.from(this.b).sub(this.a).mul(lambda));
    } else return undefined;
  }
}
