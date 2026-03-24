import { NextResponse } from "next/server";
import {
  getDashboardStats,
  getActiveSignals,
  getTrendingClusters,
  getTopEntities,
  getCompanies,
} from "@/lib/db/queries";

export async function GET() {
  try {
    const stats = getDashboardStats();
    const signals = getActiveSignals();
    const trending = getTrendingClusters();
    const topEntities = getTopEntities(undefined, 15);
    const companies = getCompanies();

    return NextResponse.json({
      stats,
      signals,
      trending,
      topEntities,
      companies,
    });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}
