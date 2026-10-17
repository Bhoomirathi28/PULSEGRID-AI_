import { searchTavily } from "./tavily";
import { callNemotronJSON } from "./llm";
import type {
  ChallengeResult,
  Confidence,
  EvidenceItem,
  Finding,
  Impact,
  SearchResult,
} from "./types";

const IMPACTS = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"];
const CONFIDENCES = ["HIGH", "MEDIUM", "LOW"];

type Plan = { assumptions: string[]; queries: string[] };

type Verdict = {
  challengeSummary: string;
  supportingEvidence: EvidenceItem[];
  limitingEvidence: EvidenceItem[];
  finalImpact: string;
  finalConfidence: string;
  whyVerdict: string;
  finalAction: string;
};

export async function challengeFinding(
  finding: Finding,
  stack: string[]
): Promise<ChallengeResult> {
  const summary = `Technology: ${finding.technology}
Change: ${finding.title} (${finding.changeType})
Fact: ${finding.fact}
Inference: ${finding.inference}
Unknown: ${finding.unknown}
Initial impact: ${finding.impact}
User's stack: ${stack.join(", ")}`;

  // STEP 1: Nemotron lists assumptions and queries that could DISPROVE the assessment
  const plan = await callNemotronJSON<Plan>(
    `You are a skeptical reviewer. Given an impact assessment, list the assumptions it depends on, then write exactly 3 web search queries that would find evidence that could LIMIT or CONTRADICT it (for example: affected versions, exceptions, migration compatibility, SDK behavior, official clarifications, newer releases).
Return ONLY JSON: {"assumptions":["..."],"queries":["...","...","..."]}`,
    summary
  );
  const assumptions = (plan.assumptions ?? []).slice(0, 5);
  const queries = (plan.queries ?? []).slice(0, 3);

  // STEP 2: Tavily searches for the new evidence
  const settled = await Promise.allSettled(queries.map((q) => searchTavily(q)));
  const seen = new Set<string>();
  const evidence: SearchResult[] = [];
  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    for (const r of s.value) {
      if (!seen.has(r.url)) {
        seen.add(r.url);
        evidence.push(r);
      }
    }
  }

  const base = {
    initialImpact: finding.impact,
    assumptions,
    queries,
    challengedAt: new Date().toISOString(),
  };

  // No new evidence: say so honestly, keep the original verdict
  if (evidence.length === 0) {
    return {
      ...base,
      challengeSummary: "Insufficient evidence found to challenge this assessment.",
      supportingEvidence: [],
      limitingEvidence: [],
      finalImpact: finding.impact,
      finalConfidence: "LOW",
      whyVerdict: "No new evidence was found, so the initial assessment is unchanged.",
      finalAction: finding.recommendedAction,
    };
  }

  // STEP 3: Nemotron weighs supporting vs limiting evidence
  const evidenceText = evidence
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join("\n\n");

  const verdict = await callNemotronJSON<Verdict>(
    `You verify impact assessments using ONLY the new evidence provided. Never invent facts or URLs.
Sort the evidence into: supportingEvidence (supports the initial assessment) and limitingEvidence (limits, contradicts, or adds exceptions). Each item has a short "claim" and a "sourceUrl" copied exactly from the evidence. If nothing fits a list, return an empty list.
Then give finalImpact (CRITICAL, HIGH, MEDIUM, LOW or INFORMATIONAL), finalConfidence (HIGH, MEDIUM or LOW), whyVerdict (explain what changed or why it did not), and finalAction.
If the user's real dependency or version is unknown, say so and do not go above MEDIUM confidence.
Return ONLY JSON: {"challengeSummary":"","supportingEvidence":[{"claim":"","sourceUrl":""}],"limitingEvidence":[{"claim":"","sourceUrl":""}],"finalImpact":"","finalConfidence":"","whyVerdict":"","finalAction":""}`,
    `${summary}\n\nNEW EVIDENCE:\n${evidenceText}`
  );

  // Keep only claims that cite a URL we actually retrieved
  const valid = new Set(evidence.map((r) => r.url));
  valid.add(finding.sourceUrl);
  const keep = (items: EvidenceItem[] | undefined) =>
    (items ?? []).filter((i) => i && valid.has(i.sourceUrl));

  return {
    ...base,
    challengeSummary: verdict.challengeSummary ?? "",
    supportingEvidence: keep(verdict.supportingEvidence),
    limitingEvidence: keep(verdict.limitingEvidence),
    finalImpact: (IMPACTS.includes(verdict.finalImpact)
      ? verdict.finalImpact
      : finding.impact) as Impact,
    finalConfidence: (CONFIDENCES.includes(verdict.finalConfidence)
      ? verdict.finalConfidence
      : "LOW") as Confidence,
    whyVerdict: verdict.whyVerdict ?? "",
    finalAction: verdict.finalAction ?? finding.recommendedAction,
  };
}