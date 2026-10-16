import StackBuilder from "@/components/StackBuilder";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium tracking-widest text-emerald-400">
          PULSEGRID AI
        </p>

        <h1 className="mt-4 text-4xl font-semibold leading-tight">
          Your stack changes every day.
          <br />
          PulseGrid tells you which changes actually matter.
        </h1>

        <p className="mt-4 text-slate-400">
          Add the technologies your app depends on, then scan the live web for
          changes that could affect you.
        </p>

        <StackBuilder />
      </div>
    </main>
  );
}