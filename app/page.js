import Link from "next/link";
import CarExplorer from "../components/car-explorer";

const sportSections = [
  {
    title: "What Formula 1 Is",
    text: "Formula 1 is the highest level of single-seater motorsport. Teams design and race highly specialized cars across a global championship, where performance comes from speed, strategy, engineering, and consistency over an entire season."
  },
  {
    title: "How A Race Weekend Works",
    text: "A standard F1 weekend usually includes practice sessions, qualifying, and the Grand Prix. Practice helps teams tune the car, qualifying sets the starting order, and the race itself combines pace, tire management, pit stops, and decision-making under pressure."
  },
  {
    title: "Why The Sport Is So Technical",
    text: "Small changes in setup or conditions can affect lap time, tire wear, and balance. That is why Formula 1 is as much an engineering competition as it is a driving competition."
  }
];

const quickFacts = [
  ["Teams", "11"],
  ["Drivers", "22"],
  ["Goal", "2 titles"],
  ["Edge", "Setup + pace"]
];

export default function HomePage() {
  return (
    <main className="relative">
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-14">
        <div className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-panel">
          <div className="border-b border-line bg-brand px-6 py-4 text-sm font-medium uppercase tracking-[0.24em] text-white">
            Introduction To Formula 1
          </div>
          <div className="space-y-8 px-6 py-8 md:px-10 md:py-10">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">
                About The Sport
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
                Formula 1 is where elite driving meets extreme engineering.
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted md:text-lg">
                Fast cars, sharp strategy, tiny margins. F1Lab turns the sport into a cleaner, more visual experience.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/tracks"
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand"
              >
                Explore tracks
              </Link>
              <Link
                href="/drivers"
                className="rounded-full border border-line bg-soft px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
              >
                View drivers
              </Link>
            </div>
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-[2rem] border border-line bg-ink text-white shadow-panel">
          <img
            src="/images/tracks-hero.jpg"
            alt="Formula 1 cars battling on track"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.2),rgba(10,10,12,0.85))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_30%)]" />
          <div className="relative flex h-full min-h-[420px] flex-col justify-end p-6 md:p-8">
            <div className="max-w-md rounded-[1.5rem] border border-white/10 bg-black/35 p-5 backdrop-blur-md">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-red-300">
                Quick Facts
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Speed, strategy, pressure.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Every lap is a fight between driver skill, car balance, tire life, and timing.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {quickFacts.map(([label, value]) => (
                <article
                  key={label}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 backdrop-blur-sm"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-red-300">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-4 md:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">
            About The Sport
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">
            Formula 1 is built around speed, rules, and relentless optimization.
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {sportSections.map((item) => (
            <article key={item.title} className="rounded-[1.75rem] border border-line bg-white p-6 shadow-panel">
              <h3 className="text-2xl font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-4 text-base leading-8 text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <CarExplorer />

      <section className="mx-auto w-full max-w-7xl px-5 pb-14 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[1.75rem] border border-line bg-white p-6 shadow-panel md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">
              Why F1Lab
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              This project turns Formula 1 into a structured web experience.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted">
              The homepage now explains the sport and the car first. Tracks,
              drivers, and future analysis tools can each live on dedicated pages
              without crowding the introduction.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-line bg-soft p-6 shadow-panel md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">
              Next Sections
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] border border-line bg-white p-4">
                <h3 className="text-xl font-semibold tracking-tight">Tracks Page</h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Circuit layouts, race stats, and track-specific characteristics.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-line bg-white p-4">
                <h3 className="text-xl font-semibold tracking-tight">Drivers Page</h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Driver grid, team links, and driver-specific overview content.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
