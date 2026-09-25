import { McpConsole } from "@/components/mcp-console";

export const metadata = { title: "MCP console" };

export default function ConsolePage() {
  return (
    <main className="site-shell page-frame">
      <div className="page-intro"><div><div className="eyebrow">Agent interface / JSON-RPC</div><h1>Give an agent a research desk.</h1></div><p>Discover tools, call a mutating tool, and inspect the same response an MCP client receives. No hidden simulation layer.</p></div>
      <McpConsole />
    </main>
  );
}
