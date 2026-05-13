import { NextRequest, NextResponse } from "next/server";

// ─── Kevel config ────────────────────────────────────────────────────────────
const KEVEL_API_KEY = process.env.KEVEL_API_KEY ?? "";

// ─── Seeded PRNG ─────────────────────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Deal types ───────────────────────────────────────────────────────────────
type DealStage =
  | "prospect"
  | "proposal"
  | "negotiation"
  | "signed"
  | "live"
  | "closed"
  | "lost";

interface IOLineItem {
  format: "billboard" | "leaderboard" | "mrec";
  flightName: string;
  flightId?: number;
  impressions: number;
  cpm: number;
  totalValue: number;
  startDate: string;
  endDate: string;
  contextualKeywords: string[];
  deliveredPct?: number; // only for live/closed
}

interface InsertionOrder {
  id: string;
  dealName: string;
  advertiserName: string;
  advertiserId?: number;
  contactName: string;
  contactEmail: string;
  stage: DealStage;
  owner: "Tyler Brooks" | "Casey Nguyen";
  totalValue: number;
  lineItems: IOLineItem[];
  notes: string;
  createdAt: string;
  proposedAt?: string;
  signedAt?: string;
  liveAt?: string;
  closedAt?: string;
  probability: number; // 0–100
  currency: "USD";
}

// ─── Static deal pipeline ────────────────────────────────────────────────────
// Deterministic seed: day bucket so numbers are stable within the day
const dayBucket = Math.floor(Date.now() / 86400000);
const rng = seededRandom(dayBucket * 9371 + 42);
rng(); rng(); // consume

function rnd(lo: number, hi: number): number {
  return lo + rng() * (hi - lo);
}

const DEALS: InsertionOrder[] = [
  // 1 — LIVE deal: Organic Valley Q2
  {
    id: "io-001",
    dealName: "Organic Valley Q2 2026 — Multi-format launch",
    advertiserName: "Organic Valley",
    advertiserId: 6254651,
    contactName: "Sarah Chen",
    contactEmail: "s.chen@organicvalley.coop",
    stage: "live",
    owner: "Tyler Brooks",
    totalValue: 15000,
    probability: 100,
    currency: "USD",
    notes: "Anchor Q2 deal. Billboard + leaderboard + MRec all live on network. Renewal conversation scheduled for late June.",
    createdAt: "2026-04-15T09:00:00Z",
    proposedAt: "2026-04-22T14:00:00Z",
    signedAt: "2026-04-30T11:00:00Z",
    liveAt: "2026-05-01T00:00:00Z",
    lineItems: [
      {
        format: "billboard",
        flightName: "Organic Valley — Homepage Billboard Q2 2026",
        flightId: 863187467,
        impressions: 1000000,
        cpm: 5.00,
        totalValue: 5000,
        startDate: "2026-05-01",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-billboard"],
        deliveredPct: Math.round(rnd(52, 62)),
      },
      {
        format: "leaderboard",
        flightName: "Organic Valley — Homepage Leaderboard Q2 2026",
        flightId: 863187590,
        impressions: 1000000,
        cpm: 5.00,
        totalValue: 5000,
        startDate: "2026-05-01",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-leaderboard"],
        deliveredPct: Math.round(rnd(50, 60)),
      },
      {
        format: "mrec",
        flightName: "Organic Valley — Product MRec Q2 2026",
        flightId: 863188334,
        impressions: 1000000,
        cpm: 5.00,
        totalValue: 5000,
        startDate: "2026-05-01",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-mrec"],
        deliveredPct: Math.round(rnd(48, 58)),
      },
    ],
  },

  // 2 — LIVE deal: Liquid I.V. Q2
  {
    id: "io-002",
    dealName: "Liquid I.V. — Q2 2026 Launch",
    advertiserName: "Liquid I.V.",
    advertiserId: 6256255,
    contactName: "Marcus Webb",
    contactEmail: "mwebb@liquidiv.com",
    stage: "live",
    owner: "Tyler Brooks",
    totalValue: 21000,
    probability: 100,
    currency: "USD",
    notes: "Higher CPM deal — $7.50 billboard, $6.50 leaderboard, $6.00 MRec. Won from RFP submitted April 28. Cross-sell conversation ongoing for Q3.",
    createdAt: "2026-04-20T10:30:00Z",
    proposedAt: "2026-04-28T16:00:00Z",
    signedAt: "2026-05-04T13:00:00Z",
    liveAt: "2026-05-06T00:00:00Z",
    lineItems: [
      {
        format: "billboard",
        flightName: "Liquid I.V. — Billboard Q2 2026",
        flightId: 863188608,
        impressions: 1000000,
        cpm: 7.50,
        totalValue: 7500,
        startDate: "2026-05-06",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-billboard"],
        deliveredPct: Math.round(rnd(35, 45)),
      },
      {
        format: "leaderboard",
        flightName: "Liquid I.V. — Leaderboard Q2 2026",
        flightId: 863188610,
        impressions: 1000000,
        cpm: 6.50,
        totalValue: 6500,
        startDate: "2026-05-06",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-leaderboard"],
        deliveredPct: Math.round(rnd(33, 43)),
      },
      {
        format: "mrec",
        flightName: "Liquid I.V. — MRec Q2 2026",
        flightId: 863188611,
        impressions: 1000000,
        cpm: 6.00,
        totalValue: 6000,
        startDate: "2026-05-06",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-mrec"],
        deliveredPct: Math.round(rnd(30, 40)),
      },
    ],
  },

  // 3 — LIVE deal: Earthbound Farm contextual
  {
    id: "io-003",
    dealName: "Earthbound Farm — Contextual Produce Q2 2026",
    advertiserName: "Earthbound Farm",
    advertiserId: 6256266,
    contactName: "Diana Holt",
    contactEmail: "dholt@earthboundfarm.com",
    stage: "live",
    owner: "Tyler Brooks",
    totalValue: 24000,
    probability: 100,
    currency: "USD",
    notes: "Premium contextual deal — produce/organic/fresh keyword targeting. $8.50 billboard CPM, highest in network. Billboard flight just added May 13. All 3 formats now live.",
    createdAt: "2026-04-25T11:00:00Z",
    proposedAt: "2026-05-02T14:30:00Z",
    signedAt: "2026-05-06T10:00:00Z",
    liveAt: "2026-05-06T00:00:00Z",
    lineItems: [
      {
        format: "billboard",
        flightName: "Earthbound Farm — Contextual Billboard Q2 2026",
        flightId: 863237502,
        impressions: 1000000,
        cpm: 8.50,
        totalValue: 8500,
        startDate: "2026-05-13",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-billboard", "produce", "organic", "fresh"],
        deliveredPct: Math.round(rnd(5, 15)), // just started
      },
      {
        format: "leaderboard",
        flightName: "Earthbound Farm — Contextual Leaderboard Q2 2026",
        flightId: 863188756,
        impressions: 1000000,
        cpm: 8.00,
        totalValue: 8000,
        startDate: "2026-05-06",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-leaderboard", "produce", "organic", "fresh"],
        deliveredPct: Math.round(rnd(30, 40)),
      },
      {
        format: "mrec",
        flightName: "Earthbound Farm — Contextual MRec Q2 2026",
        flightId: 863188757,
        impressions: 1000000,
        cpm: 7.50,
        totalValue: 7500,
        startDate: "2026-05-06",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-mrec", "produce", "organic", "fresh"],
        deliveredPct: Math.round(rnd(28, 38)),
      },
    ],
  },

  // 4 — PROPOSAL stage: NaturalBliss Tea
  {
    id: "io-004",
    dealName: "NaturalBliss Tea — Q3 2026 Contextual Launch",
    advertiserName: "NaturalBliss Tea Co.",
    advertiserId: undefined,
    contactName: "Priya Patel",
    contactEmail: "priya@naturalbliss.com",
    stage: "negotiation",
    owner: "Tyler Brooks",
    totalValue: 18000,
    probability: 65,
    currency: "USD",
    notes: "Interested in contextual beverage/snacks pages. Wants leaderboard + MRec. Pushed back on $7 MRec CPM — Tyler counter-proposed $6.50. Follow-up scheduled May 20.",
    createdAt: "2026-05-01T09:00:00Z",
    proposedAt: "2026-05-08T15:00:00Z",
    lineItems: [
      {
        format: "billboard",
        flightName: "NaturalBliss Tea — Homepage Billboard Q3 2026",
        impressions: 800000,
        cpm: 6.00,
        totalValue: 4800,
        startDate: "2026-07-01",
        endDate: "2026-09-30",
        contextualKeywords: ["ft-billboard", "beverages", "snacks"],
      },
      {
        format: "leaderboard",
        flightName: "NaturalBliss Tea — Contextual Leaderboard Q3 2026",
        impressions: 1200000,
        cpm: 6.50,
        totalValue: 7800,
        startDate: "2026-07-01",
        endDate: "2026-09-30",
        contextualKeywords: ["ft-leaderboard", "beverages", "snacks"],
      },
      {
        format: "mrec",
        flightName: "NaturalBliss Tea — Product MRec Q3 2026",
        impressions: 900000,
        cpm: 6.00,
        totalValue: 5400,
        startDate: "2026-07-01",
        endDate: "2026-09-30",
        contextualKeywords: ["ft-mrec", "beverages", "snacks"],
      },
    ],
  },

  // 5 — PROPOSAL: Kind Snacks
  {
    id: "io-005",
    dealName: "Kind Snacks — Sponsored Search + MRec",
    advertiserName: "Kind Snacks",
    advertiserId: undefined,
    contactName: "Alexis Morgan",
    contactEmail: "a.morgan@kindsnacks.com",
    stage: "proposal",
    owner: "Tyler Brooks",
    totalValue: 12500,
    probability: 45,
    currency: "USD",
    notes: "Came in via inbound inquiry from rate card. Focused on sponsored search shelf + MRec on snacks/protein pages. First RFP response sent May 10. Waiting on Q2 budget confirmation.",
    createdAt: "2026-05-07T14:00:00Z",
    proposedAt: "2026-05-10T17:00:00Z",
    lineItems: [
      {
        format: "mrec",
        flightName: "Kind Snacks — Snacks/Protein MRec Q2 2026",
        impressions: 1500000,
        cpm: 6.00,
        totalValue: 9000,
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-mrec", "snacks", "protein", "nutrition"],
      },
      {
        format: "billboard",
        flightName: "Kind Snacks — Billboard Q2 2026",
        impressions: 500000,
        cpm: 7.00,
        totalValue: 3500,
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-billboard", "snacks"],
      },
    ],
  },

  // 6 — PROSPECT: Chobani
  {
    id: "io-006",
    dealName: "Chobani — Q3 Dairy Contextual",
    advertiserName: "Chobani",
    advertiserId: undefined,
    contactName: "James Park",
    contactEmail: "jpark@chobani.com",
    stage: "prospect",
    owner: "Tyler Brooks",
    totalValue: 32000,
    probability: 20,
    currency: "USD",
    notes: "High-value prospect. Tyler connected at Groceryshop. Interested in dairy page contextual targeting. Intro call scheduled May 22. If they close, highest single-deal value to date.",
    createdAt: "2026-05-10T16:00:00Z",
    lineItems: [
      {
        format: "billboard",
        flightName: "Chobani — Dairy Contextual Billboard Q3 2026",
        impressions: 2000000,
        cpm: 9.00,
        totalValue: 18000,
        startDate: "2026-07-01",
        endDate: "2026-09-30",
        contextualKeywords: ["ft-billboard", "dairy", "fresh"],
      },
      {
        format: "leaderboard",
        flightName: "Chobani — Dairy Contextual Leaderboard Q3 2026",
        impressions: 1500000,
        cpm: 7.50,
        totalValue: 11250,
        startDate: "2026-07-01",
        endDate: "2026-09-30",
        contextualKeywords: ["ft-leaderboard", "dairy", "fresh"],
      },
      {
        format: "mrec",
        flightName: "Chobani — Product MRec Q3 2026",
        impressions: 1000000,
        cpm: 6.50,
        totalValue: 6500,
        startDate: "2026-07-01",
        endDate: "2026-09-30",
        contextualKeywords: ["ft-mrec", "dairy"],
      },
    ],
  },

  // 7 — SIGNED (not yet live): Pepperidge Farm
  {
    id: "io-007",
    dealName: "Pepperidge Farm — Bakery Contextual Q2 2026",
    advertiserName: "Pepperidge Farm",
    advertiserId: undefined,
    contactName: "Karen Liu",
    contactEmail: "k.liu@pepperidgefarm.com",
    stage: "signed",
    owner: "Casey Nguyen",
    totalValue: 14000,
    probability: 95,
    currency: "USD",
    notes: "IO signed May 12. Waiting on creative assets from advertiser — Casey following up. Kevel flight needs to be created once creatives are approved. Target live date: May 20.",
    createdAt: "2026-05-03T09:00:00Z",
    proposedAt: "2026-05-07T11:00:00Z",
    signedAt: "2026-05-12T15:00:00Z",
    lineItems: [
      {
        format: "billboard",
        flightName: "Pepperidge Farm — Bakery Billboard Q2 2026",
        impressions: 800000,
        cpm: 7.00,
        totalValue: 5600,
        startDate: "2026-05-20",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-billboard", "bakery", "fresh"],
      },
      {
        format: "leaderboard",
        flightName: "Pepperidge Farm — Bakery Leaderboard Q2 2026",
        impressions: 900000,
        cpm: 6.00,
        totalValue: 5400,
        startDate: "2026-05-20",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-leaderboard", "bakery"],
      },
      {
        format: "mrec",
        flightName: "Pepperidge Farm — Product MRec Q2 2026",
        impressions: 500000,
        cpm: 6.00,
        totalValue: 3000,
        startDate: "2026-05-20",
        endDate: "2026-06-30",
        contextualKeywords: ["ft-mrec", "bakery"],
      },
    ],
  },

  // 8 — LOST: Heinz
  {
    id: "io-008",
    dealName: "Heinz — Condiments Display Q2 2026",
    advertiserName: "Heinz",
    advertiserId: undefined,
    contactName: "Bob Carter",
    contactEmail: "bcarter@heinz.com",
    stage: "lost",
    owner: "Tyler Brooks",
    totalValue: 8000,
    probability: 0,
    currency: "USD",
    notes: "Lost to competitor network (larger reach). Heinz prioritized scale over contextual precision. Revisit Q4 once Earthbound Farm contextual results are published as case study.",
    createdAt: "2026-04-10T10:00:00Z",
    proposedAt: "2026-04-18T14:00:00Z",
    lineItems: [
      {
        format: "billboard",
        flightName: "Heinz — Homepage Billboard",
        impressions: 1000000,
        cpm: 5.50,
        totalValue: 5500,
        startDate: "2026-05-01",
        endDate: "2026-05-31",
        contextualKeywords: ["ft-billboard"],
      },
      {
        format: "mrec",
        flightName: "Heinz — Product MRec",
        impressions: 500000,
        cpm: 5.00,
        totalValue: 2500,
        startDate: "2026-05-01",
        endDate: "2026-05-31",
        contextualKeywords: ["ft-mrec"],
      },
    ],
  },
];

// ─── Pipeline summary ─────────────────────────────────────────────────────────
function buildSummary(deals: InsertionOrder[]) {
  const active = deals.filter((d) => !["lost"].includes(d.stage));
  const live = deals.filter((d) => d.stage === "live");
  const signed = deals.filter((d) => d.stage === "signed");
  const pipeline = deals.filter((d) =>
    ["prospect", "proposal", "negotiation"].includes(d.stage)
  );

  const totalLiveValue = live.reduce((s, d) => s + d.totalValue, 0);
  const totalSignedValue = signed.reduce((s, d) => s + d.totalValue, 0);
  const weightedPipeline = pipeline.reduce(
    (s, d) => s + d.totalValue * (d.probability / 100),
    0
  );
  const totalPipelineValue = pipeline.reduce((s, d) => s + d.totalValue, 0);

  // Revenue delivered so far (live deals)
  const deliveredRevenue = live.reduce((s, d) => {
    return (
      s +
      d.lineItems.reduce((ls, li) => {
        const pct = (li.deliveredPct ?? 0) / 100;
        return ls + li.totalValue * pct;
      }, 0)
    );
  }, 0);

  // Average deal size (active only, exclude lost/prospect)
  const closedDeals = deals.filter((d) => ["live", "signed", "closed"].includes(d.stage));
  const avgDealSize =
    closedDeals.length > 0
      ? closedDeals.reduce((s, d) => s + d.totalValue, 0) / closedDeals.length
      : 0;

  // Q2 contracted revenue (live + signed)
  const q2Contracted = totalLiveValue + totalSignedValue;

  return {
    totalDeals: active.length,
    liveCount: live.length,
    signedCount: signed.length,
    pipelineCount: pipeline.length,
    lostCount: deals.filter((d) => d.stage === "lost").length,
    totalLiveValue,
    totalSignedValue,
    q2Contracted,
    weightedPipeline: Math.round(weightedPipeline),
    totalPipelineValue,
    deliveredRevenue: Math.round(deliveredRevenue),
    avgDealSize: Math.round(avgDealSize),
    // Stage breakdown for funnel
    stageBreakdown: {
      prospect: deals.filter((d) => d.stage === "prospect").length,
      proposal: deals.filter((d) => d.stage === "proposal").length,
      negotiation: deals.filter((d) => d.stage === "negotiation").length,
      signed: deals.filter((d) => d.stage === "signed").length,
      live: deals.filter((d) => d.stage === "live").length,
      closed: deals.filter((d) => d.stage === "closed").length,
      lost: deals.filter((d) => d.stage === "lost").length,
    },
  };
}

// ─── In-memory note store (session-persistent) ────────────────────────────────
const noteStore: Record<string, { note: string; updatedAt: string; updatedBy: string }> = {};

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const id = searchParams.get("id");

  // Single deal
  if (id) {
    const deal = DEALS.find((d) => d.id === id);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const persisted = noteStore[id];
    return NextResponse.json({
      deal: {
        ...deal,
        notes: persisted?.note ?? deal.notes,
        noteUpdatedAt: persisted?.updatedAt,
        noteUpdatedBy: persisted?.updatedBy,
      },
    });
  }

  // Filtered list
  const filtered = stage
    ? DEALS.filter((d) => d.stage === stage)
    : DEALS;

  const withNotes = filtered.map((d) => {
    const persisted = noteStore[d.id];
    return {
      ...d,
      notes: persisted?.note ?? d.notes,
      noteUpdatedAt: persisted?.updatedAt,
      noteUpdatedBy: persisted?.updatedBy,
    };
  });

  return NextResponse.json({
    deals: withNotes,
    summary: buildSummary(DEALS),
  });
}

// ─── POST — update notes/stage ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, note, updatedBy } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const deal = DEALS.find((d) => d.id === id);
    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    if (note !== undefined) {
      noteStore[id] = {
        note,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy ?? "Casey Nguyen",
      };
    }

    return NextResponse.json({
      ok: true,
      id,
      noteUpdatedAt: noteStore[id]?.updatedAt,
    });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
