"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FormatData {
  id: string;
  name: string;
  dimensions: string;
  placement: string;
  placements: string[];
  floorCpm: number;
  avgCpm: number;
  premiumCpm: number;
  monthlyImpressions: number;
  viewability: number;
  clickRate: number;
  contextualLift: number;
  minSpend: number;
  pricingModel?: string;
  monthlyRate?: number;
  specs: {
    maxFileSize: string;
    formats: string[];
    animation: string;
    safeZone: string;
  };
  tag?: string;
}

interface PackageData {
  id: string;
  name: string;
  description: string;
  includes: string[];
  impressions: number;
  duration: string;
  listPrice: number;
  packageCpm: number;
  discount: number;
  minBudget: number;
  targetPersona: string;
  tag: string;
}

interface AudienceData {
  monthlyUniqueShoppers: number;
  monthlyPageviews: number;
  avgSessionDuration: number;
  avgItemsPerCart: number;
  groceryAffinityScore: number;
  topCategories: Array<{ name: string; share: number; avgBasket: number }>;
  purchaseFrequency: string;
  organicBuyerShare: number;
  premiumTierShare: number;
  deviceSplit: { mobile: number; desktop: number; tablet: number };
}

interface RateCardData {
  networkId: string;
  generatedAt: string;
  audience: AudienceData;
  formats: FormatData[];
  packages: PackageData[];
  adPolicies: Record<string, string>;
  contactInfo: Record<string, string>;
}

function fmt(n: number): string {
  return n >= 1000000
    ? `${(n / 1000000).toFixed(1)}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(0)}K`
    : `${n}`;
}

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString()}`;
}

const FORMAT_COLORS: Record<string, string> = {
  billboard: "emerald",
  leaderboard: "blue",
  mrec: "violet",
  "sponsored-search": "amber",
  "brand-page": "rose",
};

const PACKAGE_TAG_COLORS: Record<string, string> = {
  Bestseller: "bg-emerald-100 text-emerald-700",
  Recommended: "bg-blue-100 text-blue-700",
  "Best Value": "bg-violet-100 text-violet-700",
  Seasonal: "bg-amber-100 text-amber-700",
};

export default function RateCardClient() {
  const [data, setData] = useState<RateCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"formats" | "packages" | "audience" | "policies">("formats");
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/rate-card")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Loading rate card…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-red-500">Failed to load rate card data</p>
      </div>
    );
  }

  const { audience, formats, packages, adPolicies, contactInfo } = data;
  const totalMonthlyImpressions = formats
    .filter((f) => f.id !== "brand-page")
    .reduce((sum, f) => sum + f.monthlyImpressions, 0);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-stone-400 hover:text-stone-600 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Media Kit & Rate Card</h1>
                <p className="text-sm text-stone-400">FoodTrove Media · Network 12024 · Updated {new Date(data.generatedAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400">For sales use · Tyler Brooks</span>
              <a
                href="/admin/rate-card/print"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={(e) => { e.preventDefault(); window.print(); }}
              >
                Export PDF
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Network Summary KPI Bar */}
      <div className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            <div>
              <div className="text-2xl font-bold">{fmt(audience.monthlyUniqueShoppers)}</div>
              <div className="text-xs text-indigo-200 mt-0.5">Monthly shoppers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{fmt(totalMonthlyImpressions)}</div>
              <div className="text-xs text-indigo-200 mt-0.5">Monthly impressions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{audience.groceryAffinityScore}%</div>
              <div className="text-xs text-indigo-200 mt-0.5">Grocery affinity</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{audience.purchaseFrequency}</div>
              <div className="text-xs text-indigo-200 mt-0.5">Purchase frequency</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{audience.organicBuyerShare}%</div>
              <div className="text-xs text-indigo-200 mt-0.5">Organic buyers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{audience.premiumTierShare}%</div>
              <div className="text-xs text-indigo-200 mt-0.5">Premium tier shoppers</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Nav */}
        <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1 mb-8 w-fit shadow-sm">
          {(["formats", "packages", "audience", "policies"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab === "formats" ? "Ad Formats" : tab === "packages" ? "Packages" : tab === "audience" ? "Audience" : "Policies"}
            </button>
          ))}
        </div>

        {/* Formats Tab */}
        {activeTab === "formats" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest">Ad Formats</h2>
              <span className="text-xs text-stone-400">{formats.length} formats · All CPMs in USD</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {formats.map((format) => {
                const color = FORMAT_COLORS[format.id] || "stone";
                const isSelected = selectedFormat === format.id;
                return (
                  <div
                    key={format.id}
                    className={`bg-white border rounded-2xl shadow-sm transition-all cursor-pointer ${
                      isSelected ? `border-${color}-400 ring-2 ring-${color}-100` : "border-stone-200 hover:border-stone-300"
                    }`}
                    onClick={() => setSelectedFormat(isSelected ? null : format.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}>
                            <svg className={`h-5 w-5 text-${color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-stone-900">{format.name}</div>
                            <div className="text-xs text-stone-400">{format.dimensions} · {format.placement}</div>
                          </div>
                        </div>
                        {format.pricingModel === "flat_monthly" ? (
                          <div className="text-right">
                            <div className="text-lg font-bold text-stone-900">{fmtCurrency(format.monthlyRate || 0)}</div>
                            <div className="text-xs text-stone-400">/ month flat</div>
                          </div>
                        ) : (
                          <div className="text-right">
                            <div className="text-lg font-bold text-stone-900">${format.avgCpm.toFixed(2)}</div>
                            <div className="text-xs text-stone-400">avg CPM · floor ${format.floorCpm.toFixed(0)}</div>
                          </div>
                        )}
                      </div>

                      {/* Metrics row */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-stone-50 rounded-lg p-3 text-center">
                          <div className="text-base font-semibold text-stone-900">{fmt(format.monthlyImpressions)}</div>
                          <div className="text-xs text-stone-400 mt-0.5">Monthly impr.</div>
                        </div>
                        <div className="bg-stone-50 rounded-lg p-3 text-center">
                          <div className="text-base font-semibold text-stone-900">{format.viewability}%</div>
                          <div className="text-xs text-stone-400 mt-0.5">Viewability</div>
                        </div>
                        <div className="bg-stone-50 rounded-lg p-3 text-center">
                          <div className="text-base font-semibold text-stone-900">{format.clickRate.toFixed(2)}%</div>
                          <div className="text-xs text-stone-400 mt-0.5">Avg CTR</div>
                        </div>
                      </div>

                      {/* CPM range bar (only for display formats) */}
                      {format.pricingModel !== "flat_monthly" && format.floorCpm > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                            <span>Floor ${format.floorCpm.toFixed(0)}</span>
                            <span>Premium ${format.premiumCpm.toFixed(2)}</span>
                          </div>
                          <div className="relative h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className={`absolute left-0 top-0 h-full bg-${color}-200 rounded-full`}
                              style={{ width: "100%" }}
                            />
                            <div
                              className={`absolute top-0 h-full bg-${color}-500 rounded-full`}
                              style={{
                                left: `${((format.avgCpm - format.floorCpm) / (format.premiumCpm - format.floorCpm)) * 50}%`,
                                width: "8px",
                                marginLeft: "-4px",
                              }}
                            />
                          </div>
                          <div className="text-xs text-stone-500 mt-1">
                            Contextual targeting lifts CPM +{format.contextualLift}% avg
                          </div>
                        </div>
                      )}

                      {/* Expanded specs */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-stone-100">
                          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Creative Specs</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-stone-400">Max file size:</span> <span className="text-stone-700">{format.specs.maxFileSize}</span></div>
                            <div><span className="text-stone-400">Safe zone:</span> <span className="text-stone-700">{format.specs.safeZone}</span></div>
                            <div><span className="text-stone-400">Animation:</span> <span className="text-stone-700">{format.specs.animation}</span></div>
                            <div><span className="text-stone-400">Min spend:</span> <span className="text-stone-700">${format.minSpend.toLocaleString()}</span></div>
                          </div>
                          <div className="mt-2">
                            <span className="text-stone-400 text-sm">Accepted formats:</span>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {format.specs.formats.map((f) => (
                                <span key={f} className="px-2 py-0.5 bg-stone-100 rounded text-xs text-stone-600">{f}</span>
                              ))}
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-stone-400 text-sm">Placement IDs:</span>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {format.placements.map((p) => (
                                <span key={p} className={`px-2 py-0.5 bg-${color}-50 rounded text-xs text-${color}-700 font-mono`}>{p}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className={`mt-3 text-xs font-medium text-${color}-600`}>
                        {isSelected ? "Click to collapse specs ↑" : "Click for specs + placement IDs ↓"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === "packages" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest">Media Packages</h2>
              <span className="text-xs text-stone-400">Pre-built packages · Negotiable</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {packages.map((pkg) => (
                <div key={pkg.id} className="bg-white border border-stone-200 rounded-2xl shadow-sm hover:shadow-md transition-all p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-semibold text-stone-900">{pkg.name}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PACKAGE_TAG_COLORS[pkg.tag] || "bg-stone-100 text-stone-600"}`}>
                          {pkg.tag}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed">{pkg.description}</p>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-end gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-stone-900">{fmtCurrency(pkg.minBudget)}</div>
                      <div className="text-xs text-stone-400">min budget · {pkg.duration}</div>
                    </div>
                    <div className="text-right ml-auto">
                      <div className="text-sm font-medium text-stone-700">${pkg.packageCpm.toFixed(2)} package CPM</div>
                      <div className="text-xs text-emerald-600 font-medium">{pkg.discount}% off list</div>
                    </div>
                  </div>

                  {/* What's included */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {pkg.includes.map((fid) => {
                      const fmt = formats.find((f) => f.id === fid);
                      const color = FORMAT_COLORS[fid] || "stone";
                      return (
                        <span key={fid} className={`px-2 py-0.5 bg-${color}-50 rounded text-xs text-${color}-700 font-medium`}>
                          {fmt?.name || fid}
                        </span>
                      );
                    })}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-stone-50 rounded-lg p-3">
                      <div className="text-sm font-semibold text-stone-900">{fmt(pkg.impressions)}</div>
                      <div className="text-xs text-stone-400">Guaranteed impressions</div>
                    </div>
                    <div className="bg-stone-50 rounded-lg p-3">
                      <div className="text-sm font-semibold text-stone-900 leading-tight">{pkg.targetPersona}</div>
                      <div className="text-xs text-stone-400">Best for</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-400">
                    List price: {fmtCurrency(pkg.listPrice)} · Contact {contactInfo.salesLead}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audience Tab */}
        {activeTab === "audience" && (
          <div className="space-y-5">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest">Audience Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Core stats */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm md:col-span-2">
                <h3 className="text-sm font-semibold text-stone-700 mb-4">Network Reach</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Monthly Shoppers", value: fmt(audience.monthlyUniqueShoppers), sub: "Unique visitors" },
                    { label: "Monthly Pageviews", value: fmt(audience.monthlyPageviews), sub: "Across all pages" },
                    { label: "Session Duration", value: `${audience.avgSessionDuration}m`, sub: "Avg time on site" },
                    { label: "Items per Cart", value: audience.avgItemsPerCart.toFixed(1), sub: "Avg cart size" },
                    { label: "Purchase Freq.", value: audience.purchaseFrequency, sub: "Average per shopper" },
                    { label: "Grocery Affinity", value: `${audience.groceryAffinityScore}%`, sub: "Expressed interest" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-stone-50 rounded-xl p-4">
                      <div className="text-xl font-bold text-stone-900">{stat.value}</div>
                      <div className="text-xs font-medium text-stone-600 mt-0.5">{stat.label}</div>
                      <div className="text-xs text-stone-400">{stat.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device split */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-stone-700 mb-4">Device Split</h3>
                <div className="space-y-3">
                  {[
                    { device: "Mobile", pct: audience.deviceSplit.mobile, color: "emerald" },
                    { device: "Desktop", pct: audience.deviceSplit.desktop, color: "blue" },
                    { device: "Tablet", pct: audience.deviceSplit.tablet, color: "violet" },
                  ].map(({ device, pct, color }) => (
                    <div key={device}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-stone-600">{device}</span>
                        <span className="font-semibold text-stone-900">{pct}%</span>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-${color}-500 rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-stone-100">
                  <div className="text-xs text-stone-400 mb-2">Audience quality</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">Organic buyers</span>
                      <span className="font-semibold text-emerald-700">{audience.organicBuyerShare}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">Premium tier</span>
                      <span className="font-semibold text-blue-700">{audience.premiumTierShare}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-700 mb-4">Top Purchase Categories</h3>
              <div className="space-y-3">
                {audience.topCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-4">
                    <div className="w-40 text-sm text-stone-600 truncate">{cat.name}</div>
                    <div className="flex-1">
                      <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${cat.share * 2.5}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-stone-900 w-10 text-right">{cat.share}%</div>
                    <div className="text-xs text-stone-400 w-24 text-right">avg basket ${cat.avgBasket.toFixed(0)}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-4">
                Category share based on shopper purchase history · avg basket = avg order value when category is in cart
              </p>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === "policies" && (
          <div className="space-y-5">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest">Ad Policies & Contacts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-stone-700 mb-4">Advertising Policies</h3>
                <div className="space-y-3">
                  {Object.entries(adPolicies).map(([key, value]) => (
                    <div key={key} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-stone-700 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                        <div className="text-sm text-stone-500">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-stone-700 mb-4">Contacts</h3>
                <div className="space-y-3">
                  {Object.entries(contactInfo).map(([key, value]) => (
                    <div key={key} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-stone-700 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                        <div className="text-sm text-stone-500 break-all">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 bg-indigo-50 rounded-xl">
                  <p className="text-xs text-indigo-700">
                    <strong>For advertisers:</strong> Contact your sales rep to initiate a new campaign.
                    Creative review takes 5 business days. All buys require signed IO.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
