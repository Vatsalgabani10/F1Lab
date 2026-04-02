import * as cheerio from "cheerio";

const TRACK_EVENT_PAGES = {
  Suzuka: "https://www.formula1.com/en/racing/2026/japan",
  Monaco: "https://www.formula1.com/en/racing/2026/monaco",
  Silverstone: "https://www.formula1.com/en/racing/2026/great-britain",
  Monza: "https://www.formula1.com/en/racing/2026/italy",
  Singapore: "https://www.formula1.com/en/racing/2026/singapore",
  Austin: "https://www.formula1.com/en/racing/2026/united-states"
};

const trackMapCache = new Map();

function buildFallbackSvg(name) {
  const safeName = name.replace(/[<&>"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
      </defs>
      <rect width="960" height="540" rx="28" fill="url(#bg)" />
      <text x="480" y="250" fill="#ffffff" font-size="42" font-family="Arial, sans-serif" text-anchor="middle" font-weight="700">
        ${safeName}
      </text>
      <text x="480" y="308" fill="#fca5a5" font-size="26" font-family="Arial, sans-serif" text-anchor="middle">
        Official map unavailable
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function getTrackMapUrl(trackName) {
  if (trackMapCache.has(trackName)) {
    return trackMapCache.get(trackName);
  }

  const pageUrl = TRACK_EVENT_PAGES[trackName];
  if (!pageUrl) {
    const fallback = buildFallbackSvg(trackName);
    trackMapCache.set(trackName, fallback);
    return fallback;
  }

  try {
    const response = await fetch(pageUrl, {
      cache: "force-cache",
      headers: {
        "user-agent": "Mozilla/5.0 F1Lab Track Maps"
      },
      next: { revalidate: 60 * 60 * 24 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${pageUrl}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const circuitHeading = $("h2")
      .filter((_, element) => $(element).text().trim().toLowerCase() === "circuit")
      .first();

    const circuitImage =
      circuitHeading.nextAll("img").first().attr("src") ??
      $('img[alt*="track"], img[alt*="circuit"]').first().attr("src");

    const resolvedUrl = circuitImage
      ? new URL(circuitImage, "https://www.formula1.com").toString()
      : buildFallbackSvg(trackName);

    trackMapCache.set(trackName, resolvedUrl);
    return resolvedUrl;
  } catch {
    const fallback = buildFallbackSvg(trackName);
    trackMapCache.set(trackName, fallback);
    return fallback;
  }
}
