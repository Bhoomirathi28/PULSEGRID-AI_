import type { SearchResult } from "./types";

export async function searchTavily(query: string): Promise<SearchResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("Missing TAVILY_API_KEY in .env.local");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 5,
      time_range: "month",
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return (data.results ?? []).map(
    (r: { title: string; url: string; content: string }) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    })
  );
}