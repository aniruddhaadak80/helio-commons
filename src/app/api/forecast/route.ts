import { calculateForecast } from "@/lib/engine";
import { findMission } from "@/lib/db";
import { sealValue } from "@/lib/canonical";
import { errorResponse, isRecord, json, readJson, stringValue } from "@/lib/api";
import { parseMissionInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (isRecord(body) && stringValue(body.missionId)) {
    const mission = await findMission(stringValue(body.missionId));
    if (!mission) {
      return errorResponse("mission not found", 404);
    }
    const input = {
      name: mission.name,
      thesis: mission.thesis,
      category: mission.category,
      stage: mission.stage,
      horizonYear: mission.horizonYear,
      confidence: mission.confidence,
      evidence: mission.evidence,
    };
    const forecast = calculateForecast(input);
    return json({ missionId: mission.id, forecast, seal: sealValue("FORECAST", { input, forecast }) });
  }
  const input = parseMissionInput(body);
  if (!input) {
    return errorResponse("provide a missionId or a complete mission input");
  }
  const forecast = calculateForecast(input);
  return json({ forecast, seal: sealValue("FORECAST", { input, forecast }) });
}
