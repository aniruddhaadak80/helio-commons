import { shortSeal } from "@/lib/canonical";
import type { Mission } from "@/lib/types";

export function missionBrief(mission: Mission): string {
  const evidence = mission.evidence.length > 0
    ? mission.evidence.map((item) => `- ${item.title} — ${item.source} (${item.date})${item.verified ? " [verified]" : ""}`).join("\n")
    : "- No evidence attached yet";
  return [
    `# ${mission.name}`,
    "",
    `> ${mission.thesis}`,
    "",
    `## Readiness`,
    `- Index: ${mission.forecast.readiness}/100`,
    `- Confidence: ${mission.forecast.confidence}/100`,
    `- Horizon: ${mission.forecast.horizonYear} (${mission.forecast.horizonLabel})`,
    `- Posture: ${mission.forecast.posture}`,
    `- Seal: ${shortSeal(mission.seal)}`,
    "",
    "## Factor readout",
    ...mission.forecast.factors.map((factor) => `- ${factor.label}: ${factor.value}/${factor.weight} — ${factor.detail}`),
    "",
    "## Evidence",
    evidence,
    "",
    "## Method note",
    "This is an explainable planning aid, not a scientific forecast, investment recommendation, or safety certification. Revisit the evidence as hardware, policy, and capability assumptions change.",
  ].join("\n");
}
