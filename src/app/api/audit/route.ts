import { listAudit } from "@/lib/db";
import { json } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const missionId = new URL(request.url).searchParams.get("missionId") || undefined;
  return json({ events: await listAudit(missionId) });
}
