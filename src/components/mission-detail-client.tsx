"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Download, FileCheck2, Play, Plus, Save, Trash2 } from "lucide-react";
import type { AuditEvent, Evidence, Mission } from "@/lib/types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json() as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error || "request failed");
  }
  return body;
}

function shortSeal(seal: string) {
  return `${seal.slice(0, 12)}…${seal.slice(-8)}`;
}

export function MissionDetailClient({ missionId }: { missionId: string }) {
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [forecastSeal, setForecastSeal] = useState("");
  const [verification, setVerification] = useState<{ valid: boolean; checked: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState({ name: "", thesis: "", category: "space-compute", stage: "watch", horizonYear: 2027, confidence: 65 });
  const [evidenceForm, setEvidenceForm] = useState({ title: "", source: "", url: "", kind: "research", date: new Date().toISOString().slice(0, 10), verified: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [missionData, auditData] = await Promise.all([
        requestJson<{ mission: Mission }>(`/api/missions/${missionId}`),
        requestJson<{ events: AuditEvent[] }>(`/api/audit?missionId=${encodeURIComponent(missionId)}`),
      ]);
      setMission(missionData.mission);
      setEvents(auditData.events);
      setDraft({ name: missionData.mission.name, thesis: missionData.mission.thesis, category: missionData.mission.category, stage: missionData.mission.stage, horizonYear: missionData.mission.horizonYear, confidence: missionData.mission.confidence });
      setError(false);
    } catch (loadError) {
      setError(true);
      setMessage(loadError instanceof Error ? loadError.message : "Could not load mission");
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function saveMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mission) return;
    setBusy(true);
    try {
      const data = await requestJson<{ mission: Mission }>(`/api/missions/${mission.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      setMission(data.mission);
      setMessage("Revision saved and sealed.");
      setError(false);
      await load();
    } catch (saveError) {
      setError(true);
      setMessage(saveError instanceof Error ? saveError.message : "Could not save mission");
    } finally {
      setBusy(false);
    }
  }

  async function runForecast() {
    if (!mission) return;
    setBusy(true);
    try {
      const data = await requestJson<{ forecast: Mission["forecast"]; seal: string }>("/api/forecast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ missionId: mission.id }) });
      setMission({ ...mission, forecast: data.forecast });
      setForecastSeal(data.seal);
      setMessage(`Forecast replayed. Seal ${shortSeal(data.seal)}.`);
      setError(false);
    } catch (forecastError) {
      setError(true);
      setMessage(forecastError instanceof Error ? forecastError.message : "Could not run forecast");
    } finally {
      setBusy(false);
    }
  }

  async function addEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mission) return;
    setBusy(true);
    const evidence: Evidence = { id: `evidence-${Date.now()}`, title: evidenceForm.title, source: evidenceForm.source, url: evidenceForm.url, kind: evidenceForm.kind as Evidence["kind"], date: evidenceForm.date, verified: evidenceForm.verified };
    try {
      const data = await requestJson<{ mission: Mission }>(`/api/missions/${mission.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evidence: [...mission.evidence, evidence] }) });
      setMission(data.mission);
      setEvidenceForm({ title: "", source: "", url: "", kind: "research", date: new Date().toISOString().slice(0, 10), verified: false });
      setMessage("Evidence attached. The forecast and seal were recalculated.");
      setError(false);
      await load();
    } catch (evidenceError) {
      setError(true);
      setMessage(evidenceError instanceof Error ? evidenceError.message : "Could not attach evidence");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    try {
      const data = await requestJson<{ valid: boolean; checked: number }>(`/api/audit/verify?missionId=${encodeURIComponent(missionId)}`);
      setVerification(data);
      setMessage(data.valid ? `Chain verified across ${data.checked} events.` : "Chain verification failed.");
      setError(!data.valid);
    } catch (verifyError) {
      setError(true);
      setMessage(verifyError instanceof Error ? verifyError.message : "Could not verify chain");
    }
  }

  async function retire() {
    if (!mission || !window.confirm(`Retire “${mission.name}”?`)) return;
    setBusy(true);
    try {
      await requestJson(`/api/missions/${mission.id}`, { method: "DELETE" });
      router.push("/board");
    } catch (deleteError) {
      setError(true);
      setMessage(deleteError instanceof Error ? deleteError.message : "Could not retire mission");
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="loading-page"><div><h1>Reading flight plan</h1><p>Replaying the latest evidence and seal chain.</p></div></div>;
  }

  if (!mission) {
    return <div className="error-page"><div><h1>Mission unavailable</h1><p>{message || "This flight plan may have been retired."}</p><Link className="button button-primary" href="/board">Return to board</Link></div></div>;
  }

  return (
    <div className="detail-layout">
      <section className="detail-panel">
        <div className="detail-header">
          <div>
            <div className="tag-row"><span className="tag">{mission.category}</span><span className={`status ${mission.stage}`}>{mission.stage}</span><span className="tag">v{mission.version}</span></div>
            <h1>{mission.name}</h1>
            <p className="detail-thesis">{mission.thesis}</p>
          </div>
          <div className="detail-actions"><Link className="button button-small" href="/board"><ArrowLeft size={13} /> Board</Link><a className="button button-small" href={`/api/export?missionId=${encodeURIComponent(mission.id)}`} download><Download size={13} /> Brief</a><button className="button button-small button-danger" type="button" onClick={() => void retire()}><Trash2 size={13} /> Retire</button></div>
        </div>
        <div className="forecast-layout" style={{ marginTop: 24 }}>
          <div className="forecast-hero">
            <span className="mono-label">Readiness index</span>
            <div className="forecast-big-score">{mission.forecast.readiness}<small>/100</small></div>
            <p className="forecast-copy">{mission.forecast.narrative}</p>
            <button className="button button-primary button-small" type="button" onClick={() => void runForecast()} disabled={busy}><Play size={13} /> Replay forecast</button>
            {forecastSeal ? <span className="mono-label">forecast seal {shortSeal(forecastSeal)}</span> : null}
          </div>
          <div className="factor-list">
            {mission.forecast.factors.map((factor) => <div className="factor-row" key={factor.key}><div className="factor-label"><b>{factor.label}</b><span>{factor.value}/{factor.weight}</span></div><div className="factor-track"><div className="factor-fill" style={{ width: `${Math.min(100, (factor.value / factor.weight) * 100)}%` }} /></div><div className="factor-detail"><span>{factor.detail}</span><span>{Math.round((factor.value / factor.weight) * 100)}%</span></div></div>)}
            <div className="verify-box"><strong><FileCheck2 size={14} style={{ verticalAlign: "-2px" }} /> {verification?.valid ? "seal chain valid" : "seal chain not checked"}</strong><span>{verification ? `${verification.checked} events replayed` : "Run verification to replay the record."}</span></div>
            <button className="button button-small" type="button" onClick={() => void verify()}><Check size={13} /> Verify chain</button>
          </div>
        </div>
        {message ? <p className={`inline-message${error ? " error" : ""}`}>{error ? "!" : "✓"} {message}</p> : null}
      </section>
      <div className="detail-columns">
        <section className="detail-panel">
          <div className="audit-header"><h2>Evidence shelf</h2><span className="mono-label">{mission.evidence.length} items</span></div>
          <div className="evidence-list">{mission.evidence.length ? mission.evidence.map((item) => <article className="evidence-item" key={item.id}><div className="evidence-meta"><span>{item.kind}</span><span>{item.date}</span><span>{item.verified ? "verified" : "unverified"}</span></div>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.title} ↗</a> : <strong>{item.title}</strong>}<p>{item.source}{item.note ? ` · ${item.note}` : ""}</p></article>) : <div className="empty-state"><div>No evidence attached yet.</div></div>}</div>
          <form className="field-grid" style={{ marginTop: 18 }} onSubmit={addEvidence}>
            <div className="field"><label htmlFor="evidence-title-detail">Add evidence</label><input id="evidence-title-detail" value={evidenceForm.title} onChange={(event) => setEvidenceForm({ ...evidenceForm, title: event.target.value })} placeholder="What changed?" required /></div>
            <div className="field"><label htmlFor="evidence-source-detail">Source</label><input id="evidence-source-detail" value={evidenceForm.source} onChange={(event) => setEvidenceForm({ ...evidenceForm, source: event.target.value })} placeholder="Publication or lab" required /></div>
            <div className="field"><label htmlFor="evidence-url-detail">URL</label><input id="evidence-url-detail" type="url" value={evidenceForm.url} onChange={(event) => setEvidenceForm({ ...evidenceForm, url: event.target.value })} placeholder="https://" /></div>
            <div className="field-grid" style={{ gridTemplateColumns: "1fr 1fr" }}><div className="field"><label htmlFor="evidence-kind">Kind</label><select id="evidence-kind" value={evidenceForm.kind} onChange={(event) => setEvidenceForm({ ...evidenceForm, kind: event.target.value })}><option value="research">Research</option><option value="primary">Primary</option><option value="forecast">Forecast</option><option value="policy">Policy</option></select></div><div className="field"><label htmlFor="evidence-date">Date</label><input id="evidence-date" type="date" value={evidenceForm.date} onChange={(event) => setEvidenceForm({ ...evidenceForm, date: event.target.value })} /></div></div>
            <label className="checkbox-field"><input type="checkbox" checked={evidenceForm.verified} onChange={(event) => setEvidenceForm({ ...evidenceForm, verified: event.target.checked })} /> Mark as verified</label>
            <div className="form-actions"><button className="button button-primary button-small" type="submit" disabled={busy}><Plus size={13} /> Attach evidence</button></div>
          </form>
        </section>
        <section className="detail-panel">
          <div className="audit-header"><h2>Revision log</h2><span className="mono-label">SHA-384</span></div>
          <ol className="audit-list">{events.map((event) => <li className="audit-item" key={event.id}><span className="audit-time">{new Date(event.at).toLocaleDateString()}</span><div><span className="audit-action">{event.action}</span><p className="audit-payload">{event.action === "created" ? "Mission entered the board." : event.action === "updated" ? "Evidence or flight-plan fields changed." : "Mission moved to the retired shelf."}</p></div><span className="audit-seal">{shortSeal(event.seal)}</span></li>)}</ol>
          <div className="verify-box"><strong><Save size={14} style={{ verticalAlign: "-2px" }} /> current seal</strong><span>{shortSeal(mission.seal)}</span></div>
        </section>
      </div>
      <section className="detail-panel">
        <div className="audit-header"><h2>Edit flight plan</h2><span className="mono-label">mutation → new seal</span></div>
        <form className="field-grid" onSubmit={saveMission}>
          <div className="field"><label htmlFor="edit-name">Name</label><input id="edit-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div>
          <div className="field"><label htmlFor="edit-thesis">Thesis</label><textarea id="edit-thesis" value={draft.thesis} onChange={(event) => setDraft({ ...draft, thesis: event.target.value })} /></div>
          <div className="field-grid" style={{ gridTemplateColumns: "1fr 1fr" }}><div className="field"><label htmlFor="edit-stage">Stage</label><select id="edit-stage" value={draft.stage} onChange={(event) => setDraft({ ...draft, stage: event.target.value })}><option value="watch">Watch</option><option value="prototype">Prototype</option><option value="deploy">Deploy</option></select></div><div className="field"><label htmlFor="edit-horizon">Horizon</label><input id="edit-horizon" type="number" value={draft.horizonYear} onChange={(event) => setDraft({ ...draft, horizonYear: Number(event.target.value) })} /></div></div>
          <div className="field"><label htmlFor="edit-confidence">Prior confidence</label><input id="edit-confidence" type="number" min="0" max="100" value={draft.confidence} onChange={(event) => setDraft({ ...draft, confidence: Number(event.target.value) })} /></div>
          <div className="form-actions"><button className="button button-primary" type="submit" disabled={busy}><Save size={14} /> Save revision</button></div>
        </form>
      </section>
    </div>
  );
}
