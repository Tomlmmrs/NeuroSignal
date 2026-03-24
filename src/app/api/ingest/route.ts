import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Dynamic import to avoid loading ingestion code on every request
    const { runAllSources } = await import("@/lib/ingestion/pipeline");
    const results = await runAllSources();
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: "Ingestion failed", details: String(error) },
      { status: 500 }
    );
  }
}
