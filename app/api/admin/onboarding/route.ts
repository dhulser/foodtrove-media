/**
 * /api/admin/onboarding — Advertiser Onboarding API
 *
 * Creates a new advertiser in Kevel with full campaign infrastructure:
 *   1. POST /advertiser  → advertiser record
 *   2. POST /campaign    → campaign
 *   3. POST /flight (×N) → one flight per selected ad format
 *   4. POST /creative    → one HTML creative per format
 *   5. POST /flight/{id}/creative → link creative to flight
 *   6. PUT  /flight/{id}/creative/{adId} → set Percentage: 100
 *   7. POST Decision API test call → verify ads fill
 *
 * On success, returns all created entity IDs so Tyler/Casey can
 * reference them in Kevel dashboard or in subsequent API calls.
 *
 * Used by: /admin/onboarding
 * Consumers: Tyler (Sales), Casey (Ad Ops)
 */

import { NextRequest, NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;
const KEVEL_NETWORK_ID = 12024;
const KEVEL_SITE_ID = 1324936;
const KEVEL_PRIORITY_ID = 259929;

// ─── Kevel API helpers ────────────────────────────────────────────────────────

async function kevelPost(path: string, body: Record<string, unknown>) {
  if (!KEVEL_API_KEY) throw new Error("KEVEL_API_KEY not set");
  const res = await fetch(`https://api.kevel.co/v1/${path}`, {
    method: "POST",
    headers: {
      "X-Adzerk-ApiKey": KEVEL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kevel POST /${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function kevelPut(path: string, body: Record<string, unknown>) {
  if (!KEVEL_API_KEY) throw new Error("KEVEL_API_KEY not set");
  const res = await fetch(`https://api.kevel.co/v1/${path}`, {
    method: "PUT",
    headers: {
      "X-Adzerk-ApiKey": KEVEL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kevel PUT /${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function decisionTest(flightKeywords: string[]): Promise<boolean> {
  try {
    const res = await fetch(
      `https://e-${KEVEL_NETWORK_ID}.adzerk.net/api/v2`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placements: [
            {
              divName: "onboarding-test",
              networkId: KEVEL_NETWORK_ID,
              siteId: KEVEL_SITE_ID,
              adTypes: [5],
              count: 1,
            },
          ],
          keywords: flightKeywords,
        }),
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    const decisions = data?.decisions?.["onboarding-test"];
    return Array.isArray(decisions) && decisions.length > 0;
  } catch {
    return false;
  }
}

// ─── Creative HTML templates ──────────────────────────────────────────────────

function buildCreativeHtml(
  format: "billboard" | "leaderboard" | "mrec",
  advertiserName: string,
  tagline: string,
  primaryColor: string,
  category: string
): string {
  const sizes: Record<string, { w: number; h: number }> = {
    billboard: { w: 970, h: 250 },
    leaderboard: { w: 728, h: 90 },
    mrec: { w: 300, h: 250 },
  };
  const { w, h } = sizes[format];
  const fontSizes = {
    billboard: { brand: 32, tag: 16, cta: 14 },
    leaderboard: { brand: 22, tag: 13, cta: 12 },
    mrec: { brand: 24, tag: 14, cta: 13 },
  };
  const fs = fontSizes[format];
  const categoryBadge = category ? `<div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:.7;margin-bottom:4px">${category}</div>` : "";

  if (format === "leaderboard") {
    return `<div style="width:${w}px;height:${h}px;background:linear-gradient(135deg,${primaryColor}22,${primaryColor}44);border:1px solid ${primaryColor}55;display:flex;align-items:center;justify-content:space-between;padding:0 24px;font-family:-apple-system,sans-serif;box-sizing:border-box">
  <div>
    ${categoryBadge}
    <div style="font-size:${fs.brand}px;font-weight:700;color:#fff">${advertiserName}</div>
    <div style="font-size:${fs.tag}px;color:#ffffffcc">${tagline}</div>
  </div>
  <div style="background:${primaryColor};color:#fff;padding:8px 20px;border-radius:4px;font-size:${fs.cta}px;font-weight:600;white-space:nowrap">Shop Now</div>
</div>`;
  }

  return `<div style="width:${w}px;height:${h}px;background:linear-gradient(160deg,${primaryColor}33,${primaryColor}66);border:1px solid ${primaryColor}77;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-family:-apple-system,sans-serif;text-align:center;box-sizing:border-box;padding:16px">
  ${categoryBadge}
  <div style="font-size:${fs.brand}px;font-weight:800;color:#fff;letter-spacing:-0.5px">${advertiserName}</div>
  <div style="font-size:${fs.tag}px;color:#ffffffdd;max-width:80%">${tagline}</div>
  <div style="background:${primaryColor};color:#fff;padding:8px 24px;border-radius:6px;font-size:${fs.cta}px;font-weight:700;margin-top:4px">Shop Now</div>
</div>`;
}

// ─── Format config ────────────────────────────────────────────────────────────

const FORMAT_CONFIG: Record<
  string,
  { keyword: string; adTypeId: number; name: string }
> = {
  billboard: { keyword: "ft-billboard", adTypeId: 5, name: "Billboard 970×250" },
  leaderboard: { keyword: "ft-leaderboard", adTypeId: 5, name: "Leaderboard 728×90" },
  mrec: { keyword: "ft-mrec", adTypeId: 5, name: "MRec 300×250" },
};

// ─── Request types ────────────────────────────────────────────────────────────

interface OnboardingRequest {
  advertiserName: string;
  tagline: string;
  primaryColor: string;
  category: string;
  formats: Array<"billboard" | "leaderboard" | "mrec">;
  cpms: Record<string, number>;
  contextualKeywords: string[];
  campaignName: string;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!KEVEL_API_KEY) {
    return NextResponse.json(
      { error: "KEVEL_API_KEY not configured" },
      { status: 503 }
    );
  }

  let body: OnboardingRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    advertiserName,
    tagline = `Fresh from ${advertiserName}`,
    primaryColor = "#22c55e",
    category = "",
    formats = ["billboard", "leaderboard", "mrec"],
    cpms = { billboard: 5.0, leaderboard: 4.5, mrec: 4.0 },
    contextualKeywords = [],
    campaignName,
  } = body;

  if (!advertiserName?.trim()) {
    return NextResponse.json(
      { error: "advertiserName is required" },
      { status: 400 }
    );
  }

  const log: Array<{ step: string; status: "ok" | "error"; detail?: string }> = [];
  const result: Record<string, unknown> = {};

  try {
    // ── Step 1: Create advertiser ─────────────────────────────────────────────
    log.push({ step: "Create advertiser", status: "ok" });
    const advertiser = await kevelPost("advertiser", {
      Title: advertiserName.trim(),
    });
    result.advertiserId = advertiser.Id;
    log[log.length - 1].detail = `ID: ${advertiser.Id}`;

    // ── Step 2: Create campaign ───────────────────────────────────────────────
    log.push({ step: "Create campaign", status: "ok" });
    const campaign = await kevelPost("campaign", {
      Name: campaignName?.trim() || `${advertiserName} — Q2 2026`,
      AdvertiserId: advertiser.Id,
    });
    result.campaignId = campaign.Id;
    log[log.length - 1].detail = `ID: ${campaign.Id}`;

    // ── Steps 3–6: Per-format flight + creative + link ────────────────────────
    const flightResults: Record<string, unknown> = {};
    const firstFormatKeywords: string[] = [];

    for (const format of formats) {
      const fmtConfig = FORMAT_CONFIG[format];
      if (!fmtConfig) continue;

      const cpm = cpms[format] ?? 5.0;
      const contextKws = contextualKeywords.length > 0
        ? `,${contextualKeywords.join(",")}`
        : "";
      const keywords = `${fmtConfig.keyword}${contextKws}`;

      // 3a — Create flight
      log.push({ step: `Create ${format} flight`, status: "ok" });
      const flight = await kevelPost("flight", {
        Name: `${advertiserName} — ${fmtConfig.name} Q2 2026`,
        CampaignId: campaign.Id,
        PriorityId: KEVEL_PRIORITY_ID,
        StartDateISO: "2026-01-01T00:00:00",
        NoEndDate: true,
        IsActive: true,
        IsUnlimited: true,
        Impressions: 1000000,
        Price: cpm,
        RateType: 1,
        GoalType: 2,
        Keywords: keywords,
      });
      log[log.length - 1].detail = `ID: ${flight.Id}, CPM: $${cpm}, keywords: ${keywords}`;

      if (format === formats[0]) {
        firstFormatKeywords.push(...keywords.split(","));
      }

      // 3b — Create creative
      log.push({ step: `Create ${format} creative`, status: "ok" });
      const scriptBody = buildCreativeHtml(
        format,
        advertiserName,
        tagline,
        primaryColor,
        category
      );
      const creative = await kevelPost("creative", {
        Title: `${advertiserName} — ${fmtConfig.name}`,
        AdvertiserId: advertiser.Id,
        AdTypeId: fmtConfig.adTypeId,
        IsHTMLJS: true,
        ScriptBody: scriptBody,
        IsActive: true,
      });
      log[log.length - 1].detail = `ID: ${creative.Id}`;

      // 3c — Link creative to flight
      log.push({ step: `Link ${format} creative → flight`, status: "ok" });
      const adMap = await kevelPost(`flight/${flight.Id}/creative`, {
        Creative: { Id: creative.Id },
        FlightId: flight.Id,
        IsActive: true,
      });
      log[log.length - 1].detail = `Ad map ID: ${adMap.Id}`;

      // 3d — Set Percentage: 100
      log.push({ step: `Set ${format} creative weight`, status: "ok" });
      await kevelPut(`flight/${flight.Id}/creative/${adMap.Id}`, {
        Percentage: 100,
      });
      log[log.length - 1].detail = "Percentage=100";

      flightResults[format] = {
        flightId: flight.Id,
        creativeId: creative.Id,
        adMapId: adMap.Id,
        cpm,
        keywords,
      };
    }

    result.flights = flightResults;

    // ── Step 7: Test Decision API fill ────────────────────────────────────────
    log.push({ step: "Test Decision API (propagation — may show 0 candidates)", status: "ok" });
    const filled = await decisionTest(firstFormatKeywords);
    log[log.length - 1].detail = filled
      ? "✓ Ad filled immediately"
      : "Propagation pending — typically 15–30 min";

    result.decisionTestFilled = filled;
    result.propagationNote = filled
      ? null
      : "New flights typically take 15–30 min to propagate to the Decision API. Run /api/health to recheck.";

    return NextResponse.json({
      success: true,
      advertiserName,
      log,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Mark last log entry as error
    if (log.length > 0) {
      log[log.length - 1].status = "error";
      log[log.length - 1].detail = message;
    }
    return NextResponse.json(
      {
        success: false,
        error: message,
        log,
        partial: result,
      },
      { status: 500 }
    );
  }
}
