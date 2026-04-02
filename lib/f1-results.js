import * as cheerio from "cheerio";

const BASE_URL = "https://www.formula1.com";

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

  if (repeatedHalf) {
    nextValue = repeatedHalf;
  }

  return nextValue;
}

function toAbsoluteUrl(href) {
  return new URL(href, BASE_URL).toString();
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

      return {
        cells,
        href: href ? toAbsoluteUrl(href) : null
      };
    })
    .get()
    .filter(Boolean);

  return { headers, rows };
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

async function fetchOfficialHtml(url) {
  const response = await fetch(url, {
    next: { revalidate: 60 * 60 * 12 },
    headers: {
      "user-agent": "Mozilla/5.0 F1Lab"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch official F1 page: ${url}`);
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

export async function fetchSeasonOverview(year) {
  const [racesHtml, fastestLapsHtml] = await Promise.all([
    fetchOfficialHtml(`${BASE_URL}/en/results/${year}/races`),
    fetchOfficialHtml(`${BASE_URL}/en/results/${year}/awards/fastest-laps`)
  ]);

  const races$ = cheerio.load(racesHtml);
  const fastest$ = cheerio.load(fastestLapsHtml);

  const racesTable = parseFirstTable(races$);
  const fastestTable = parseFirstTable(fastest$);

  const fastestByRace = new Map(
    fastestTable.rows.map((row) => [
      normalizeRaceName(row.cells[0] ?? ""),
      {
        raceName: row.cells[0] ?? "",
        driver: row.cells[1] ?? "N/A",
        time: row.cells.at(-1) ?? "N/A"
      }
    ])
  );

  const races = racesTable.rows.map((row, index) => {
    const grandPrix = normalizeReadableName(row.cells[0] ?? `Round ${index + 1}`);
    const fastest = fastestByRace.get(normalizeRaceName(grandPrix));

    return {
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

  return races;
}

export async function fetchSeasonCalendar(year) {
  const html = await fetchOfficialHtml(`${BASE_URL}/en/racing/${year}`);
  const $ = cheerio.load(html);
  const seen = new Set();
  const eventLinks = [];

  $("a[href^='/en/racing/']").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || !href.includes(`/${year}/`)) {
      return;
    }

    const absolute = toAbsoluteUrl(href);
    const url = new URL(absolute);
    const slug = url.pathname.split("/").filter(Boolean).at(-1);

    if (!slug || slug === String(year) || slug.endsWith(".html")) {
      return;
    }

    const text = cleanText($(element).text());

    if (!text.startsWith("ROUND ") || text.includes("TESTING")) {
      return;
    }

    const roundMatch = text.match(/ROUND\s+(\d+)/i);
    const grandPrixMatch = text.match(/Flag of .*? ([A-Za-zÀ-ÿ'’.\-][A-Za-zÀ-ÿ'’.\-\s]+?) FORMULA 1/i);
    const dateMatch = text.match(/(\d{2}\s-\s\d{2}\s[A-Z]{3}|\d{2}\s[A-Z]{3}\s-\s\d{2}\s[A-Z]{3})/i);

    if (seen.has(slug)) {
      return;
    }

    seen.add(slug);
    eventLinks.push({
      round: roundMatch ? String(roundMatch[1]).padStart(2, "0") : "",
      slug,
      grandPrix: normalizeReadableName(grandPrixMatch?.[1] ?? slug.replace(/-/g, " ")),
      date: dateMatch?.[1] ?? "TBC",
      href: absolute
    });
  });

  return eventLinks.sort((left, right) => Number(left.round) - Number(right.round));
}

export async function fetchRaceClassification(raceUrl) {
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
      const url = new URL(absolute);
      const pathname = url.pathname;

      if (!pathname.includes("/races/")) {
        return null;
      }

      return [
        absolute,
        {
          href: absolute,
          label: getSessionLabelFromPath(pathname)
        }
      ];
    })
    .get()
    .filter((entry) => Array.isArray(entry) && entry.length === 2);

  return {
    headers: table.headers,
    rows: table.rows.map((row) => row.cells),
    sessionLinks: Array.from(new Map(sessionEntries).values())
  };
}

export async function fetchWeekendSessions(year, raceUrl) {
  const classification = await fetchRaceClassification(raceUrl);

  if (String(year) !== "2026") {
    return [];
  }

  const orderedLabels = [
    "Practice 1",
    "Practice 2",
    "Practice 3",
    "Sprint Qualifying",
    "Sprint",
    "Qualifying",
    "Race"
  ];

  const uniqueLinks = classification.sessionLinks.filter(
    (session) =>
      orderedLabels.includes(session.label) &&
      (session.label === "Race" || session.href !== raceUrl)
  );

  const sortedLinks = orderedLabels
    .map((label) => uniqueLinks.find((session) => session.label === label))
    .filter(Boolean);

  const sessions = await Promise.all(
    sortedLinks.map(async (session) => {
      const data = session.label === "Race"
        ? classification
        : await fetchRaceClassification(session.href);

      return {
        label: session.label,
        headers: data.headers,
        rows: data.rows
      };
    })
  );

  return sessions;
}

export async function fetchWeekendSessionSummaries(year, race) {
  if (Number(year) !== 2026) {
    return [];
  }
  const raceHref = normalizeResultsUrl(race?.href ?? race?.raceHref ?? "");

  if (!raceHref) {
    return [];
  }

  const raceUrl = new URL(raceHref);
  const parts = raceUrl.pathname.split("/").filter(Boolean);
  const session = parts.at(-1);
  const slug = parts.at(-2);
  const roundId = parts.at(-3);
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
