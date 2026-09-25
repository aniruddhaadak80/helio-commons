export type MissionCategory = "space-compute" | "capability" | "governance";
export type MissionStage = "watch" | "prototype" | "deploy";
export type MissionStatus = "active" | "retired";
export type EvidenceKind = "research" | "primary" | "forecast" | "policy";

export interface Evidence {
  id: string;
  title: string;
  source: string;
  url: string;
  kind: EvidenceKind;
  date: string;
  verified: boolean;
  note?: string;
}

export interface EvidenceInput {
  id?: string;
  title: string;
  source: string;
  url: string;
  kind: EvidenceKind;
  date: string;
  verified: boolean;
  note?: string;
}

export interface ForecastFactor {
  key: "evidence" | "horizon" | "stage" | "coordination";
  label: string;
  value: number;
  weight: number;
  detail: string;
}

export interface Forecast {
  readiness: number;
  confidence: number;
  horizonYear: number;
  horizonLabel: string;
  posture: string;
  factors: ForecastFactor[];
  narrative: string;
  referenceYear: number;
}

export interface MissionInput {
  name: string;
  thesis: string;
  category: MissionCategory;
  stage: MissionStage;
  horizonYear: number;
  confidence: number;
  evidence?: Evidence[];
}

export interface Mission extends MissionInput {
  id: string;
  status: MissionStatus;
  evidence: Evidence[];
  forecast: Forecast;
  prevSeal: string;
  seal: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchSignal {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  kind: EvidenceKind;
  summary: string;
  tags: string[];
}

export interface FeedResponse {
  mode: "live" | "fallback";
  fetchedAt: string;
  signals: ResearchSignal[];
  sources: Array<{ name: string; url: string; status: "live" | "fallback" }>;
}

export interface AuditEvent {
  id: string;
  missionId: string;
  action: "created" | "updated" | "deleted";
  payload: Record<string, unknown>;
  prevSeal: string;
  seal: string;
  at: string;
}

export interface AuditVerification {
  valid: boolean;
  checked: number;
  brokenAt?: string;
  lastSeal: string;
}
