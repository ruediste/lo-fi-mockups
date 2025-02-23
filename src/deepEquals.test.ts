import { deepEquals, deepHash, markImmutable } from "./deepEquals";

class TestCase<T> {
  constructor(
    public label: string,
    public factory: () => T,
    public modify: (obj: T) => T | void
  ) {}

  private mod(input: T): T {
    const result = this.modify(input);
    if (result !== void 0) return result as T;
    return input;
  }
  testEquals() {
    const a = this.factory();
    let b = this.factory();

    expect(deepEquals(a, a)).toBe(true);
    expect(deepEquals(a, b)).toBe(true);

    b = this.mod(b);
    expect(deepEquals(a, b)).toBe(false);
  }

  testHash() {
    const a = this.factory();
    let b = this.factory();

    const hashA = deepHash(a);
    const hashB = deepHash(b);
    b = this.mod(b);
    const hashBMod = deepHash(b);

    expect(hashA == deepHash(a)).toBe(true);
    expect(hashA == hashB).toBe(true);
    expect(hashA == hashBMod).toBe(false);
  }
}

class TestCls {
  foo = "bar";
}
const testCases: TestCase<any>[] = [
  new TestCase(
    "number",
    () => 1,
    () => 2
  ),
  new TestCase(
    "string",
    () => "foo",
    () => "bar"
  ),
  new TestCase(
    "obj literal",
    () => ({
      foo: "bar",
    }),
    (x) => {
      x.foo = "foobar";
    }
  ),
  new TestCase(
    "class instance",
    () => new TestCls(),
    (x) => {
      x.foo = "foobar";
    }
  ),
];
describe("deepEquals", () => {
  testCases.forEach((t) => it(t.label, () => t.testEquals()));
});
describe("deepHash", () => {
  testCases.forEach((t) => it(t.label, () => t.testHash()));
  it("handle immutable", () => {
    const a = { foo: "bar" };
    const hash = deepHash(markImmutable(a));
    a.foo = "foo";
    expect(deepHash(markImmutable(a))).toBe(hash);
    expect(deepHash(a)).not.toBe(hash);
  });
});
