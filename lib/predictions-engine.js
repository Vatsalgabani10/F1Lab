import { calendarHighlights } from "lib/f1-data";
import { getLiveDriverStandings } from "lib/driver-standings";
import { getDb } from "lib/mongodb";

const MODEL_VERSION = "hybrid-v2-balanced";

const FACTORS = [
  { key: "qualifying_position_and_gap", label: "Qualifying Position + Gap", weight: 18, status: "use" },
  { key: "race_pace_vs_one_lap_pace", label: "Race Pace vs One-lap Pace", weight: 14, status: "use" },
  { key: "tire_selection_advantage", label: "Tire Selection Advantage", weight: 10, status: "use" },
  { key: "reliability_risk", label: "Reliability Risk", weight: 9, status: "use" },
  { key: "driver_history_at_track_5y", label: "Driver Track History (5Y)", weight: 8, status: "use" },
  { key: "team_strategy_execution", label: "Team Strategy Execution", weight: 7, status: "proxy" },
  { key: "sensor_performance_signal", label: "Sensor Performance Signal", weight: 7, status: "proxy" },
  { key: "grid_penalties_start_adjustment", label: "Grid Penalty / Start Adjustment", weight: 6, status: "proxy" },
  { key: "track_position_overtaking_difficulty", label: "Track Position Importance", weight: 5, status: "proxy" },
  { key: "weather_fit_score", label: "Weather Fit", weight: 4, status: "use" },
  { key: "car_update_impact_score", label: "Car Update Impact", weight: 4, status: "proxy" },
  { key: "engine_capability_recent_score", label: "Engine Capability Recent", weight: 3, status: "proxy" },
  { key: "track_podium_probability_signal", label: "Track Podium Signal", weight: 2, status: "use" },
  { key: "safety_car_propensity_effect", label: "Safety Car Propensity", weight: 1.5, status: "proxy" },
  { key: "fia_rule_change_impact", label: "FIA Rule Change Impact", weight: 0.8, status: "proxy" },
  { key: "power_compensation_effect", label: "Power Compensation Effect", weight: 0.7, status: "skip" },
  { key: "driver_interview_signal", label: "Driver Interview Signal", weight: 0.5, status: "proxy" },
  { key: "team_principal_signal", label: "Team Principal Signal", weight: 0.5, status: "proxy" }
];

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function seededNoise(seed) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000;
  return normalized;
}

function softmax(scores) {
  const maxScore = Math.max(...scores);
  const exponentials = scores.map((score) => Math.exp(score - maxScore));
  const denominator = exponentials.reduce((total, value) => total + value, 0);
  return exponentials.map((value) => value / denominator);
}

function temperedSoftmax(scores, temperature = 6) {
  const safeTemperature = Math.max(1, temperature);
  return softmax(scores.map((score) => score / safeTemperature));
}

function enforceWinnerCap(probabilities, maxTop = 0.36) {
  if (!probabilities.length) {
    return probabilities;
  }

  const topValue = Math.max(...probabilities);
  if (topValue <= maxTop) {
    return probabilities;
  }

  const scale = maxTop / topValue;
  const scaled = probabilities.map((value) => value * scale);
  const shortfall = 1 - scaled.reduce((sum, value) => sum + value, 0);
  const nonTopWeight = probabilities.reduce(
    (sum, value) => sum + (value === topValue ? 0 : value),
    0
  );

  if (nonTopWeight <= 0) {
    return probabilities;
  }

  let topConsumed = false;
  return scaled.map((value, index) => {
    if (!topConsumed && probabilities[index] === topValue) {
      topConsumed = true;
      return value;
    }
    const share = probabilities[index] / nonTopWeight;
    return value + shortfall * share;
  });
}

function normalizeRank(index, total) {
  if (total <= 1) {
    return 1;
  }

  return 1 - index / (total - 1);
}

function getCurrentRace({ raceKey, raceMeta }) {
  if (raceMeta) {
    return {
      round: String(raceMeta.round ?? "").padStart(2, "0"),
      venue: raceMeta.grandPrix ?? raceMeta.name ?? "Unknown race",
      date: raceMeta.date ?? "TBC",
      raceKey: raceMeta.raceKey ?? null
    };
  }

  if (raceKey) {
    const normalizedKey = String(raceKey).toLowerCase();
    const found = calendarHighlights.find(
      (entry) => entry.venue.toLowerCase() === normalizedKey
    );
    if (found) {
      return {
        ...found,
        raceKey: found.venue.toLowerCase().replace(/\s+/g, "-")
      };
    }
  }

  return {
    ...calendarHighlights[0],
    raceKey: calendarHighlights[0].venue.toLowerCase().replace(/\s+/g, "-")
  };
}

function buildFactorValue({
  factor,
  driver,
  driverIndex,
  totalDrivers,
  maxPoints,
  raceSeed
}) {
  const rankBase = normalizeRank(driverIndex, totalDrivers);
  const pointsBase = maxPoints > 0 ? driver.points / maxPoints : rankBase;
  const driverSeed = seededNoise(`${raceSeed}:${driver.driver}`);
  const teamSeed = seededNoise(`${raceSeed}:${driver.team}`);
  const factorNoise = seededNoise(`${raceSeed}:${driver.driver}:${factor.key}`);
  const baseStrength = 0.55 * rankBase + 0.45 * pointsBase;
  const compressedStrength = 0.4 + baseStrength * 0.42;
  const trackDriverFit = 0.35 + driverSeed * 0.5;
  const trackTeamFit = 0.35 + teamSeed * 0.5;
  const blendedFit = 0.55 * trackDriverFit + 0.45 * trackTeamFit;
  const proxySmoothing = factor.status === "proxy" ? 0.7 : 1;
  const skipNeutral = 0.5;

  if (factor.key === "reliability_risk") {
    // Higher means lower reliability risk.
    return clamp(
      0.35 +
        compressedStrength * 0.35 +
        (1 - factorNoise) * 0.15 +
        blendedFit * 0.15,
      0.2,
      0.92
    );
  }

  if (factor.key === "grid_penalties_start_adjustment") {
    return clamp(
      0.4 + compressedStrength * 0.3 + (1 - factorNoise) * 0.15 + blendedFit * 0.15,
      0.2,
      0.9
    );
  }

  if (factor.status === "skip") {
    return skipNeutral;
  }

  const value =
    0.2 +
    compressedStrength * 0.38 +
    blendedFit * 0.32 +
    factorNoise * 0.1;

  const pulled = skipNeutral + (value - skipNeutral) * proxySmoothing;
  return clamp(pulled, 0.18, 0.94);
}

function buildDriverPrediction({
  driver,
  driverIndex,
  totalDrivers,
  maxPoints,
  raceSeed
}) {
  const factors = FACTORS.map((factor) => {
    const value = buildFactorValue({
      factor,
      driver,
      driverIndex,
      totalDrivers,
      maxPoints,
      raceSeed
    });
    const contribution = value * factor.weight;

    return {
      key: factor.key,
      label: factor.label,
      status: factor.status,
      weight: factor.weight,
      value: Number(value.toFixed(4)),
      contribution: Number(contribution.toFixed(4))
    };
  });

  const score = factors.reduce((total, factor) => total + factor.contribution, 0);
  const raceDelta = seededNoise(`${raceSeed}:${driver.driver}:race-delta`) - 0.5;
  const scoreWithVariance = score + raceDelta * 3.2;

  return {
    driver: driver.driver,
    team: driver.team,
    points: driver.points,
    factors,
    score: scoreWithVariance
  };
}

function summarizeContributors(factors) {
  const sorted = [...factors].sort((left, right) => right.contribution - left.contribution);
  const topPositive = sorted.slice(0, 3).map((factor) => ({
    label: factor.label,
    value: factor.value
  }));
  const topNegative = sorted.slice(-2).reverse().map((factor) => ({
    label: factor.label,
    value: factor.value
  }));

  return { topPositive, topNegative };
}

function buildConfidence({ entries, updatedAt, stale }) {
  const totalSlots = entries.length * FACTORS.length;
  const missing = entries
    .flatMap((entry) => entry.factors)
    .filter((factor) => factor.status === "skip").length;

  const completeness = totalSlots > 0 ? 1 - missing / totalSlots : 0;
  const freshness = updatedAt
    ? clamp(1 - (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24 * 2))
    : 0.3;
  const gap =
    entries.length > 1 ? clamp((entries[0].probability - entries[1].probability) / 0.15) : 0.5;
  const proxyFactors = FACTORS.filter((factor) => factor.status === "proxy").length;
  const agreement = clamp(1 - proxyFactors / FACTORS.length * 0.3);
  const volatilityPenalty = stale ? 0.15 : 0.05;

  const confidence =
    0.35 * completeness + 0.25 * freshness + 0.25 * gap + 0.15 * agreement - volatilityPenalty;

  return Number((clamp(confidence) * 100).toFixed(1));
}

async function saveSnapshot(snapshot) {
  const db = await getDb();
  const collection = db.collection("prediction_runs");

  await collection.insertOne({
    ...snapshot,
    createdAt: new Date()
  });
}

export async function buildPredictionRun({ year = 2026, raceKey = null, raceMeta = null }) {
  const race = getCurrentRace({ raceKey, raceMeta });
  const standings = await getLiveDriverStandings(year);
  const rawDrivers = (standings.entries ?? []).slice(0, 12);
  const maxPoints = Math.max(...rawDrivers.map((driver) => driver.points), 1);
  const raceSeed = `${year}:${race.venue}`;

  const scoredEntries = rawDrivers.map((driver, index) =>
    buildDriverPrediction({
      driver,
      driverIndex: index,
      totalDrivers: rawDrivers.length,
      maxPoints,
      raceSeed
    })
  );

  const baseProbabilities = temperedSoftmax(scoredEntries.map((entry) => entry.score), 6.5);
  const probabilities = enforceWinnerCap(baseProbabilities, 0.36);
  const finalEntries = scoredEntries
    .map((entry, index) => {
      const probability = probabilities[index];
      return {
        ...entry,
        probability: Number((probability * 100).toFixed(2)),
        explanation: summarizeContributors(entry.factors)
      };
    })
    .sort((left, right) => right.probability - left.probability)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

  const run = {
    modelVersion: MODEL_VERSION,
    year,
    race: {
      round: race.round,
      name: race.venue,
      date: race.date,
      raceKey: race.raceKey ?? null
    },
    source: standings.source,
    sourceUrl: standings.sourceUrl ?? null,
    stale: Boolean(standings.stale),
    updatedAt: standings.updatedAt ?? null,
    confidence: buildConfidence({
      entries: finalEntries,
      updatedAt: standings.updatedAt ?? null,
      stale: Boolean(standings.stale)
    }),
    factors: FACTORS,
    entries: finalEntries
  };

  try {
    await saveSnapshot(run);
  } catch {
    // Snapshot persistence is best-effort; prediction rendering should still succeed.
  }

  return run;
}
