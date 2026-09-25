"use client";

import { useState } from "react";
import { Braces, Check, Copy, Play, Plus, RefreshCw, Terminal } from "lucide-react";

const listRequest = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }, null, 2);

async function sendRequest(body: unknown) {
  const response = await fetch("/api/mcp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return response.json();
}

export function McpConsole() {
  const [editor, setEditor] = useState(listRequest);
  const [response, setResponse] = useState("Send a request to inspect the live tool manifest.");
  const [tools, setTools] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run(body: unknown) {
    setBusy(true);
    try {
      const result = await sendRequest(body);
      setResponse(JSON.stringify(result, null, 2));
      if (body && typeof body === "object" && "method" in body && body.method === "tools/list") {
        const listed = (result as { result?: { tools?: Array<{ name: string }> } }).result?.tools || [];
        setTools(listed.map((tool) => tool.name));
      }
      setMessage("Response received from the live JSON-RPC endpoint.");
    } catch (requestError) {
      setResponse(requestError instanceof Error ? requestError.message : "Request failed");
      setMessage("The endpoint did not respond.");
    } finally {
      setBusy(false);
    }
  }

  function runEditor() {
    try {
      const parsed = JSON.parse(editor) as unknown;
      void run(parsed);
    } catch {
      setMessage("Editor contains invalid JSON.");
    }
  }

  async function createThroughAgent() {
    await run({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: "create_mission",
        arguments: {
          name: "Agent launch check",
          thesis: "Can an agent create a useful, sealed flight plan from a one-line thesis?",
          category: "space-compute",
          stage: "watch",
          horizonYear: 2028,
          confidence: 58,
          evidence: [],
        },
      },
    });
  }

  async function copyManifest() {
    await navigator.clipboard?.writeText(editor);
    setMessage("Request copied to clipboard.");
  }

  return (
    <div className="console-shell">
      <div className="console-toolbar"><div><div className="eyebrow"><Terminal size={14} style={{ verticalAlign: "-3px" }} /> JSON-RPC / HTTP</div><h1 className="page-intro" style={{ marginBottom: 0 }}>MCP console</h1></div><div className="tag-row"><span className="tag">no key</span><span className="tag">tools/call</span><a className="button button-small" href="/mcp.json" target="_blank" rel="noreferrer">mcp.json <Braces size={13} /></a></div></div>
      <div className="console-grid">
        <section className="console-panel"><div className="board-toolbar" style={{ marginBottom: 12 }}><span className="mono-label">Request editor</span><div className="action-row" style={{ marginTop: 0 }}><button className="button button-small" type="button" onClick={() => void run({ jsonrpc: "2.0", id: 1, method: "initialize" })}>Initialize</button><button className="button button-small" type="button" onClick={() => void run({ jsonrpc: "2.0", id: 2, method: "tools/list" })}>List tools</button></div></div><textarea className="console-editor" value={editor} onChange={(event) => setEditor(event.target.value)} spellCheck={false} aria-label="MCP request JSON" /><div className="form-actions"><button className="button button-primary" type="button" onClick={runEditor} disabled={busy}><Play size={14} /> Send request</button><button className="button" type="button" onClick={() => setEditor(listRequest)}><RefreshCw size={14} /> Reset</button><button className="button" type="button" onClick={() => void copyManifest()}><Copy size={14} /> Copy</button><button className="button button-small" type="button" onClick={() => void createThroughAgent()} disabled={busy}><Plus size={13} /> Create through agent</button></div>{message ? <p className="inline-message">{message}</p> : null}</section>
        <section className="console-panel"><div className="board-toolbar" style={{ marginBottom: 12 }}><span className="mono-label">Response</span><span className="feed-status">live endpoint</span></div><pre className="console-response">{response}</pre>{tools.length ? <div style={{ marginTop: 15 }}><span className="mono-label">Discovered tools</span><ul className="tool-list" style={{ marginTop: 9 }}>{tools.map((tool) => <li className="tool-item" key={tool}><strong>{tool}</strong><span>Available through the same persistence and forecast layer.</span></li>)}</ul></div> : null}</section>
      </div>
      <div className="method-card"><div className="eyebrow"><Check size={14} style={{ verticalAlign: "-3px" }} /> Agent contract</div><p>Initialize, list tools, then call a mutating tool. The in-page “Create through agent” button is a real POST to <code>/api/mcp</code>, not a simulation.</p></div>
    </div>
  );
}
