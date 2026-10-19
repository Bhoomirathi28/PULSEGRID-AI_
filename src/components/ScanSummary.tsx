import type { Diff, Finding } from "@/lib/types";

export default function ScanSummary({
  technologies,
  findings,
  scannedAt,
  diff,
}: {
  technologies: string[];
  findings: Finding[];
  scannedAt: string;
  diff: Diff | null;
}) {
  const count = (impact: string) =>
    findings.filter((f) => f.impact === impact).length;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5 text-sm">
      <p className="text-xs font-semibold tracking-widest text-emerald-400">
        STACK HEALTH
      </p>
      <p className="mt-2 text-slate-300">
        {technologies.length} technologies scanned · {findings.length} changes
        detected
      </p>
      <p className="mt-1 text-slate-400">
        Critical {count("CRITICAL")} · High {count("HIGH")} · Medium{" "}
        {count("MEDIUM")} · Low {count("LOW")} · Informational{" "}
        {count("INFORMATIONAL")}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Scanned at {new Date(scannedAt).toLocaleString()}
      </p>

      {diff && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <p className="text-xs font-semibold text-slate-400">
            COMPARED WITH PREVIOUS SCAN
          </p>
          {diff.isFirstScan ? (
            <p className="mt-1 text-slate-300">
              Baseline created. Click Scan Again later to see what changed.
            </p>
          ) : (
            <div className="mt-1 text-slate-300">
              <p className="text-xs text-slate-500">
                Previous scan: {new Date(diff.previousScannedAt!).toLocaleString()}
              </p>
              <p>
                {diff.newFindings.length} new · {diff.changed.length} changed
                impact · {diff.removed.length} no longer found
              </p>
              {diff.changed.map((c, i) => (
                <p key={i} className="text-yellow-300">
                  {c.finding.title}: {c.previousImpact} → {c.finding.impact}
                </p>
              ))}
              {diff.newFindings.map((f, i) => (
                <p key={i} className="text-emerald-300">
                  New: {f.title} ({f.technology})
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}