import { NextResponse } from "next/server";
import { getTrackMapUrl } from "lib/track-maps";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing track name" }, { status: 400 });
  }

  const mapUrl = await getTrackMapUrl(name);

  if (mapUrl.startsWith("data:image/svg+xml")) {
    const [, encodedSvg = ""] = mapUrl.split(",", 2);
    return new Response(decodeURIComponent(encodedSvg), {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=3600"
      }
    });
  }

  return NextResponse.redirect(mapUrl, {
    headers: {
      "cache-control": "public, max-age=3600"
    }
  });
}
