"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface EnvVar {
  set: boolean;
  value: string | null;
}

interface NetworkConfig {
  networkId: number | null;
  siteId: number | null;
  channelId: number;
  channelName: string;
  defaultAdTypeId: number;
  managementApiHost: string;
  decisionApiHost: string | null;
}

interface ApiStatus {
  ok: boolean;
  latencyMs: number | null;
  error: string | null;
  candidatesFound?: number | null;
}

interface AdDensityRule {
  page: string;
  label: string;
  billboards: number;
  leaderboards: number;
  mrecs: number;
  notes: string;
}

interface KeywordRoute {
  keyword: string;
  flights: string[];
  purpose: string;
}

interface Advertiser {
  name: string;
  advertiserId: number;
  campaignId: number;
  formats: string[];
  cpm: { billboard: number | null; leaderboard: number | null; mrec: number | null };
  contextualKeywords: string[];
  status: string;
  note?: string;
}

interface AuditEntry {
  date: string;
  event: string;
}

interface SettingsData {
  generatedAt: string;
  networkConfig: NetworkConfig;
  envStatus: Record<string, EnvVar>;
  allEnvSet: boolean;
  kevelApiStatus: ApiStatus;
  decisionApiStatus: ApiStatus;
  adDensityRules: AdDensityRule[];
  keywordRouting: KeywordRoute[];
  advertisers: Advertiser[];
  auditLog: AuditEntry[];
}

type Tab = "network" | "density" | "targeting" | "advertisers" | "audit";

export default function SettingsClient() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("network");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-stone-400 text-sm">Loading network configuration…</div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-red-500 text-sm">Failed to load: {error}</div>
    </div>
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "network", label: "Network & API" },
    { id: "density", label: "Ad Density" },
    { id: "targeting", label: "Keyword Routing" },
    { id: "advertisers", label: "Advertisers" },
    { id: "audit", label: "Audit Log" },
  ];

  const statusDot = (ok: boolean) => (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-stone-400 hover:text-stone-600 transition-colors">
              ← Admin
            </Link>
            <span className="text-stone-300">/</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Network Settings</h1>
                <p className="text-sm text-stone-400">Kevel config · ad density rules · keyword routing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 pb-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === t.id
                    ? "border-slate-600 text-slate-900"
                    : "border-transparent text-stone-400 hover:text-stone-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Network & API Tab ── */}
        {activeTab === "network" && (
          <div className="space-y-6">
            {/* Overall health */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${data.allEnvSet ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              {statusDot(data.allEnvSet)}
              <span className={`text-sm font-medium ${data.allEnvSet ? "text-emerald-700" : "text-red-700"}`}>
                {data.allEnvSet ? "All environment variables set — platform fully operational" : "Missing environment variables — ads may not fill"}
              </span>
              <span className="text-xs text-stone-400 ml-auto">Generated {new Date(data.generatedAt).toLocaleTimeString()}</span>
            </div>

            {/* Environment variables */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100">
                <h2 className="text-sm font-semibold text-stone-900">Environment Variables</h2>
              </div>
              <div className="divide-y divide-stone-50">
                {Object.entries(data.envStatus).map(([key, val]) => (
                  <div key={key} className="px-6 py-3 flex items-center gap-4">
                    {statusDot(val.set)}
                    <code className="text-sm font-mono text-stone-700 flex-1">{key}</code>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${val.set ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {val.set ? "set" : "missing"}
                    </span>
                    {val.value && <code className="text-xs font-mono text-stone-400">{val.value}</code>}
                  </div>
                ))}
              </div>
            </div>

            {/* API status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  {statusDot(data.kevelApiStatus.ok)}
                  <h2 className="text-sm font-semibold text-stone-900">Kevel Management API</h2>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Host</span>
                    <code className="text-xs text-stone-600">api.kevel.co/v1</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Status</span>
                    <span className={data.kevelApiStatus.ok ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                      {data.kevelApiStatus.ok ? "Reachable" : "Error"}
                    </span>
                  </div>
                  {data.kevelApiStatus.latencyMs != null && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Latency</span>
                      <span className={`font-medium ${data.kevelApiStatus.latencyMs < 200 ? "text-emerald-600" : "text-amber-600"}`}>
                        {data.kevelApiStatus.latencyMs}ms
                      </span>
                    </div>
                  )}
                  {data.kevelApiStatus.error && (
                    <div className="mt-2 text-xs text-red-500 bg-red-50 rounded p-2">{data.kevelApiStatus.error}</div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  {statusDot(data.decisionApiStatus.ok)}
                  <h2 className="text-sm font-semibold text-stone-900">Kevel Decision API</h2>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Host</span>
                    <code className="text-xs text-stone-600">e-12024.adzerk.net/api/v2</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Status</span>
                    <span className={data.decisionApiStatus.ok ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                      {data.decisionApiStatus.ok ? "Serving" : "Error"}
                    </span>
                  </div>
                  {data.decisionApiStatus.latencyMs != null && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Latency</span>
                      <span className={`font-medium ${data.decisionApiStatus.latencyMs < 200 ? "text-emerald-600" : "text-amber-600"}`}>
                        {data.decisionApiStatus.latencyMs}ms
                      </span>
                    </div>
                  )}
                  {data.decisionApiStatus.candidatesFound != null && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Candidates (probe)</span>
                      <span className={`font-medium ${data.decisionApiStatus.candidatesFound > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                        {data.decisionApiStatus.candidatesFound}
                      </span>
                    </div>
                  )}
                  {data.decisionApiStatus.error && (
                    <div className="mt-2 text-xs text-red-500 bg-red-50 rounded p-2">{data.decisionApiStatus.error}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Network config */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100">
                <h2 className="text-sm font-semibold text-stone-900">Kevel Network Configuration</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-x divide-stone-100">
                {[
                  { label: "Network ID", value: data.networkConfig.networkId?.toString() ?? "—" },
                  { label: "Site ID", value: data.networkConfig.siteId?.toString() ?? "—" },
                  { label: "Channel ID", value: `${data.networkConfig.channelId} (${data.networkConfig.channelName})` },
                  { label: "Default Ad Type", value: `AdType ${data.networkConfig.defaultAdTypeId}` },
                  { label: "Management API", value: "api.kevel.co/v1" },
                  { label: "Decision API", value: data.networkConfig.decisionApiHost?.replace("https://", "") ?? "—" },
                ].map((item) => (
                  <div key={item.label} className="px-6 py-4 border-b border-stone-50">
                    <div className="text-xs text-stone-400 mb-1">{item.label}</div>
                    <code className="text-sm font-mono text-stone-800">{item.value}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Ad Density Tab ── */}
        {activeTab === "density" && (
          <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              <strong>Ad density policy (set 2026-05-06):</strong> Max 2 ad placements on utility/transactional pages (checkout, account, order status).
              High-attention pages (homepage, department, product detail) support full inventory. No ads on checkout flow.
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100">
                <h2 className="text-sm font-semibold text-stone-900">Per-Page Ad Limits</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="text-left px-6 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">Page</th>
                      <th className="text-center px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">Billboard</th>
                      <th className="text-center px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">Leaderboard</th>
                      <th className="text-center px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">MRec</th>
                      <th className="text-left px-6 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">Total</th>
                      <th className="text-left px-6 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {data.adDensityRules.map((rule) => {
                      const total = rule.billboards + rule.leaderboards + rule.mrecs;
                      return (
                        <tr key={rule.page} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-3">
                            <div className="font-medium text-stone-900">{rule.label}</div>
                            <code className="text-xs text-stone-400">{rule.page}</code>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${rule.billboards > 0 ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400"}`}>
                              {rule.billboards}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${rule.leaderboards > 0 ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400"}`}>
                              {rule.leaderboards}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${rule.mrecs > 0 ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400"}`}>
                              {rule.mrecs}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`text-sm font-semibold ${total === 0 ? "text-stone-300" : total <= 2 ? "text-amber-600" : "text-stone-700"}`}>
                              {total === 0 ? "—" : total}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-xs text-stone-400 max-w-xs">{rule.notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Keyword Routing Tab ── */}
        {activeTab === "targeting" && (
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              Kevel keyword matching is <strong>OR-based at the flight level</strong>. Format-routing keywords (<code>ft-billboard</code>, <code>ft-leaderboard</code>, <code>ft-mrec</code>) are
              merged with contextual signals before each Decision API call. Higher-CPM contextual flights win when their keyword matches.
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100">
                <h2 className="text-sm font-semibold text-stone-900">Keyword → Flight Routing Map</h2>
              </div>
              <div className="divide-y divide-stone-50">
                {data.keywordRouting.map((route) => (
                  <div key={route.keyword} className="px-6 py-4 flex items-start gap-4">
                    <code className="text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 whitespace-nowrap min-w-[160px]">
                      {route.keyword}
                    </code>
                    <div className="flex-1">
                      <div className="text-xs text-stone-400 mb-1">{route.purpose}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {route.flights.map((f) => (
                          <span key={f} className="inline-block px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs">{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Advertisers Tab ── */}
        {activeTab === "advertisers" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {data.advertisers.map((adv) => (
                <div key={adv.advertiserId} className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-stone-900">{adv.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${adv.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                      {adv.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Advertiser ID</span>
                      <code className="text-stone-600">{adv.advertiserId}</code>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Campaign ID</span>
                      <code className="text-stone-600">{adv.campaignId}</code>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">CPM by Format</div>
                    <div className="space-y-1">
                      {[
                        { f: "Billboard", v: adv.cpm.billboard },
                        { f: "Leaderboard", v: adv.cpm.leaderboard },
                        { f: "MRec", v: adv.cpm.mrec },
                      ].map(({ f, v }) => (
                        <div key={f} className="flex justify-between text-xs">
                          <span className="text-stone-500">{f}</span>
                          {v != null ? (
                            <span className="font-semibold text-stone-700">${v.toFixed(2)}</span>
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Contextual Keywords</div>
                    <div className="flex flex-wrap gap-1">
                      {adv.contextualKeywords.map((kw) => (
                        <code key={kw} className="text-xs bg-stone-50 border border-stone-200 text-stone-600 px-1.5 py-0.5 rounded">{kw}</code>
                      ))}
                    </div>
                  </div>

                  {adv.note && (
                    <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded p-2">{adv.note}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Audit Log Tab ── */}
        {activeTab === "audit" && (
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-stone-900">Configuration Audit Log</h2>
            </div>
            <div className="divide-y divide-stone-50">
              {[...data.auditLog].reverse().map((entry, i) => (
                <div key={i} className="px-6 py-4 flex items-start gap-4">
                  <span className="text-xs font-mono text-stone-400 whitespace-nowrap pt-0.5">{entry.date}</span>
                  <span className="text-sm text-stone-700">{entry.event}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
