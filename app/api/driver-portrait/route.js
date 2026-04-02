import { NextResponse } from "next/server";
import { getDriverPortraitUrl } from "lib/driver-portraits";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing driver name" }, { status: 400 });
  }

  const portraitUrl = await getDriverPortraitUrl(name);

  if (portraitUrl.startsWith("data:image/svg+xml")) {
    const [, encodedSvg = ""] = portraitUrl.split(",", 2);
    return new Response(decodeURIComponent(encodedSvg), {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=3600"
      }
    });
  }

  return NextResponse.redirect(portraitUrl, {
    headers: {
      "cache-control": "public, max-age=3600"
    }
  });
}
