/**
 * /api/admin/alerts — Flight Ops Alert Center
 *
 * Returns a structured alert feed covering:
 *   - Pacing alerts: flights delivering behind or ahead of expected pace
 *   - Fill rate drops: placements with degraded fill (env issues, no eligible flights)
 *   - Creative health: creatives flagged inactive or misconfigured
 *   - Budget alerts: flights approaching spend cap or end date
 *   - Auction anomalies: unusual win-rate shifts, keyword targeting gaps
 *
 * Alerts are severity-ranked: CRITICAL → WARNING → INFO
 * Deterministic seeded model — alerts rotate on a 5-minute cadence for demo realism.
 *
 * Auth: none (demo — production would require session auth + Kevel webhook integration)
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AlertSeverity = "critical" | "warning" | "info";
type AlertCategory =
  | "pacing"
  | "fill-rate"
  | "creative"
  | "budget"
  | "auction"
  | "system";

interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  detail: string;
  advertiser?: string;
  flight?: string;
  flightId?: number;
  format?: string;
  metric?: string;        // e.g. "43% fill rate (floor: 60%)"
  action?: string;        // recommended remediation
  raisedAt: string;       // ISO timestamp (simulated)
  acknowledgedAt?: string;
  status: "open" | "acknowledged" | "resolved";
}

// Seeded PRNG — same seed → same values; seed changes every 5 min
function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function tsAgo(rng: () => number, maxMinutes: number): string {
  const msAgo = Math.floor(rng() * maxMinutes * 60 * 1000);
  return new Date(Date.now() - msAgo).toISOString();
}

export async function GET(_req: NextRequest) {
  const windowSeed = Math.floor(Date.now() / 300000); // 5-min windows
  const rng = seededRandom(windowSeed + 77);

  const now = Date.now();
  const alerts: Alert[] = [];

  // ── CRITICAL ──────────────────────────────────────────────────────────────

  // 1. Liquid I.V. billboard fill rate drop
  const liquidFillRate = 38 + Math.floor(rng() * 12); // 38–50%
  if (liquidFillRate < 50) {
    alerts.push({
      id: "alert-liq-fill-001",
      severity: "critical",
      category: "fill-rate",
      title: "Liquid I.V. Billboard — Fill Rate Below Floor",
      detail: `Billboard fill rate at ${liquidFillRate}%, below the 60% contractual floor. Flight 863229977 is returning candidates but decisions are null on ~${100 - liquidFillRate}% of requests. Creative Percentage weight may have been reset to 0 by a Kevel API sync.`,
      advertiser: "Liquid I.V.",
      flight: "Liquid I.V. — Billboard Q2 2026",
      flightId: 863229977,
      format: "Billboard (970×250)",
      metric: `${liquidFillRate}% fill (floor: 60%)`,
      action: "PUT /v1/flight/863229977/creative/{adId} with Percentage: 100 to restore creative rotation weight.",
      raisedAt: tsAgo(rng, 47),
      status: "open",
    });
  }

  // 2. Organic Valley MRec — under-pacing
  const ovPacePct = 58 + Math.floor(rng() * 8); // 58–66%, expected 80%
  alerts.push({
    id: "alert-ov-pace-001",
    severity: "critical",
    category: "pacing",
    title: "Organic Valley MRec — Under-Pacing",
    detail: `Organic Valley MRec flight is at ${ovPacePct}% of expected daily delivery (goal: 80%+ by this hour). At current pace, campaign will under-deliver impressions by end of flight. Competing flights (Liquid I.V., Earthbound Farm) are winning a higher share of contextual auctions than projected.`,
    advertiser: "Organic Valley",
    flight: "Organic Valley — MRec Q2 2026",
    flightId: 863229976,
    format: "MRec (300×250)",
    metric: `${ovPacePct}% pace (expected 80%+)`,
    action: "Consider raising Organic Valley MRec CPM from $5.00 to $5.50 to increase auction win rate vs. Earthbound Farm on contextual pages.",
    raisedAt: tsAgo(rng, 23),
    status: "open",
  });

  // ── WARNINGS ──────────────────────────────────────────────────────────────

  // 3. Earthbound Farm — contextual keyword gap
  const gapKeyword = ["bakery", "beverages", "snacks", "pantry"][
    Math.floor(rng() * 4)
  ];
  alerts.push({
    id: "alert-ef-kw-001",
    severity: "warning",
    category: "auction",
    title: `Earthbound Farm — No Coverage on /${gapKeyword} Department`,
    detail: `Earthbound Farm contextual flights target keywords: produce, organic, fresh. The /${gapKeyword} department is driving 11% of weekly pageviews but Earthbound Farm has zero eligible flights there. Organic Valley and Liquid I.V. are unopposed — contextual CPM premium not captured.`,
    advertiser: "Earthbound Farm",
    format: "Leaderboard (728×90) + MRec (300×250)",
    metric: `0% contextual coverage on /${gapKeyword}`,
    action: `Add keyword "${gapKeyword}" to Earthbound Farm contextual flight targeting. Revenue opportunity: ~$280/week at $8.00 CPM.`,
    raisedAt: tsAgo(rng, 130),
    status: "open",
  });

  // 4. Organic Valley — budget runway < 7 days
  const daysLeft = 4 + Math.floor(rng() * 3); // 4–6 days
  alerts.push({
    id: "alert-ov-budget-001",
    severity: "warning",
    category: "budget",
    title: "Organic Valley — Campaign Budget Runway Low",
    detail: `Organic Valley campaign (Billboard + Leaderboard + MRec) is projecting exhaustion of contracted impressions in ${daysLeft} days at current delivery rate. Flight end date is not set (IsUnlimited), but contracted impressions target will be hit. Renewal conversation should be opened now.`,
    advertiser: "Organic Valley",
    metric: `~${daysLeft} days to impression cap`,
    action: "Tyler: open renewal conversation. Casey: confirm flight renewal logistics with advertiser contact.",
    raisedAt: tsAgo(rng, 310),
    status: "acknowledged",
    acknowledgedAt: new Date(now - 90 * 60 * 1000).toISOString(),
  });

  // 5. Pacing: Liquid I.V. Leaderboard slight over-pace
  const liqLeaderPace = 108 + Math.floor(rng() * 9); // 108–117%
  alerts.push({
    id: "alert-liq-leader-pace-001",
    severity: "warning",
    category: "pacing",
    title: "Liquid I.V. Leaderboard — Over-Pacing",
    detail: `Liquid I.V. Leaderboard flight is delivering at ${liqLeaderPace}% of goal (daily cap equivalent). No hard cap is set (IsUnlimited: true), but delivery is outpacing the contracted impression target. If left unchecked, flight will exhaust contracted volume ~${Math.floor((liqLeaderPace - 100) * 0.4)} days early.`,
    advertiser: "Liquid I.V.",
    flight: "Liquid I.V. — Leaderboard Q2 2026",
    flightId: 863229978,
    format: "Leaderboard (728×90)",
    metric: `${liqLeaderPace}% of goal pace`,
    action: "Set a daily impression cap on flight 863229978 to even out delivery. Target: 85K impressions/day.",
    raisedAt: tsAgo(rng, 200),
    status: "open",
  });

  // 6. Creative quality flag — Organic Valley Billboard
  const creativeIssue = rng() > 0.4;
  if (creativeIssue) {
    alerts.push({
      id: "alert-ov-creative-001",
      severity: "warning",
      category: "creative",
      title: "Organic Valley Billboard — Creative Click-Through Below Benchmark",
      detail: "Organic Valley Billboard (970×250) is recording CTR of 0.09% against a 0.18% network benchmark for the billboard format. The current creative (product image + tagline) is underperforming relative to Liquid I.V. (0.31% CTR) and Earthbound Farm (0.26% CTR). Creative refresh recommended.",
      advertiser: "Organic Valley",
      format: "Billboard (970×250)",
      metric: "0.09% CTR (benchmark: 0.18%)",
      action: "Request updated creative asset from Organic Valley account team. Swap via PUT /v1/creative/{creativeId} with new ScriptBody.",
      raisedAt: tsAgo(rng, 600),
      status: "acknowledged",
      acknowledgedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    });
  }

  // ── INFO ──────────────────────────────────────────────────────────────────

  // 7. New experiment ready for launch
  alerts.push({
    id: "alert-exp-001",
    severity: "info",
    category: "system",
    title: "Experiment EXP-004 — Ready to Launch",
    detail: "Experiment EXP-004 (Sponsored Search CTR vs. Organic Rank Test) has been configured in /admin/experiments and is waiting for Kevel flight activation. Treatment group requires a new sponsored-search flight with dedicated keyword targeting.",
    metric: "Config complete, flight pending",
    action: "Create Kevel flight for EXP-004 treatment arm. Set Keywords: ft-sponsored-search-treatment. Activate on next session.",
    raisedAt: tsAgo(rng, 480),
    status: "open",
  });

  // 8. Kevel propagation delay cleared
  const propagationMinutes = 20 + Math.floor(rng() * 20);
  alerts.push({
    id: "alert-kevel-prop-001",
    severity: "info",
    category: "system",
    title: "Kevel Decision API — Propagation Delay Resolved",
    detail: `The ${propagationMinutes}-minute Kevel propagation window for the last creative update (Earthbound Farm MRec) has elapsed. All three ad formats are confirmed filling on the Decision API. No further action required.`,
    metric: `Resolved after ${propagationMinutes} min`,
    raisedAt: tsAgo(rng, propagationMinutes + 5),
    status: "resolved",
  });

  // 9. Vercel health confirmation
  alerts.push({
    id: "alert-vercel-health-001",
    severity: "info",
    category: "system",
    title: "Vercel Deploy — All Systems Healthy",
    detail: "Latest commit (bd2d0e0) confirmed deployed to Vercel. /api/health returns 200 with all 4 Kevel env vars present. Ads filling across all 3 formats. p99 Decision API latency: 89ms.",
    metric: "p99 latency: 89ms",
    raisedAt: tsAgo(rng, 40),
    status: "resolved",
  });

  // Sort: open CRITICAL first, then open WARNING, then acknowledged, then resolved
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  const statusOrder: Record<string, number> = {
    open: 0,
    acknowledged: 1,
    resolved: 2,
  };
  alerts.sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Summary counts
  const summary = {
    critical: alerts.filter((a) => a.severity === "critical" && a.status === "open").length,
    warning: alerts.filter((a) => a.severity === "warning" && a.status === "open").length,
    info: alerts.filter((a) => a.severity === "info" && a.status === "open").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
  };

  return NextResponse.json({
    alerts,
    summary,
    generatedAt: new Date().toISOString(),
    networkId: 12024,
  });
}
