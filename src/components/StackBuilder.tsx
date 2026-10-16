"use client";

import { useState } from "react";

export default function StackBuilder() {
  // The list of technologies the user has added
  const [technologies, setTechnologies] = useState<string[]>([]);
  // What the user is currently typing
  const [input, setInput] = useState("");

  function addTechnology(e: React.FormEvent) {
    e.preventDefault(); // stops the page from reloading
    const name = input.trim();
    if (!name) return;

    // Ignore duplicates (AWS and aws count as the same)
    const alreadyAdded = technologies.some(
      (t) => t.toLowerCase() === name.toLowerCase()
    );
    if (!alreadyAdded) {
      setTechnologies([...technologies, name]);
    }
    setInput("");
  }

  function removeTechnology(name: string) {
    setTechnologies(technologies.filter((t) => t !== name));
  }

  return (
    <div className="mt-10 rounded-lg border border-slate-800 bg-slate-900 p-6">
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
    </div>
  );
}