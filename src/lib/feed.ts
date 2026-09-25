import { FALLBACK_SIGNALS } from "@/lib/fallback";
import type { EvidenceKind, FeedResponse, ResearchSignal } from "@/lib/types";

type FeedDefinition = {
  name: string;
  url: string;
  kind: EvidenceKind;
  tags: string[];
};

const FEEDS: FeedDefinition[] = [
  {
    name: "NASA Breaking News",
    url: "https://www.nasa.gov/rss/dyn/breaking_news.rss",
    kind: "primary",
    tags: ["space", "missions", "compute"],
  },
  {
    name: "arXiv AI",
    url: "https://export.arxiv.org/api/query?search_query=all:%22artificial%20intelligence%22&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending",
    kind: "research",
    tags: ["ai", "research", "agents"],
  },
];

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function linkValue(block: string): string {
  const atomLink = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (atomLink?.[1]) {
    return atomLink[1];
  }
  return tagValue(block, "link");
}

function dateValue(block: string): string {
  const value = tagValue(block, "published") || tagValue(block, "pubDate") || tagValue(block, "updated");
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function parseFeed(xml: string, definition: FeedDefinition): ResearchSignal[] {
  const blocks = xml.match(/<(item|entry)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi) ?? [];
  return blocks.map((block, index) => {
    const title = tagValue(block, "title") || "Untitled research signal";
    const summary = tagValue(block, "summary") || tagValue(block, "description") || "A new signal entered the research desk.";
    const url = linkValue(block) || definition.url;
    return {
      id: `${definition.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}-${title.slice(0, 24)}`,
      title,
      source: definition.name,
      url,
      publishedAt: dateValue(block),
      kind: definition.kind,
      summary: summary.length > 260 ? `${summary.slice(0, 257)}…` : summary,
      tags: definition.tags,
    };
  });
}

async function fetchFeed(definition: FeedDefinition): Promise<ResearchSignal[]> {
  const response = await fetch(definition.url, {
    next: { revalidate: 900 },
    headers: { "user-agent": "helio-commons/1.0 research desk" },
  });
  if (!response.ok) {
    throw new Error(`${definition.name} returned ${response.status}`);
  }
  return parseFeed(await response.text(), definition);
}

export async function getResearchFeed(): Promise<FeedResponse> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const sources: FeedResponse["sources"] = [];
  const liveSignals: ResearchSignal[] = [];
  results.forEach((result, index) => {
    const definition = FEEDS[index];
    if (result.status === "fulfilled" && result.value.length > 0) {
      liveSignals.push(...result.value);
      sources.push({ name: definition.name, url: definition.url, status: "live" });
    } else {
      sources.push({ name: definition.name, url: definition.url, status: "fallback" });
    }
  });
  if (liveSignals.length === 0) {
    return {
      mode: "fallback",
      fetchedAt: new Date().toISOString(),
      signals: FALLBACK_SIGNALS,
      sources: sources.map((source) => ({ ...source, status: "fallback" })),
    };
  }
  const seen = new Set<string>();
  const signals = liveSignals
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .filter((signal) => {
      const key = signal.url || signal.title;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 12);
  return { mode: "live", fetchedAt: new Date().toISOString(), signals, sources };
}
