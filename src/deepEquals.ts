"use strict";

const immutableHashes: WeakMap<any, number> = new WeakMap<object, number>();

class ImmutableMarker<T> {
  private hash?: number;
  constructor(public value: T) {}

  hashCode(): number {
    if (this.hash === undefined) {
      this.hash = immutableHashes.get(this.value);
    }

    if (this.hash === undefined) {
      this.hash = deepHash(this.value);
      immutableHashes.set(this.value, this.hash);
    }

    return this.hash;
  }
}

export function markImmutable<T>(value: T): ImmutableMarker<T> {
  return new ImmutableMarker(value);
}

export function deepEquals(a: any, b: any) {
  if (a === b) return true;

  if (a && b && typeof a == "object" && typeof b == "object") {
    if (a.constructor !== b.constructor) return false;

    if (Array.isArray(a)) {
      const length = a.length;
      if (length != b.length) return false;
      for (let i = length; i-- !== 0; )
        if (!deepEquals(a[i], b[i])) return false;
      return true;
    }

    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (const i of a.entries()) if (!b.has(i[0])) return false;
      for (const i of a.entries())
        if (!deepEquals(i[1], b.get(i[0]))) return false;
      return true;
    }

    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (const i of a.entries()) if (!b.has(i[0])) return false;
      return true;
    }

    if (a.constructor === RegExp)
      return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf)
      return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString)
      return a.toString() === b.toString();

    const keys = Object.keys(a);
    const length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (let i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (let i = length; i-- !== 0; ) {
      const key = keys[i];

      if (!deepEquals(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b;
}

// v8 has an optimization for storing 31-bit signed numbers.
// Values which have either 00 or 11 as the high order bits qualify.
// This function drops the highest order bit in a signed number, maintaining
// the sign bit.
export function smi(i32: number) {
  return ((i32 >>> 1) & 0x40000000) | (i32 & 0xbfffffff);
}

export function deepHash(value: any): number {
  if (value == null) {
    return hashNullish(value);
  }

  if (typeof value.hashCode === "function") {
    // Drop any high bits from accidentally long hash codes.
    return smi(value.hashCode(value));
  }

  switch (typeof value) {
    case "boolean":
      // The hash values for built-in constants are a 1 value for each 5-byte
      // shift region expect for the first, which encodes the value. This
      // reduces the odds of a hash collision for these common values.
      return value ? 0x42108421 : 0x42108420;
    case "number":
      return hashNumber(value);
    case "string":
      return hashString(value);
    case "object":
    case "function":
      return hashJSObj(value);
    case "symbol":
      return hashSymbol(value);
    default:
      throw new Error("Value type " + typeof value + " cannot be hashed.");
  }
}

function hashNullish(nullish: any) {
  return nullish === null ? 0x42108422 : /* undefined */ 0x42108423;
}

function hashString(string: string) {
  // This is the hash from JVM
  // The hash code for a string is computed as
  // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
  // where s[i] is the ith character of the string and n is the length of
  // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
  // (exclusive) by dropping high bits.
  let hashed = 0;
  for (let ii = 0; ii < string.length; ii++) {
    hashed = (31 * hashed + string.charCodeAt(ii)) | 0;
  }
  return smi(hashed);
}

// Compress arbitrarily large numbers into smi hashes.
function hashNumber(n: number) {
  if (n !== n || n === Infinity) {
    return 0;
  }
  let hash = n | 0;
  if (hash !== n) {
    hash ^= n * 0xffffffff;
  }
  while (n > 0xffffffff) {
    n /= 0xffffffff;
    hash ^= n;
  }
  return smi(hash);
}

function hashJSObj(a: object): number {
  let result = getObjectIdentityHash(a.constructor);

  if (Array.isArray(a)) {
    a.forEach((x) => (result = result * 31 + deepHash(x)));
  } else if (a instanceof Map) {
    for (const i of a.entries()) {
      result = result * 31 + deepHash(i[0]);
      result = result * 31 + deepHash(i[1]);
    }
  } else if (a instanceof Set) {
    for (const i of a.entries()) {
      result = result * 31 + deepHash(i);
    }
  } else {
    Object.entries(a).forEach((e) => {
      result = result * 31 + deepHash(e[0]);
      result = result * 31 + deepHash(e[1]);
    });
  }

  return result;
}

const symbolMap = Object.create(null);
let _nextHash = 0;

function nextHash() {
  const nextHash = ++_nextHash;
  if (_nextHash & 0x40000000) {
    _nextHash = 0;
  }
  return nextHash;
}

function hashSymbol(sym: symbol) {
  let hashed = symbolMap[sym];
  if (hashed !== undefined) {
    return hashed;
  }

  hashed = nextHash();

  symbolMap[sym] = hashed;

  return hashed;
}

const idMap: WeakMap<object, number> = new WeakMap<object, number>();

function getObjectIdentityHash(object: object): number {
  const objectId: number | undefined = idMap.get(object);
  if (objectId === undefined) {
    const hash = nextHash();
    idMap.set(object, hash);
    return hash;
  }

  return objectId;
}
