import { DeepKeyMap } from "./DeepKeyMap";

describe("DeepKeyMap", () => {
  it("happy flow", () => {
    const map = new DeepKeyMap<string, number>();
    map.set("foo", 1);
    expect(map.get("foo")).toBe(1);
    map.set("foo", 2);
    expect(map.get("foo")).toBe(2);
    expect(map.get("bar")).toBe(undefined);
    map.set("bar", 3);
    expect(map.get("foo")).toBe(2);
    expect(map.get("bar")).toBe(3);
  });
});
