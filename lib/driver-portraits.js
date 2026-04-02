import * as cheerio from "cheerio";

const DRIVER_SLUGS = {
  "George Russell": "george-russell",
  "Kimi Antonelli": "kimi-antonelli",
  "Charles Leclerc": "charles-leclerc",
  "Lewis Hamilton": "lewis-hamilton",
  "Lando Norris": "lando-norris",
  "Oscar Piastri": "oscar-piastri",
  "Oliver Bearman": "oliver-bearman",
  "Pierre Gasly": "pierre-gasly",
  "Max Verstappen": "max-verstappen",
  "Liam Lawson": "liam-lawson",
  "Arvid Lindblad": "arvid-lindblad",
  "Isack Hadjar": "isack-hadjar",
  "Gabriel Bortoleto": "gabriel-bortoleto",
  "Carlos Sainz": "carlos-sainz",
  "Esteban Ocon": "esteban-ocon",
  "Franco Colapinto": "franco-colapinto",
  "Nico Hulkenberg": "nico-hulkenberg",
  "Alexander Albon": "alexander-albon",
  "Valtteri Bottas": "valtteri-bottas",
  "Sergio Perez": "sergio-perez",
  "Fernando Alonso": "fernando-alonso",
  "Lance Stroll": "lance-stroll"
};

const portraitCache = new Map();
const FORMULA_ONE_BASE_URL = "https://www.formula1.com";

function buildFallbackSvg(name) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="560" viewBox="0 0 480 560">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#151b2d" />
          <stop offset="100%" stop-color="#d7263d" />
        </linearGradient>
      </defs>
      <rect width="480" height="560" fill="url(#bg)" rx="40" />
      <circle cx="240" cy="170" r="92" fill="rgba(255,255,255,0.12)" />
      <path d="M120 466c18-88 94-136 120-136s102 48 120 136" fill="rgba(255,255,255,0.12)" />
      <text x="240" y="500" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="72" font-weight="700">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function fetchDriverPortraitUrl(name) {
  const cached = portraitCache.get(name);
  if (cached) {
    return cached;
  }

  const slug = DRIVER_SLUGS[name];
  if (!slug) {
    const fallback = buildFallbackSvg(name);
    portraitCache.set(name, fallback);
    return fallback;
  }

  try {
    const response = await fetch(`${FORMULA_ONE_BASE_URL}/en/drivers/${slug}`, {
      cache: "force-cache",
      headers: {
        "user-agent": "Mozilla/5.0 F1Lab Driver Portraits"
      },
      next: { revalidate: 60 * 60 * 24 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch portrait page for ${name}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const imageUrl =
      $('meta[property="og:image"]').attr("content") ??
      $('meta[name="twitter:image"]').attr("content") ??
      $("img").first().attr("src");

    const resolvedUrl = imageUrl ? new URL(imageUrl, FORMULA_ONE_BASE_URL).toString() : buildFallbackSvg(name);
    portraitCache.set(name, resolvedUrl);
    return resolvedUrl;
  } catch {
    const fallback = buildFallbackSvg(name);
    portraitCache.set(name, fallback);
    return fallback;
  }
}

export async function getDriverPortraitUrl(name) {
  return fetchDriverPortraitUrl(name);
}
