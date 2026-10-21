import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { canonicalJson, sealValue } from "@/lib/canonical";
import { buildSealedMission, calculateForecast, normalizeMissionInput } from "@/lib/engine";
import { SEED_MISSIONS } from "@/lib/fallback";
import type { AuditEvent, AuditVerification, Evidence, Forecast, Mission, MissionInput } from "@/lib/types";

const GENESIS_SEAL = "GENESIS";

type MemoryState = {
  missions: Mission[];
  audit: AuditEvent[];
  seeded: boolean;
};

type MissionRow = {
  id: string;
  name: string;
  thesis: string;
  category: Mission["category"];
  stage: Mission["stage"];
  horizon_year: number;
  confidence: number;
  status: Mission["status"];
  evidence: unknown;
  forecast: unknown;
  prev_seal: string;
  seal: string;
  version: number;
  created_at: string | Date;
  updated_at: string | Date;
};

type AuditRow = {
  id: string;
  mission_id: string;
  action: AuditEvent["action"];
  event_data: unknown;
  prev_seal: string;
  seal: string;
  created_at: string | Date;
};

const globalState = globalThis as typeof globalThis & { __helioMemory?: MemoryState };

function memoryState(): MemoryState {
  if (!globalState.__helioMemory) {
    globalState.__helioMemory = { missions: [], audit: [], seeded: false };
  }
  return globalState.__helioMemory;
}

type SqlClient = ReturnType<typeof neon>;

function sqlClient(): SqlClient | null {
  return process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
}

async function queryRows<T extends Record<string, unknown> = Record<string, unknown>>(sql: SqlClient, statement: string, params?: unknown[]): Promise<T[]> {
  const result = await sql.query(statement, params);
  return result as unknown as T[];
}

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return (value as T | null) ?? fallback;
}

function rowToMission(row: MissionRow): Mission {
  const input: MissionInput = {
    name: row.name,
    thesis: row.thesis,
    category: row.category,
    stage: row.stage,
    horizonYear: row.horizon_year,
    confidence: row.confidence,
    evidence: parseJson<Evidence[]>(row.evidence, []),
  };
  return {
    ...input,
    evidence: input.evidence ?? [],
    id: row.id,
    status: row.status,
    forecast: parseJson<Forecast>(row.forecast, calculateForecast(input)),
    prevSeal: row.prev_seal,
    seal: row.seal,
    version: row.version,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function rowToAudit(row: AuditRow): AuditEvent {
  const event = parseJson<Record<string, unknown>>(row.event_data, {});
  return {
    id: row.id,
    missionId: row.mission_id,
    action: row.action,
    payload: parseJson<Record<string, unknown>>(event.payload, {}),
    prevSeal: row.prev_seal,
    seal: row.seal,
    at: iso(row.created_at),
  };
}

function eventData(action: AuditEvent["action"], missionId: string, payload: unknown, previousSeal: string, at: string) {
  return { action, missionId, payload, at, prevSeal: previousSeal };
}

function missionAuditPayload(mission: Mission) {
  return {
    name: mission.name,
    thesis: mission.thesis,
    category: mission.category,
    stage: mission.stage,
    horizonYear: mission.horizonYear,
    confidence: mission.confidence,
    evidence: mission.evidence,
    forecast: mission.forecast,
    version: mission.version,
  };
}

function seedMemory(): void {
  const state = memoryState();
  if (state.seeded) {
    return;
  }
  let previousSeal = GENESIS_SEAL;
  for (const input of SEED_MISSIONS) {
    const id = `seed-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
    const now = "2026-09-25T00:00:00.000Z";
    const normalized = normalizeMissionInput(input);
    const mission = buildSealedMission(normalized, previousSeal, now, id);
    const payload = { ...normalized } as Record<string, unknown>;
    state.audit.push({
      id: `audit-${mission.id}`,
      missionId: mission.id,
      action: "created",
      payload,
      prevSeal: previousSeal,
      seal: mission.seal,
      at: now,
    });
    state.missions.push(mission);
    previousSeal = mission.seal;
  }
  state.seeded = true;
}

async function lastAuditSeal(): Promise<string> {
  const sql = sqlClient();
  if (!sql) {
    seedMemory();
    return memoryState().audit.at(-1)?.seal ?? GENESIS_SEAL;
  }
  const result = await queryRows(sql, "SELECT seal FROM helio_audit_events ORDER BY sequence DESC LIMIT 1");
  return String(result[0]?.seal ?? GENESIS_SEAL);
}

async function insertAudit(event: AuditEvent, fullEvent: Record<string, unknown>): Promise<void> {
  const sql = sqlClient();
  if (!sql) {
    memoryState().audit.push(event);
    return;
  }
  await queryRows(sql,
    "INSERT INTO helio_audit_events (id, mission_id, action, event_data, prev_seal, seal, created_at) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)",
    [event.id, event.missionId, event.action, JSON.stringify(fullEvent), event.prevSeal, event.seal, event.at],
  );
}

async function insertMission(mission: Mission): Promise<void> {
  const sql = sqlClient();
  if (!sql) {
    memoryState().missions.push(mission);
    return;
  }
  await queryRows(sql,
    "INSERT INTO helio_missions (id, name, thesis, category, stage, horizon_year, confidence, status, evidence, forecast, prev_seal, seal, version, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13, $14, $15)",
    [mission.id, mission.name, mission.thesis, mission.category, mission.stage, mission.horizonYear, mission.confidence, mission.status, JSON.stringify(mission.evidence), JSON.stringify(mission.forecast), mission.prevSeal, mission.seal, mission.version, mission.createdAt, mission.updatedAt],
  );
}

async function seedDatabase(): Promise<void> {
  const sql = sqlClient();
  if (!sql) {
    seedMemory();
    return;
  }
  const countResult = await queryRows(sql, "SELECT COUNT(*)::int AS count FROM helio_missions");
  if (Number(countResult[0]?.count ?? 0) > 0) {
    return;
  }
  let previousSeal = GENESIS_SEAL;
  for (const input of SEED_MISSIONS) {
    const now = "2026-09-25T00:00:00.000Z";
    const normalized = normalizeMissionInput(input);
    const mission = buildSealedMission(normalized, previousSeal, now, randomUUID());
    const payload = { ...normalized } as Record<string, unknown>;
    const fullEvent = eventData("created", mission.id, payload, previousSeal, now);
    await insertMission(mission);
    await insertAudit({ id: randomUUID(), missionId: mission.id, action: "created", payload, prevSeal: previousSeal, seal: mission.seal, at: now }, fullEvent);
    previousSeal = mission.seal;
  }
}

export async function ensureSeeded(): Promise<void> {
  if (sqlClient()) {
    await seedDatabase();
  } else {
    seedMemory();
  }
}

export async function listMissions(includeDeleted = false): Promise<Mission[]> {
  await ensureSeeded();
  const sql = sqlClient();
  if (!sql) {
    return memoryState().missions
      .filter((mission) => includeDeleted || mission.status === "active")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  const result = includeDeleted
    ? await queryRows(sql, "SELECT * FROM helio_missions ORDER BY updated_at DESC")
    : await queryRows(sql, "SELECT * FROM helio_missions WHERE deleted_at IS NULL ORDER BY updated_at DESC");
  return result.map((row) => rowToMission(row as MissionRow));
}

export async function findMission(id: string, includeDeleted = false): Promise<Mission | null> {
  await ensureSeeded();
  const sql = sqlClient();
  if (!sql) {
    const mission = memoryState().missions.find((item) => item.id === id);
    return mission && (includeDeleted || mission.status === "active") ? mission : null;
  }
  const result = includeDeleted
    ? await queryRows(sql, "SELECT * FROM helio_missions WHERE id = $1 LIMIT 1", [id])
    : await queryRows(sql, "SELECT * FROM helio_missions WHERE id = $1 AND deleted_at IS NULL LIMIT 1", [id]);
  return result[0] ? rowToMission(result[0] as MissionRow) : null;
}

export async function createMission(input: MissionInput): Promise<Mission> {
  await ensureSeeded();
  const previousSeal = await lastAuditSeal();
  const now = new Date().toISOString();
  const normalized = normalizeMissionInput(input);
  const mission = buildSealedMission(normalized, previousSeal, now, randomUUID());
  const payload = { ...normalized } as Record<string, unknown>;
  const fullEvent = eventData("created", mission.id, payload, previousSeal, now);
  await insertMission(mission);
  await insertAudit({ id: randomUUID(), missionId: mission.id, action: "created", payload, prevSeal: previousSeal, seal: mission.seal, at: now }, fullEvent);
  return mission;
}

export async function updateMission(id: string, patch: Partial<MissionInput>): Promise<Mission | null> {
  const current = await findMission(id);
  if (!current) {
    return null;
  }
  await ensureSeeded();
  const previousSeal = await lastAuditSeal();
  const now = new Date().toISOString();
  const nextInput = normalizeMissionInput({
    name: patch.name ?? current.name,
    thesis: patch.thesis ?? current.thesis,
    category: patch.category ?? current.category,
    stage: patch.stage ?? current.stage,
    horizonYear: patch.horizonYear ?? current.horizonYear,
    confidence: patch.confidence ?? current.confidence,
    evidence: patch.evidence ?? current.evidence,
  });
  const forecast = calculateForecast(nextInput);
  const before = missionAuditPayload(current);
  const draft = {
    ...nextInput,
    id,
    status: current.status,
    evidence: nextInput.evidence ?? [],
    forecast,
    prevSeal: previousSeal,
    seal: "",
    version: current.version + 1,
    createdAt: current.createdAt,
    updatedAt: now,
  } satisfies Mission;
  const after = missionAuditPayload(draft);
  const fullEvent = eventData("updated", id, { before, after }, previousSeal, now);
  const next: Mission = { ...draft, seal: sealValue(previousSeal, fullEvent) };
  const sql = sqlClient();
  if (!sql) {
    const state = memoryState();
    const index = state.missions.findIndex((item) => item.id === id);
    if (index >= 0) {
      state.missions[index] = next;
    }
  } else {
    await queryRows(sql,
      "UPDATE helio_missions SET name = $1, thesis = $2, category = $3, stage = $4, horizon_year = $5, confidence = $6, evidence = $7::jsonb, forecast = $8::jsonb, prev_seal = $9, seal = $10, version = $11, updated_at = $12 WHERE id = $13",
      [next.name, next.thesis, next.category, next.stage, next.horizonYear, next.confidence, JSON.stringify(next.evidence), JSON.stringify(next.forecast), next.prevSeal, next.seal, next.version, next.updatedAt, id],
    );
  }
  await insertAudit({ id: randomUUID(), missionId: id, action: "updated", payload: { before, after }, prevSeal: previousSeal, seal: next.seal, at: now }, fullEvent);
  return next;
}

export async function deleteMission(id: string): Promise<Mission | null> {
  const current = await findMission(id);
  if (!current) {
    return null;
  }
  await ensureSeeded();
  const previousSeal = await lastAuditSeal();
  const now = new Date().toISOString();
  const before = missionAuditPayload(current);
  const after = { ...before, status: "retired", retiredAt: now };
  const fullEvent = eventData("deleted", id, { before, after }, previousSeal, now);
  const next: Mission = {
    ...current,
    status: "retired",
    prevSeal: previousSeal,
    seal: sealValue(previousSeal, fullEvent),
    version: current.version + 1,
    updatedAt: now,
  };
  const sql = sqlClient();
  if (!sql) {
    const state = memoryState();
    const index = state.missions.findIndex((item) => item.id === id);
    if (index >= 0) {
      state.missions[index] = next;
    }
  } else {
    await queryRows(sql,
      "UPDATE helio_missions SET status = $1, prev_seal = $2, seal = $3, version = $4, updated_at = $5, deleted_at = $5 WHERE id = $6",
      [next.status, next.prevSeal, next.seal, next.version, next.updatedAt, id],
    );
  }
  await insertAudit({ id: randomUUID(), missionId: id, action: "deleted", payload: { before, after }, prevSeal: previousSeal, seal: next.seal, at: now }, fullEvent);
  return next;
}

export async function listAudit(missionId?: string): Promise<AuditEvent[]> {
  await ensureSeeded();
  const sql = sqlClient();
  if (!sql) {
    return memoryState().audit.filter((event) => !missionId || event.missionId === missionId);
  }
  const result = missionId
    ? await queryRows(sql, "SELECT * FROM helio_audit_events WHERE mission_id = $1 ORDER BY sequence ASC", [missionId])
    : await queryRows(sql, "SELECT * FROM helio_audit_events ORDER BY sequence ASC");
  return result.map((row) => rowToAudit(row as AuditRow));
}

export async function verifyAudit(missionId?: string): Promise<AuditVerification> {
  // The audit chain is global: every event links to the seal of the event
  // before it, across missions. Replaying only one mission's events would
  // compare each event against the wrong predecessor as soon as another
  // mission is written in between, so the whole chain is replayed and the
  // result is then reported for the requested mission.
  const chain = await listAudit();
  const scope = missionId ? chain.filter((event) => event.missionId === missionId) : chain;
  let previousSeal = GENESIS_SEAL;
  let brokenIndex = -1;
  let brokenEventId: string | undefined;
  for (let index = 0; index < chain.length; index += 1) {
    const event = chain[index];
    const fullEvent = eventData(event.action, event.missionId, event.payload, event.prevSeal, event.at);
    if (event.prevSeal !== previousSeal || sealValue(event.prevSeal, fullEvent) !== event.seal) {
      brokenIndex = index;
      brokenEventId = event.id;
      break;
    }
    previousSeal = event.seal;
  }
  if (brokenIndex === -1) {
    return { valid: true, checked: scope.length, lastSeal: previousSeal };
  }
  // A mission-scoped request only fails when the break touches that mission:
  // either the broken event is one of its own, or one of its events comes
  // after the break and can no longer be trusted.
  const scopeIndexes = scope.map((event) => chain.indexOf(event));
  const scopeAffected = scopeIndexes.some((index) => index >= brokenIndex);
  if (missionId && !scopeAffected) {
    return { valid: true, checked: scope.length, lastSeal: previousSeal };
  }
  const checked = scopeIndexes.filter((index) => index < brokenIndex).length;
  return { valid: false, checked, brokenAt: brokenEventId, lastSeal: previousSeal };
}

export function storageMode(): "neon" | "memory" {
  return process.env.DATABASE_URL ? "neon" : "memory";
}

export function canonicalize(value: unknown): string {
  return canonicalJson(value);
}
