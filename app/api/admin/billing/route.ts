import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY || "";

// --- Types ---
interface InvoiceLineItem {
  flightId: number;
  flightName: string;
  format: "Billboard" | "Leaderboard" | "MRec";
  startDate: string;
  endDate: string;
  bookedImpressions: number;
  deliveredImpressions: number;
  deliveryPct: number;
  cpm: number;
  grossRevenue: number;
  // Adjustments
  makeGoodCredit: number; // if under-delivered
  earlyFinishCredit: number;
  netRevenue: number;
  status: "pending" | "approved" | "invoiced" | "paid";
}

interface AdvertiserInvoice {
  advertiserId: string;
  advertiserName: string;
  billingPeriod: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  makeGoodCredits: number;
  netTotal: number;
  status: "draft" | "ready" | "sent" | "paid";
  // Audit trail — all four lifecycle timestamps
  draftedAt: string;
  finalizedAt: string | null;
  sentAt: string | null;
  paidAt: string | null;
  // Notes — free text per invoice, for Casey's ops notes
  notes: string;
  // Make-good review gate — true if credits need review before finalizing
  makeGoodPendingReview: boolean;
}

interface BillingSummary {
  period: string;
  totalGrossRevenue: number;
  totalCredits: number;
  totalNetRevenue: number;
  invoiceCount: number;
  paidCount: number;
  pendingCount: number;
  avgDeliveryPct: number;
  underDeliveryAlerts: number;
}

// Seeded PRNG — daily cadence for billing data (stable within a day, changes daily)
function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getDailyRng(salt: number = 0): () => number {
  const daySeed = Math.floor(Date.now() / 86400000) * 997 + salt;
  return seededRandom(daySeed);
}

// Format a date N days ago/ahead
function offsetDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

// Generate invoice number — stable per advertiser+period
function invoiceNumber(advertiserInitials: string, periodKey: string, seq: number): string {
  return `FTM-${advertiserInitials}-${periodKey}-${String(seq).padStart(3, "0")}`;
}

async function tryFetchFlight(flightId: number): Promise<{ Impressions?: number; Price?: { CPM?: number } } | null> {
  if (!KEVEL_API_KEY) return null;
  try {
    const res = await fetch(`https://api.kevel.co/v1/flight/${flightId}`, {
      headers: { "X-Adzerk-ApiKey": KEVEL_API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.Flight || data;
  } catch {
    return null;
  }
}

export async function GET() {
  const rng = getDailyRng(42);

  // Current billing period (current month)
  const now = new Date();
  const periodLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const periodKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Try to pull live CPM from Kevel for Organic Valley billboard
  const liveFlight = await tryFetchFlight(863187467);
  const liveCPM = liveFlight?.Price?.CPM ?? null;

  // --- Advertiser billing configs ---
  const advertiserConfigs = [
    {
      id: "organic-valley",
      name: "Organic Valley",
      initials: "OV",
      flights: [
        {
          flightId: 863187467,
          flightName: "Organic Valley Billboard Q2 2026",
          format: "Billboard" as const,
          cpm: liveCPM ?? 5.0,
          bookedImpressions: 120000,
          startDate: offsetDate(-28),
          endDate: offsetDate(3),
          paceBase: 0.88,
          seq: 1,
        },
        {
          flightId: 863187590,
          flightName: "Organic Valley Leaderboard Q2 2026",
          format: "Leaderboard" as const,
          cpm: 5.0,
          bookedImpressions: 200000,
          startDate: offsetDate(-28),
          endDate: offsetDate(3),
          paceBase: 0.94,
          seq: 2,
        },
        {
          flightId: 863188334,
          flightName: "Organic Valley MRec Q2 2026",
          format: "MRec" as const,
          cpm: 5.0,
          bookedImpressions: 150000,
          startDate: offsetDate(-28),
          endDate: offsetDate(3),
          paceBase: 0.97,
          seq: 3,
        },
      ],
      paymentStatus: "paid" as const,
    },
    {
      id: "liquid-iv",
      name: "Liquid I.V.",
      initials: "LIV",
      flights: [
        {
          flightId: 863188400,
          flightName: "Liquid I.V. Billboard Q2 2026",
          format: "Billboard" as const,
          cpm: 7.5,
          bookedImpressions: 80000,
          startDate: offsetDate(-21),
          endDate: offsetDate(10),
          paceBase: 0.76,
          seq: 1,
        },
        {
          flightId: 863188401,
          flightName: "Liquid I.V. Leaderboard Q2 2026",
          format: "Leaderboard" as const,
          cpm: 6.5,
          bookedImpressions: 100000,
          startDate: offsetDate(-21),
          endDate: offsetDate(10),
          paceBase: 0.82,
          seq: 2,
        },
      ],
      paymentStatus: "pending" as const,
    },
    {
      id: "earthbound-farm",
      name: "Earthbound Farm",
      initials: "EF",
      flights: [
        {
          flightId: 863188500,
          flightName: "Earthbound Farm MRec Q2 2026",
          format: "MRec" as const,
          cpm: 7.5,
          bookedImpressions: 90000,
          startDate: offsetDate(-14),
          endDate: offsetDate(17),
          paceBase: 0.91,
          seq: 1,
        },
        {
          flightId: 863188501,
          flightName: "Earthbound Farm Leaderboard Q2 2026",
          format: "Leaderboard" as const,
          cpm: 8.0,
          bookedImpressions: 110000,
          startDate: offsetDate(-14),
          endDate: offsetDate(17),
          paceBase: 0.68, // intentionally under-delivering — triggers make-good
          seq: 2,
        },
      ],
      paymentStatus: "draft" as const,
    },
  ];

  const invoices: AdvertiserInvoice[] = [];

  for (const advertiser of advertiserConfigs) {
    const lineItems: InvoiceLineItem[] = [];

    for (const flight of advertiser.flights) {
      const localRng = getDailyRng(flight.flightId % 997);
      localRng(); // consume one call to avoid seed collision with top-level rng
      const deliveryVariance = localRng() * 0.08 - 0.04; // ±4%
      const deliveryPct = Math.min(1.0, Math.max(0.5, flight.paceBase + deliveryVariance));
      const deliveredImpressions = Math.round(flight.bookedImpressions * deliveryPct);

      const grossRevenue = (deliveredImpressions / 1000) * flight.cpm;

      // Make-good credit: if delivery < 95%, credit the shortfall at booked CPM
      let makeGoodCredit = 0;
      if (deliveryPct < 0.95) {
        const shortfall = flight.bookedImpressions - deliveredImpressions;
        makeGoodCredit = (shortfall / 1000) * flight.cpm * 0.5; // 50% credit on shortfall
      }

      const netRevenue = grossRevenue - makeGoodCredit;

      lineItems.push({
        flightId: flight.flightId,
        flightName: flight.flightName,
        format: flight.format,
        startDate: flight.startDate,
        endDate: flight.endDate,
        bookedImpressions: flight.bookedImpressions,
        deliveredImpressions,
        deliveryPct: Math.round(deliveryPct * 1000) / 10, // one decimal
        cpm: flight.cpm,
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        makeGoodCredit: Math.round(makeGoodCredit * 100) / 100,
        earlyFinishCredit: 0,
        netRevenue: Math.round(netRevenue * 100) / 100,
        status: advertiser.paymentStatus === "paid" ? "paid" : "pending",
      });
    }

    const subtotal = lineItems.reduce((s, li) => s + li.grossRevenue, 0);
    const invoiceMakeGoodCredits = lineItems.reduce((s, li) => s + li.makeGoodCredit, 0);
    const netTotal = subtotal - invoiceMakeGoodCredits;

    const invoiceDate = offsetDate(-3);
    const dueDate = offsetDate(27);

    // Audit trail timestamps — simulate realistic lifecycle based on status
    const draftedAt = new Date(Date.now() - 3 * 86400000).toISOString(); // 3 days ago
    const finalizedAt =
      advertiser.paymentStatus !== "draft"
        ? new Date(Date.now() - 2 * 86400000).toISOString()
        : null;
    const sentAt =
      advertiser.paymentStatus === "pending" || advertiser.paymentStatus === "paid"
        ? new Date(Date.now() - 1 * 86400000).toISOString()
        : null;
    const paidAt =
      advertiser.paymentStatus === "paid"
        ? new Date(Date.now() - 6 * 3600000).toISOString() // paid 6 hours ago
        : null;

    const makeGoodPendingReview = invoiceMakeGoodCredits > 0 && advertiser.paymentStatus !== "paid";

    invoices.push({
      advertiserId: advertiser.id,
      advertiserName: advertiser.name,
      billingPeriod: periodLabel,
      invoiceNumber: invoiceNumber(advertiser.initials, periodKey, 1),
      invoiceDate,
      dueDate,
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      makeGoodCredits: Math.round(invoiceMakeGoodCredits * 100) / 100,
      netTotal: Math.round(netTotal * 100) / 100,
      status: advertiser.paymentStatus === "paid"
        ? "paid"
        : advertiser.paymentStatus === "pending"
        ? "sent"
        : "draft",
      draftedAt,
      finalizedAt,
      sentAt,
      paidAt,
      notes: "",
      makeGoodPendingReview,
    });
  }

  // Summary
  const summary: BillingSummary = {
    period: periodLabel,
    totalGrossRevenue: Math.round(invoices.reduce((s, inv) => s + inv.subtotal, 0) * 100) / 100,
    totalCredits: Math.round(invoices.reduce((s, inv) => s + inv.makeGoodCredits, 0) * 100) / 100,
    totalNetRevenue: Math.round(invoices.reduce((s, inv) => s + inv.netTotal, 0) * 100) / 100,
    invoiceCount: invoices.length,
    paidCount: invoices.filter((i) => i.status === "paid").length,
    pendingCount: invoices.filter((i) => i.status !== "paid").length,
    avgDeliveryPct:
      Math.round(
        (invoices
          .flatMap((inv) => inv.lineItems)
          .reduce((s, li) => s + li.deliveryPct, 0) /
          invoices.flatMap((inv) => inv.lineItems).length) * 10
      ) / 10,
    underDeliveryAlerts: invoices
      .flatMap((inv) => inv.lineItems)
      .filter((li) => li.deliveryPct < 95).length,
  };

  return NextResponse.json({
    summary,
    invoices,
    liveCPMFromKevel: liveCPM !== null ? { flightId: 863187467, cpm: liveCPM } : null,
    generatedAt: new Date().toISOString(),
  });
}
