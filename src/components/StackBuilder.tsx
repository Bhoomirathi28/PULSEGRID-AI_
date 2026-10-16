"use client";

import { useState } from "react";
import type { Finding } from "@/lib/types";

type ScanResponse = {
  scannedAt: string;
  technologies: string[];
  findings: Finding[];
  errors: string[];
  error?: string;
};

const impactColor: Record<string, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-orange-500 text-slate-950",
  MEDIUM: "bg-yellow-400 text-slate-950",
  LOW: "bg-sky-400 text-slate-950",
  INFORMATIONAL: "bg-slate-600 text-white",
};

export default function StackBuilder() {
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState("");

  function addTechnology(e: React.FormEvent) {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    const alreadyAdded = technologies.some(
      (t) => t.toLowerCase() === name.toLowerCase()
    );
    if (!alreadyAdded) setTechnologies([...technologies, name]);
    setInput("");
  }

  function removeTechnology(name: string) {
    setTechnologies(technologies.filter((t) => t !== name));
  }

  async function scanStack() {
    setScanning(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technologies }),
      });
      const data: ScanResponse = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-medium">Your stack</h2>

        <form onSubmit={addTechnology} className="mt-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Stripe, AWS, Next.js"
            className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Add Technology
          </button>
        </form>

        {technologies.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No technologies added yet.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <li
                key={tech}
                className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm"
              >
                {tech}
                <button
                  onClick={() => removeTechnology(tech)}
                  className="text-slate-400 hover:text-red-400"
                  aria-label={`Remove ${tech}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={scanStack}
          disabled={technologies.length === 0 || scanning}
          className="mt-6 w-full rounded-md bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {scanning ? "Investigating live web sources..." : "SCAN MY STACK"}
        </button>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-red-800 bg-red-950 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-8">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
            {result.technologies.length} technologies scanned ·{" "}
            {result.findings.length} changes detected · scanned at{" "}
            {new Date(result.scannedAt).toLocaleString()}
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4 rounded-md border border-yellow-800 bg-yellow-950 p-4 text-sm text-yellow-200">
              {result.errors.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}

          {result.findings.length === 0 && result.errors.length === 0 && (
            <p className="mt-4 text-sm text-slate-400">
              Insufficient evidence of meaningful recent changes.
            </p>
          )}

          <div className="mt-4 space-y-4">
            {result.findings.map((f, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-400">
                      {f.technology} · {f.changeType}
                    </p>
                    <h3 className="mt-1 text-lg font-medium">{f.title}</h3>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${impactColor[f.impact]}`}
                  >
                    {f.impact} IMPACT
                  </span>
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}