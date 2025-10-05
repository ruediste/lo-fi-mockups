import { IRectangle, IVec2d } from "@/widgets/Widget";
import { LineSegment } from "./LineSegment";
import { Vec2d } from "./Vec2d";

export class Rectangle implements IRectangle {
  constructor(
    readonly x: number,
    readonly y: number,
    readonly width: number,
    readonly height: number
  ) {}

  static fromRect(rect: IRectangle) {
    return new Rectangle(rect.x, rect.y, rect.width, rect.height);
  }

  static boundingBox(points: IVec2d[]): Rectangle {
    if (points.length === 0) return new Rectangle(0, 0, 0, 0);
    const left = Math.min(...points.map((p) => p.x));
    const right = Math.max(...points.map((p) => p.x));
    const top = Math.min(...points.map((p) => p.y));
    const bottom = Math.max(...points.map((p) => p.y));
    return new Rectangle(left, right, top, bottom);
  }

  get position() {
    return getPosition(this);
  }

  get size() {
    return getSize(this);
  }

  public containsPoint(point: IVec2d) {
    return (
      point.x >= this.left &&
      point.x <= this.right &&
      point.y >= this.top &&
      point.y <= this.bottom
    );
  }

  get left() {
    return this.x;
  }

  get right() {
    return this.x + this.width;
  }

  get top() {
    return this.y;
  }

  get bottom() {
    return this.y + this.height;
  }

  get topLeft() {
    return new Vec2d(this.left, this.top);
  }

  get topRight() {
    return new Vec2d(this.right, this.top);
  }

  get bottomLeft() {
    return new Vec2d(this.left, this.bottom);
  }

  get bottomRight() {
    return new Vec2d(this.right, this.bottom);
  }

  get topSegment() {
    return new LineSegment(this.topLeft, this.topRight);
  }

  get rightSegment() {
    return new LineSegment(this.topRight, this.bottomRight);
  }

  get bottomSegment() {
    return new LineSegment(this.bottomRight, this.bottomLeft);
  }

  get leftSegment() {
    return new LineSegment(this.bottomLeft, this.topLeft);
  }

  get segments() {
    return [
      this.topSegment,
      this.rightSegment,
      this.bottomSegment,
      this.leftSegment,
    ];
  }

  public intersectionLength(segment: LineSegment) {
    const intersectionPoints: Vec2d[] = [];
    if (this.containsPoint(segment.a))
      intersectionPoints.push(Vec2d.from(segment.a));
    if (this.containsPoint(segment.b))
      intersectionPoints.push(Vec2d.from(segment.b));
    this.segments.forEach((s) => {
      const intersectionPoint = s.intersectionPoint(segment);
      if (intersectionPoint) intersectionPoints.push(intersectionPoint);
    });

    if (intersectionPoints.length === 2)
      return intersectionPoints[0].sub(intersectionPoints[1]).length;
    return undefined;
  }
}

export function getPosition(rect: IRectangle): IVec2d {
  return rect;
}

export function getSize(rect: IRectangle): IVec2d {
  return { x: rect.width, y: rect.height };
}

export function inflate(rect: Rectangle, margin: number) {
  return {
    left: rect.left - margin,
    right: rect.right + margin,
    top: rect.top - margin,
    bottom: rect.bottom + margin,
  };
}

export function fullyContains(container: Rectangle, contained: Rectangle) {
  return (
    container.left <= contained.left &&
    container.right >= contained.right &&
    container.top <= contained.top &&
    container.bottom >= contained.bottom
  );
}

export function getFbArray(rect: Rectangle) {
  return [rect.left, rect.top, rect.right, rect.bottom] as const;
}
