import Link from "next/link";
import { ArrowRight, CheckCircle2, Satellite, ScanLine, ShieldCheck } from "lucide-react";
import { TelemetryScene } from "@/components/telemetry-scene";

const nodes = [
  ["01", "Question", "A bet worth testing", "hot"],
  ["02", "Evidence", "Sources become inputs", "cool"],
  ["03", "Constraints", "Power · heat · link", "alert"],
  ["04", "Horizon", "A date to pressure-test", ""],
  ["05", "Seal", "Every revision leaves a trace", "cool"],
  ["06", "Brief", "Export the next question", "hot"],
];

export default function Home() {
  return (
    <main className="site-shell page-frame">
      <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">Field manual / 2026.09 / public beta</div>
          <h1 className="display-title">Map the next <em>compute frontier.</em></h1>
          <p className="lede"><strong>Helio Commons</strong> is a playable research desk for space data centers, Project Suncatcher, and the long road toward superintelligence. Turn a headline into a flight plan, attach evidence, and see what the bottleneck actually is.</p>
          <div className="action-row"><Link className="button button-primary" href="/board">Open the mission board <ArrowRight size={15} /></Link><Link className="button" href="/signals">Scan live signals <Satellite size={15} /></Link></div>
          <div className="hero-note">No account. No API key. First paint works offline.</div>
        </div>
        <TelemetryScene />
      </section>
      <div className="protocol-strip" aria-label="How Helio Commons works">
        <div className="protocol-step"><span className="protocol-index">01 / FRAME</span><h2>Ask a sharper question.</h2><p>Turn a vague prediction into a mission with a horizon, a stage, and a thesis you can revise.</p></div>
        <div className="protocol-step"><span className="protocol-index">02 / INSTRUMENT</span><h2>Make the bottleneck visible.</h2><p>Evidence, confidence, and engineering stage feed one explainable readiness engine.</p></div>
        <div className="protocol-step"><span className="protocol-index">03 / CARRY IT</span><h2>Leave a sealed trail.</h2><p>Every create, update, evidence drop, and retirement is hash-chained for replay.</p></div>
      </div>
      <section className="section">
        <div className="section-heading"><div><div className="section-kicker">The instrument</div><h2>Prediction is a system, not a vibe.</h2></div><p>Space compute is a physical bet. Capability forecasts are a coordination bet. This board makes both inspectable.</p></div>
        <div className="engine-board">
          <div className="engine-map">
            <div className="eyebrow">Readout architecture / v1</div>
            <div className="engine-map-grid">{nodes.map(([index, title, detail, tone]) => <div className={`engine-node ${tone}`} key={index}><strong>{index} {title}</strong>{detail}</div>)}</div>
          </div>
          <div className="engine-readout"><div><div className="mono-label">Example output / Suncatcher silicon</div><div className="readout-score">78<small>/100</small></div><p>Promising, instrument the constraints. Evidence depth is carrying more signal than the distant horizon.</p></div><div className="readout-list"><div><span>horizon momentum</span><b>26 / 28</b></div><div><span>stage leverage</span><b>17 / 24</b></div><div><span>coordination surface</span><b>13 / 20</b></div></div><Link className="button" href="/method" style={{ marginTop: 22, alignSelf: "start", borderColor: "rgba(7,17,31,.4)", color: "var(--ink)" }}>See the math <ArrowRight size={14} /></Link></div>
        </div>
      </section>
      <section className="section">
        <div className="section-heading"><div><div className="section-kicker">What you can do here</div><h2>Useful in ten seconds. Defensible tomorrow.</h2></div><p>Three concrete loops, all backed by real API routes and persisted state.</p></div>
        <div className="method-grid">
          <div className="method-card"><div className="eyebrow"><ScanLine size={14} style={{ verticalAlign: "-3px" }} /> Create</div><h2>Put a bet on the board.</h2><p>Start with the question behind orbital compute or superintelligence. Add a first source, set a horizon, and make the card yours.</p><Link className="button button-small" href="/board">Create a flight plan <ArrowRight size={13} /></Link></div>
          <div className="method-card"><div className="eyebrow"><CheckCircle2 size={14} style={{ verticalAlign: "-3px" }} /> Decide</div><h2>See which lever is real.</h2><p>Run the same forecast from the board, REST API, or MCP tool. Every factor is itemized instead of hidden behind a single magic number.</p><Link className="button button-small" href="/mission/seed-suncatcher-silicon-survives-orbit">Open the example <ArrowRight size={13} /></Link></div>
          <div className="method-card"><div className="eyebrow"><ShieldCheck size={14} style={{ verticalAlign: "-3px" }} /> Carry</div><h2>Export the next question.</h2><p>Track a live research signal onto a mission, replay the SHA-384 audit chain, and download a markdown brief for your team.</p><Link className="button button-small" href="/signals">Open research desk <ArrowRight size={13} /></Link></div>
          <div className="method-card"><div className="eyebrow"><Satellite size={14} style={{ verticalAlign: "-3px" }} /> Extend</div><h2>Let an agent use it.</h2><p>The MCP-style endpoint exposes discovery plus mutating tools, so a coding agent can create and revise flight plans without a bespoke integration.</p><Link className="button button-small" href="/console">Open MCP console <ArrowRight size={13} /></Link></div>
        </div>
      </section>
    </main>
  );
}
