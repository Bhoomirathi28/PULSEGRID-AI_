import type { Diff, Finding, Snapshot } from "./types";

const keyOf = (f: Finding) => `${f.technology.toLowerCase()}|${f.sourceUrl}`;

export function diffSnapshots(previous: Snapshot | null, current: Snapshot): Diff {
  if (!previous) {
    return { isFirstScan: true, newFindings: [], changed: [], removed: [] };
  }
  const prev = new Map(previous.findings.map((f) => [keyOf(f), f]));
  const curr = new Map(current.findings.map((f) => [keyOf(f), f]));

  const newFindings: Finding[] = [];
  const changed: Diff["changed"] = [];
  for (const [k, f] of curr) {
    const old = prev.get(k);
    if (!old) newFindings.push(f);
    else if (old.impact !== f.impact) {
      changed.push({ finding: f, previousImpact: old.impact });
    }
  }
  const removed = [...prev].filter(([k]) => !curr.has(k)).map(([, f]) => f);

  return {
    isFirstScan: false,
    previousScannedAt: previous.scannedAt,
    newFindings,
    changed,
    removed,
  };
}