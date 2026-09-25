import type { Mission, MissionInput } from "@/lib/types";
import { canonicalJson, sealValue } from "@/lib/canonical";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeEvidence(input: MissionInput) {
  return (input.evidence ?? []).map((item, index) => ({
    id: item.id ?? `evidence-${Date.now()}-${index}`,
    title: item.title.trim(),
    source: item.source.trim(),
    url: item.url.trim(),
    kind: item.kind,
    date: item.date,
    verified: Boolean(item.verified),
    note: item.note?.trim() || undefined,
  }));
}

export function calculateForecast(input: MissionInput, referenceYear = 2026) {
  const evidence = normalizeEvidence(input);
  const verifiedCount = evidence.filter((item) => item.verified).length;
  const uniqueKinds = new Set(evidence.map((item) => item.kind)).size;
  const evidenceDepth = clamp(8 + evidence.length * 7 + verifiedCount * 5, 0, 40);
  const horizonDistance = Math.max(0, input.horizonYear - referenceYear);
  const horizonMomentum = clamp(28 - horizonDistance * 2, 4, 28);
  const stageValue = { watch: 9, prototype: 17, deploy: 24 }[input.stage] ?? 9;
  const coordinationValue = clamp(5 + uniqueKinds * 4 + (evidence.some((item) => item.kind === "policy") ? 3 : 0), 0, 20);
  const readiness = clamp(Math.round(evidenceDepth + horizonMomentum + stageValue + coordinationValue), 0, 100);
  const evidenceConfidence = clamp(34 + verifiedCount * 12 + uniqueKinds * 6, 20, 88);
  const horizonUncertainty = clamp(horizonDistance * 1.8, 0, 22);
  const priorAdjustment = (clamp(input.confidence, 0, 100) - 50) * 0.22;
  const confidence = clamp(Math.round(evidenceConfidence - horizonUncertainty + priorAdjustment), 12, 94);
  const horizonLabel = input.horizonYear <= referenceYear ? "now" : input.horizonYear <= 2027 ? "near-term" : input.horizonYear <= 2030 ? "mid-horizon" : input.horizonYear <= 2040 ? "long-horizon" : "far-horizon";
  const posture = readiness >= 75 ? "ready for a bounded test" : readiness >= 55 ? "promising, instrument the constraints" : "watch the bottleneck before scaling";
  const factors = [
    {
      key: "evidence" as const,
      label: "Evidence depth",
      value: evidenceDepth,
      weight: 40,
      detail: `${evidence.length} source${evidence.length === 1 ? "" : "s"}, ${verifiedCount} verified`,
    },
    {
      key: "horizon" as const,
      label: "Horizon momentum",
      value: horizonMomentum,
      weight: 28,
      detail: `${input.horizonYear} target · ${horizonLabel}`,
    },
    {
      key: "stage" as const,
      label: "Stage leverage",
      value: stageValue,
      weight: 24,
      detail: `${input.stage} stage`,
    },
    {
      key: "coordination" as const,
      label: "Coordination surface",
      value: coordinationValue,
      weight: 20,
      detail: `${uniqueKinds} evidence type${uniqueKinds === 1 ? "" : "s"} in the mix`,
    },
  ];
  const narrative = `${posture}. The strongest lever is ${factors.reduce((best, factor) => factor.value > best.value ? factor : best).label.toLowerCase()}; the main drag is ${horizonUncertainty > 12 ? "the distance to the stated horizon" : "the number of verified constraints"}.`;
  return {
    readiness,
    confidence,
    horizonYear: input.horizonYear,
    horizonLabel,
    posture,
    factors,
    narrative,
    referenceYear,
  };
}

export function normalizeMissionInput(input: MissionInput): MissionInput {
  return {
    name: input.name.trim(),
    thesis: input.thesis.trim(),
    category: input.category,
    stage: input.stage,
    horizonYear: clamp(Math.round(input.horizonYear), 2026, 2050),
    confidence: clamp(Math.round(input.confidence), 0, 100),
    evidence: normalizeEvidence(input),
  };
}

export function buildSealedMission(input: MissionInput, previousSeal: string, now: string, id: string): Mission {
  const normalized = normalizeMissionInput(input);
  const forecast = calculateForecast(normalized);
  const event = {
    action: "created" as const,
    missionId: id,
    payload: normalized,
    at: now,
    prevSeal: previousSeal,
  };
  const seal = sealValue(previousSeal, event);
  return {
    ...normalized,
    id,
    status: "active",
    evidence: normalized.evidence ?? [],
    forecast,
    prevSeal: previousSeal,
    seal,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function canonicalMissionPayload(mission: Mission): string {
  return canonicalJson({
    name: mission.name,
    thesis: mission.thesis,
    category: mission.category,
    stage: mission.stage,
    horizonYear: mission.horizonYear,
    confidence: mission.confidence,
    evidence: mission.evidence,
  });
}
