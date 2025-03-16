import { PageItem } from "./model/PageItem";
import { toSet } from "./utils";

export class Selection {
  static empty = new Selection(toSet());

  static of(...items: PageItem[]): Selection {
    return new Selection(toSet(...items));
  }

  private constructor(public items: Set<PageItem>) {}

  has(item: PageItem) {
    return this.items.has(item);
  }
  hasSingle(item: PageItem) {
    return this.size == 1 && this.items.has(item);
  }

  add(item: PageItem) {
    return new Selection(toSet(...this.items, item));
  }

  toggle(item: PageItem) {
    return this.has(item) ? this.remove(item) : this.add(item);
  }

  remove(item: PageItem) {
    const tmp = toSet(...this.items);
    tmp.delete(item);
    return new Selection(tmp);
  }

  clear() {
    return new Selection(toSet());
  }

  all(): PageItem[] {
    return [...this.items];
  }

  get size() {
    return this.items.size;
  }

  get single() {
    if (this.items.size != 1) throw new Error("Expected single selected item");
    return this.items.values().next().value!;
  }
}
