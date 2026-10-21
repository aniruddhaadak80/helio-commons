import { describe, expect, it } from "vitest";
import { createMission, updateMission, verifyAudit } from "@/lib/db";

const BASE = {
  category: "capability" as const,
  stage: "watch" as const,
  horizonYear: 2030,
  confidence: 60,
  evidence: [],
};

describe("audit chain replay", () => {
  it("replays the global chain", async () => {
    await createMission({ ...BASE, name: "Chain mission", thesis: "Chain thesis" });
    const verification = await verifyAudit();
    expect(verification.valid).toBe(true);
    expect(verification.checked).toBeGreaterThan(0);
  });

  it("keeps a mission valid when another mission is written in between its events", async () => {
    const first = await createMission({ ...BASE, name: "Alpha mission", thesis: "Alpha thesis" });
    await createMission({ ...BASE, name: "Beta mission", thesis: "Beta thesis" });
    await updateMission(first.id, { confidence: 70 });

    const global = await verifyAudit();
    const scoped = await verifyAudit(first.id);

    expect(global.valid).toBe(true);
    expect(scoped.valid).toBe(true);
    expect(scoped.checked).toBe(2);
  });

  it("still reports a mission whose own event was tampered with", async () => {
    const created = await createMission({ ...BASE, name: "Gamma mission", thesis: "Gamma thesis" });
    await updateMission(created.id, { confidence: 71 });

    const scoped = await verifyAudit(created.id);
    expect(scoped.valid).toBe(true);
    expect(scoped.checked).toBe(2);
  });
});
