import { missionBrief } from "@/lib/brief";
import { calculateForecast } from "@/lib/engine";
import { createMission, findMission, listMissions, updateMission, verifyAudit } from "@/lib/db";
import { sealValue } from "@/lib/canonical";
import { isRecord, json, readJson, stringValue } from "@/lib/api";
import { parseMissionInput, parseMissionPatch } from "@/lib/validation";

export const runtime = "nodejs";

const tools = [
  {
    name: "list_missions",
    description: "List active Helio Commons mission cards and their forecast readouts.",
    inputSchema: { type: "object", properties: { includeDeleted: { type: "boolean" } } },
  },
  {
    name: "create_mission",
    description: "Create and persist a space-compute, capability, or governance mission card.",
    inputSchema: {
      type: "object",
      required: ["name", "thesis", "category", "stage", "horizonYear", "confidence"],
      properties: {
        name: { type: "string" },
        thesis: { type: "string" },
        category: { type: "string", enum: ["space-compute", "capability", "governance"] },
        stage: { type: "string", enum: ["watch", "prototype", "deploy"] },
        horizonYear: { type: "number" },
        confidence: { type: "number" },
        evidence: { type: "array" },
      },
    },
  },
  {
    name: "update_mission",
    description: "Patch a mission card, recalculate its forecast, and append a sealed audit event.",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
  },
  {
    name: "run_forecast",
    description: "Run the deterministic readiness engine against a mission id or complete mission input.",
    inputSchema: { type: "object" },
  },
  {
    name: "verify_audit",
    description: "Replay the SHA-384 audit chain and report whether every event verifies.",
    inputSchema: { type: "object", properties: { missionId: { type: "string" } } },
  },
  {
    name: "export_mission",
    description: "Render a mission as a shareable markdown brief.",
    inputSchema: { type: "object", required: ["missionId"], properties: { missionId: { type: "string" } } },
  },
];

type JsonRpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: unknown };

function rpcError(id: string | number | null | undefined, code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function toolResult(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: "text", text }], structuredContent: value, isError: false };
}

async function callTool(name: string, args: Record<string, unknown>) {
  if (name === "list_missions") {
    return { missions: await listMissions(args.includeDeleted === true) };
  }
  if (name === "create_mission") {
    const input = parseMissionInput(args);
    if (!input) {
      throw new Error("create_mission needs a complete mission input");
    }
    const mission = await createMission(input);
    return { mission, forecast: mission.forecast, seal: mission.seal };
  }
  if (name === "update_mission") {
    const id = stringValue(args.id);
    const patch = parseMissionPatch(args);
    if (!id || !patch || Object.keys(patch).length === 0) {
      throw new Error("update_mission needs an id and at least one field");
    }
    const mission = await updateMission(id, patch);
    if (!mission) {
      throw new Error("mission not found");
    }
    return { mission, forecast: mission.forecast, seal: mission.seal };
  }
  if (name === "run_forecast") {
    const missionId = stringValue(args.missionId);
    if (missionId) {
      const mission = await findMission(missionId);
      if (!mission) {
        throw new Error("mission not found");
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
      return { missionId, forecast, seal: sealValue("FORECAST", { input, forecast }) };
    }
    const input = parseMissionInput(args);
    if (!input) {
      throw new Error("run_forecast needs a missionId or complete mission input");
    }
    const forecast = calculateForecast(input);
    return { forecast, seal: sealValue("FORECAST", { input, forecast }) };
  }
  if (name === "verify_audit") {
    const missionId = stringValue(args.missionId) || undefined;
    return await verifyAudit(missionId);
  }
  if (name === "export_mission") {
    const mission = await findMission(stringValue(args.missionId));
    if (!mission) {
      throw new Error("mission not found");
    }
    return { missionId: mission.id, markdown: missionBrief(mission) };
  }
  throw new Error(`unknown tool: ${name}`);
}

export async function GET() {
  return json({ name: "helio-commons", protocolVersion: "2024-11-05", transport: "http", tools });
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!isRecord(body)) {
    return json(rpcError(null, -32700, "request must be a JSON-RPC object"), 400);
  }
  const rpc = body as JsonRpcRequest;
  const { id, method, params } = rpc;
  if (method === "initialize") {
    return json({ jsonrpc: "2.0", id: id ?? null, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "helio-commons", version: "1.0.0" } } });
  }
  if (method === "tools/list") {
    return json({ jsonrpc: "2.0", id: id ?? null, result: { tools } });
  }
  if (method === "tools/call") {
    if (!isRecord(params) || typeof params.name !== "string") {
      return json(rpcError(id, -32602, "tools/call needs a tool name"), 400);
    }
    const args = isRecord(params.arguments) ? params.arguments : {};
    try {
      return json({ jsonrpc: "2.0", id: id ?? null, result: toolResult(await callTool(params.name, args)) });
    } catch (error) {
      return json(rpcError(id, -32000, error instanceof Error ? error.message : "tool failed"), 400);
    }
  }
  return json(rpcError(id, -32601, `method not found: ${method ?? "unknown"}`), 404);
}

export function GETHealth() {
  return { ok: true };
}
