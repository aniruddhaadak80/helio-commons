import { SignalsClient } from "@/components/signals-client";

export const metadata = { title: "Research signals" };

export default function SignalsPage() {
  return (
    <main className="site-shell page-frame">
      <div className="page-intro"><div><div className="eyebrow">Live desk / dated fallback</div><h1>Research signals</h1></div><p>Two public feeds, normalized into one horizon map. Track a signal onto a mission and the evidence becomes part of the forecast.</p></div>
      <SignalsClient />
    </main>
  );
}
