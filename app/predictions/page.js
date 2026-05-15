import Link from "next/link";
import { getSeasonData } from "lib/season-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Predictions | F1Lab",
  description: "Select a race to open full winner prediction details."
};

export default async function PredictionsPage() {
  const selectedYear = 2026;
  const season = await getSeasonData(selectedYear);
  const races = (season?.races ?? [])
    .slice()
    .sort((left, right) => Number(left.round) - Number(right.round));

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <section className="rounded-[2rem] border border-line bg-white p-8 shadow-panel md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Predictions</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-ink md:text-6xl">Select a race</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
            Open a dedicated race page with model ranking, confidence, and post-race comparison.
          </p>
      </section>

      <section className="mt-8 rounded-[2rem] border border-line bg-white p-6 shadow-panel md:p-8">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand">2026 Race Calendar</p>
          <p className="rounded-full border border-line bg-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {races.length} rounds
          </p>
        </div>
        <div className="mt-4 space-y-3">
          {races.map((race) => {
            const completed = race.winner !== "Results pending";
            return (
              <Link
                key={race.raceKey}
                href={`/predictions/${encodeURIComponent(race.raceKey)}`}
                className="block rounded-[1.25rem] border border-line bg-white p-4 transition hover:border-brand hover:bg-soft"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">Round {race.round}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{race.grandPrix}</p>
                    <p className="mt-1 text-sm text-muted">{race.date}</p>
                  </div>
                  <span className="rounded-full border border-line bg-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Open report
                  </span>
                </div>
                <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.2em] ${completed ? "text-emerald-700" : "text-sky-700"}`}>
                  {completed ? "Completed" : "Upcoming"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
