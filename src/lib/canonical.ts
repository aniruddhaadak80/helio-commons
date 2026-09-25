import { createHash } from "node:crypto";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortValue((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function sealValue(previousSeal: string, value: unknown): string {
  return createHash("sha384")
    .update(previousSeal)
    .update(canonicalJson(value))
    .digest("hex");
}

export function shortSeal(seal: string): string {
  return `${seal.slice(0, 10)}…${seal.slice(-6)}`;
}
