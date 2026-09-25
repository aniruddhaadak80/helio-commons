"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Plus, RefreshCw, Trash2 } from "lucide-react";
import { CATEGORY_LABELS, STAGE_LABELS } from "@/lib/fallback";
import type { Mission, MissionCategory, MissionStage } from "@/lib/types";

const initialForm = {
  name: "",
  thesis: "",
  category: "space-compute" as MissionCategory,
  stage: "watch" as MissionStage,
  horizonYear: 2027,
  confidence: 65,
  evidenceTitle: "",
  source: "",
  url: "",
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json() as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error || "request failed");
  }
  return body;
}

function shortSeal(seal: string) {
  return `${seal.slice(0, 10)}…${seal.slice(-6)}`;
}

function MissionCard({ mission, onDelete }: { mission: Mission; onDelete: (id: string) => void }) {
  return (
    <article className="mission-card">
      <div className="card-top">
        <div>
          <div className="tag-row">
            <span className="tag">{CATEGORY_LABELS[mission.category]}</span>
            <span className={`status ${mission.stage}`}>{STAGE_LABELS[mission.stage]}</span>
          </div>
          <h2 className="card-title" style={{ marginTop: 13 }}>{mission.name}</h2>
        </div>
        <div className="score-orb" aria-label={`Readiness ${mission.forecast.readiness} out of 100`}>
          <span><strong>{mission.forecast.readiness}</strong>readiness</span>
        </div>
      </div>
      <p className="card-thesis">{mission.thesis}</p>
      <div className="metric-row">
        <div className="metric"><span>horizon</span><strong>{mission.horizonYear}</strong></div>
        <div className="metric"><span>confidence</span><strong>{mission.forecast.confidence}%</strong></div>
        <div className="metric"><span>evidence</span><strong>{mission.evidence.length}</strong></div>
        <div className="metric"><span>revision</span><strong>v{mission.version}</strong></div>
      </div>
      <div className="card-footer">
        <span className="seal">seal {shortSeal(mission.seal)}</span>
        <div className="action-row" style={{ marginTop: 0 }}>
          <Link className="button button-small" href={`/mission/${mission.id}`}>Open flight plan <ArrowUpRight size={13} /></Link>
          <button className="button button-small button-danger" type="button" onClick={() => onDelete(mission.id)} aria-label={`Delete ${mission.name}`}><Trash2 size={13} /> Retire</button>
        </div>
      </div>
    </article>
  );
}

export function BoardClient() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const loadMissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestJson<{ missions: Mission[] }>("/api/missions");
      setMissions(data.missions);
      setError(false);
    } catch (loadError) {
      setError(true);
      setMessage(loadError instanceof Error ? loadError.message : "Could not load board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMissions();
    });
  }, [loadMissions]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const evidence = form.evidenceTitle ? [{
      id: `evidence-${Date.now()}`,
      title: form.evidenceTitle,
      source: form.source || "Field note",
      url: form.url,
      kind: "primary" as const,
      date: new Date().toISOString().slice(0, 10),
      verified: false,
    }] : [];
    try {
      const data = await requestJson<{ mission: Mission }>("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, evidence }),
      });
      setMissions((current) => [data.mission, ...current]);
      setForm(initialForm);
      setMessage("Mission created and sealed. Open its flight plan to add more evidence.");
      setError(false);
    } catch (createError) {
      setError(true);
      setMessage(createError instanceof Error ? createError.message : "Could not create mission");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    const mission = missions.find((item) => item.id === id);
    if (!mission || !window.confirm(`Retire “${mission.name}” from the board?`)) {
      return;
    }
    setMissions((current) => current.filter((item) => item.id !== id));
    try {
      await requestJson(`/api/missions/${id}`, { method: "DELETE" });
      setMessage("Mission retired. The sealed audit event remains replayable.");
      setError(false);
    } catch (deleteError) {
      await loadMissions();
      setError(true);
      setMessage(deleteError instanceof Error ? deleteError.message : "Could not retire mission");
    }
  }

  return (
    <div className="board-layout">
      <form className="form-panel" onSubmit={handleCreate}>
        <div className="eyebrow">New flight plan</div>
        <h2>Put a bet on the board.</h2>
        <p>Start with a question. Evidence can arrive later, and every revision gets its own seal.</p>
        <div className="field-grid">
          <div className="field"><label htmlFor="mission-name">Mission name</label><input id="mission-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Optical fabric beats radio" required /></div>
          <div className="field"><label htmlFor="mission-thesis">Working thesis</label><textarea id="mission-thesis" value={form.thesis} onChange={(event) => setForm({ ...form, thesis: event.target.value })} placeholder="What would have to be true?" required /></div>
          <div className="field"><label htmlFor="mission-category">Domain</label><select id="mission-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as MissionCategory })}><option value="space-compute">Space compute</option><option value="capability">Capability</option><option value="governance">Governance</option></select></div>
          <div className="field"><label htmlFor="mission-stage">Stage</label><select id="mission-stage" value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value as MissionStage })}><option value="watch">Watch</option><option value="prototype">Prototype</option><option value="deploy">Deploy</option></select></div>
          <div className="field-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field"><label htmlFor="mission-horizon">Horizon</label><input id="mission-horizon" type="number" min="2026" max="2050" value={form.horizonYear} onChange={(event) => setForm({ ...form, horizonYear: Number(event.target.value) })} /></div>
            <div className="field"><label htmlFor="mission-confidence">Prior confidence</label><input id="mission-confidence" type="number" min="0" max="100" value={form.confidence} onChange={(event) => setForm({ ...form, confidence: Number(event.target.value) })} /></div>
          </div>
          <div className="field"><label htmlFor="evidence-title">First evidence (optional)</label><input id="evidence-title" value={form.evidenceTitle} onChange={(event) => setForm({ ...form, evidenceTitle: event.target.value })} placeholder="Title of a source" /></div>
          <div className="field"><label htmlFor="evidence-source">Source</label><input id="evidence-source" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="Google Research / GAO / arXiv" /></div>
          <div className="field"><label htmlFor="evidence-url">Source URL</label><input id="evidence-url" type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://" /></div>
        </div>
        <div className="form-actions"><button className="button button-primary" type="submit" disabled={busy}>{busy ? "Sealing…" : "Create mission"} <Plus size={14} /></button><button className="button" type="button" onClick={() => void loadMissions()}><RefreshCw size={14} /> Refresh</button></div>
        {message ? <p className={`form-message${error ? " error" : ""}`}>{error ? "!" : "✓"} {message}</p> : null}
      </form>
      <div>
        <div className="board-toolbar" style={{ marginBottom: 12 }}>
          <span className="mono-label">Active flight plans / {missions.length}</span>
          <span className="feed-status">persist ready</span>
        </div>
        {loading ? <div className="loading-grid"><div className="loading-line" /><div className="loading-card" /><div className="loading-card" /></div> : missions.length > 0 ? <div className="mission-stack">{missions.map((mission) => <MissionCard key={mission.id} mission={mission} onDelete={handleDelete} />)}</div> : <div className="empty-state"><div><strong>No flight plans yet.</strong>Use the form to put the first question on the board.</div></div>}
      </div>
    </div>
  );
}
