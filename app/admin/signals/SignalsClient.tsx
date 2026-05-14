"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type TrendDirection = "up" | "flat" | "down";

interface PurchaseSignal {
  id: string;
  ts: string;
  productName: string;
  productId: string;
  departmentSlug: string;
  departmentName: string;
  tags: string[];
  purchaseValue: number;
  shopperId: string;
  sessionKeywords: string[];
  sponsored: boolean;
  sponsoredAdvertiser?: string;
}

interface CategorySignal {
  slug: string;
  name: string;
  sessionCount5min: number;
  sessionCount1h: number;
  sessionCount24h: number;
  purchaseCount1h: number;
  purchaseCount24h: number;
  avgOrderValue: number;
  trendDirection: TrendDirection;
  trendPct: number;
  topSearchTerms: string[];
  activeAdvertisers: string[];
  untargeted: boolean;
  cpmFloor: number;
}

interface TrendingKeyword {
  keyword: string;
  count1h: number;
  count24h: number;
  trendPct: number;
  categories: string[];
  advertiserMatch: string | null;
  opportunityScore: number;
}

interface SignalSummary {
  purchasesLast5min: number;
  purchasesLast1h: number;
  purchasesLast24h: number;
  grossRevenueLast24h: number;
  sponsoredInfluencedLast24h: number;
  sponsoredInfluencePct: number;
  activeShoppers5min: number;
  activeShoppers1h: number;
  topCategoryNow: string;
  topKeywordNow: string;
  untargetedOpportunities: number;
  estimatedOpportunityRevenue: number;
}

interface AdvertiserRecommendation {
  advertiserName: string;
  advertiserId: number;
  recommendation: string;
  rationale: string;
  targetKeywords: string[];
  estimatedImpressionLift: number;
  priority: "high" | "medium" | "low";
}

interface SignalsPayload {
  summary: SignalSummary;
  recentSignals: PurchaseSignal[];
  categorySignals: CategorySignal[];
  trendingKeywords: TrendingKeyword[];
  advertiserRecommendations: AdvertiserRecommendation[];
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt$(n: number) {
  return n >= 1000
    ? `$${(n / 1000).toFixed(1)}K`
    : `$${n.toFixed(2)}`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  return `${Math.floor(diffSec / 60)}m ${diffSec % 60}s ago`;
}

const DEPT_ICONS: Record<string, string> = {
  produce: "🥦",
  dairy: "🥛",
  beverages: "🧃",
  snacks: "🍿",
  bakery: "🍞",
  "meat-seafood": "🐟",
  frozen: "🧊",
  household: "🧹",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-stone-100 text-stone-500 border-stone-200",
};

const TREND_ICON: Record<TrendDirection, string> = {
  up: "↑",
  flat: "→",
  down: "↓",
};

const TREND_COLOR: Record<TrendDirection, string> = {
  up: "text-emerald-600",
  flat: "text-stone-400",
  down: "text-red-500",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${accent ?? "border-stone-200"}`}>
      <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-stone-900">{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function SignalRow({ sig }: { sig: PurchaseSignal }) {
  const icon = DEPT_ICONS[sig.departmentSlug] ?? "🛒";
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-stone-100 last:border-0">
      <span className="text-xl mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-stone-800">{sig.productName}</span>
          {sig.sponsored && (
            <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">
              Sponsored · {sig.sponsoredAdvertiser}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-stone-400">{sig.departmentName}</span>
          <span className="text-stone-300">·</span>
          <span className="text-xs text-stone-400">{sig.shopperId}</span>
          <span className="text-stone-300">·</span>
          <span className="text-xs text-stone-400">{timeAgo(sig.ts)}</span>
        </div>
        {sig.sessionKeywords.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {sig.sessionKeywords.map((kw) => (
              <span key={kw} className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="text-sm font-semibold text-stone-700 whitespace-nowrap">
        {fmt$(sig.purchaseValue)}
      </span>
    </div>
  );
}

function CategoryCard({ cat }: { cat: CategorySignal }) {
  const icon = DEPT_ICONS[cat.slug] ?? "🛒";
  return (
    <div
      className={`bg-white border rounded-xl p-4 shadow-sm ${
        cat.untargeted ? "border-amber-300 bg-amber-50" : "border-stone-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-stone-800 text-sm">{cat.name}</span>
          {cat.untargeted && (
            <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-medium">
              No Advertiser
            </span>
          )}
        </div>
        <span
          className={`text-sm font-bold ${TREND_COLOR[cat.trendDirection]}`}
        >
          {TREND_ICON[cat.trendDirection]}{" "}
          {cat.trendPct > 0 ? "+" : ""}
          {cat.trendPct.toFixed(1)}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <div className="text-lg font-bold text-stone-900">{cat.sessionCount5min}</div>
          <div className="text-xs text-stone-400">sessions/5m</div>
        </div>
        <div>
          <div className="text-lg font-bold text-stone-900">{cat.sessionCount1h}</div>
          <div className="text-xs text-stone-400">sessions/1h</div>
        </div>
        <div>
          <div className="text-lg font-bold text-stone-900">{cat.purchaseCount1h}</div>
          <div className="text-xs text-stone-400">purchases/1h</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
        <span>Avg order: <strong>{fmt$(cat.avgOrderValue)}</strong></span>
        <span>CPM floor: <strong>${cat.cpmFloor.toFixed(2)}</strong></span>
      </div>

      {cat.activeAdvertisers.length > 0 ? (
        <div className="flex gap-1 flex-wrap">
          {cat.activeAdvertisers.map((adv) => (
            <span
              key={adv}
              className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full"
            >
              {adv}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-xs text-amber-700 font-medium">
          ⚡ Opportunity — no active flight targeting this category
        </div>
      )}

      {cat.topSearchTerms.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {cat.topSearchTerms.slice(0, 4).map((t) => (
            <span key={t} className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function KeywordRow({ kw }: { kw: TrendingKeyword }) {
  const barWidth = Math.min(100, (kw.count1h / 50) * 100);
  return (
    <div className="py-2 border-b border-stone-100 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-stone-800">{kw.keyword}</span>
          {kw.advertiserMatch ? (
            <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
              {kw.advertiserMatch}
            </span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
              Unclaimed
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span
            className={`font-medium ${
              kw.trendPct > 0 ? "text-emerald-600" : kw.trendPct < 0 ? "text-red-500" : "text-stone-400"
            }`}
          >
            {kw.trendPct > 0 ? "+" : ""}
            {kw.trendPct.toFixed(1)}% vs yday
          </span>
          <span>{kw.count1h}/hr</span>
          <span
            className={`font-bold ${
              kw.opportunityScore > 70
                ? "text-red-600"
                : kw.opportunityScore > 40
                ? "text-amber-600"
                : "text-stone-400"
            }`}
          >
            {kw.opportunityScore} opp
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            kw.advertiserMatch ? "bg-emerald-400" : "bg-amber-400"
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: AdvertiserRecommendation }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`bg-white border rounded-xl p-4 shadow-sm ${
        rec.priority === "high" ? "border-red-200" : "border-stone-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                PRIORITY_COLORS[rec.priority]
              }`}
            >
              {rec.priority.toUpperCase()}
            </span>
            {rec.advertiserId > 0 && (
              <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                {rec.advertiserName}
              </span>
            )}
            {rec.advertiserId === 0 && (
              <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                New Prospect
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-stone-800">{rec.recommendation}</div>
        </div>
        <div className="text-right whitespace-nowrap">
          <div className="text-lg font-bold text-emerald-700">
            +{rec.estimatedImpressionLift}%
          </div>
          <div className="text-xs text-stone-400">est. impression lift</div>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 text-sm text-stone-600 leading-relaxed bg-stone-50 rounded-lg p-3">
          {rec.rationale}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1 flex-wrap">
          {rec.targetKeywords.map((kw) => (
            <span key={kw} className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
              {kw}
            </span>
          ))}
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          {expanded ? "Less ↑" : "Detail ↓"}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = ["Live Feed", "Categories", "Keywords", "Recommendations"] as const;
type Tab = (typeof TABS)[number];

export default function SignalsClient() {
  const [data, setData] = useState<SignalsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Live Feed");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [tick, setTick] = useState(0); // force re-render for timeAgo

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/signals", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: SignalsPayload = await res.json();
      setData(json);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + 60s auto-refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Tick every 5s to update timeAgo displays
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5_000);
    return () => clearInterval(interval);
  }, []);

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-cyan-600 rounded-xl">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Signal Intelligence</h1>
                <p className="text-sm text-stone-400">
                  Live 1P shopper signals · FoodTrove Network 12024
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastRefresh && (
                <span className="text-xs text-stone-400">
                  Updated {lastRefresh.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              )}
              <button
                onClick={fetchData}
                className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors"
              >
                ↻ Refresh
              </button>
              <a
                href="/admin"
                className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                ← Admin Hub
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-20 text-stone-400">Loading signals…</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
            Error loading signals: {error}
          </div>
        )}

        {!loading && data && s && (
          <>
            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
              <KpiCard
                label="Active Shoppers"
                value={s.activeShoppers5min.toString()}
                sub="right now (5-min window)"
                accent="border-cyan-300"
              />
              <KpiCard
                label="Purchases / 1h"
                value={s.purchasesLast1h.toString()}
                sub={`${s.purchasesLast24h.toLocaleString()} today`}
              />
              <KpiCard
                label="Gross Rev / 24h"
                value={fmt$(s.grossRevenueLast24h)}
                sub="shopper GMV"
              />
              <KpiCard
                label="Sponsored Influence"
                value={`${s.sponsoredInfluencePct}%`}
                sub={`${s.sponsoredInfluencedLast24h} purchases influenced`}
                accent="border-violet-200"
              />
              <KpiCard
                label="Hot Category"
                value={s.topCategoryNow}
                sub="most active now"
                accent="border-emerald-200"
              />
              <KpiCard
                label="Untargeted Opps"
                value={s.untargetedOpportunities.toString()}
                sub={`~${fmt$(s.estimatedOpportunityRevenue)}/day at floor CPM`}
                accent={s.untargetedOpportunities > 0 ? "border-amber-300 bg-amber-50" : "border-stone-200"}
              />
            </div>

            {/* 1P Data Callout */}
            <div className="bg-cyan-950 border border-cyan-700 rounded-xl px-5 py-4 mb-6 flex items-start gap-4">
              <span className="text-2xl mt-0.5">⚡</span>
              <div>
                <div className="text-sm font-semibold text-cyan-200 mb-1">
                  FoodTrove 1P Signal Advantage
                </div>
                <div className="text-sm text-cyan-300/80 leading-relaxed">
                  Every purchase on FoodTrove generates a first-party signal — product, category, session 
                  keywords, and whether a sponsored ad was in the path. This data powers contextual keyword 
                  targeting in Kevel and informs CPM floors by category. No third-party cookies. No inference.
                  Real purchase intent from real shoppers.
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-stone-100 p-1 rounded-xl w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  {tab}
                  {tab === "Recommendations" && data.advertiserRecommendations.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs bg-red-500 text-white rounded-full">
                      {data.advertiserRecommendations.filter((r) => r.priority === "high").length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab: Live Feed */}
            {activeTab === "Live Feed" && (
              <div className="bg-white border border-stone-200 rounded-2xl shadow-sm">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                  <h2 className="font-semibold text-stone-800">
                    Recent Purchase Signals
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-stone-400">Live · refreshes every 60s</span>
                  </div>
                </div>
                <div className="px-6 py-2">
                  {data.recentSignals.map((sig) => (
                    <SignalRow key={sig.id} sig={sig} />
                  ))}
                </div>
                {/* Sponsored influence summary */}
                <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between text-sm">
                  <span className="text-stone-500">
                    {data.recentSignals.filter((s) => s.sponsored).length} of{" "}
                    {data.recentSignals.length} purchases above were sponsored-influenced
                  </span>
                  <Link
                    href="/admin/measurement"
                    className="text-xs text-violet-600 hover:text-violet-700"
                  >
                    Attribution detail →
                  </Link>
                </div>
              </div>
            )}

            {/* Tab: Categories */}
            {activeTab === "Categories" && (
              <div>
                {data.categorySignals.some((c) => c.untargeted) && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-3 mb-4 flex items-center gap-3">
                    <span className="text-lg">⚠️</span>
                    <div className="text-sm text-amber-800">
                      <strong>{data.categorySignals.filter((c) => c.untargeted).length} categories</strong>{" "}
                      have active shopper sessions but no advertiser targeting them.
                      Estimated daily opportunity:{" "}
                      <strong>{fmt$(s.estimatedOpportunityRevenue)}</strong> at CPM floor.
                      Tyler&apos;s next prospect call should lead with this.
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data.categorySignals.map((cat) => (
                    <CategoryCard key={cat.slug} cat={cat} />
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Keywords */}
            {activeTab === "Keywords" && (
              <div className="bg-white border border-stone-200 rounded-2xl shadow-sm">
                <div className="px-6 py-4 border-b border-stone-100">
                  <h2 className="font-semibold text-stone-800 mb-1">Trending Search Keywords</h2>
                  <p className="text-sm text-stone-400">
                    Ranked by searches/hour. <span className="text-amber-600 font-medium">Amber = unclaimed</span> —
                    no advertiser currently targets this keyword.{" "}
                    <span className="text-emerald-600 font-medium">Green = active flight</span>. Opp score = demand × gap.
                  </p>
                </div>
                <div className="px-6 py-2">
                  {data.trendingKeywords.map((kw) => (
                    <KeywordRow key={kw.keyword} kw={kw} />
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-stone-100">
                  <Link
                    href="/admin/trafficking"
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    Add keyword to flight → Trafficking Console
                  </Link>
                </div>
              </div>
            )}

            {/* Tab: Recommendations */}
            {activeTab === "Recommendations" && (
              <div>
                <div className="mb-4 text-sm text-stone-500">
                  Targeting recommendations based on live signal gaps — categories with high shopper
                  activity and no active advertiser, plus keyword expansion opportunities for existing
                  flights. Generated from FoodTrove 1P data only.
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {data.advertiserRecommendations.map((rec, i) => (
                    <RecommendationCard key={i} rec={rec} />
                  ))}
                </div>
                {data.advertiserRecommendations.length === 0 && (
                  <div className="text-center py-12 text-stone-400">
                    No recommendations at this time. All categories are targeted.
                  </div>
                )}
                <div className="mt-6 flex gap-4">
                  <Link
                    href="/admin/forecast"
                    className="text-sm text-stone-500 hover:text-stone-700 underline"
                  >
                    → Run reach forecast for new keywords
                  </Link>
                  <Link
                    href="/admin/deal-desk"
                    className="text-sm text-stone-500 hover:text-stone-700 underline"
                  >
                    → Open Deal Desk to create IO
                  </Link>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-xs text-stone-400 text-center">
              Signals based on FoodTrove 1P purchase data · Network 12024 ·{" "}
              Generated {new Date(data.generatedAt).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
