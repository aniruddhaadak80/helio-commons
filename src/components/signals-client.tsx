"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, RefreshCw, Satellite } from "lucide-react";
import type { FeedResponse, Mission, ResearchSignal } from "@/lib/types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "request failed");
  return body;
}

export function SignalsClient() {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [feedData, missionData] = await Promise.all([
        requestJson<FeedResponse>("/api/feed", { cache: "no-store" }),
        requestJson<{ missions: Mission[] }>("/api/missions"),
      ]);
      setFeed(feedData);
      setMissions(missionData.missions);
      setSelectedMission((current) => current || missionData.missions[0]?.id || "");
      setMessage("");
    } catch (loadError) {
      setMessage(loadError instanceof Error ? loadError.message : "Could not load research desk");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAll();
    });
  }, [loadAll]);

  async function trackSignal(signal: ResearchSignal) {
    if (!selectedMission) {
      setMessage("Create a mission on the board before tracking a signal.");
      return;
    }
    const mission = missions.find((item) => item.id === selectedMission);
    if (!mission) return;
    setBusy(signal.id);
    const evidence = {
      id: `tracked-${signal.id}`,
      title: signal.title,
      source: signal.source,
      url: signal.url,
      kind: signal.kind,
      date: signal.publishedAt.slice(0, 10),
      verified: false,
      note: "Tracked from the live research desk.",
    };
    try {
      const data = await requestJson<{ mission: Mission }>(`/api/missions/${mission.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evidence: [...mission.evidence, evidence] }) });
      setMissions((current) => current.map((item) => item.id === mission.id ? data.mission : item));
      setMessage(`Tracked “${signal.title}” on ${data.mission.name}. The mission seal advanced.`);
    } catch (trackError) {
      setMessage(trackError instanceof Error ? trackError.message : "Could not track signal");
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <div className="loading-page"><div><h1>Tuning research desk</h1><p>Checking public feeds and the mission board.</p></div></div>;
  }

  return (
    <div>
      <div className="board-toolbar" style={{ marginBottom: 18 }}>
        <span className={`feed-status${feed?.mode === "fallback" ? " fallback" : ""}`}>{feed?.mode === "fallback" ? "offline sample" : "live feed"}</span>
        <div className="action-row" style={{ marginTop: 0 }}><select className="button button-small" value={selectedMission} onChange={(event) => setSelectedMission(event.target.value)} aria-label="Mission to track"><option value="">Choose a mission</option>{missions.map((mission) => <option key={mission.id} value={mission.id}>{mission.name}</option>)}</select><button className="button button-small" type="button" onClick={() => void loadAll()}><RefreshCw size={13} /> Refresh feed</button></div>
      </div>
      <div className="horizon-map" aria-label="Research horizon map">
        <div className="horizon-step"><strong>2026—27</strong><span>Hardware and launch tests make the near-term legible.</span></div>
        <div className="horizon-step"><strong>2028—30</strong><span>Clusters, links, and supply chains decide whether prototypes compound.</span></div>
        <div className="horizon-step"><strong>2031—35</strong><span>Scale assumptions meet energy, cooling, and orbital governance limits.</span></div>
        <div className="horizon-step"><strong>2036—40</strong><span>Capability scenarios and coordination choices become first-order.</span></div>
      </div>
      {message ? <p className="inline-message">{message}</p> : null}
      <div className="signal-grid">{feed?.signals.map((signal) => <article className="signal-card" key={signal.id}><div className="signal-meta"><span>{signal.source}</span><span>{new Date(signal.publishedAt).toLocaleDateString()}</span></div><h2>{signal.title}</h2><p>{signal.summary}</p><div className="tag-row">{signal.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><div className="signal-actions"><a href={signal.url} target="_blank" rel="noreferrer">Read source <ExternalLink size={12} style={{ verticalAlign: "-2px" }} /></a><button className="button button-small" type="button" onClick={() => void trackSignal(signal)} disabled={busy === signal.id}><Check size={13} /> {busy === signal.id ? "Tracking…" : "Track on mission"}</button></div></article>)}</div>
      <div className="method-card" style={{ marginTop: 16 }}><div className="eyebrow"><Satellite size={14} style={{ verticalAlign: "-3px" }} /> Feed provenance</div><p>{feed?.sources.map((source) => `${source.name}: ${source.status}`).join(" · ")}. When public feeds fail, the app serves a dated, attributed baseline so the first paint and demo remain useful.</p></div>
    </div>
  );
}
