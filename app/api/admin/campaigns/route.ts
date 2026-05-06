/**
 * /api/admin/campaigns — Kevel Management API proxy for Ad Operations dashboard
 *
 * Returns live campaign, flight, and advertiser data from Kevel network 12024.
 * Server-side only — KEVEL_API_KEY never leaves the server.
 *
 * Response shape:
 *   { advertisers: AdvertiserSummary[], meta: NetworkMeta }
 *
 * Cached for 30 seconds (ISR-friendly) to avoid rate limiting the Management API.
 */
import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;
const KEVEL_NETWORK_ID = process.env.KEVEL_NETWORK_ID ?? "12024";

// Known advertiser IDs for FoodTrove network 12024
const ADVERTISER_IDS = [6254651, 6256255, 6256266];

// Known campaign IDs per advertiser
const CAMPAIGN_IDS: Record<number, number[]> = {
  6254651: [659158534],   // FreshFarm Organics
  6256255: [659159072],   // NutriPeak Nutrition
  6256266: [659159177],   // GreenLeaf Farms
};

// Known flight IDs per campaign
const FLIGHT_IDS: Record<number, number[]> = {
  659158534: [863187467, 863187590, 863188334],  // FreshFarm: billboard, leaderboard, mrec
  659159072: [863188608, 863188610, 863188611],  // NutriPeak: billboard, leaderboard, mrec
  659159177: [863188756, 863188757],              // GreenLeaf: leaderboard, mrec (contextual)
};

// Known ad (creative map) IDs per flight
const AD_IDS: Record<number, number[]> = {
  863187467: [1081404207],
  863187590: [1081437296],
  863188334: [1081470449],
  863188608: [1081471133],
  863188610: [1081471134],
  863188611: [1081471135],
  863188756: [1081476545],
  863188757: [1081476547],
};

async function kevelGet(path: string) {
  if (!KEVEL_API_KEY) throw new Error("KEVEL_API_KEY not set");
    const res = await fetch(`https://api.kevel.co/v1/${path}`, {
    headers: {
      "X-Adzerk-ApiKey": KEVEL_API_KEY,
      "Content-Type": "application/json",
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(({ next: { revalidate: 30 } }) as any), // Next.js ISR cache hint
  });
  if (!res.ok) {
    throw new Error(`Kevel API error: ${res.status} ${res.statusText} on GET /v1/${path}`);
  }
  return res.json();
}

export async function GET() {
  if (!KEVEL_API_KEY) {
    return NextResponse.json(
      { error: "Missing KEVEL_API_KEY — Kevel Management API unavailable" },
      { status: 503 }
    );
  }

  try {
    // Fetch all advertisers, campaigns, flights in parallel where possible
    const advertisers = await Promise.all(
      ADVERTISER_IDS.map(async (advId) => {
        const [advData, campaigns] = await Promise.all([
          kevelGet(`advertiser/${advId}`),
          Promise.all(
            (CAMPAIGN_IDS[advId] ?? []).map(async (campId) => {
              const [campData, flights] = await Promise.all([
                kevelGet(`campaign/${campId}`),
                Promise.all(
                  (FLIGHT_IDS[campId] ?? []).map(async (flightId) => {
                    const [flightData, ads] = await Promise.all([
                      kevelGet(`flight/${flightId}`),
                      Promise.all(
                        (AD_IDS[flightId] ?? []).map(async (adId) => {
                          try {
                            return await kevelGet(`flight/${flightId}/creative/${adId}`);
                          } catch {
                            return { Id: adId, _fetchError: true };
                          }
                        })
                      ),
                    ]);

                    return {
                      id: flightData.Id,
                      name: flightData.Name,
                      isActive: flightData.IsActive,
                      isUnlimited: flightData.IsUnlimited,
                      impressions: flightData.Impressions,
                      price: flightData.Price,
                      rateType: flightData.RateType,
                      keywords: flightData.Keywords ?? "",
                      startDate: flightData.StartDate,
                      noEndDate: flightData.NoEndDate,
                      priorityId: flightData.PriorityId,
                      ads: ads.map((ad) => ({
                        id: ad.Id,
                        creativeId: ad.Creative?.Id ?? ad.CreativeId,
                        isActive: ad.IsActive,
                        percentage: ad.Percentage,
                      })),
                    };
                  })
                ),
              ]);

              return {
                id: campData.Id,
                name: campData.Name,
                isActive: campData.IsActive,
                advertiserId: campData.AdvertiserId,
                flights,
              };
            })
          ),
        ]);

        return {
          id: advData.Id,
          name: advData.Title,
          isActive: advData.IsActive,
          campaigns,
        };
      })
    );

    return NextResponse.json({
      advertisers,
      meta: {
        networkId: parseInt(KEVEL_NETWORK_ID, 10),
        siteId: 1324936,
        channelId: 65694,
        adTypeId: 5,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Admin] Kevel Management API fetch failed:", msg);
    return NextResponse.json(
      { error: `Kevel Management API unavailable: ${msg}` },
      { status: 502 }
    );
  }
}
