"use client";

import { useState } from "react";
import type { Diff, Finding } from "@/lib/types";
import { loadSnapshot, saveSnapshot } from "@/lib/storage";
import { diffSnapshots } from "@/lib/diff";
import FindingCard from "./FindingCard";
import ScanSummary from "./ScanSummary";

type ScanResponse = {
  scannedAt: string;
  technologies: string[];
  findings: Finding[];
  errors: string[];
  error?: string;
};

export default function StackBuilder() {
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [diff, setDiff] = useState<Diff | null>(null);
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
    setDiff(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technologies }),
      });
      const raw = await res.text();
      if (!raw) throw new Error(`Empty response (status ${res.status})`);
      const data: ScanResponse = JSON.parse(raw);
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setResult(data);

      // Only compare and save a baseline when the scan fully succeeded
      if (data.errors.length === 0) {
        const snapshot = {
          scannedAt: data.scannedAt,
          technologies: data.technologies,
          findings: data.findings,
        };
        setDiff(diffSnapshots(loadSnapshot(), snapshot));
        saveSnapshot(snapshot);
      }
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
          {scanning
            ? "Investigating live web sources..."
            : result
              ? "SCAN AGAIN"
              : "SCAN MY STACK"}
        </button>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-red-800 bg-red-950 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-8">
          <ScanSummary
            technologies={result.technologies}
            findings={result.findings}
            scannedAt={result.scannedAt}
            diff={diff}
          />

          {result.errors.length > 0 && (
            <div className="mt-4 rounded-md border border-yellow-800 bg-yellow-950 p-4 text-sm text-yellow-200">
              <p className="mb-1 font-semibold">
                Scan incomplete, so no baseline was saved:
              </p>
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
              <FindingCard key={i} finding={f} stack={result.technologies} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}