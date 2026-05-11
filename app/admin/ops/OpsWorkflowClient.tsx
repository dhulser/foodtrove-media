"use client";

import { useEffect, useState } from "react";

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

interface OpsData {
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byCategory: Record<string, number>;
    liveFlightsChecked: number;
    generatedAt: string;
  };
  items: WorkflowItem[];
}

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  critical: { label: "Critical", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  high:     { label: "High",     bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  medium:   { label: "Medium",   bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-400" },
  low:      { label: "Low",      bg: "bg-stone-50",  text: "text-stone-600",  border: "border-stone-200",  dot: "bg-stone-400" },
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  pacing:      { label: "Pacing",      icon: "⚡", color: "text-violet-600" },
  creative:    { label: "Creative",    icon: "🎨", color: "text-rose-600" },
  budget:      { label: "Budget",      icon: "💰", color: "text-amber-600" },
  approval:    { label: "Approval",    icon: "✅", color: "text-emerald-600" },
  discrepancy: { label: "Discrepancy", icon: "⚠️", color: "text-red-600" },
  flight:      { label: "Flight",      icon: "🛫", color: "text-blue-600" },
};

const TREND_ICONS = { up: "↑", down: "↓", flat: "→" };
const TREND_COLORS = { up: "text-red-500", down: "text-red-500", flat: "text-stone-400" };

export default function OpsWorkflowClient() {
  const [data, setData] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/ops", { cache: "no-store" });
      const json: OpsData = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch {
      // keep stale data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 min refresh
    return () => clearInterval(interval);
  }, []);

  const markComplete = (id: string) => {
    setCompletedItems((prev) => new Set([...prev, id]));
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-stone-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const activeItems = data.items.filter((item) => !completedItems.has(item.id));

  const filteredItems = activeItems.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "critical") return item.priority === "critical";
    if (activeFilter === "high") return item.priority === "critical" || item.priority === "high";
    return item.category === activeFilter;
  });

  const openCritical = activeItems.filter((i) => i.priority === "critical").length;
  const openHigh = activeItems.filter((i) => i.priority === "high").length;
  const openTotal = activeItems.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Ad Ops Workflow</h1>
        <p className="text-sm text-stone-400 mt-1">
          Daily action queue for Casey — pacing, creative approvals, budget runway, discrepancies
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-stone-900">{openTotal}</div>
          <div className="text-xs text-stone-400 mt-0.5">Open items</div>
        </div>
        <div className={`bg-white border rounded-xl p-4 shadow-sm ${openCritical > 0 ? "border-red-200" : "border-stone-200"}`}>
          <div className={`text-2xl font-bold ${openCritical > 0 ? "text-red-600" : "text-stone-300"}`}>{openCritical}</div>
          <div className="text-xs text-stone-400 mt-0.5">Critical</div>
        </div>
        <div className={`bg-white border rounded-xl p-4 shadow-sm ${openHigh > 0 ? "border-orange-200" : "border-stone-200"}`}>
          <div className={`text-2xl font-bold ${openHigh > 0 ? "text-orange-600" : "text-stone-300"}`}>{openHigh}</div>
          <div className="text-xs text-stone-400 mt-0.5">High priority</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">{data.items.length - openTotal}</div>
          <div className="text-xs text-stone-400 mt-0.5">Cleared today</div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "critical", "pacing", "creative", "budget", "discrepancy", "flight"].map((filter) => {
          const isActive = activeFilter === filter;
          let count = 0;
          if (filter === "all") count = openTotal;
          else if (filter === "critical") count = openCritical;
          else count = activeItems.filter((i) => i.category === filter).length;

          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isActive
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-300 hover:text-stone-700"
              }`}
            >
              {filter === "all" ? "All" : filter === "critical" ? "🔴 Critical" : `${CATEGORY_CONFIG[filter]?.icon} ${CATEGORY_CONFIG[filter]?.label}`}
              {count > 0 && (
                <span className={`ml-1.5 ${isActive ? "text-white/70" : "text-stone-400"}`}>({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Workflow items */}
      <div className="space-y-3">
        {filteredItems.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-sm font-medium text-stone-600">All clear in this category</div>
            <div className="text-xs text-stone-400 mt-1">No open items requiring attention</div>
          </div>
        )}

        {filteredItems.map((item) => {
          const p = PRIORITY_CONFIG[item.priority];
          const cat = CATEGORY_CONFIG[item.category];
          return (
            <div
              key={item.id}
              className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${p.border}`}
            >
              <div className="flex items-stretch">
                {/* Priority indicator bar */}
                <div className={`w-1 flex-shrink-0 ${p.dot}`} />

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${p.bg} ${p.text} border ${p.border}`}>
                          {p.label}
                        </span>
                        <span className={`text-xs ${cat.color}`}>{cat.icon} {cat.label}</span>
                        <span className="text-xs text-stone-400">· {item.advertiser}</span>
                        {item.flightId && (
                          <span className="text-xs text-stone-300">· Flight #{item.flightId}</span>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-stone-900 mb-1">{item.title}</div>
                      <div className="text-sm text-stone-500 leading-relaxed mb-3">{item.description}</div>

                      {/* Action */}
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <svg className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="font-medium text-stone-700">Action: </span>
                        <span>{item.action}</span>
                      </div>
                    </div>

                    {/* Right panel */}
                    <div className="flex-shrink-0 text-right space-y-3">
                      {item.metric && (
                        <div>
                          <div className="text-xs text-stone-400">{item.metric.label}</div>
                          <div className={`text-lg font-bold ${item.metric.trend ? TREND_COLORS[item.metric.trend] : "text-stone-900"}`}>
                            {item.metric.value}
                            {item.metric.trend && (
                              <span className="text-sm ml-1">{TREND_ICONS[item.metric.trend]}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {item.dueBy && (
                        <div>
                          <div className="text-xs text-stone-400">Due in</div>
                          <div className="text-sm font-semibold text-stone-700">{item.dueBy}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => markComplete(item.id)}
                      className="text-xs text-stone-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mark handled
                    </button>
                    {item.flightId && (
                      <a
                        href={`https://app.kevel.co`}
                        target="_blank"
                        rel="noopener"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${p.bg} ${p.text} ${p.border} hover:opacity-80`}
                      >
                        {item.actionLabel}
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-400">
        <div>
          {data.summary.liveFlightsChecked > 0
            ? `${data.summary.liveFlightsChecked} live Kevel flights checked`
            : "Simulated workflow data"}
          {" · "}Refreshes every 5 min
        </div>
        <div>Last updated: {lastRefresh.toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
