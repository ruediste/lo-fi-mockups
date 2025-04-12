import { CanvasProjection } from "@/editor/Canvas";
import { Vec2d } from "@/util/Vec2d";
import Flatbush from "flatbush";
import { Page, SnapResult } from "./Page";
import {
  HorizontalSnapBox,
  HorizontalSnapReference,
  PageItem,
  SnapReferencesArgs,
  VerticalSnapBox,
  VerticalSnapReference,
} from "./PageItem";

export class SnapIndex {
  horizontalBoxes: HorizontalSnapBox[] = [];
  verticalBoxes: VerticalSnapBox[] = [];
  horizontal?: Flatbush;
  vertical?: Flatbush;
  constructor(
    page: Page,
    projection: CanvasProjection,
    filter: (item: PageItem) => boolean
  ) {
    [...page.masterItems, ...page.ownItems].filter(filter).forEach((item) =>
      item.getSnapBoxes({
        horizontal: this.horizontalBoxes,
        vertical: this.verticalBoxes,
        viewToWorld: projection.scale,
      })
    );

    if (this.horizontalBoxes.length > 0) {
      const horizontal = new Flatbush(this.horizontalBoxes.length);

      this.horizontalBoxes.forEach((p) =>
        horizontal.add(p.x, p.y - p.snapRange, p.x + p.width, p.y + p.snapRange)
      );
      horizontal.finish();
      this.horizontal = horizontal;
    }

    if (this.verticalBoxes.length > 0) {
      const vertical = new Flatbush(this.verticalBoxes.length);
      this.verticalBoxes.forEach((p) =>
        vertical.add(p.x - p.snapRange, p.y, p.x + p.snapRange, p.y + p.height)
      );
      vertical.finish();
      this.vertical = vertical;
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
    ]) {
      const indices = this.vertical?.search(
        ref.x - currentOffset.x,
        ref.y - currentOffset.y,
        ref.x - currentOffset.x,
        ref.y + ref.height - currentOffset.y
      );
      for (const idx of indices ?? []) {
        const box = this.verticalBoxes[idx];
        const delta = box.x - (ref.x - currentOffset.x);
        if (deltaX === undefined || Math.abs(deltaX) > Math.abs(delta)) {
          deltaX = delta;
          verticalSnap = { box, ref };
        }
      }
    }

    for (const ref of [
      ...(refs.top ?? []),
      ...(refs.bottom ?? []),
      ...(refs.otherHorizontal ?? []),
    ]) {
      const indices = this.horizontal?.search(
        ref.x - currentOffset.x,
        ref.y - currentOffset.y,
        ref.x + ref.width - currentOffset.x,
        ref.y - currentOffset.y
      );
      for (const idx of indices ?? []) {
        const box = this.horizontalBoxes[idx];
        const delta = box.y - (ref.y - currentOffset.y);
        if (deltaY === undefined || Math.abs(deltaY) > Math.abs(delta)) {
          deltaY = delta;
          horizontalSnap = { box, ref };
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
