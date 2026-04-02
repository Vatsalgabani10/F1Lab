import Link from "next/link";
import { getSeasonData } from "lib/season-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Season | F1Lab",
  description: "2026 Formula 1 season calendar with dedicated race session pages."
};

export default async function SeasonPage() {
  const selectedYear = 2026;
  let displayRaces = [];
  let error = null;

  try {
    const seasonDoc = await getSeasonData(selectedYear);

    if (!seasonDoc) {
      throw new Error("No MongoDB 2026 season data found. Run the season seed first.");
    }

    displayRaces = seasonDoc.races ?? [];
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "Unable to load official Formula 1 archive data right now.";
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <section className="rounded-[2rem] border border-line bg-white px-6 py-5 shadow-panel md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Season Archive</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
              Official F1 season data
            </h1>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            Source: official Formula 1 archive on{" "}
            <a
              href="https://www.formula1.com/en/results"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-ink underline"
            >
              formula1.com
            </a>
            .
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-line bg-white p-6 shadow-panel md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Current View</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight">{selectedYear} Season</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
              F1Lab now focuses only on the 2026 championship. Every round opens a dedicated race
              page with stored session summaries from practice to race.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <section className="mt-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-900 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.22em]">Archive Error</p>
          <p className="mt-3 text-base leading-8">{error}</p>
        </section>
      ) : null}

      {!error ? (
        <>
          <section className="mt-8 rounded-[2rem] border border-line bg-white p-6 shadow-panel md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">
                  {selectedYear} Calendar
                </p>
                <h2 className="mt-2 text-4xl font-semibold tracking-tight">
                  Every round of the 2026 season.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-muted">
                Choose a race below to open its dedicated session page.
              </p>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {displayRaces.map((race) => {
                const raceKey = race.raceKey ?? race.slug;
                return (
                  <Link
                    key={race.eventHref ?? race.href ?? `${selectedYear}-${race.round}`}
                    href={`/season/${selectedYear}/${raceKey}`}
                    className="rounded-[1.5rem] border border-line bg-white p-5 transition hover:border-brand"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted">Round {race.round}</p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-tight">{race.grandPrix}</h3>
                        <p className="mt-2 text-sm text-muted">{race.date}</p>
                      </div>
                      <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                        {selectedYear}
                      </span>
                    </div>

                    <div className="mt-5 inline-flex rounded-full border border-line bg-soft px-4 py-2 text-sm font-semibold text-ink">
                      Open race page
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
