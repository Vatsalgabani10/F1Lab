import Link from "next/link";
import { fetchWeekendSessionSummaries } from "lib/f1-results";
import { getRaceDetail, getSeasonData } from "lib/season-store";

export const dynamic = "force-dynamic";

function slugifySession(label) {
  return label.toLowerCase().replace(/\s+/g, "-");
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return {
    title: `${resolvedParams.raceKey} | Season | F1Lab`
  };
}

function SessionMetricCard({ label, value, subvalue }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {subvalue ? <p className="mt-2 text-sm leading-7 text-white/65">{subvalue}</p> : null}
    </div>
  );
}

function hasBrokenSessionData(sessionSummaries) {
  return sessionSummaries.some(
    (session) =>
      session.status === "available" &&
      (!session.topThree?.length || !session.topThree[0]?.driver)
  );
}

export default async function SeasonRacePage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const year = Number(resolvedParams.year);
  const raceKey = resolvedParams.raceKey;
  const selectedSessionKey = resolvedSearchParams?.session ?? null;

  let race = null;
  let sessionSummaries = [];
  let error = null;

  try {
    if (year !== 2026) {
      throw new Error("F1Lab only supports 2026 season data.");
    }

    const seasonDoc = await getSeasonData(year);
    race = seasonDoc?.races?.find((entry) => entry.raceKey === raceKey) ?? null;

    if (!race) {
      throw new Error(`Race ${raceKey} not found for ${year}.`);
    }

    const raceDetail = await getRaceDetail(year, raceKey);
    sessionSummaries = raceDetail?.sessionSummaries ?? [];

    if (!sessionSummaries.length || hasBrokenSessionData(sessionSummaries)) {
      sessionSummaries = await fetchWeekendSessionSummaries(year, race);
    }
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "Unable to load official race data right now.";
  }

  const selectedSession =
    sessionSummaries.find((session) => slugifySession(session.label) === selectedSessionKey) ??
    sessionSummaries.at(-1) ??
    null;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <section className="rounded-[2rem] border border-line bg-white p-6 shadow-panel md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Race Details</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
              {race?.grandPrix ?? raceKey}
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              {year} season round {race?.round ?? "?"}
            </p>
          </div>
          <Link
            href="/season"
            className="rounded-full border border-line bg-soft px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Back to season
          </Link>
        </div>
      </section>

      {error ? (
        <section className="mt-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-900 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.22em]">Race Error</p>
          <p className="mt-3 text-base leading-8">{error}</p>
        </section>
      ) : null}

      {!error && year === 2026 ? (
        <>
          <section className="mt-8 rounded-[2rem] border border-line bg-white p-6 shadow-panel md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">
                  Session Selector
                </p>
                <h2 className="mt-2 text-4xl font-semibold tracking-tight">
                  Practice to race
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-muted">
                This page stores only the top three finishers, fastest lap, and the average speed of
                that fastest lap. Speeds are shown in km/h and mph.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {sessionSummaries.map((session) => {
                const sessionSlug = slugifySession(session.label);
                const isActive = selectedSession?.label === session.label;

                return (
                  <Link
                    key={session.label}
                    href={`/season/${year}/${raceKey}?session=${sessionSlug}`}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-brand text-white"
                        : "border border-line bg-soft text-ink hover:border-brand hover:text-brand"
                    }`}
                  >
                    {session.label}
                  </Link>
                );
              })}
            </div>
          </section>

          {selectedSession ? (
            <section className="mt-8 rounded-[2rem] border border-line bg-ink p-6 text-white shadow-panel md:p-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300">
                    Selected Session
                  </p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-tight">
                    {selectedSession.label}
                  </h2>
                </div>
                <Link
                  href={selectedSession.href}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40"
                >
                  Open official F1 source
                </Link>
              </div>

              {selectedSession.status === "available" ? (
                <>
                  <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    {selectedSession.topThree.map((entry) => (
                      <article
                        key={`${selectedSession.label}-${entry.position}`}
                        className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                          P{entry.position}
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold tracking-tight">{entry.driver}</h3>
                        <p className="mt-2 text-sm leading-7 text-white/65">{entry.team}</p>
                        <p className="mt-5 text-lg font-semibold text-red-300">{entry.result}</p>
                      </article>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <SessionMetricCard
                      label="Fastest Lap"
                      value={
                        selectedSession.fastestLap
                          ? `${selectedSession.fastestLap.driver} · ${selectedSession.fastestLap.time}`
                          : "Not available"
                      }
                      subvalue={
                        selectedSession.fastestLap ? selectedSession.fastestLap.team : null
                      }
                    />

                    <SessionMetricCard
                      label="Fastest Speed"
                      value={
                        selectedSession.fastestSpeed
                          ? `${selectedSession.fastestSpeed.driver} · ${selectedSession.fastestSpeed.kmh} km/h`
                          : "Not available"
                      }
                      subvalue={
                        selectedSession.fastestSpeed
                          ? `${selectedSession.fastestSpeed.team} · ${selectedSession.fastestSpeed.mph} mph · ${selectedSession.fastestSpeed.basis}`
                          : "Sprint sessions may not expose an official fastest-lap speed in the archive."
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-lg font-semibold">Official data is not available for this session yet.</p>
                </div>
              )}
            </section>
          ) : (
            <section className="mt-8 rounded-[2rem] border border-line bg-white p-6 shadow-panel md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">
                Session Status
              </p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight">
                No session data stored yet
              </h2>
            </section>
          )}
        </>
      ) : null}
    </main>
  );
}
