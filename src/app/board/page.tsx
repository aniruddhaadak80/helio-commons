import { BoardClient } from "@/components/board-client";

export const metadata = { title: "Mission board" };

export default function BoardPage() {
  return (
    <main className="site-shell page-frame">
      <div className="page-intro"><div><div className="eyebrow">Persistent workspace / CRUD online</div><h1>Mission board</h1></div><p>Create a flight plan, attach a source, run the engine, and keep the revision trail. This is a shared board, not a private account.</p></div>
      <BoardClient />
    </main>
  );
}
