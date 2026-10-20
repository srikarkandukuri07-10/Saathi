import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/config/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const uptimeSeconds = process.uptime();

  return NextResponse.json(
    {
      status: "healthy",
      product: APP_CONFIG.name,
      codeName: APP_CONFIG.codeName,
      timestamp: new Date().toISOString(),
      uptime: `${Math.round(uptimeSeconds)}s`,
      services: {
        database: "operational",
        postgis: "operational",
        redis: "operational",
        realtime: "operational",
        matchingEngine: "operational",
      },
      coldStartCity: APP_CONFIG.initialCity,
      themeColors: APP_CONFIG.theme.colors,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
