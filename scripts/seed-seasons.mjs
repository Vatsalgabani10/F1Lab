import * as cheerio from "cheerio";
import { MongoClient } from "mongodb";

const BASE_URL = "https://www.formula1.com";
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "f1lab";

if (!mongoUri) {
  throw new Error("Missing MONGODB_URI in environment");
}

function cleanText(value) {
  let nextValue = value.replace(/\s+/g, " ").trim();
  nextValue = nextValue.replace(/\bImage\b/g, "").replace(/\bChequered Flag\b/g, "");
  nextValue = nextValue.replace(/\bExpand\b/g, "");
  nextValue = nextValue.replace(/\s+/g, " ").trim();

  const repeatedHalf =
    nextValue.length % 2 === 0 &&
    nextValue.slice(0, nextValue.length / 2) === nextValue.slice(nextValue.length / 2)
      ? nextValue.slice(0, nextValue.length / 2)
      : null;

  return repeatedHalf ?? nextValue;
}

function toAbsoluteUrl(href) {
  return new URL(href, BASE_URL).toString();
}

function normalizeRaceName(name) {
  return name.toLowerCase().replace(/grand prix/g, "").replace(/\s+/g, " ").trim();
}

function stripFlagPrefix(value) {
  return value.replace(/^Flag of [A-Za-zÀ-ÿ'’.\-\s]+?\s/, "").trim();
}

function stripDriverCode(value) {
  return value
    .replace(/([A-Za-zÀ-ÿ'’.\-])([A-Z]{3})$/, "$1")
    .replace(/\s+[A-Z]{3}$/, "")
    .trim();
}

function normalizeReadableName(value) {
  return stripDriverCode(stripFlagPrefix(cleanText(value)));
}

function normalizeResultsUrl(url) {
  return url.replace(/\/+$/, "");
}

function parseLapTimeToSeconds(value) {
  if (!value) {
    return null;
  }

  const normalized = cleanText(value);

  if (!/^\d+(?::\d+)?\.\d+$/.test(normalized)) {
    return null;
  }

  const parts = normalized.split(":");

  if (parts.length === 1) {
    return Number(parts[0]);
  }

  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  return null;
}

function formatSpeed(value) {
  return Number.isFinite(value) ? value.toFixed(3) : null;
}

function convertKmhToMph(kmh) {
  return kmh * 0.621371;
}

function extractCircuitLengthKm($) {
  const bodyText = cleanText($("body").text());
  const match = bodyText.match(/\b(\d+\.\d+)\s?km\b/i);
  return match ? Number(match[1]) : null;
}

function buildAverageSpeed(time, circuitLengthKm) {
  const seconds = parseLapTimeToSeconds(time);

  if (!seconds || !circuitLengthKm) {
    return null;
  }

  return {
    kmh: formatSpeed((circuitLengthKm / seconds) * 3600),
    mph: formatSpeed(convertKmhToMph((circuitLengthKm / seconds) * 3600))
  };
}

function getHeaderIndex(headers, patterns) {
  const lowerHeaders = headers.map((header) => header.toLowerCase());
  return lowerHeaders.findIndex((header) => patterns.some((pattern) => header.includes(pattern)));
}

function extractDriverTeam(row, headers) {
  const driverIndex = getHeaderIndex(headers, ["driver"]);
  const teamIndex = getHeaderIndex(headers, ["team", "car"]);

  return {
    driver: normalizeReadableName(row[driverIndex] ?? ""),
    team: normalizeReadableName(row[teamIndex] ?? "")
  };
}

function extractResultValue(row, headers, label) {
  const lowerHeaders = headers.map((header) => header.toLowerCase());

  if (label === "Race" || label === "Sprint") {
    const timeIndex = lowerHeaders.findIndex((header) => header.includes("time / retired"));
    return row[timeIndex] ?? "N/A";
  }

  if (label === "Qualifying" || label === "Sprint Qualifying") {
    const q3Index = lowerHeaders.findIndex((header) => header === "q3");
    const q2Index = lowerHeaders.findIndex((header) => header === "q2");
    const q1Index = lowerHeaders.findIndex((header) => header === "q1");
    return row[q3Index] || row[q2Index] || row[q1Index] || "N/A";
  }

  const timeIndex = lowerHeaders.findIndex(
    (header) => header.includes("time / gap") || header === "time"
  );
  return row[timeIndex] ?? "N/A";
}

function buildTopThreeSummary(table, label) {
  const positionIndex = getHeaderIndex(table.headers, ["pos"]);

  return table.rows.slice(0, 3).map((row, index) => {
    const { driver, team } = extractDriverTeam(row, table.headers);

    return {
      position: row[positionIndex] ?? String(index + 1),
      driver,
      team,
      result: extractResultValue(row, table.headers, label)
    };
  });
}

function parseFirstTable($) {
  const table = $("table").first();
  if (!table.length) {
    return { headers: [], rows: [] };
  }

  const headers = table
    .find("thead th")
    .map((_, element) => cleanText($(element).text()))
    .get()
    .filter(Boolean);

  const rows = table
    .find("tbody tr")
    .map((_, row) => {
      const cells = $(row)
        .find("td")
        .map((__, cell) => cleanText($(cell).text()))
        .get()
        .filter(Boolean);

      if (!cells.length) {
        return null;
      }

      const href = $(row).find("a[href*='/en/results/']").first().attr("href");
      return { cells, href: href ? toAbsoluteUrl(href) : null };
    })
    .get()
    .filter(Boolean);

  return { headers, rows };
}

function getSessionLabelFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const session = parts.at(-1);
  const parent = parts.at(-2);

  if (parent === "practice") {
    return `Practice ${session}`;
  }

  switch (session) {
    case "qualifying":
      return "Qualifying";
    case "sprint-qualifying":
      return "Sprint Qualifying";
    case "starting-grid":
      return "Qualifying";
    case "sprint-grid":
      return "Sprint Qualifying";
    case "sprint":
    case "sprint-results":
      return "Sprint";
    case "race-result":
      return "Race";
    default:
      return session
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function extractEventSlug(url) {
  if (!url) {
    return "";
  }
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts.at(-2) ?? "";
}

function extractRaceKey(url) {
  if (!url) {
    return "";
  }
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return `${parts[3]}-${parts[4]}`;
}

async function fetchOfficialHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 F1Lab Seeder"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return response.text();
}

async function fetchResultsTable(url) {
  const html = await fetchOfficialHtml(url);
  const $ = cheerio.load(html);
  const table = parseFirstTable($);
  const unavailable = table.rows.some(
    (row) => row.cells.length === 1 && row.cells[0].toLowerCase() === "no results available"
  );

  return {
    table: {
      headers: table.headers,
      rows: unavailable ? [] : table.rows.map((row) => row.cells)
    },
    circuitLengthKm: extractCircuitLengthKm($)
  };
}

function getSessionCandidates(label, href) {
  const normalizedHref = normalizeResultsUrl(href);
  const candidates = [normalizedHref];

  if (label === "Qualifying") {
    candidates.push(normalizedHref.replace(/\/qualifying$/, "/starting-grid"));
    candidates.push(normalizedHref.replace(/\/starting-grid$/, "/qualifying"));
  }

  if (label === "Sprint Qualifying") {
    candidates.push(normalizedHref.replace(/\/sprint-qualifying$/, "/sprint-grid"));
    candidates.push(normalizedHref.replace(/\/sprint-grid$/, "/sprint-qualifying"));
  }

  if (label === "Sprint") {
    candidates.push(normalizedHref.replace(/\/sprint$/, "/sprint-results"));
  }

  return [...new Set(candidates)];
}

async function fetchFastestRaceLap(raceResultUrl) {
  const fastestLapUrl = normalizeResultsUrl(raceResultUrl).replace(/\/race-result$/, "/fastest-laps");
  const { table } = await fetchResultsTable(fastestLapUrl);

  if (!table.rows.length) {
    return { fastestLap: null, fastestSpeed: null };
  }

  const firstRow = table.rows[0];
  const { driver, team } = extractDriverTeam(firstRow, table.headers);
  const timeIndex = getHeaderIndex(table.headers, ["time"]);
  const avgSpeedIndex = getHeaderIndex(table.headers, ["avg. speed"]);
  const time = firstRow[timeIndex] ?? null;
  const avgSpeedValue = firstRow[avgSpeedIndex] ?? null;
  const kmh = avgSpeedValue ? Number(avgSpeedValue) : null;

  return {
    fastestLap: time
      ? {
          driver,
          team,
          time
        }
      : null,
    fastestSpeed:
      kmh !== null
        ? {
            driver,
            team,
            kmh: formatSpeed(kmh),
            mph: formatSpeed(convertKmhToMph(kmh)),
            basis: "Average speed of the official fastest lap"
          }
        : null
  };
}

async function fetchSessionSummary(label, href) {
  const candidates = getSessionCandidates(label, href);
  let selectedUrl = candidates[0];
  let selectedTable = { headers: [], rows: [] };
  let circuitLengthKm = null;

  for (const candidate of candidates) {
    const result = await fetchResultsTable(candidate);
    if (result.table.rows.length) {
      selectedUrl = candidate;
      selectedTable = result.table;
      circuitLengthKm = result.circuitLengthKm;
      break;
    }

    if (!circuitLengthKm) {
      circuitLengthKm = result.circuitLengthKm;
    }
  }

  if (!selectedTable.rows.length) {
    return {
      label,
      href: selectedUrl,
      status: "pending",
      topThree: [],
      fastestLap: null,
      fastestSpeed: null
    };
  }

  const topThree = buildTopThreeSummary(selectedTable, label);
  let fastestLap = null;
  let fastestSpeed = null;

  if (label === "Race") {
    const raceMetrics = await fetchFastestRaceLap(selectedUrl);
    fastestLap = raceMetrics.fastestLap;
    fastestSpeed = raceMetrics.fastestSpeed;
  } else if (label !== "Sprint" && topThree.length) {
    const lapLeader = topThree[0];
    const speed = buildAverageSpeed(lapLeader.result, circuitLengthKm);

    fastestLap = {
      driver: lapLeader.driver,
      team: lapLeader.team,
      time: lapLeader.result
    };

    if (speed) {
      fastestSpeed = {
        driver: lapLeader.driver,
        team: lapLeader.team,
        kmh: speed.kmh,
        mph: speed.mph,
        basis: "Average speed of the fastest lap"
      };
    }
  }

  return {
    label,
    href: selectedUrl,
    status: "available",
    topThree,
    fastestLap,
    fastestSpeed
  };
}

async function fetchSeasonOverview(year) {
  const [racesHtml, fastestHtml] = await Promise.all([
    fetchOfficialHtml(`${BASE_URL}/en/results/${year}/races`),
    fetchOfficialHtml(`${BASE_URL}/en/results/${year}/awards/fastest-laps`)
  ]);

  const races$ = cheerio.load(racesHtml);
  const fastest$ = cheerio.load(fastestHtml);
  const racesTable = parseFirstTable(races$);
  const fastestTable = parseFirstTable(fastest$);

  const fastestByRace = new Map(
    fastestTable.rows.map((row) => [
      normalizeRaceName(row.cells[0] ?? ""),
      {
        driver: row.cells[1] ?? "N/A",
        time: row.cells.at(-1) ?? "N/A"
      }
    ])
  );

  return racesTable.rows.map((row, index) => {
    const grandPrix = normalizeReadableName(row.cells[0] ?? `Round ${index + 1}`);
    const fastest = fastestByRace.get(normalizeRaceName(grandPrix));

    return {
      raceKey: extractRaceKey(row.href),
      round: String(index + 1).padStart(2, "0"),
      grandPrix,
      date: row.cells[1] ?? "N/A",
      winner: normalizeReadableName(row.cells[2] ?? "N/A"),
      car: normalizeReadableName(row.cells[3] ?? "N/A"),
      laps: row.cells[4] ?? "N/A",
      time: row.cells[5] ?? "N/A",
      href: row.href,
      fastestLapDriver: normalizeReadableName(fastest?.driver ?? "N/A"),
      fastestLapTime: fastest?.time ?? "N/A"
    };
  });
}

async function fetchSeasonCalendar(year) {
  const html = await fetchOfficialHtml(`${BASE_URL}/en/racing/${year}`);
  const $ = cheerio.load(html);
  const seen = new Set();
  const races = [];

  $("a[href^='/en/racing/']").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || !href.includes(`/${year}/`)) {
      return;
    }

    const absolute = toAbsoluteUrl(href);
    const url = new URL(absolute);
    const slug = url.pathname.split("/").filter(Boolean).at(-1);

    if (!slug || slug === String(year) || slug.endsWith(".html") || seen.has(slug)) {
      return;
    }

    const text = cleanText($(element).text());
    if (!text.startsWith("ROUND ") || text.includes("TESTING")) {
      return;
    }

    seen.add(slug);
    const roundMatch = text.match(/ROUND\s+(\d+)/i);
    const grandPrixMatch = text.match(/Flag of .*? ([A-Za-zÀ-ÿ'’.\-][A-Za-zÀ-ÿ'’.\-\s]+?) FORMULA 1/i);
    const dateMatch = text.match(/(\d{2}\s-\s\d{2}\s[A-Z]{3}|\d{2}\s[A-Z]{3}\s-\s\d{2}\s[A-Z]{3})/i);

    races.push({
      raceKey: slug,
      round: roundMatch ? String(roundMatch[1]).padStart(2, "0") : "",
      grandPrix: normalizeReadableName(grandPrixMatch?.[1] ?? slug.replace(/-/g, " ")),
      date: dateMatch?.[1] ?? "TBC",
      eventHref: absolute
    });
  });

  return races.sort((left, right) => Number(left.round) - Number(right.round));
}

async function fetchRaceClassification(raceUrl) {
  const html = await fetchOfficialHtml(raceUrl);
  const $ = cheerio.load(html);
  const table = parseFirstTable($);
  const sessionEntries = $("a[href*='/en/results/']")
    .map((_, element) => {
      const href = $(element).attr("href");
      if (!href || !href.includes("/races/")) {
        return null;
      }

      const absolute = toAbsoluteUrl(href);
      const pathname = new URL(absolute).pathname;
      if (!pathname.includes("/races/")) {
        return null;
      }

      return [absolute, { href: absolute, label: getSessionLabelFromPath(pathname) }];
    })
    .get()
    .filter((entry) => Array.isArray(entry) && entry.length === 2);

  return {
    headers: table.headers,
    rows: table.rows.map((row) => row.cells),
    sessionLinks: Array.from(new Map(sessionEntries).values())
  };
}

async function fetchWeekendSessions(year, raceUrl) {
  if (Number(year) !== 2026) {
    return [];
  }
  const raceHref = normalizeResultsUrl(raceUrl);

  if (!raceHref) {
    return [];
  }

  const raceParts = new URL(raceHref).pathname.split("/").filter(Boolean);
  const session = raceParts.at(-1);
  const slug = raceParts.at(-2);
  const roundId = raceParts.at(-3);
  const baseResultPath = `${BASE_URL}/en/results/${year}/races/${roundId}/${slug}`;
  const candidates = [
    ["Practice 1", `${baseResultPath}/practice/1`],
    ["Practice 2", `${baseResultPath}/practice/2`],
    ["Practice 3", `${baseResultPath}/practice/3`],
    ["Sprint Qualifying", `${baseResultPath}/sprint-qualifying`],
    ["Sprint", `${baseResultPath}/sprint-results`],
    ["Qualifying", `${baseResultPath}/qualifying`],
    ["Race", session === "race-result" ? raceHref : `${baseResultPath}/race-result`]
  ];

  const summaries = await Promise.all(
    candidates.map(async ([label, href]) => fetchSessionSummary(label, href))
  );

  return summaries.filter(
    (sessionSummary) =>
      sessionSummary.status === "available" ||
      sessionSummary.label === "Race" ||
      sessionSummary.label === "Qualifying"
  );
}

async function buildSeasonDocument(year) {
  const overview = await fetchSeasonOverview(year);

  if (Number(year) !== 2026) {
    return {
      year: Number(year),
      source: "official-f1",
      updatedAt: new Date(),
      races: overview
    };
  }

  const calendar = await fetchSeasonCalendar(year);

  return {
    year: Number(year),
    source: "official-f1",
    updatedAt: new Date(),
    races: calendar.map((calendarRace) => {
      const matchingResult =
        overview.find((race) => extractEventSlug(race.href) === calendarRace.raceKey) ?? null;

      return {
        ...calendarRace,
        href: matchingResult?.href ?? null,
        winner: matchingResult?.winner ?? "Results pending",
        car: matchingResult?.car ?? "TBC",
        fastestLapDriver: matchingResult?.fastestLapDriver ?? "Results pending",
        fastestLapTime: matchingResult?.fastestLapTime ?? "TBC"
      };
    })
  };
}

async function buildRaceDetail(year, race) {
  if (Number(year) !== 2026 || !race?.href) {
    return {
      year: Number(year),
      raceKey: race.raceKey,
      grandPrix: race.grandPrix,
      eventHref: race.eventHref ?? null,
      raceHref: race.href ?? null,
      sessionSummaries: [],
      updatedAt: new Date()
    };
  }

  const sessionSummaries = await fetchWeekendSessions(year, race.href);

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

const years = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : [2026];
const client = new MongoClient(mongoUri);

await client.connect();
const db = client.db(dbName);

for (const year of years) {
  console.log(`Seeding season ${year}...`);
  const season = await buildSeasonDocument(year);
  await db.collection("seasons").updateOne(
    { year: Number(year) },
    { $set: season },
    { upsert: true }
  );

  for (const race of season.races) {
    const detail = await buildRaceDetail(year, race);
    await db.collection("race_details").updateOne(
      { year: Number(year), raceKey: race.raceKey },
      { $set: detail },
      { upsert: true }
    );
  }

  console.log(`Done: ${year}`);
}

await client.close();
