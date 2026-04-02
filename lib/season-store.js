import { getDb } from "lib/mongodb";
import {
  fetchSeasonCalendar,
  fetchSeasonOverview,
  fetchWeekendSessionSummaries
} from "lib/f1-results";

function extractEventSlug(url) {
  if (!url) {
    return "";
  }

  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts.at(-2) ?? "";
}

export async function buildSeasonDocument(year) {
  if (Number(year) !== 2026) {
    throw new Error("F1Lab stores only 2026 season data.");
  }

  const overview = await fetchSeasonOverview(year);

  const calendar = await fetchSeasonCalendar(year);
  const races = calendar.map((calendarRace) => {
    const matchingResult =
      overview.find((race) => extractEventSlug(race.href) === calendarRace.slug) ?? null;

    return {
      raceKey: calendarRace.slug,
      round: calendarRace.round,
      grandPrix: calendarRace.grandPrix,
      date: calendarRace.date,
      eventHref: calendarRace.href,
      href: matchingResult?.href ?? null,
      winner: matchingResult?.winner ?? "Results pending",
      car: matchingResult?.car ?? "TBC",
      fastestLapDriver: matchingResult?.fastestLapDriver ?? "Results pending",
      fastestLapTime: matchingResult?.fastestLapTime ?? "TBC"
    };
  });

  return {
    year: Number(year),
    source: "official-f1",
    updatedAt: new Date(),
    races
  };
}

export async function buildRaceDetailDocument(year, race) {
  if (Number(year) !== 2026) {
    throw new Error("F1Lab stores only 2026 race detail data.");
  }

  const sessionSummaries = await fetchWeekendSessionSummaries(year, race);

  return {
    year: Number(year),
    raceKey: race.raceKey,
    grandPrix: race.grandPrix,
    eventHref: race.eventHref ?? null,
    raceHref: race.href ?? null,
    sessionSummaries,
    updatedAt: new Date()
  };
}

export async function upsertSeason(year) {
  const seasonDoc = await buildSeasonDocument(year);
  const db = await getDb();
  const seasons = db.collection("seasons");

  await seasons.updateOne(
    { year: Number(year) },
    { $set: seasonDoc },
    { upsert: true }
  );

  return seasonDoc;
}

export async function upsertRaceDetails(year, races) {
  const db = await getDb();
  const raceDetails = db.collection("race_details");

  for (const race of races) {
    const detail = await buildRaceDetailDocument(year, race);
    await raceDetails.updateOne(
      { year: Number(year), raceKey: race.raceKey },
      { $set: detail },
      { upsert: true }
    );
  }
}

export async function getSeasonData(year) {
  try {
    const db = await getDb();
    const seasons = db.collection("seasons");
    const storedSeason = await seasons.findOne({ year: Number(year) });

    if (storedSeason) {
      return storedSeason;
    }
  } catch {
    // Fall back to a live build if MongoDB is temporarily unavailable.
  }

  const seasonDoc = await buildSeasonDocument(year);

  try {
    const db = await getDb();
    const seasons = db.collection("seasons");
    await seasons.updateOne(
      { year: Number(year) },
      { $set: seasonDoc },
      { upsert: true }
    );
  } catch {
    // Rendering the page matters more than persisting the cache snapshot.
  }

  return seasonDoc;
}

export async function getRaceDetail(year, raceKey) {
  try {
    const db = await getDb();
    const raceDetails = db.collection("race_details");
    return raceDetails.findOne({ year: Number(year), raceKey });
  } catch {
    return null;
  }
}
