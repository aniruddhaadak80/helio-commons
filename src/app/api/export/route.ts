import { missionBrief } from "@/lib/brief";
import { findMission } from "@/lib/db";
import { errorResponse } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const missionId = new URL(request.url).searchParams.get("missionId");
  if (!missionId) {
    return errorResponse("missionId is required");
  }
  const mission = await findMission(missionId);
  if (!mission) {
    return errorResponse("mission not found", 404);
  }
  return new Response(missionBrief(mission), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${mission.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md"`,
    },
  });
}
