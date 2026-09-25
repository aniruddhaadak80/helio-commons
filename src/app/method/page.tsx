import Link from "next/link";
import { ArrowRight, CheckCircle2, Fingerprint, LockKeyhole, Scale } from "lucide-react";

export const metadata = { title: "Method" };

export default function MethodPage() {
  return (
    <main className="site-shell page-frame">
      <div className="page-intro"><div><div className="eyebrow">Method / explainable by default</div><h1>How the readout works.</h1></div><p>Helio Commons separates physical feasibility, evidence quality, time pressure, and coordination. A forecast is a prompt for investigation—not a prophecy.</p></div>
      <div className="method-grid">
        <section className="method-card"><div className="eyebrow"><Scale size={14} style={{ verticalAlign: "-3px" }} /> 01 / Evidence depth</div><h2>Sources earn weight.</h2><p>Each source contributes depth, verified items, and kind diversity. The UI shows the exact count used by the engine so a new claim cannot hide behind a polished number.</p></section>
        <section className="method-card"><div className="eyebrow"><CheckCircle2 size={14} style={{ verticalAlign: "-3px" }} /> 02 / Horizon momentum</div><h2>Dates create pressure.</h2><p>A near-term prototype gets more momentum than a 2040 scenario, but distance also lowers confidence. This keeps “soon” and “important” from being confused.</p></section>
        <section className="method-card"><div className="eyebrow"><LockKeyhole size={14} style={{ verticalAlign: "-3px" }} /> 03 / Stage leverage</div><h2>Watch, prototype, deploy.</h2><p>Stage is a leverage multiplier, not a maturity certificate. It tells the reader which kind of evidence would change the decision next.</p></section>
        <section className="method-card"><div className="eyebrow"><Fingerprint size={14} style={{ verticalAlign: "-3px" }} /> 04 / Seal chain</div><h2>Every mutation leaves a trace.</h2><p>Each event uses <code>SHA-384(previousSeal ‖ canonicalJson(event))</code>. The audit endpoint replays the chain, and exports carry the current seal.</p></section>
      </div>
      <section className="section"><div className="section-heading"><div><div className="section-kicker">Use the surface</div><h2>Pick a lane.</h2></div><p>The routes are deliberately different so the tool is useful in the browser, a terminal, or an agent session.</p></div><div className="method-grid"><div className="method-card"><h2>Board</h2><p>Create, revise, and retire mission cards with persisted state.</p><Link className="button button-small" href="/board">Open board <ArrowRight size={13} /></Link></div><div className="method-card"><h2>Signals</h2><p>Read live feeds or the dated fallback and attach a signal to a mission.</p><Link className="button button-small" href="/signals">Open desk <ArrowRight size={13} /></Link></div><div className="method-card"><h2>Console</h2><p>Use the REST + JSON-RPC surface from an MCP-compatible client.</p><Link className="button button-small" href="/console">Open console <ArrowRight size={13} /></Link></div><div className="method-card"><h2>API</h2><p>Read, mutate, forecast, verify, and export from a script.</p><a className="button button-small" href="/api/health">Check health <ArrowRight size={13} /></a></div></div></section>
    </main>
  );
}
