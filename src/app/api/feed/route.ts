import { getResearchFeed } from "@/lib/feed";
import { json } from "@/lib/api";

export const revalidate = 900;
export const runtime = "nodejs";

export async function GET() {
  return json(await getResearchFeed());
}
