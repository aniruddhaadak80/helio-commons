import type { Evidence, EvidenceInput, MissionCategory, MissionInput, MissionStage } from "@/lib/types";
import { isRecord } from "@/lib/api";

const categories: MissionCategory[] = ["space-compute", "capability", "governance"];
const stages: MissionStage[] = ["watch", "prototype", "deploy"];
const evidenceKinds = ["research", "primary", "forecast", "policy"] as const;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseEvidence(value: unknown, index: number): Evidence {
  const input = isRecord(value) ? value : {};
  const kind = evidenceKinds.includes(input.kind as (typeof evidenceKinds)[number]) ? input.kind as EvidenceInput["kind"] : "research";
  return {
    id: text(input.id) || `evidence-${Date.now()}-${index}`,
    title: text(input.title) || "Untitled evidence",
    source: text(input.source) || "Unknown source",
    url: text(input.url),
    kind,
    date: text(input.date) || new Date().toISOString().slice(0, 10),
    verified: Boolean(input.verified),
    note: text(input.note) || undefined,
  };
}

function parseEvidenceList(value: unknown): Evidence[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value.map(parseEvidence) : [];
}

export function parseMissionInput(value: unknown): MissionInput | null {
  if (!isRecord(value)) {
    return null;
  }
  const name = text(value.name);
  const thesis = text(value.thesis);
  const category = value.category as MissionCategory;
  const stage = value.stage as MissionStage;
  if (!name || !thesis || !categories.includes(category) || !stages.includes(stage)) {
    return null;
  }
  return {
    name,
    thesis,
    category,
    stage,
    horizonYear: finiteNumber(value.horizonYear, 2027),
    confidence: finiteNumber(value.confidence, 60),
    evidence: parseEvidenceList(value.evidence) ?? [],
  };
}

export function parseMissionPatch(value: unknown): Partial<MissionInput> | null {
  if (!isRecord(value)) {
    return null;
  }
  const patch: Partial<MissionInput> = {};
  if (value.name !== undefined) {
    patch.name = text(value.name);
  }
  if (value.thesis !== undefined) {
    patch.thesis = text(value.thesis);
  }
  if (value.category !== undefined && categories.includes(value.category as MissionCategory)) {
    patch.category = value.category as MissionCategory;
  }
  if (value.stage !== undefined && stages.includes(value.stage as MissionStage)) {
    patch.stage = value.stage as MissionStage;
  }
  if (value.horizonYear !== undefined) {
    patch.horizonYear = finiteNumber(value.horizonYear, 2027);
  }
  if (value.confidence !== undefined) {
    patch.confidence = finiteNumber(value.confidence, 60);
  }
  if (value.evidence !== undefined) {
    patch.evidence = parseEvidenceList(value.evidence) ?? [];
  }
  return patch;
}
