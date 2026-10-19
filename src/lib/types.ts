export type Impact = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

// One web search result from Tavily
export type SearchResult = {
  title: string;
  url: string;
  content: string;
};

// One evidence-backed finding shown on the dashboard
export type Finding = {
  technology: string;
  title: string;
  changeType: string;
  fact: string;
  inference: string;
  unknown: string;
  impact: Impact;
  confidence: Confidence;
  recommendedAction: string;
  sourceUrl: string;
  retrievedAt: string;
};
export type EvidenceItem = { claim: string; sourceUrl: string };

export type ChallengeResult = {
  initialImpact: Impact;
  assumptions: string[];
  queries: string[];
  challengeSummary: string;
  supportingEvidence: EvidenceItem[];
  limitingEvidence: EvidenceItem[];
  finalImpact: Impact;
  finalConfidence: Confidence;
  whyVerdict: string;
  finalAction: string;
  challengedAt: string;
};
export type Snapshot = {
  scannedAt: string;
  technologies: string[];
  findings: Finding[];
};

export type Diff = {
  isFirstScan: boolean;
  previousScannedAt?: string;
  newFindings: Finding[];
  changed: { finding: Finding; previousImpact: Impact }[];
  removed: Finding[];
};