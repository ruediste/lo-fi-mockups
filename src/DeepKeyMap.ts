import { deepEquals, deepHash } from "./deepEquals";

export class DeepKeyMap<K, V> {
  private map = new Map<number, [K, V][]>();

  get(key: K): V | undefined {
    const list = this.map.get(deepHash(key));
    for (const entry of list ?? []) {
      if (deepEquals(entry[0], key)) return entry[1];
    }

    return undefined;
  }
  set(key: K, value: V) {
    const hash = deepHash(key);
    const list = this.map.get(hash);
    if (list === undefined) {
      this.map.set(hash, [[key, value]]);
    } else {
      for (const entry of list) {
        if (deepEquals(entry[0], key)) {
          entry[1] = value;
          return;
        }
      }
      list.push([key, value]);
    }
  }
}
