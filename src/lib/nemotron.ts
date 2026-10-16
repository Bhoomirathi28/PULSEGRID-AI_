import type { Finding, SearchResult } from "./types";

const IMPACTS = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"];
const CONFIDENCES = ["HIGH", "MEDIUM", "LOW"];

export async function analyzeTechnology(
  technology: string,
  stack: string[],
  results: SearchResult[]
): Promise<Finding[]> {
  const key = process.env.NEBIUS_API_KEY;
  const base = process.env.NEBIUS_BASE_URL;
  const model = process.env.NEBIUS_MODEL;
  if (!key || !base || !model) {
    throw new Error("Missing NEBIUS_API_KEY / NEBIUS_BASE_URL / NEBIUS_MODEL");
  }
  if (results.length === 0) return [];

  const evidence = results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join("\n\n");

  const system = `You are PulseGrid, an evidence-based change impact analyst for software teams.
Rules:
- Use ONLY the evidence provided. Never invent facts, dates or URLs.
- Only report real changes (deprecations, breaking changes, security issues, pricing, removals, new releases that matter). Ignore marketing and unrelated pages.
- "fact" = what the source explicitly states. "inference" = your conclusion. "unknown" = what cannot be confirmed (for example whether the user's code uses the affected feature).
- If there is no meaningful change, return {"findings": []}.
- sourceUrl MUST be copied exactly from the evidence.
- impact is one of: CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL.
- confidence is one of: HIGH, MEDIUM, LOW.
Return ONLY valid JSON, no extra text, in this shape:
{"findings":[{"title":"","changeType":"DEPRECATED|REMOVED|SECURITY|PRICING|BREAKING|POLICY|RELEASE|MODIFIED|OTHER","fact":"","inference":"","unknown":"","impact":"","confidence":"","recommendedAction":"","sourceUrl":""}]}`;

  const user = `User's stack: ${stack.join(", ")}
Technology being analyzed: ${technology}

Evidence:
${evidence}`;

  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 2000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Nebius error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  let text: string = data.choices?.[0]?.message?.content ?? "";

  // Remove reasoning tags and code fences if the model adds them
  text = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  text = text.replace(/```json|```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model returned no JSON");
  }

  let parsed: { findings?: Record<string, string>[] };
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("Model returned malformed JSON");
  }

  const validUrls = new Set(results.map((r) => r.url));
  const now = new Date().toISOString();

  // Keep only findings that cite a real URL from Tavily (no fake sources)
  return (parsed.findings ?? [])
    .filter((f) => validUrls.has(f.sourceUrl))
    .map((f) => ({
      technology,
      title: f.title ?? "Untitled change",
      changeType: f.changeType ?? "OTHER",
      fact: f.fact ?? "",
      inference: f.inference ?? "",
      unknown: f.unknown ?? "",
      impact: (IMPACTS.includes(f.impact)
        ? f.impact
        : "INFORMATIONAL") as Finding["impact"],
      confidence: (CONFIDENCES.includes(f.confidence)
        ? f.confidence
        : "LOW") as Finding["confidence"],
      recommendedAction: f.recommendedAction ?? "",
      sourceUrl: f.sourceUrl,
      retrievedAt: now,
    }));
}