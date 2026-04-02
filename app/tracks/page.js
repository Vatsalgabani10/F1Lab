import { featuredTracks } from "lib/f1-data";

function TrackMiniMap({ track }) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-line bg-ink p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_58%)]" />
      <div className="relative rounded-[1.25rem] bg-black/30 p-4">
        <img
          src={`/api/track-map?name=${encodeURIComponent(track.name)}`}
          alt={`${track.name} official circuit map`}
          className="h-48 w-full rounded-[1rem] object-contain md:h-56"
          loading="lazy"
        />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Tracks | F1Lab",
  description: "Circuit profiles and race statistics for selected 2026 Formula 1 venues."
};

const tracksHeroImage = "/images/tracks-hero.jpg";

export default function TracksPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-black/40 bg-white p-8 shadow-panel md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Tracks</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[0.96] tracking-tight md:text-7xl">
            Circuit pages with the right level of race-weekend detail.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted">
            The tracks section uses official 2026 event and circuit information as the base layer for a
            more premium motorsport interface. Each card is structured so setup modeling can be added later.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-black/40 shadow-panel">
          <img
            src={tracksHeroImage}
            alt="Formula 1 car on track during testing"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-[5px] brightness-[0.62] saturate-[1.08]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(8,8,10,0.9),rgba(95,0,0,0.58)_44%,rgba(8,8,10,0.88))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(255,255,255,0.1),transparent_24%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.18),transparent_22%,transparent_80%,rgba(255,70,70,0.12))]" />
          <div className="absolute inset-0 bg-black/24" />
          <div className="absolute -left-12 top-16 h-40 w-72 rotate-[-8deg] rounded-full bg-white/6 blur-3xl" />
          <div className="absolute right-[-4rem] top-24 h-48 w-80 rotate-[10deg] rounded-full bg-red-500/16 blur-3xl" />
          <div className="relative flex h-full flex-col p-8 text-white md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-100">What matters</p>
            <div className="mt-6 max-w-lg rounded-[1.75rem] border border-white/12 bg-black/30 p-6 backdrop-blur-md">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Speed, pressure, and clean air shape every lap.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/80">
                The panel is meant to feel like a chase shot through the spray and heat haze, while the
                core circuit metrics stay readable on top.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["Circuit length", "Baseline pace and sector balance"],
              ["Laps", "Race rhythm and tire exposure"],
              ["Race distance", "Strategy context"],
              ["Fastest lap", "Historic performance marker"]
            ].map(([title, text]) => (
              <article
                key={title}
                className="rounded-[1.5rem] border border-black/45 bg-black/30 p-5 backdrop-blur-md"
              >
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/80">{text}</p>
              </article>
            ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        {featuredTracks.map((track) => (
          <article
            key={track.name}
            className="overflow-hidden rounded-[2rem] border border-black/40 bg-white shadow-panel"
          >
            <div className="border-b border-black/35 bg-soft px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                    Round {track.round} • {track.country}
                  </p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-tight">{track.name}</h2>
                  <p className="mt-2 text-sm text-muted">{track.date}</p>
                </div>
                <div className="rounded-full border border-brand/15 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                  2026
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="rounded-[1.5rem] border border-black/45 bg-ink p-6 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-red-300">Character</p>
                <p className="mt-4 text-2xl font-semibold leading-tight">{track.character}</p>
                <div className="mt-6">
                  <TrackMiniMap track={track} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  ["Circuit length", track.circuitLength],
                  ["Number of laps", track.laps],
                  ["Race distance", track.raceDistance],
                  ["First Grand Prix", track.firstGrandPrix],
                  ["Fastest lap", track.fastestLap],
                  ["Record holder", track.fastestLapHolder]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[1.25rem] border border-black/40 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">{label}</p>
                    <p className="mt-3 text-lg font-semibold tracking-tight">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
