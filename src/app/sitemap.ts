import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return ["", "/board", "/signals", "/console", "/method"].map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === "/signals" ? "hourly" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
