"use client";

import { useState } from "react";
import type { ChallengeResult, Finding } from "@/lib/types";

const impactColor: Record<string, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-orange-500 text-slate-950",
  MEDIUM: "bg-yellow-400 text-slate-950",
  LOW: "bg-sky-400 text-slate-950",
  INFORMATIONAL: "bg-slate-600 text-white",
};

function Badge({ impact }: { impact: string }) {
  return (
    <span
      className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${impactColor[impact]}`}
    >
      {impact}
    </span>
  );
}

export default function FindingCard({
  finding: f,
  stack,
}: {
  finding: Finding;
  stack: string[];
}) {
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeResult | null>(null);
  const [error, setError] = useState("");

  async function runChallenge() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finding: f, stack }),
      });
      const raw = await res.text();
      if (!raw) throw new Error(`Empty response (status ${res.status})`);
      const data = JSON.parse(raw);
      if (!res.ok) throw new Error(data.error ?? "Challenge failed");
      setChallenge(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Challenge failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            {f.technology} · {f.changeType}
          </p>
          <h3 className="mt-1 text-lg font-medium">{f.title}</h3>
        </div>
        <Badge impact={f.impact} />
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold text-emerald-400">FACT</dt>
          <dd className="text-slate-300">{f.fact}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-sky-400">INFERENCE</dt>
          <dd className="text-slate-300">{f.inference}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-yellow-400">UNKNOWN</dt>
          <dd className="text-slate-300">{f.unknown}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-400">
            RECOMMENDED ACTION
          </dt>
          <dd className="text-slate-300">{f.recommendedAction}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-slate-500">
        Confidence: {f.confidence} · Source:{" "}
        <a
          href={f.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-400 underline"
        >
          {f.sourceUrl}
        </a>{" "}
        · Retrieved {new Date(f.retrievedAt).toLocaleString()}
      </p>

      {!challenge && (
        <button
          onClick={runChallenge}
          disabled={loading}
          className="mt-5 rounded-md border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 disabled:opacity-50"
        >
          {loading
            ? "Searching for evidence that could prove this wrong..."
            : "⚔ CHALLENGE IMPACT"}
        </button>
      )}

      {error && (
        <p className="mt-4 rounded-md border border-red-800 bg-red-950 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {challenge && (
        <div className="mt-6 space-y-4 border-t border-slate-800 pt-5 text-sm">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-slate-400">INITIAL ASSESSMENT</p>
              <Badge impact={challenge.initialImpact} />
            </div>
            <span className="text-slate-500">→</span>
            <div>
              <p className="text-xs text-slate-400">FINAL VERDICT</p>
              <Badge impact={challenge.finalImpact} />
            </div>
            <p className="ml-auto text-xs text-slate-400">
              Confidence: {challenge.finalConfidence}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400">
              ASSUMPTIONS TESTED
            </p>
            <ul className="mt-1 list-disc pl-5 text-slate-300">
              {challenge.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400">
              CHALLENGE FINDINGS
            </p>
            <p className="mt-1 text-slate-300">{challenge.challengeSummary}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-emerald-400">
              SUPPORTING EVIDENCE
            </p>
            {challenge.supportingEvidence.length === 0 ? (
              <p className="mt-1 text-slate-500">None found.</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {challenge.supportingEvidence.map((e, i) => (
                  <li key={i} className="text-slate-300">
                    {e.claim}{" "}
                    <a
                      href={e.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline"
                    >
                      source
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-orange-400">
              LIMITING / CONTRADICTING EVIDENCE
            </p>
            {challenge.limitingEvidence.length === 0 ? (
              <p className="mt-1 text-slate-500">None found.</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {challenge.limitingEvidence.map((e, i) => (
                  <li key={i} className="text-slate-300">
                    {e.claim}{" "}
                    <a
                      href={e.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 underline"
                    >
                      source
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400">WHY</p>
            <p className="mt-1 text-slate-300">{challenge.whyVerdict}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400">
              FINAL RECOMMENDED ACTION
            </p>
            <p className="mt-1 text-slate-300">{challenge.finalAction}</p>
          </div>
        </div>
      )}
    </div>
  );
}