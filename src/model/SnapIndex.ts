import { CanvasProjection } from "@/editor/Canvas";
import { Vec2d } from "@/util/Vec2d";
import Flatbush from "flatbush";
import { Page, SnapResult } from "./Page";
import {
  HorizontalSnapBox,
  HorizontalSnapReference,
  PageItem,
  SnapBoxesArgs,
  SnapReferencesArgs,
  SnapType,
  VerticalSnapBox,
  VerticalSnapReference,
} from "./PageItem";

export class SnapIndex {
  boxes: SnapBoxesArgs;
  horizontalBoxes: { [key in SnapType]: HorizontalSnapBox[] } = {
    edge: [],
    margin: [],
    middle: [],
  };
  verticalBoxes: { [key in SnapType]: VerticalSnapBox[] } = {
    edge: [],
    margin: [],
    middle: [],
  };

  horizontalIndices: { [key in SnapType]?: Flatbush } = {};
  verticalIndices: { [key in SnapType]?: Flatbush } = {};

  constructor(
    page: Page,
    projection: CanvasProjection,
    filter: (item: PageItem) => boolean
  ) {
    this.boxes = new SnapBoxesArgs(projection.scale);
    [...page.masterItems, ...page.ownItems]
      .filter(filter)
      .forEach((item) => item.getSnapBoxes(this.boxes));

    for (const box of this.boxes.horizontal) {
      this.horizontalBoxes[box.type].push(box);
    }
    for (const box of this.boxes.vertical) {
      this.verticalBoxes[box.type].push(box);
    }

    for (const snapType in this.horizontalBoxes) {
      const boxes = this.horizontalBoxes[snapType as SnapType];
      if (boxes.length > 0) {
        const index = new Flatbush(boxes.length);
        boxes.forEach((p) =>
          index.add(p.x, p.y - p.snapRange, p.x + p.width, p.y + p.snapRange)
        );
        index.finish();
        this.horizontalIndices[snapType as SnapType] = index;
      }
    }

    for (const snapType in this.verticalBoxes) {
      const boxes = this.verticalBoxes[snapType as SnapType];
      if (boxes.length > 0) {
        const index = new Flatbush(boxes.length);
        boxes.forEach((p) =>
          index.add(p.x - p.snapRange, p.y, p.x + p.snapRange, p.y + p.height)
        );
        index.finish();
        this.verticalIndices[snapType as SnapType] = index;
      }
    }
  }

  snapItems(
    items: PageItem[],
    currentOffset: { x: number; y: number },
    viewToWorld: number
  ) {
    const refs = PageItem.getSnapReferences(items, viewToWorld);

    return this.snapBoxes(refs, currentOffset);
  }

  snapBoxes(
    refs: Partial<SnapReferencesArgs>,
    currentOffset: { x: number; y: number }
  ): SnapResult {
    let deltaX: number | undefined = undefined;
    let horizontalSnap:
      | { box: HorizontalSnapBox; ref: HorizontalSnapReference }
      | undefined = undefined;
    let deltaY: number | undefined = undefined;
    let verticalSnap:
      | { box: VerticalSnapBox; ref: VerticalSnapReference }
      | undefined = undefined;
    for (const ref of [
      ...(refs.left ?? []),
      ...(refs.right ?? []),
      ...(refs.otherVertical ?? []),
    ].map((x) => x.withOffset(currentOffset))) {
      const snapType = ref.type;
      const index = this.verticalIndices[snapType];
      if (!index) continue;

      const indices = index.search(ref.x, ref.y, ref.x, ref.y + ref.height);
      for (const idx of indices ?? []) {
        const box = this.verticalBoxes[snapType][idx];
        const delta = box.x - ref.x;
        if (deltaX === undefined || Math.abs(deltaX) > Math.abs(delta)) {
          deltaX = delta;
          verticalSnap = { box, ref: ref.withOffset({ x: deltaX, y: 0 }) };
        }
      }
    }

    for (const ref of [
      ...(refs.top ?? []),
      ...(refs.bottom ?? []),
      ...(refs.otherHorizontal ?? []),
    ].map((x) => x.withOffset(currentOffset))) {
      const snapType = ref.type;
      const index = this.horizontalIndices[snapType];
      if (!index) continue;

      const indices = index.search(ref.x, ref.y, ref.x + ref.width, ref.y);
      for (const idx of indices ?? []) {
        const box = this.horizontalBoxes[snapType][idx];
        const delta = box.y - ref.y;
        if (deltaY === undefined || Math.abs(deltaY) > Math.abs(delta)) {
          deltaY = delta;
          horizontalSnap = { box, ref: ref.withOffset({ x: 0, y: deltaY }) };
        }
      }
    }

    return {
      offset: new Vec2d(deltaX ?? 0, deltaY ?? 0),
      h: horizontalSnap,
      v: verticalSnap,
    };
  }
}
