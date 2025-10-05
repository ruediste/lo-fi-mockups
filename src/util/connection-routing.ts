import { IVec2d } from "@/widgets/Widget";
import { LineSegment } from "./LineSegment";
import { Rectangle } from "./rectangle";
import { Direction, Orientation, Vec2d, getOrientation } from "./Vec2d";

const lineOffset = 40;
const centerLineWeightFactor = 0.9;
const stemLength = lineOffset;

type LineOrRayRole = "source" | "target" | "none";

export const showConnectionDebugLines = false;

class Distance {
  constructor(
    public metricDistance: number,
    public numberOfCorners: number,
    public collisionLength: number,
    public missingStemFraction: number
  ) {}

  public add(other: Distance) {
    return new Distance(
      this.metricDistance + other.metricDistance,
      this.numberOfCorners + other.numberOfCorners,
      this.collisionLength + other.collisionLength,
      this.missingStemFraction + other.missingStemFraction
    );
  }

  public compare(other: Distance) {
    return (
      compare(this.collisionLength, other.collisionLength) ||
      compare(this.numberOfCorners, other.numberOfCorners) ||
      compare(this.missingStemFraction, other.missingStemFraction) ||
      compare(this.metricDistance, other.metricDistance)
    );
  }
}

export type ConnectionEndConfiguration = {
  pos: Vec2d;
} & (
  | {
      direction: Direction;
      /** if true, the connection attaches to the inside of the rectangle.  */
      inside: boolean;
      rectangle: Rectangle;
    }
  | {
      direction?: undefined;
      inside?: undefined;
      rectangle?: undefined;
    }
);

class Line {
  weightFactor = 1;

  constructor(
    public orientation: Orientation,
    public ordinate: number,
    public role: LineOrRayRole
  ) {}

  withWeightFactor(factor: number): this {
    this.weightFactor = factor;
    return this;
  }

  withRole(role: LineOrRayRole): this {
    this.role = role;
    return this;
  }

  static horizontal(y: number) {
    return new Line("horizontal", y, "none");
  }

  static vertical(x: number) {
    return new Line("vertical", x, "none");
  }

  intersection(other: Line | Ray): Vec2d | undefined {
    return intersection(this, other);
  }
}

export class Ray {
  weightFactor = 1;

  constructor(
    public origin: Vec2d,
    public direction: Direction,
    public role: LineOrRayRole
  ) {}

  withWeightFactor(factor: number): this {
    this.weightFactor = factor;
    return this;
  }

  get orientation() {
    return getOrientation(this.direction);
  }

  get ordinate() {
    return this.orientation === "horizontal" ? this.origin.y : this.origin.x;
  }

  isPointOnRay(point: IVec2d) {
    switch (this.direction) {
      case "up":
        return point.x === this.origin.x && point.y < this.origin.y;
      case "down":
        return point.x === this.origin.x && point.y > this.origin.y;
      case "left":
        return point.y === this.origin.y && point.x < this.origin.x;
      case "right":
        return point.y === this.origin.y && point.x > this.origin.x;
    }
  }

  intersection(other: Line | Ray): Vec2d | undefined {
    return intersection(this, other);
  }
}

function intersection(a: Line | Ray, b: Line | Ray): Vec2d | undefined {
  if (a.orientation === b.orientation) {
    return undefined;
  }

  const result =
    a.orientation === "horizontal"
      ? new Vec2d(b.ordinate, a.ordinate)
      : new Vec2d(a.ordinate, b.ordinate);

  if (
    (a instanceof Ray && !a.isPointOnRay(result)) ||
    (b instanceof Ray && !b.isPointOnRay(result))
  ) {
    return undefined;
  }
  return result;
}

function compare(first: number, second: number) {
  if (isFinite(second) && second !== 0) {
    const relativeDiff = first / second - 1;
    return Math.abs(relativeDiff) > 1e-6 ? relativeDiff : 0;
  }

  return first - second;
}

class SubVertex {
  previous?: SubVertex;
  minDistanceFromSource?: Distance;
  constructor(public vertex: Vertex, public incomingDirection: Direction) {}
}

class Vertex {
  outgoingEdges: Edge[] = [];
  constructor(public point: Vec2d) {}

  subVertices: { [incomingDirection in Direction]: SubVertex } = {
    up: new SubVertex(this, "up"),
    down: new SubVertex(this, "down"),
    left: new SubVertex(this, "left"),
    right: new SubVertex(this, "right"),
  };

  /**
  The fraction of the stem missing when an ede leaves/enters the vertex in the given orientation
   */
  missingStemFraction: { [orientation in Orientation]: number } = {
    horizontal: 0,
    vertical: 0,
  };
}

class Edge {
  constructor(
    public length: Distance,
    public target: Vertex,
    public direction: Direction
  ) {}
}

export function getRoutePoints(
  source: ConnectionEndConfiguration,
  target: ConnectionEndConfiguration
): Vec2d[] | null {
  // collect lines
  const lines = collectLines(source, target);

  // build graph
  const { sourceVertex, targetVertex } = buildGraph(
    lines,
    [source, target].flatMap((x) =>
      x.rectangle === undefined || x.inside ? [] : [x.rectangle]
    )
  );

  if (sourceVertex === undefined || targetVertex === undefined) {
    return null;
  }

  return shortestPath(sourceVertex, targetVertex);
}

export function collectLines(
  source: ConnectionEndConfiguration,
  target: ConnectionEndConfiguration
): (Line | Ray)[] {
  const lines: (Line | Ray)[] = [];

  // lines around source and target
  collectLinesEnd(lines, source, "source");
  collectLinesEnd(lines, target, "target");

  // if source and target point in the same direction, do not add center lines
  if (
    source.direction !== undefined &&
    target.direction !== undefined &&
    source.direction !== target.direction
  ) {
    // center lines
    lines.push(
      Line.vertical((source.pos.x + target.pos.x) / 2).withWeightFactor(
        centerLineWeightFactor
      )
    );
    lines.push(
      Line.horizontal((source.pos.y + target.pos.y) / 2).withWeightFactor(
        centerLineWeightFactor
      )
    );
  }
  return lines;
}

function collectLinesEnd(
  lines: (Line | Ray)[],
  ep: ConnectionEndConfiguration,
  role: "source" | "target"
) {
  if (ep.rectangle === undefined) {
    lines.push(
      Line.horizontal(ep.pos.y).withRole(role),
      Line.vertical(ep.pos.x).withRole(role)
    );
  } else {
    if (ep.inside) {
      lines.push(new Ray(ep.pos, ep.direction, role));
      const point = ep.pos.add(
        Vec2d.fromDirection(ep.direction).scale(lineOffset)
      );
      switch (getOrientation(ep.direction)) {
        case "horizontal":
          lines.push(new Line("vertical", point.x, "none"));
          break;
        case "vertical":
          lines.push(new Line("horizontal", point.y, "none"));
          break;
      }
    } else {
      lines.push(Line.horizontal(ep.rectangle.top - lineOffset));
      lines.push(Line.horizontal(ep.rectangle.bottom + lineOffset));
      lines.push(Line.vertical(ep.rectangle.left - lineOffset));
      lines.push(Line.vertical(ep.rectangle.right + lineOffset));

      lines.push(new Ray(ep.pos, ep.direction, role));
    }
  }
}

function buildGraph(lines: (Line | Ray)[], obstacles: Rectangle[]) {
  const horizontalLines = lines
    .filter((l) => l.orientation === "horizontal")
    .sort((a, b) => a.ordinate - b.ordinate);

  const verticalLines = lines
    .filter((l) => l.orientation === "vertical")
    .sort((a, b) => a.ordinate - b.ordinate);

  const vertexGrid: (Vertex | undefined)[][] = [];

  let sourceVertex: Vertex | undefined = undefined;
  let targetVertex: Vertex | undefined = undefined;

  const assignSourceOrTargetVertex = (
    vertex: Vertex,
    role: "source" | "target"
  ) => {
    if (role === "source") {
      sourceVertex = vertex;
    } else {
      targetVertex = vertex;
    }
  };

  for (let i = 0; i < verticalLines.length; i++) {
    const verticalLine = verticalLines[i];
    vertexGrid.push([]);
    for (let j = 0; j < horizontalLines.length; j++) {
      const horizontalLine = horizontalLines[j];
      const intersection = verticalLine.intersection(horizontalLine);
      if (intersection === undefined) {
        vertexGrid[i].push(undefined);
      } else {
        const v = new Vertex(intersection);
        vertexGrid[i].push(v);

        // check if both lines have the same role it indicates that the lines
        // were created for an non directional source or target
        if (
          verticalLine.role !== "none" &&
          horizontalLine.role === verticalLine.role
        ) {
          assignSourceOrTargetVertex(v, verticalLine.role);
        }

        // check for rays and add penalties if the vertex is close to the source or target
        if (verticalLine instanceof Ray) {
          const dist = Math.abs(verticalLine.origin.y - intersection.y);
          if (dist < stemLength) {
            v.missingStemFraction["horizontal"] =
              (stemLength - dist) / stemLength;
          }
        }

        if (horizontalLine instanceof Ray) {
          const dist = Math.abs(horizontalLine.origin.x - intersection.x);
          if (dist < stemLength) {
            v.missingStemFraction["vertical"] =
              (stemLength - dist) / stemLength;
          }
        }
      }
    }
  }

  function calculateDistance(line: Line | Ray, a: Vertex, b: Vertex): Distance {
    const collisionLength = obstacles
      .flatMap((obstacle) => {
        const length = obstacle.intersectionLength(
          new LineSegment(a.point, b.point)
        );
        return length === undefined ? [] : [length];
      })
      .reduce((a, b) => a + b, 0);

    const length = a.point.sub(b.point).length;
    return new Distance(
      length * line.weightFactor,
      0,
      collisionLength,
      a.missingStemFraction[line.orientation] +
        b.missingStemFraction[line.orientation]
    );
  }

  // add vertical edges
  for (let i = 0; i < verticalLines.length; i++) {
    const line = verticalLines[i];
    let v1: Vertex | undefined = undefined;

    for (let j = 0; j < horizontalLines.length; j++) {
      const v2 = vertexGrid[i][j];
      if (v2 === undefined) {
        continue;
      }
      if (v1 === undefined) {
        // First vertex encountered. If the vertical line is a ray downwards, add a vertex for the source/target role of the ray
        if (
          line.role !== "none" &&
          line instanceof Ray &&
          line.direction === "down"
        ) {
          const v = new Vertex(line.origin);
          const dist = calculateDistance(line, v, v2);
          v.outgoingEdges.push(new Edge(dist, v2, "down"));
          v2.outgoingEdges.push(new Edge(dist, v, "up"));
          assignSourceOrTargetVertex(v, line.role);
        }
        v1 = v2;
        continue;
      }

      const dist = calculateDistance(line, v1, v2);
      v1.outgoingEdges.push(new Edge(dist, v2, "down"));
      v2.outgoingEdges.push(new Edge(dist, v1, "up"));
      v1 = v2;
    }

    // We are at the bottom of the vertical line and the line was a ray upwards.
    // Add a vertex for the source/target role of the ray
    if (
      line.role !== "none" &&
      line instanceof Ray &&
      line.direction === "up"
    ) {
      const v = new Vertex(line.origin);
      const dist = calculateDistance(line, v, v1!);
      v.outgoingEdges.push(new Edge(dist, v1!, "up"));
      v1!.outgoingEdges.push(new Edge(dist, v, "down"));
      assignSourceOrTargetVertex(v, line.role);
    }
  }

  // add horizontal edges
  for (let j = 0; j < horizontalLines.length; j++) {
    const line = horizontalLines[j];
    let v1: Vertex | undefined = undefined;
    for (let i = 0; i < verticalLines.length; i++) {
      const v2 = vertexGrid[i][j];
      if (v2 === undefined) {
        continue;
      }
      if (v1 === undefined) {
        if (
          line.role !== "none" &&
          line instanceof Ray &&
          line.direction === "right"
        ) {
          const v = new Vertex(line.origin);
          const dist = calculateDistance(line, v, v2);
          v.outgoingEdges.push(new Edge(dist, v2, "right"));
          v2.outgoingEdges.push(new Edge(dist, v, "left"));
          assignSourceOrTargetVertex(v, line.role);
        }
        v1 = v2;
        continue;
      }

      const dist = calculateDistance(line, v1, v2);
      v1.outgoingEdges.push(new Edge(dist, v2, "right"));
      v2.outgoingEdges.push(new Edge(dist, v1, "left"));
      v1 = v2;
    }
    if (
      line.role !== "none" &&
      line instanceof Ray &&
      line.direction === "left"
    ) {
      const v = new Vertex(line.origin);
      const dist = calculateDistance(line, v, v1!);
      v.outgoingEdges.push(new Edge(dist, v1!, "left"));
      v1!.outgoingEdges.push(new Edge(dist, v, "right"));
      assignSourceOrTargetVertex(v, line.role);
    }
  }
  return { sourceVertex: sourceVertex!, targetVertex: targetVertex! };
}

function shortestPath(sourceVertex: Vertex, targetVertex: Vertex) {
  // search shortest path
  const processed = new Set<SubVertex>();
  const border = new Set<SubVertex>();
  sourceVertex!.subVertices.up.minDistanceFromSource = new Distance(0, 0, 0, 0);
  border.add(sourceVertex!.subVertices.up);

  while (border.size > 0) {
    const current = Array.from(border).sort((a, b) =>
      a.minDistanceFromSource!.compare(b.minDistanceFromSource!)
    )[0];
    border.delete(current);
    processed.add(current);

    if (current.vertex === targetVertex) {
      // traverse path
      const path: Vec2d[] = [];
      let currentSubVertex: SubVertex = current;
      while (currentSubVertex.previous !== undefined) {
        path.unshift(currentSubVertex.vertex.point);
        currentSubVertex = currentSubVertex.previous;
      }
      path.unshift(sourceVertex!.point);
      return simplifyPath(path);
    }

    for (const edge of current.vertex.outgoingEdges) {
      const v = edge.target.subVertices[edge.direction];
      if (!processed.has(v)) {
        border.add(v);
        let dist = current.minDistanceFromSource!.add(edge.length);
        if (current.incomingDirection != edge.direction) {
          dist = dist.add(new Distance(0, 1, 0, 0));
        }

        if (
          v.minDistanceFromSource === undefined ||
          v.minDistanceFromSource.compare(dist) > 0
        ) {
          v.minDistanceFromSource = dist;
          v.previous = current;
        }
      }
    }
  }

  return null;
}

export function simplifyPath(points: Vec2d[]): Vec2d[];
export function simplifyPath(points: null): null;
export function simplifyPath(points: Vec2d[] | null) {
  if (points == null) return null;

  const result: Vec2d[] = [];
  if (points.length == 0) return [];

  result.push(points[0]);
  let previous = points[0];

  for (let i = 1; i < points.length - 1; i++) {
    if (previous.x == points[i].x && points[i].x == points[i + 1].x) {
      continue;
    }
    if (previous.y == points[i].y && points[i].y == points[i + 1].y) {
      continue;
    }
    result.push(points[i]);
    previous = points[i];
  }

  if (points.length > 1) result.push(points[points.length - 1]);
  return result;
}
