import DriversLiveBoard from "components/drivers-live-board";
import { getLiveDriverStandings } from "lib/driver-standings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Drivers | F1Lab",
  description: "Live 2026 Formula 1 driver standings for F1Lab."
};

export default async function DriversPage() {
  try {
    const liveStandings = await getLiveDriverStandings(2026);
    return <DriversLiveBoard initialData={liveStandings} year={2026} />;
  } catch (error) {
    return (
      <main className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <section className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-950 shadow-panel md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em]">Drivers</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Live standings are temporarily unavailable.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8">
            {error instanceof Error ? error.message : "F1Lab could not load the live standings feed."}
          </p>
        </section>
      </main>
    );
  }
}
