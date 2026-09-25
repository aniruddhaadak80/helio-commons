import { deleteMission, findMission, updateMission } from "@/lib/db";
import { errorResponse, json, readJson } from "@/lib/api";
import { parseMissionPatch } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const mission = await findMission(id);
  return mission ? json({ mission }) : errorResponse("mission not found", 404);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await readJson(request);
  const patch = parseMissionPatch(body);
  if (!patch || Object.keys(patch).length === 0) {
    return errorResponse("provide at least one mission field to update");
  }
  const mission = await updateMission(id, patch);
  return mission ? json({ mission }) : errorResponse("mission not found", 404);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const mission = await deleteMission(id);
  return mission ? json({ mission, deleted: true }) : errorResponse("mission not found", 404);
}
