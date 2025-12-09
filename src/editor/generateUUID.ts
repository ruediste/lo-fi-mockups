export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: generate a v4-like UUID without crypto
  return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".replace(/[x]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return r.toString(16);
  });
}
