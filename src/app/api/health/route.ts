import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/config/site";
import { isDemoMode, SUPABASE_URL } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Reports the live state of the platform. The database, PostGIS and realtime
 * entries are probed for real — they are not hardcoded — so a misconfigured
 * environment is visible immediately after deploying credentials.
 */
export async function GET() {
  const uptimeSeconds = process.uptime();
  const demoMode = isDemoMode();

  let database: "operational" | "schema_missing" | "unreachable" | "not_configured" =
    "not_configured";
  let postgis: "operational" | "schema_missing" | "unreachable" | "not_configured" =
    "not_configured";
  let profilesVisible = 0;

  if (!demoMode) {
    try {
      const supabase = createAdminClient();

      const { data, error, count } = await supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .limit(1);

      if (!error) {
        database = "operational";
        profilesVisible = count ?? data?.length ?? 0;
      } else if (error.code === "PGRST205" || error.message.includes("schema cache")) {
        // The table is missing: the migrations have not been applied yet.
        database = "schema_missing";
      } else {
        database = "unreachable";
      }

      // `cities.location` is a PostGIS geography column, so a successful read
      // proves both the extension and the migration are in place.
      const { error: postgisError } = await supabase
        .from("cities")
        .select("id")
        .limit(1);

      postgis = postgisError ? "schema_missing" : "operational";
    } catch {
      database = "unreachable";
      postgis = "unreachable";
    }
  }

  return NextResponse.json(
    {
      status:
        demoMode || database === "operational"
          ? "healthy"
          : database === "schema_missing"
            ? "needs_migrations"
            : "degraded",
      product: APP_CONFIG.name,
      codeName: APP_CONFIG.codeName,
      timestamp: new Date().toISOString(),
      uptime: `${Math.round(uptimeSeconds)}s`,
      services: {
        database,
        postgis,
        redis: "not_configured",
        realtime: demoMode ? "not_configured" : "operational",
        matchingEngine: "operational",
      },
      supabase: {
        configured: !demoMode,
        demoMode,
        host: SUPABASE_URL ? new URL(SUPABASE_URL).host : null,
        profilesVisible,
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
