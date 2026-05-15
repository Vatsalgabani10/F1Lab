import Link from "next/link";
import { buildPredictionRun } from "lib/predictions-engine";
import { fetchRaceClassification } from "lib/f1-results";
import { getSeasonData } from "lib/season-store";

export const dynamic = "force-dynamic";

function getHeaderIndex(headers, patterns) {
  const lower = headers.map((header) => String(header).toLowerCase());
  return lower.findIndex((header) => patterns.some((pattern) => header.includes(pattern)));
}

function extractTopFiveActual(classification) {
  if (!classification?.rows?.length) {
    return [];
  }

  const positionIndex = getHeaderIndex(classification.headers ?? [], ["pos", "position"]);
  const driverIndex = getHeaderIndex(classification.headers ?? [], ["driver"]);
  const teamIndex = getHeaderIndex(classification.headers ?? [], ["team", "car"]);

  return classification.rows.slice(0, 5).map((row, index) => ({
    position: row[positionIndex] ?? String(index + 1),
    driver: row[driverIndex] ?? "N/A",
    team: row[teamIndex] ?? "N/A"
  }));
}

function ConfidenceBadge({ confidence }) {
  const tone =
    confidence >= 75
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : confidence >= 55
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-red-200 bg-red-50 text-red-900";

  return (
    <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${tone}`}>
      Confidence: {confidence}%
    </span>
  );
}

export default async function PredictionRacePage({ params }) {
  const resolvedParams = await params;
  const raceKey = resolvedParams?.raceKey ?? null;
  const selectedYear = 2026;
  const season = await getSeasonData(selectedYear);
  const races = (season?.races ?? [])
    .slice()
    .sort((left, right) => Number(left.round) - Number(right.round));

  const activeRace = races.find((race) => race.raceKey === raceKey) ?? races[0] ?? null;

  const run = await buildPredictionRun({
    year: selectedYear,
    raceKey: activeRace?.raceKey ?? raceKey,
    raceMeta: activeRace
  });

  const isCompletedRace = Boolean(activeRace?.href && activeRace?.winner !== "Results pending");
  let actualTopFive = [];

  if (isCompletedRace) {
    try {
      const classification = await fetchRaceClassification(activeRace.href);
      actualTopFive = extractTopFiveActual(classification);
    } catch {
      actualTopFive = [];
    }
  }

  const factorSummary = [
    {
      label: "Strong factors",
      value: run.factors.filter((factor) => factor.status === "use").length
    },
    {
      label: "Proxy factors",
      value: run.factors.filter((factor) => factor.status === "proxy").length
    },
    {
      label: "Skipped factors",
      value: run.factors.filter((factor) => factor.status === "skip").length
    }
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <section className="rounded-[2rem] border border-line bg-white p-8 shadow-panel md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Predictions</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight text-ink md:text-6xl">
              {run.race.name}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
              Professional model summary with ranked win probabilities and factor attribution.
            </p>
          </div>
          <ConfidenceBadge confidence={run.confidence} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span className="rounded-full border border-line bg-soft px-4 py-2">
            Race date: {run.race.date}
          </span>
          <span
            className={`rounded-full border px-4 py-2 ${
              isCompletedRace
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-sky-200 bg-sky-50 text-sky-900"
            }`}
          >
            {isCompletedRace ? "Completed race" : "Upcoming race"}
          </span>
          <span className="rounded-full border border-line bg-soft px-4 py-2">
            Source: {run.source}
          </span>
          <Link
            href="/predictions"
            className="rounded-full border border-line bg-white px-4 py-2 text-ink transition hover:border-brand hover:text-brand"
          >
            Back to all races
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[2rem] border border-line bg-ink p-6 text-white shadow-panel md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Win Probability</p>
          <div className="mt-6 space-y-3">
            {run.entries.slice(0, 8).map((entry) => (
              <div
                key={entry.driver}
                className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-brand">P{entry.rank}</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{entry.driver}</p>
                    <p className="text-sm text-white/70">{entry.team}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-white">{entry.probability}%</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">Win chance</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{ width: `${Math.min(100, entry.probability)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-line bg-white p-6 shadow-panel md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Why The Model Chose P1</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {run.entries[0]?.driver ?? "No driver"}
          </h2>
          <p className="mt-2 text-sm text-muted">{run.entries[0]?.team ?? "N/A"}</p>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Top Positive Factors</p>
            <div className="mt-3 space-y-2">
              {run.entries[0]?.explanation?.topPositive?.map((factor) => (
                <div
                  key={factor.label}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900"
                >
                  <p className="text-sm font-semibold">{factor.label}</p>
                  <p className="text-xs">score: {(factor.value * 100).toFixed(1)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Main Risks</p>
            <div className="mt-3 space-y-2">
              {run.entries[0]?.explanation?.topNegative?.map((factor) => (
                <div
                  key={factor.label}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900"
                >
                  <p className="text-sm font-semibold">{factor.label}</p>
                  <p className="text-xs">score: {(factor.value * 100).toFixed(1)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {factorSummary.map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-soft px-3 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-line bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Score Guide
            </p>
            <div className="mt-3 space-y-2 text-sm text-muted">
              <p>
                Factor scores run from <span className="font-semibold text-ink">0 to 100</span>.
                Higher means a stronger signal for this race.
              </p>
              <p>
                <span className="font-semibold text-ink">80-100:</span> strong advantage,{" "}
                <span className="font-semibold text-ink">60-79:</span> useful support,{" "}
                <span className="font-semibold text-ink">40-59:</span> neutral/uncertain,{" "}
                <span className="font-semibold text-ink">0-39:</span> weak signal.
              </p>
              <p>
                <span className="font-semibold text-ink">Strong factors</span> use direct data.
                <span className="ml-1 font-semibold text-ink">Proxy factors</span> use indirect estimates.
                <span className="ml-1 font-semibold text-ink">Skipped factors</span> are neutralized (near 50).
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-soft px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Model Math (Beta)
            </p>
            <div className="mt-3 space-y-2 text-sm text-muted">
              <p>
                1) For each driver:{" "}
                <span className="font-semibold text-ink">
                  total score = sum(factor value × factor weight)
                </span>
                .
              </p>
              <p>
                2) We add race variance to avoid one-driver lock in every race.
              </p>
              <p>
                3) We convert scores to win probabilities using{" "}
                <span className="font-semibold text-ink">tempered softmax</span>.
              </p>
              <p>
                4) For realism in beta, top win chance is capped at{" "}
                <span className="font-semibold text-ink">36%</span>, then remaining probability is redistributed.
              </p>
            </div>
          </div>
        </article>
      </section>

      {isCompletedRace ? (
        <section className="mt-8 rounded-[2rem] border border-line bg-white p-6 shadow-panel md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">
            Race Result vs Prediction
          </p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight">{run.race.name}</h3>
          <p className="mt-2 text-sm text-muted">
            Actual P1-P5 compared with model P1-P5 for this completed race.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-[1.25rem] border border-line bg-soft p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Actual Race P1-P5</p>
              <div className="mt-3 space-y-2">
                {actualTopFive.length ? (
                  actualTopFive.map((entry, index) => (
                    <div key={`${entry.position}-${entry.driver}-${index}`} className="rounded-xl border border-line bg-white px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted">P{entry.position}</p>
                      <p className="mt-1 text-lg font-semibold">{entry.driver}</p>
                      <p className="text-sm text-muted">{entry.team}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">
                    Official classification is not available yet for this race.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-[1.25rem] border border-line bg-soft p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Model Prediction P1-P5</p>
              <div className="mt-3 space-y-2">
                {run.entries.slice(0, 5).map((entry) => (
                  <div key={entry.driver} className="rounded-xl border border-line bg-white px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">P{entry.rank}</p>
                    <p className="mt-1 text-lg font-semibold">{entry.driver}</p>
                    <p className="text-sm text-muted">{entry.team}</p>
                    <p className="mt-1 text-xs text-muted">Win chance: {entry.probability}%</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : null}
    </main>
  );
}
