import * as cheerio from "cheerio";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDb } from "lib/mongodb";
import { drivers as bundledDrivers } from "lib/f1-data";

const OFFICIAL_URLS = (year) => [
  `https://www.formula1.com/en/results/${year}/drivers`,
  `https://www.formula1.com/en/results/${year}/driver`
];

const RN365_URLS = (year) => [
  `https://racingnews365.com/f1/standings`,
  `https://racingnews365.com/formula-1-standings-${year}`
];
const ESPN_URLS = [
  "https://www.espn.com/racing/standings/_/series/f1",
  "https://www.espn.com/f1/table"
];
const SNAPSHOT_DIR = path.join(process.cwd(), ".cache");
const snapshotPathForYear = (year) => path.join(SNAPSHOT_DIR, `driver-standings-${year}.json`);
const NAME_ALIASES = new Map([
  ["Andrea Kimi Antonelli", "Kimi Antonelli"],
  ["Nico Hulkenberg", "Nico Huelkenberg"],
  ["Nico Hülkenberg", "Nico Huelkenberg"],
  ["Sergio Pérez", "Sergio Perez"]
]);

function cleanText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function stripFlagPrefix(value) {
  return value.replace(/^Flag of [A-Za-zÀ-ÿ'’.\-\s]+?\s/, "").trim();
}

function normalizeReadableName(value) {
  const normalized = stripFlagPrefix(cleanText(value))
    .replace(/\s+[A-Z]{3}$/, "")
    .replace(/([A-Za-zÀ-ÿ'’.\-])([A-Z]{3})$/, "$1")
    .trim();

  return NAME_ALIASES.get(normalized) ?? normalized;
}

function parsePoints(value) {
  const match = cleanText(value).match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

function parsePosition(value, fallbackIndex) {
  const match = cleanText(value).match(/\d+/);
  return match ? String(Number(match[0])).padStart(2, "0") : String(fallbackIndex + 1).padStart(2, "0");
}

function parseHtmlTable($, table) {
  const headers = $(table)
    .find("thead th")
    .map((_, element) => cleanText($(element).text()).toLowerCase())
    .get();

  if (!headers.length) {
    return [];
  }

  const positionIndex = headers.findIndex((header) => header.includes("pos"));
  const driverIndex = headers.findIndex((header) => header.includes("driver"));
  const teamIndex = headers.findIndex((header) => header.includes("team") || header.includes("car"));
  const pointsIndex = headers.findIndex((header) => header === "pts" || header.includes("point"));

  if (driverIndex === -1 || teamIndex === -1 || pointsIndex === -1) {
    return [];
  }

  return $(table)
    .find("tbody tr")
    .map((index, row) => {
      const cells = $(row)
        .find("td")
        .map((__, cell) => normalizeReadableName($(cell).text()))
        .get()
        .filter(Boolean);

      if (!cells.length) {
        return null;
      }

      const points = parsePoints(cells[pointsIndex] ?? "");
      if (points === null) {
        return null;
      }

      return {
        position: parsePosition(cells[positionIndex] ?? "", index),
        driver: cells[driverIndex] ?? "Unknown Driver",
        team: cells[teamIndex] ?? "Unknown Team",
        points
      };
    })
    .get()
    .filter(Boolean);
}

function parseGpFansFallbackText(bodyText) {
  const compact = cleanText(bodyText);
  const matches = [...compact.matchAll(/(\d+)\s+points\s+(\d+)\s+([A-Za-z][A-Za-z\s-]+?)\s+([A-Z][A-Za-zÀ-ÿ'’.\-\s]+?)(?=\d+\s+points|Drivers|Teams|Races|$)/g)];

  return matches
    .map((match) => ({
      position: String(Number(match[1])).padStart(2, "0"),
      points: Number(match[2]),
      team: cleanText(match[3]),
      driver: cleanText(match[4])
    }))
    .filter((entry) => entry.driver && entry.team && Number.isFinite(entry.points));
}

async function fetchHtml(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      "user-agent": "Mozilla/5.0 F1Lab Live Standings",
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchOfficialStandings(year) {
  for (const url of OFFICIAL_URLS(year)) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const tables = $("table").toArray();

      for (const table of tables) {
        const standings = parseHtmlTable($, table);
        if (standings.length) {
          return {
            source: "official-f1",
            sourceUrl: url,
            entries: standings
          };
        }
      }
    } catch (error) {
      if (url === OFFICIAL_URLS(year).at(-1)) {
        throw error;
      }
    }
  }

  throw new Error(`No standings table found for ${year} on formula1.com`);
}

async function fetchRacingNews365Standings(year) {
  for (const url of RN365_URLS(year)) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const tables = $("table").toArray();

      for (const table of tables) {
        const standings = parseHtmlTable($, table);
        if (standings.length >= 10) {
          return {
            source: "racingnews365",
            sourceUrl: url,
            entries: standings
          };
        }
      }
    } catch (error) {
      if (url === RN365_URLS(year).at(-1)) {
        throw error;
      }
    }
  }

  throw new Error(`No standings table found for ${year} on RacingNews365`);
}

async function fetchEspnStandings(year) {
  for (const url of ESPN_URLS) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const tables = $("table").toArray();

      for (const table of tables) {
        const standings = parseHtmlTable($, table);
        if (standings.length >= 10) {
          return {
            source: "espn",
            sourceUrl: url,
            entries: standings
          };
        }
      }
    } catch (error) {
      if (url === ESPN_URLS.at(-1)) {
        throw error;
      }
    }
  }

  throw new Error(`No standings table found for ${year} on ESPN`);
}

async function persistStandingsSnapshot(year, payload) {
  const db = await getDb();
  const collection = db.collection("driver_standings");

  await collection.updateOne(
    { year: Number(year) },
    {
      $set: {
        year: Number(year),
        source: payload.source,
        sourceUrl: payload.sourceUrl,
        entries: payload.entries,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
}

async function persistStandingsFileSnapshot(year, payload) {
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  await writeFile(
    snapshotPathForYear(year),
    JSON.stringify(
      {
        year: Number(year),
        source: payload.source,
        sourceUrl: payload.sourceUrl,
        entries: payload.entries,
        updatedAt: new Date().toISOString()
      },
      null,
      2
    ),
    "utf8"
  );
}

async function getStoredFileDriverStandings(year) {
  try {
    const raw = await readFile(snapshotPathForYear(year), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getBundledDriverStandings(year) {
  if (Number(year) !== 2026) {
    return null;
  }

  return {
    year: 2026,
    source: "bundled-fallback",
    sourceUrl: null,
    entries: bundledDrivers.map((driver, index) => ({
      position: String(index + 1).padStart(2, "0"),
      driver: driver.name,
      team: driver.team,
      points: driver.points
    })),
    updatedAt: null,
    stale: true,
    fallback: true
  };
}

export async function getStoredDriverStandings(year) {
  try {
    const db = await getDb();
    const collection = db.collection("driver_standings");
    return collection.findOne({ year: Number(year) });
  } catch {
    return null;
  }
}

export async function getLiveDriverStandings(year) {
  const errors = [];

  for (const loader of [fetchRacingNews365Standings, fetchOfficialStandings, fetchEspnStandings]) {
    try {
      const payload = await loader(year);
      try {
        await persistStandingsSnapshot(year, payload);
      } catch {
        // Live standings are still valuable even if snapshot persistence is temporarily unavailable.
      }
      try {
        await persistStandingsFileSnapshot(year, payload);
      } catch {
        // File snapshotting is only a backup cache.
      }

      return {
        year: Number(year),
        source: payload.source,
        sourceUrl: payload.sourceUrl,
        entries: payload.entries,
        updatedAt: new Date().toISOString(),
        stale: false
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown standings fetch error");
    }
  }

  const stored = await getStoredDriverStandings(year);
  if (stored) {
    return {
      year: stored.year,
      source: stored.source,
      sourceUrl: stored.sourceUrl,
      entries: stored.entries ?? [],
      updatedAt: stored.updatedAt instanceof Date ? stored.updatedAt.toISOString() : new Date(stored.updatedAt).toISOString(),
      stale: true,
      error: errors.join(" | ")
    };
  }

  const fileSnapshot = await getStoredFileDriverStandings(year);
  if (fileSnapshot) {
    return {
      year: fileSnapshot.year,
      source: fileSnapshot.source ?? "file-snapshot",
      sourceUrl: fileSnapshot.sourceUrl ?? null,
      entries: fileSnapshot.entries ?? [],
      updatedAt: fileSnapshot.updatedAt ?? null,
      stale: true,
      error: errors.join(" | ")
    };
  }

  const bundledFallback = getBundledDriverStandings(year);
  if (bundledFallback) {
    return {
      ...bundledFallback,
      error: errors.join(" | ")
    };
  }

  throw new Error(errors.join(" | ") || `Unable to load driver standings for ${year}`);
}
