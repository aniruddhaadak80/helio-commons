import { createMission, listMissions } from "@/lib/db";
import { errorResponse, json, readJson } from "@/lib/api";
import { parseMissionInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const includeDeleted = new URL(request.url).searchParams.get("includeDeleted") === "1";
  return json({ missions: await listMissions(includeDeleted) });
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const input = parseMissionInput(body);
  if (!input) {
    return errorResponse("name, thesis, category, stage, horizonYear, and confidence are required");
  }
  return json({ mission: await createMission(input) }, 201);
}
