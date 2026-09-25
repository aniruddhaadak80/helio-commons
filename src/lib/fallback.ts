import type { MissionCategory, MissionInput, MissionStage, ResearchSignal } from "@/lib/types";

export const FALLBACK_SIGNALS: ResearchSignal[] = [
  {
    id: "fallback-suncatcher-2026",
    title: "Project Suncatcher prepares its first in-orbit TPU test",
    source: "Google Research",
    url: "https://blog.google/innovation-and-ai/technology/research/google-project-suncatcher/",
    publishedAt: "2026-09-24T00:00:00.000Z",
    kind: "primary",
    summary: "A prototype mission will test radiation, launch loads, and thermal behavior before larger orbital compute clusters are considered.",
    tags: ["space-compute", "hardware", "thermal", "radiation"],
  },
  {
    id: "fallback-gao-space-dc-2026",
    title: "GAO maps the open engineering questions for space data centers",
    source: "U.S. GAO",
    url: "https://www.gao.gov/products/gao-26-109012",
    publishedAt: "2026-04-28T00:00:00.000Z",
    kind: "policy",
    summary: "Power, cooling, communications, economics, orbital safety, and repair remain the practical gates for orbital compute.",
    tags: ["policy", "cooling", "economics", "safety"],
  },
  {
    id: "fallback-deepmind-asi-2026",
    title: "From AGI to ASI: four possible pathways",
    source: "Google DeepMind",
    url: "https://deepmind.google/research/publications/239142/",
    publishedAt: "2026-06-12T00:00:00.000Z",
    kind: "research",
    summary: "The report frames scaling, paradigm shifts, recursive improvement, and multi-agent collectives as distinct routes beyond human-level generality.",
    tags: ["capability", "research", "agents", "forecasting"],
  },
  {
    id: "fallback-ai2040-plan-a",
    title: "AI 2040 Plan A: coordination instead of a race",
    source: "AI 2040",
    url: "https://ai-2040.com/",
    publishedAt: "2026-01-01T00:00:00.000Z",
    kind: "forecast",
    summary: "A scenario model explores how research transparency and compute governance could move generally-superhuman systems to 2040.",
    tags: ["governance", "forecasting", "compute"],
  },
  {
    id: "fallback-ai2027-takeoff",
    title: "Takeoff forecast: superhuman research as a systems problem",
    source: "AI 2027",
    url: "https://ai-2027.com/research/takeoff-forecast",
    publishedAt: "2026-01-01T00:00:00.000Z",
    kind: "forecast",
    summary: "Scenario-based estimates treat coding, research automation, software progress, and compute growth as interacting constraints.",
    tags: ["capability", "agents", "forecasting"],
  },
];

export const SEED_MISSIONS: MissionInput[] = [
  {
    name: "Suncatcher silicon survives orbit",
    thesis: "Can TPU-class accelerators survive launch, radiation, and vacuum long enough to make orbital inference useful?",
    category: "space-compute",
    stage: "prototype",
    horizonYear: 2027,
    confidence: 78,
    evidence: [
      {
        id: "seed-evidence-suncatcher",
        title: "Project Suncatcher first in-orbit test",
        source: "Google Research",
        url: "https://blog.google/innovation-and-ai/technology/research/google-project-suncatcher/",
        kind: "primary",
        date: "2026-09-24",
        verified: true,
        note: "Tests the first hardware milestone before constellation scale.",
      },
      {
        id: "seed-evidence-thermal",
        title: "Heat pipes and radiators remain the hard part",
        source: "Google Research",
        url: "https://blog.google/innovation-and-ai/technology/research/google-project-suncatcher/",
        kind: "research",
        date: "2026-09-24",
        verified: true,
        note: "Vacuum removes the familiar cooling path.",
      },
    ],
  },
  {
    name: "Optical fabric beats radio first",
    thesis: "Does a short-range free-space optical link unlock clustered orbital inference before ground downlink becomes the bottleneck?",
    category: "space-compute",
    stage: "watch",
    horizonYear: 2030,
    confidence: 64,
    evidence: [
      {
        id: "seed-evidence-gao",
        title: "Space-based data centers need new support systems",
        source: "U.S. GAO",
        url: "https://www.gao.gov/products/gao-26-109012",
        kind: "policy",
        date: "2026-04-28",
        verified: true,
      },
    ],
  },
  {
    name: "The 2040 coordination window",
    thesis: "Can researchers turn capability forecasts into a practical governance playbook before automated AI research changes the decision loop?",
    category: "governance",
    stage: "watch",
    horizonYear: 2040,
    confidence: 61,
    evidence: [
      {
        id: "seed-evidence-ai2040",
        title: "AI 2040 Plan A",
        source: "AI 2040",
        url: "https://ai-2040.com/",
        kind: "forecast",
        date: "2026-01-01",
        verified: true,
      },
      {
        id: "seed-evidence-deepmind",
        title: "From AGI to ASI",
        source: "Google DeepMind",
        url: "https://deepmind.google/research/publications/239142/",
        kind: "research",
        date: "2026-06-12",
        verified: true,
      },
    ],
  },
];

export const CATEGORY_LABELS: Record<MissionCategory, string> = {
  "space-compute": "Space compute",
  capability: "Capability",
  governance: "Governance",
};

export const STAGE_LABELS: Record<MissionStage, string> = {
  watch: "Watch",
  prototype: "Prototype",
  deploy: "Deploy",
};
