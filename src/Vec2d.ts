import { Rectangle } from "./widgets/Widget";

export class Vec2d {
  readonly x: number;
  readonly y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static fromEvent(event: { clientX: number; clientY: number }): Vec2d {
    return new Vec2d(event.clientX, event.clientY);
  }

  static from(value: null | undefined): undefined;
  static from(value: { x: number; y: number }): Vec2d;
  static from(value: { x: number; y: number } | null | undefined): Vec2d;
  static from(value: { x: number; y: number } | null | undefined) {
    if (value === null || value === undefined) {
      return undefined;
    }
    return new Vec2d(value.x, value.y);
  }

  static fromWidthHeight(value: { width: number; height: number }) {
    return new Vec2d(value.width, value.height);
  }

  static boundingBox(...items: Vec2d[]): Rectangle {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    items.forEach((item) => {
      if (minX > item.x) minX = item.x;
      if (maxX < item.x) maxX = item.x;
      if (minY > item.y) minY = item.y;
      if (maxY < item.y) maxY = item.y;
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  add(v: { x: number; y: number }) {
    return new Vec2d(this.x + v.x, this.y + v.y);
  }

  sub(v: { x: number; y: number }) {
    return new Vec2d(this.x - v.x, this.y - v.y);
  }

  scale(s: number | { x: number; y: number }) {
    if (typeof s === "number") {
      return new Vec2d(this.x * s, this.y * s);
    } else return new Vec2d(this.x * s.x, this.y * s.y);
  }

  mul(s: number) {
    return this.scale(s);
  }

  div(size: { x: number; y: number }): Vec2d {
    return new Vec2d(
      size.x == 0 ? 0 : this.x / size.x,
      size.y == 0 ? 0 : this.y / size.y
    );
  }

  get length(): number {
    return Math.sqrt(this.length2);
  }

  get length2(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const l = this.length;
    if (l == 0) {
      return new Vec2d(1, 0);
    }
    return new Vec2d(this.x / l, this.y / l);
  }

  static determinant(a: Vec2d, b: Vec2d) {
    return a.x * b.y - b.x * a.y;
  }
}
