"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function formatUpdatedAt(value) {
  if (!value) {
    return "Saved baseline";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Waiting for first live snapshot";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function driverPortraitSrc(name) {
  return `/api/driver-portrait?name=${encodeURIComponent(name)}`;
}

export default function DriversLiveBoard({ initialData, year = 2026 }) {
  const [data, setData] = useState(initialData);
  const [refreshState, setRefreshState] = useState("idle");

  useEffect(() => {
    let cancelled = false;

    async function refreshStandings() {
      try {
        setRefreshState("refreshing");
        const response = await fetch(`/api/standings?year=${year}`, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(`Refresh failed with ${response.status}`);
        }

        const nextData = await response.json();
        if (!cancelled) {
          setData(nextData);
          setRefreshState("idle");
        }
      } catch (error) {
        if (!cancelled) {
          setRefreshState("error");
        }
      }
    }

    const intervalId = window.setInterval(refreshStandings, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [year]);

  const entries = data?.entries ?? [];
  const leaders = entries.slice(0, 5);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-line bg-white p-8 shadow-panel md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Drivers</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[0.96] tracking-tight md:text-7xl">
            Live 2026 driver standings with auto refresh built in.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted">
            F1Lab now reads live standings data instead of frozen file data. This page polls
            for updates every 30 seconds so the leaderboard can move during a race weekend.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted">
            <span className="rounded-full border border-line bg-soft px-4 py-2">
              Last update: {formatUpdatedAt(data?.updatedAt)}
            </span>
            <span className="rounded-full border border-line bg-soft px-4 py-2">
              Source: {data?.source ?? "unknown"}
            </span>
            <span className="rounded-full border border-line bg-soft px-4 py-2">
              Refresh: every 30s
            </span>
            {data?.stale ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-amber-900">
                {data?.updatedAt ? "Using last refreshed snapshot" : "Using bundled fallback"}
              </span>
            ) : null}
            {refreshState === "refreshing" ? (
              <span className="rounded-full border border-brand/20 bg-brand/5 px-4 py-2 text-brand">
                Refreshing now
              </span>
            ) : null}
            {refreshState === "error" ? (
              <span className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-red-900">
                Refresh failed, keeping last good data
              </span>
            ) : null}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-line bg-ink p-8 text-white shadow-panel md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300">Front runners</p>
          <div className="mt-6 space-y-3">
            {leaders.map((entry) => (
              <article
                key={entry.driver}
                className="grid grid-cols-[40px_56px_1fr_auto] items-center gap-4 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="text-lg font-semibold text-red-300">{entry.position}</div>
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                  <Image
                    src={driverPortraitSrc(entry.driver)}
                    alt={entry.driver}
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <p className="font-semibold">{entry.driver}</p>
                  <p className="text-sm text-white/60">{entry.team}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold">{entry.points}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">pts</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((driver, index) => (
          <article
            key={driver.driver}
            className="overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-panel"
          >
            <div className="h-2 w-full bg-ink" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="relative h-24 w-24 overflow-hidden rounded-[1.5rem] border border-line bg-soft">
                    <Image
                      src={driverPortraitSrc(driver.driver)}
                      alt={driver.driver}
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                      Driver #{String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="text-3xl font-semibold tracking-tight">{driver.driver}</h2>
                    <p className="mt-2 text-sm text-muted">{driver.team}</p>
                  </div>
                </div>
                <div className="rounded-full border border-line px-3 py-2 text-right">
                  <p className="text-2xl font-semibold leading-none">{driver.points}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted">Pts</p>
                </div>
              </div>
              <div className="mt-6 rounded-[1.25rem] bg-soft p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Team</p>
                <p className="mt-2 text-lg font-semibold tracking-tight">{driver.team}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
