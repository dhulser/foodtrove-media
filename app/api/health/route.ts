/**
 * /api/health — Platform health check
 *
 * Returns the health status of the FoodTrove platform:
 * - Env vars present (credentials configured)
 * - Kevel Decision API connectivity (live check)
 * - Catalog loaded (SSR data available)
 *
 * Response codes:
 *   200 — healthy (all checks pass or degraded gracefully)
 *   503 — unhealthy (critical check failed)
 *
 * Used by:
 * - Vercel deploy verification
 * - Monitoring / uptime checks
 * - Ad Ops platform status panel
 */
import { NextResponse } from "next/server";
import { getAllDepartments } from "@/lib/catalog";

interface CheckResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

async function checkKevelConnectivity(): Promise<CheckResult> {
  const networkId = process.env.KEVEL_NETWORK_ID;
  const apiKey = process.env.KEVEL_API_KEY;

  if (!networkId || !apiKey) {
    return { ok: false, message: "KEVEL_NETWORK_ID or KEVEL_API_KEY not set" };
  }

  const start = Date.now();
  try {
    const response = await fetch(
      `https://e-${networkId}.adzerk.net/api/v2`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placements: [
            {
              divName: "health-check",
              networkId: parseInt(networkId, 10),
              siteId: process.env.KEVEL_SITE_ID ? parseInt(process.env.KEVEL_SITE_ID, 10) : 0,
              adTypes: [5],
              count: 1,
            },
          ],
        }),
        // Tight timeout for health check
        signal: AbortSignal.timeout(5000),
      }
    );
    const latencyMs = Date.now() - start;

    if (response.ok) {
      return { ok: true, message: "Kevel Decision API reachable", latencyMs };
    } else {
      return {
        ok: false,
        message: `Kevel returned HTTP ${response.status}`,
        latencyMs,
      };
    }
  } catch (err) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Kevel unreachable: ${msg}`, latencyMs };
  }
}

export async function GET() {
  const now = new Date().toISOString();

  // Check 1: env vars
  const envCheck: CheckResult = (() => {
    const required = ["KEVEL_NETWORK_ID", "KEVEL_API_KEY", "KEVEL_SITE_ID"];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      return { ok: false, message: `Missing env vars: ${missing.join(", ")}` };
    }
    return { ok: true, message: "All required env vars present" };
  })();

  // Check 2: catalog
  const catalogCheck: CheckResult = (() => {
    try {
      const depts = getAllDepartments();
      const totalProducts = depts.reduce((sum, d) => sum + d.products.length, 0);
      return {
        ok: depts.length > 0,
        message: `${depts.length} departments, ${totalProducts} products loaded`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, message: `Catalog error: ${msg}` };
    }
  })();

  // Check 3: Kevel connectivity (only if env vars are set)
  const kevelCheck = envCheck.ok
    ? await checkKevelConnectivity()
    : { ok: false, message: "Skipped — env vars not set" };

  const checks = {
    env: envCheck,
    catalog: catalogCheck,
    kevel: kevelCheck,
  };

  // Platform is healthy if catalog is up; Kevel is degraded (not critical) if down
  const isCriticalHealthy = catalogCheck.ok;
  const isFullyHealthy = isCriticalHealthy && kevelCheck.ok;
  const status = isCriticalHealthy ? (isFullyHealthy ? "healthy" : "degraded") : "unhealthy";

  return NextResponse.json(
    {
      status,
      timestamp: now,
      version: process.env.npm_package_version ?? "unknown",
      checks,
    },
    {
      status: status === "unhealthy" ? 503 : 200,
      headers: {
        "Cache-Control": "no-store",
        "X-FoodTrove-Health": status,
      },
    }
  );
}
