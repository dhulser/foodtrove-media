"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FlightPerformance {
  flightId: number;
  flightName: string;
  format: string;
  cpm: number;
  bookedImpressions: number;
  deliveredToDate: number;
  pacePercent: number;
  fillRate: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  roas: number;
  remainingDays: number;
  status: "on-pace" | "under" | "over" | "ended";
  topContexts: string[];
}

interface CreativeSpec {
  format: string;
  size: string;
  idealFor: string;
  hasCreative: boolean;
  linkedToFlight: boolean;
  pendingLinkage: boolean;
  creativeId?: number;
  flightId?: number;
  previewHtml?: string;
}

interface AdvertiserPortalData {
  advertiserId: string;
  advertiserName: string;
  slug: string;
  category: string;
  primaryColor: string;
  campaignName: string;
  contractedSpend: number;
  spendToDate: number;
  estimatedSpend: number;
  flights: FlightPerformance[];
  creativeSpecs: CreativeSpec[];
  audienceInsights: {
    totalReach: number;
    uniqueShoppers: number;
    avgFrequency: number;
    topSegments: string[];
    contextualKeywords: string[];
  };
  recommendations: {
    type: string;
    headline: string;
    detail: string;
    estimatedImpact: string;
  }[];
  generatedAt: string;
}

interface PortalResponse {
  advertisers: AdvertiserPortalData[];
  totalAdvertisers: number;
  liveCPMEnrichment: { flightId: number; cpm: number } | null;
  generatedAt: string;
}

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();
}

function statusBadge(status: FlightPerformance["status"]) {
  const map = {
    "on-pace": "bg-emerald-900/40 text-emerald-400 border border-emerald-800",
    over: "bg-sky-900/40 text-sky-400 border border-sky-800",
    under: "bg-amber-900/40 text-amber-400 border border-amber-800",
    ended: "bg-zinc-800 text-zinc-500 border border-zinc-700",
  };
  const labels = { "on-pace": "On pace", over: "Over-delivering", under: "Under-pacing", ended: "Ended" };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function AdvertiserPortalPage() {
  const [data, setData] = useState<PortalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"performance" | "creatives" | "audience" | "recommendations">("performance");

  useEffect(() => {
    fetch("/api/admin/advertiser-portal")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.advertisers?.length > 0) setSelectedAdvertiser(d.advertisers[0].advertiserId);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Loading advertiser portal…</div>
      </div>
    );
  }

  const adv = data.advertisers.find((a) => a.advertiserId === selectedAdvertiser) ?? data.advertisers[0];

  const totalDelivered = adv.flights.reduce((s, f) => s + f.deliveredToDate, 0);
  const totalClicks = adv.flights.reduce((s, f) => s + f.clicks, 0);
  const totalConversions = adv.flights.reduce((s, f) => s + f.conversions, 0);
  const blendedRoas = adv.flights.reduce((s, f) => s + f.roas, 0) / Math.max(adv.flights.length, 1);

  const TABS = [
    { id: "performance", label: "Flight Performance" },
    { id: "creatives", label: "Creatives" },
    { id: "audience", label: "Audience Insights" },
    { id: "recommendations", label: "Recommendations" },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 text-sm">← Admin</Link>
          <span className="text-zinc-700">/</span>
          <h1 className="text-lg font-semibold text-zinc-100">Advertiser Portal</h1>
          <span className="ml-2 text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">Self-serve</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {data.liveCPMEnrichment && (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              Live Kevel CPM: ${data.liveCPMEnrichment.cpm.toFixed(2)}
            </span>
          )}
          <span>{data.totalAdvertisers} active advertisers</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Advertiser selector */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {data.advertisers.map((a) => (
            <button
              key={a.advertiserId}
              onClick={() => { setSelectedAdvertiser(a.advertiserId); setActiveTab("performance"); }}
              style={selectedAdvertiser === a.advertiserId ? { borderColor: a.primaryColor, color: a.primaryColor } : {}}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                selectedAdvertiser === a.advertiserId
                  ? "bg-zinc-800"
                  : "border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
              }`}
            >
              {a.advertiserName}
              <span className="ml-2 text-xs opacity-60">{a.category}</span>
            </button>
          ))}
        </div>

        {/* Advertiser summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold" style={{ color: adv.primaryColor }}>{adv.advertiserName}</h2>
              <div className="text-sm text-zinc-400 mt-0.5">{adv.campaignName}</div>
              <div className="text-xs text-zinc-600 mt-1">{adv.category} · {adv.flights.length} active flights</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 mb-1">Contracted Spend</div>
              <div className="text-lg font-bold text-zinc-200">{fmt(adv.contractedSpend)}</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {fmt(adv.spendToDate)} spent · {fmt(adv.estimatedSpend)} est. total
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Impressions Delivered", value: fmtK(totalDelivered), sub: "to date" },
              { label: "Total Clicks", value: fmtK(totalClicks), sub: `${adv.flights.reduce((s, f) => s + f.ctr, 0) / Math.max(adv.flights.length, 1) > 0 ? (adv.flights.reduce((s, f) => s + f.ctr, 0) / Math.max(adv.flights.length, 1)).toFixed(2) : "—"}% avg CTR` },
              { label: "Conversions", value: fmtK(totalConversions), sub: "attributed (30d window)" },
              { label: "Blended ROAS", value: blendedRoas.toFixed(1) + "x", sub: "return on ad spend" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1">{kpi.label}</div>
                <div className="text-xl font-bold text-zinc-100">{kpi.value}</div>
                <div className="text-xs text-zinc-600 mt-0.5">{kpi.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 border-b border-zinc-800 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "text-zinc-100 border-zinc-300"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              {tab.label}
              {tab.id === "recommendations" && adv.recommendations.length > 0 && (
                <span className="ml-1.5 text-xs bg-amber-700 text-amber-100 px-1.5 py-0.5 rounded-full">
                  {adv.recommendations.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Flight Performance */}
        {activeTab === "performance" && (
          <div className="space-y-4">
            {adv.flights.map((flight) => (
              <div key={flight.flightId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">{flight.flightName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500">{flight.format} · {fmt(flight.cpm)} CPM</span>
                      {statusBadge(flight.status)}
                      {flight.remainingDays > 0 && (
                        <span className="text-xs text-zinc-600">{flight.remainingDays}d remaining</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-zinc-200 font-medium">{fmtK(flight.deliveredToDate)}</div>
                    <div className="text-xs text-zinc-600">of {fmtK(flight.bookedImpressions)} booked</div>
                  </div>
                </div>

                {/* Delivery bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Delivery pace</span>
                    <span>{flight.pacePercent}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        flight.status === "on-pace" ? "bg-emerald-500"
                        : flight.status === "over" ? "bg-sky-500"
                        : flight.status === "under" ? "bg-amber-500"
                        : "bg-zinc-600"
                      }`}
                      style={{ width: `${Math.min(100, flight.pacePercent)}%` }}
                    />
                  </div>
                </div>

                {/* Performance metrics */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: "Fill Rate", value: `${flight.fillRate}%` },
                    { label: "Clicks", value: fmtK(flight.clicks) },
                    { label: "CTR", value: `${flight.ctr}%` },
                    { label: "Conversions", value: flight.conversions.toString() },
                    { label: "Conv. Rate", value: `${flight.conversionRate}%` },
                    { label: "ROAS", value: `${flight.roas}x` },
                  ].map((m) => (
                    <div key={m.label} className="bg-zinc-950/50 rounded-lg p-2.5">
                      <div className="text-xs text-zinc-600">{m.label}</div>
                      <div className="text-sm font-semibold text-zinc-200 mt-0.5">{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Top contexts */}
                {flight.topContexts.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-zinc-600">Top contexts:</span>
                    {flight.topContexts.map((ctx) => (
                      <span key={ctx} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                        {ctx}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab: Creatives */}
        {activeTab === "creatives" && (
          <div className="space-y-5">
            {/* Pending linkage banner — shown when any creative needs Dylan's Kevel action */}
            {adv.creativeSpecs.some((s) => s.pendingLinkage) && (
              <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-800/60 rounded-xl px-5 py-4">
                <span className="text-amber-400 text-lg mt-0.5">⚠️</span>
                <div>
                  <div className="text-sm font-semibold text-amber-300 mb-1">
                    Creative-to-flight linkage pending
                  </div>
                  <div className="text-sm text-amber-200/80 leading-relaxed">
                    {adv.creativeSpecs.filter((s) => s.pendingLinkage).map((s) => s.format).join(", ")} creative
                    {adv.creativeSpecs.filter((s) => s.pendingLinkage).length > 1 ? "s are" : " is"} uploaded in Kevel
                    but not yet linked to a flight via{" "}
                    <code className="text-amber-300 text-xs bg-amber-950/60 px-1 rounded">POST /flight/&#123;id&#125;/creative</code>.
                    Ads will not serve until the link is established.
                  </div>
                  <div className="mt-2 text-xs text-amber-400/80">
                    Action required: <strong>Dylan Hulser</strong> — complete flight-creative mapping in Kevel dashboard
                    or contact Kai to run the API script.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {adv.creativeSpecs.map((spec) => (
              <div key={spec.format} className={`bg-zinc-900 border rounded-xl p-5 ${spec.pendingLinkage ? "border-amber-800/50" : "border-zinc-800"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-zinc-200">{spec.format}</div>
                  {!spec.hasCreative ? (
                    <span className="text-xs bg-zinc-800 text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">No creative</span>
                  ) : spec.pendingLinkage ? (
                    <span className="text-xs bg-amber-900/50 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">Pending linkage</span>
                  ) : (
                    <span className="text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 mb-3">{spec.size} · {spec.idealFor}</div>

                {spec.previewHtml ? (
                  <div className={`rounded-lg overflow-hidden border mb-3 ${spec.pendingLinkage ? "border-amber-800/40 opacity-60" : "border-zinc-700"}`}>
                    <iframe
                      srcDoc={spec.previewHtml}
                      className="w-full h-20"
                      sandbox="allow-same-origin"
                      title={`${adv.advertiserName} ${spec.format} creative preview`}
                    />
                  </div>
                ) : (
                  <div className="h-20 bg-zinc-800 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center text-xs text-zinc-600 mb-3">
                    No creative uploaded
                  </div>
                )}

                {spec.pendingLinkage && (
                  <div className="text-xs text-amber-500/80 mb-2 flex items-center gap-1">
                    <span>⚡</span>
                    <span>Flight linkage required before this creative can serve</span>
                  </div>
                )}

                {spec.creativeId && (
                  <div className="text-xs text-zinc-600">Creative ID: {spec.creativeId}</div>
                )}
                {spec.flightId && spec.linkedToFlight && (
                  <div className="text-xs text-zinc-600">Flight ID: {spec.flightId}</div>
                )}
                <div className="mt-3">
                  <Link
                    href="/admin/creatives"
                    className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    View in Creative Gallery →
                  </Link>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Tab: Audience Insights */}
        {activeTab === "audience" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Total Impressions", value: fmtK(adv.audienceInsights.totalReach), sub: "delivered" },
                { label: "Unique Shoppers", value: fmtK(adv.audienceInsights.uniqueShoppers), sub: "reached" },
                { label: "Avg Frequency", value: `${adv.audienceInsights.avgFrequency}×`, sub: "impressions/shopper" },
              ].map((stat) => (
                <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="text-xs text-zinc-500 mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold text-zinc-100">{stat.value}</div>
                  <div className="text-xs text-zinc-600 mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Top Audience Segments</h3>
              <div className="space-y-2">
                {adv.audienceInsights.topSegments.map((seg, i) => (
                  <div key={seg} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm text-zinc-300">{seg}</div>
                    </div>
                    <div className="h-2 w-32 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${85 - i * 18}%`,
                          backgroundColor: adv.primaryColor,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-8 text-right">{85 - i * 18}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Contextual Keyword Targeting</h3>
              <div className="flex flex-wrap gap-2">
                {adv.audienceInsights.contextualKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-3 py-1 rounded-full text-sm border"
                    style={{ borderColor: adv.primaryColor + "66", color: adv.primaryColor }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
              <p className="text-xs text-zinc-600 mt-3">
                Ads are served when shopper page context matches these keywords.
                Contextual targeting earns {adv.primaryColor === "#84cc16" ? "23–31" : "15–22"}% CPM premium vs. run-of-site.
              </p>
            </div>
          </div>
        )}

        {/* Tab: Recommendations */}
        {activeTab === "recommendations" && (
          <div className="space-y-4">
            {adv.recommendations.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
                No active recommendations. Campaign is performing well.
              </div>
            ) : (
              adv.recommendations.map((rec, i) => {
                const iconMap: Record<string, string> = {
                  "increase-budget": "💰",
                  "add-format": "📐",
                  "keyword-expansion": "🎯",
                  "creative-refresh": "🎨",
                };
                return (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">{iconMap[rec.type] ?? "💡"}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-zinc-200 mb-1">{rec.headline}</div>
                        <div className="text-sm text-zinc-400 leading-relaxed">{rec.detail}</div>
                        <div className="mt-2 text-xs text-emerald-400 font-medium">
                          Estimated impact: {rec.estimatedImpact}
                        </div>
                      </div>
                      <button className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors">
                        Discuss with Sales
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Renewal CTA */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-200">Ready to renew?</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Talk to your FoodTrove Media account manager about Q3 planning.
                  </div>
                </div>
                <Link href="/admin/rate-card" className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-4 py-2 rounded-lg transition-colors">
                  View Rate Card →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
