import { ensureSeeded, listMissions, storageMode, verifyAudit } from "@/lib/db";
import { json } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureSeeded();
    const missions = await listMissions();
    const audit = await verifyAudit();
    return json({
      ok: true,
      service: "helio-commons",
      storage: storageMode(),
      missions: missions.length,
      auditValid: audit.valid,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return json({ ok: false, service: "helio-commons", error: "persistence unavailable" }, 503);
  }
}
