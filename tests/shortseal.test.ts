import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relative: string): string {
  return readFileSync(path.join(root, relative), "utf8");
}

describe("seal abbreviation", () => {
  it("has exactly one shortSeal implementation", () => {
    expect(read("src/lib/canonical.ts")).toMatch(/export function shortSeal\(/);
    for (const source of ["src/components/board-client.tsx", "src/components/mission-detail-client.tsx"]) {
      expect(read(source)).not.toMatch(/function shortSeal/);
    }
  });

  it("imports the shared helper everywhere a seal is abbreviated", () => {
    for (const source of ["src/components/board-client.tsx", "src/components/mission-detail-client.tsx"]) {
      expect(read(source)).toMatch(/import \{ shortSeal \} from "@\/lib\/canonical"/);
    }
  });
});
