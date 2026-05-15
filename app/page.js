import Link from "next/link";
import CarExplorer from "../components/car-explorer";

const quickFacts = [
  ["Season rounds", "24"],
  ["Model factors", "18"],
  ["Output", "P1-P5"],
  ["Refresh", "Live/beta"]
];

export default function HomePage() {
  return (
    <main className="relative">
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-14">
        <div className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-panel">
          <div className="border-b border-line bg-brand px-6 py-4 text-sm font-medium uppercase tracking-[0.24em] text-white">
            Prediction Platform
          </div>
          <div className="space-y-8 px-6 py-8 md:px-10 md:py-10">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">
                Race Winner Model
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
                Predict race winners before lights out.
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted md:text-lg">
                F1Lab ranks win probability for every race, explains why P1 was selected, and compares predictions with actual race results.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/predictions"
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand"
              >
                View predictions
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
                Prediction Snapshot
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Probability, confidence, explainability.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Select any race to open a dedicated report with factor scores, model math, and P1-P5 comparison.
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

      <CarExplorer />

    </main>
  );
}
