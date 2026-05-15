import { NextResponse } from "next/server";
import { buildPredictionRun } from "lib/predictions-engine";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? "2026");
  const race = searchParams.get("race");

  try {
    const run = await buildPredictionRun({
      year,
      raceKey: race
    });

    return NextResponse.json(run, {
      headers: {
        "cache-control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to generate predictions"
      },
      { status: 500 }
    );
  }
}
