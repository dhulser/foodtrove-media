import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY || "";
const KEVEL_NETWORK_ID = process.env.KEVEL_NETWORK_ID || "12024";

interface WorkflowItem {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: "pacing" | "creative" | "budget" | "approval" | "discrepancy" | "flight";
  title: string;
  description: string;
  advertiser: string;
  flightId?: number;
  action: string;
  actionLabel: string;
  dueBy?: string;
  metric?: { label: string; value: string; trend?: "up" | "down" | "flat" };
}

interface FlightData {
  Id: number;
  Name: string;
  IsActive: boolean;
  IsUnlimited: boolean;
  Impressions: number;
  Price: { CPM: number };
  StartDateISO: string;
  EndDateISO?: string;
  CampaignId: number;
}

interface AdvertiserConfig {
  name: string;
  flightIds: number[];
  campaignIds: number[];
  formats: string[];
}

const ADVERTISERS: AdvertiserConfig[] = [
  { name: "Organic Valley", flightIds: [863187467, 863187590, 863188334], campaignIds: [12024001], formats: ["Billboard", "Leaderboard", "MRec"] },
  { name: "Liquid I.V.", flightIds: [863188400, 863188401], campaignIds: [12024002], formats: ["Billboard", "Leaderboard"] },
  { name: "Earthbound Farm", flightIds: [863188500, 863188501], campaignIds: [12024003], formats: ["MRec", "Leaderboard"] },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

async function fetchFlightData(flightId: number): Promise<FlightData | null> {
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

// --- 3P discrepancy rolling window ---
// Simulate a 3-day rolling average for each advertiser/format pair.
// Each day is seeded on that day's bucket so it's stable within a day but varies across days.
// The 3-day average is what triggers the alert — single-day spikes don't fire.
interface DiscrepancyDaySample {
  day: number; // 0 = today, 1 = yesterday, 2 = two days ago
  value: number;
}

function getDiscrepancyRollingAvg(
  advertiser: string,
  format: string,
  baseValue: number,
  variance: number,
  daysLive: number = 3 // how many days the campaign has been running (1, 2, or 3+)
): { avg: number; samples: DiscrepancyDaySample[]; windowDays: number } {
  const samples: DiscrepancyDaySample[] = [];
  const todayBucket = Math.floor(Date.now() / 86400000); // daily seed

  // Clamp to available days — don't wait for 3 days of data before firing
  // On day 1: use 1-day window. Day 2: 2-day window. Day 3+: full 3-day window.
  const windowDays = Math.min(daysLive, 3);

  for (let day = 0; day < windowDays; day++) {
    const daySeed = (todayBucket - day) * 31 + advertiser.length * 17 + format.length * 7;
    const dayRng = seededRandom(daySeed);
    // Consume a few rng calls to get stable per-day values (avoid seed collisions)
    dayRng(); dayRng();
    const val = baseValue + dayRng() * variance - variance * 0.3;
    samples.push({ day, value: Math.max(0, val) });
  }

  const avg = samples.reduce((sum, s) => sum + s.value, 0) / samples.length;
  return { avg, samples, windowDays };
}

export async function GET() {
  // Seed on 5-minute windows for stable but changing demo data
  const windowSeed = Math.floor(Date.now() / 300000);
  const rng = seededRandom(windowSeed);

  const workflowItems: WorkflowItem[] = [];
  const liveFlights: FlightData[] = [];

  // Try to fetch real Kevel flight data
  if (KEVEL_API_KEY && KEVEL_NETWORK_ID) {
    const flightIds = ADVERTISERS.flatMap((a) => a.flightIds);
    const fetches = await Promise.allSettled(flightIds.map((id) => fetchFlightData(id)));
    for (const result of fetches) {
      if (result.status === "fulfilled" && result.value) {
        liveFlights.push(result.value);
      }
    }
  }

  // --- Pacing items ---
  const pacingProfiles = [
    { advertiser: "Organic Valley", flightId: 863187467, format: "Billboard", pace: 0.42 + rng() * 0.3, budget: 4200, spent: 0 },
    { advertiser: "Liquid I.V.", flightId: 863188400, format: "Leaderboard", pace: 0.78 + rng() * 0.15, budget: 3500, spent: 0 },
    { advertiser: "Earthbound Farm", flightId: 863188500, format: "MRec", pace: 0.91 + rng() * 0.08, budget: 2800, spent: 0 },
  ];

  for (const p of pacingProfiles) {
    p.spent = Math.round(p.budget * p.pace * (0.6 + rng() * 0.3));
    const daysRemaining = Math.floor(3 + rng() * 12);
    const paceRate = p.pace;

    if (paceRate < 0.55) {
      workflowItems.push({
        id: `pacing-under-${p.flightId}`,
        priority: "high",
        category: "pacing",
        title: `${p.advertiser} ${p.format} — under-pacing`,
        description: `Delivering at ${Math.round(paceRate * 100)}% of goal. ${daysRemaining}d remaining. Risk of under-delivery on committed impressions.`,
        advertiser: p.advertiser,
        flightId: p.flightId,
        action: `Increase bid floor or expand targeting`,
        actionLabel: "Review pacing",
        dueBy: `${daysRemaining}d`,
        metric: { label: "Pace rate", value: `${Math.round(paceRate * 100)}%`, trend: "down" },
      });
    } else if (paceRate > 0.95) {
      workflowItems.push({
        id: `pacing-over-${p.flightId}`,
        priority: "medium",
        category: "pacing",
        title: `${p.advertiser} ${p.format} — burning fast`,
        description: `Delivering at ${Math.round(paceRate * 100)}% of goal. Budget exhausts in ${daysRemaining}d unless throttled.`,
        advertiser: p.advertiser,
        flightId: p.flightId,
        action: `Enable even-pacing or reduce daily cap`,
        actionLabel: "Adjust pacing",
        dueBy: `${daysRemaining}d`,
        metric: { label: "Pace rate", value: `${Math.round(paceRate * 100)}%`, trend: "up" },
      });
    }
  }

  // --- Creative expiration / review items ---
  const creativeItems = [
    { advertiser: "Organic Valley", format: "Billboard", expiresInDays: Math.floor(2 + rng() * 5), status: "review" },
    { advertiser: "Liquid I.V.", format: "MRec", expiresInDays: Math.floor(8 + rng() * 7), status: "approved" },
    { advertiser: "Earthbound Farm", format: "Leaderboard", expiresInDays: Math.floor(1 + rng() * 3), status: "pending" },
  ];

  for (const c of creativeItems) {
    if (c.status === "pending") {
      workflowItems.push({
        id: `creative-pending-${c.advertiser}-${c.format}`,
        priority: c.expiresInDays <= 2 ? "critical" : "high",
        category: "creative",
        title: `${c.advertiser} ${c.format} creative — approval pending`,
        description: `Creative submitted ${Math.floor(1 + rng() * 3)}d ago. Flights go dark if not approved before campaign start (${c.expiresInDays}d).`,
        advertiser: c.advertiser,
        action: `Review HTML/image, check brand safety, approve or reject`,
        actionLabel: "Review creative",
        dueBy: `${c.expiresInDays}d`,
        metric: { label: "Pending", value: `${c.expiresInDays}d left`, trend: "down" },
      });
    } else if (c.status === "review" && c.expiresInDays <= 4) {
      workflowItems.push({
        id: `creative-expiring-${c.advertiser}-${c.format}`,
        priority: "medium",
        category: "creative",
        title: `${c.advertiser} ${c.format} creative — expires soon`,
        description: `Active creative expires in ${c.expiresInDays}d. Advertiser has not submitted refresh. Follow up to prevent impression gap.`,
        advertiser: c.advertiser,
        action: `Contact ${c.advertiser} for creative refresh`,
        actionLabel: "Follow up",
        dueBy: `${c.expiresInDays}d`,
        metric: { label: "Expires", value: `${c.expiresInDays}d`, trend: "down" },
      });
    }
  }

  // --- Budget runway items ---
  const budgetItems = [
    { advertiser: "Organic Valley", remainingPct: 0.12 + rng() * 0.08, format: "Leaderboard", flightId: 863187590 },
    { advertiser: "Liquid I.V.", remainingPct: 0.28 + rng() * 0.1, format: "Billboard", flightId: 863188400 },
  ];

  for (const b of budgetItems) {
    if (b.remainingPct < 0.15) {
      workflowItems.push({
        id: `budget-${b.flightId}`,
        priority: "high",
        category: "budget",
        title: `${b.advertiser} ${b.format} — low budget runway`,
        description: `${Math.round(b.remainingPct * 100)}% of flight budget remaining. At current burn rate, exhausts in ${Math.floor(2 + rng() * 4)}d. Renewal discussion needed.`,
        advertiser: b.advertiser,
        flightId: b.flightId,
        action: `Alert Tyler for renewal conversation or pause flight`,
        actionLabel: "Budget review",
        metric: { label: "Remaining", value: `${Math.round(b.remainingPct * 100)}%`, trend: "down" },
      });
    }
  }

  // --- 3P discrepancy items (3-day rolling window) ---
  // Fix: alert only fires when the 3-day rolling average exceeds 5% threshold.
  // Single-day spikes are normal measurement noise and should not trigger Casey's queue.
  // A rolling average ensures the discrepancy is persistent, not a one-time pixel anomaly.
  const discrepancyConfigs = [
    { advertiser: "Earthbound Farm", format: "Billboard", baseValue: 4.2, variance: 2.5, daysLive: 3 },
    { advertiser: "Organic Valley", format: "MRec", baseValue: 1.8, variance: 1.5, daysLive: 3 },
    // Example new campaign on day 1 — fires immediately if discrepant (no 3-day wait)
    { advertiser: "Liquid I.V.", format: "Leaderboard", baseValue: 6.8, variance: 1.2, daysLive: 1 },
  ];

  for (const d of discrepancyConfigs) {
    const { avg, samples, windowDays } = getDiscrepancyRollingAvg(d.advertiser, d.format, d.baseValue, d.variance, d.daysLive);
    if (avg > 5.0) {
      const dayLabels = ["today", "yesterday", "2d ago"];
      const sampleDesc = samples
        .map((s) => `${dayLabels[s.day]}: ${s.value.toFixed(1)}%`)
        .join(", ");
      const vendor = ["DoubleVerify", "IAS", "Moat"][Math.floor(rng() * 3)];
      const windowLabel = windowDays === 1 ? "1d" : windowDays === 2 ? "2d avg" : "3d avg";
      workflowItems.push({
        id: `discrepancy-${d.advertiser}-${d.format}`,
        priority: "critical",
        category: "discrepancy",
        title: `${d.advertiser} ${d.format} — 3P discrepancy ${avg.toFixed(1)}% (${windowLabel})`,
        description: windowDays < 3
          ? `${windowLabel} vs. ${vendor} is ${avg.toFixed(1)}% — above 5% threshold. Campaign is ${windowDays}d old; alert fires immediately on partial window. Day breakdown: ${sampleDesc}. Investigate before campaign runs further.`
          : `3-day rolling avg vs. ${vendor} is ${avg.toFixed(1)}% — above 5% threshold. Day breakdown: ${sampleDesc}. Persistent, not a spike — requires root-cause investigation before billing cycle.`,
        advertiser: d.advertiser,
        action: `Compare impression logs, check pixel fires, escalate to Kevel support if pixel issue`,
        actionLabel: "Investigate",
        metric: { label: `${windowLabel} discrepancy`, value: `${avg.toFixed(1)}%`, trend: "up" },
      });
    }
  }

  // --- Flight lifecycle items ---
  // Fix: "Ending within 3d" alert only fires if delivery rate is below 95%.
  // An over-delivering or on-pace flight ending soon is not an ops concern —
  // it delivered what was committed. Only under-delivery at end-of-flight is actionable.
  interface EndingFlight { advertiser: string; format: string; endsInDays: number; flightId: number; deliveryPct: number }
  interface StartingFlight { advertiser: string; format: string; startsInDays: number; flightId: number }

  const endingFlights: EndingFlight[] = [
    {
      advertiser: "Liquid I.V.",
      format: "MRec",
      endsInDays: Math.floor(1 + rng() * 4),
      flightId: 863188401,
      // Delivery rate: simulated as a fraction of impression goal delivered by EoF
      deliveryPct: 0.72 + rng() * 0.35, // range 0.72–1.07
    },
  ];
  const startingFlights: StartingFlight[] = [
    { advertiser: "Earthbound Farm", format: "Leaderboard", startsInDays: Math.floor(1 + rng() * 3), flightId: 863188501 },
  ];

  for (const fl of endingFlights) {
    // Only fire if delivery is below 95% — on-pace or over-delivering flights ending soon are fine
    const isUnderDelivering = fl.deliveryPct < 0.95;
    if (fl.endsInDays <= 3 && isUnderDelivering) {
      workflowItems.push({
        id: `flight-ending-${fl.flightId}`,
        priority: fl.endsInDays <= 1 ? "high" : "medium",
        category: "flight",
        title: `${fl.advertiser} ${fl.format} flight ending in ${fl.endsInDays}d — ${Math.round(fl.deliveryPct * 100)}% delivered`,
        description: `Flight ${fl.flightId} ends in ${fl.endsInDays}d at ${Math.round(fl.deliveryPct * 100)}% delivery. Risk of under-delivery on committed impressions. Coordinate with ${fl.advertiser} and Tyler on make-good or extension.`,
        advertiser: fl.advertiser,
        flightId: fl.flightId,
        action: `Confirm end-of-flight plan — make-good or extension if <95% at EoF`,
        actionLabel: "Flight end checklist",
        dueBy: `${fl.endsInDays}d`,
        metric: { label: "Delivered", value: `${Math.round(fl.deliveryPct * 100)}%`, trend: "down" },
      });
    }
    // If over-delivering or on pace: no alert needed — log it quietly
  }

  for (const fl of startingFlights) {
    if (fl.startsInDays <= 2) {
      workflowItems.push({
        id: `flight-starting-${fl.flightId}`,
        priority: "medium",
        category: "flight",
        title: `${fl.advertiser} ${fl.format} flight starts in ${fl.startsInDays}d`,
        description: `Verify creative is approved, targeting is correct, and impression cap is set. Run test decision request before live date.`,
        advertiser: fl.advertiser,
        flightId: fl.flightId,
        action: `Pre-flight QA checklist: creative, targeting, caps`,
        actionLabel: "Pre-flight QA",
        dueBy: `${fl.startsInDays}d`,
        metric: { label: "Starts in", value: `${fl.startsInDays}d`, trend: "flat" },
      });
    }
  }

  // Sort: critical → high → medium → low
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  workflowItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Summary stats
  const summary = {
    total: workflowItems.length,
    critical: workflowItems.filter((i) => i.priority === "critical").length,
    high: workflowItems.filter((i) => i.priority === "high").length,
    medium: workflowItems.filter((i) => i.priority === "medium").length,
    low: workflowItems.filter((i) => i.priority === "low").length,
    byCategory: {
      pacing: workflowItems.filter((i) => i.category === "pacing").length,
      creative: workflowItems.filter((i) => i.category === "creative").length,
      budget: workflowItems.filter((i) => i.category === "budget").length,
      approval: workflowItems.filter((i) => i.category === "approval").length,
      discrepancy: workflowItems.filter((i) => i.category === "discrepancy").length,
      flight: workflowItems.filter((i) => i.category === "flight").length,
    },
    liveFlightsChecked: liveFlights.length,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ summary, items: workflowItems });
}
