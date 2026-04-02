import { NextResponse } from "next/server";
import { getLiveDriverStandings } from "lib/driver-standings";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? "2026");

  try {
    const standings = await getLiveDriverStandings(year);
    return NextResponse.json(standings, {
      headers: {
        "cache-control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load live standings"
      },
      { status: 500 }
    );
  }
}
