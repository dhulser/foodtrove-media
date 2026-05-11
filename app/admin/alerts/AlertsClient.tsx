/**
 * /admin/alerts — Flight Ops Alert Center
 *
 * Real-time alert feed for Casey (Ad Ops) and Kai (Engineering):
 *   - CRITICAL: fill drops, severe under-pacing
 *   - WARNING: over-pacing, keyword gaps, creative underperformance, budget runway
 *   - INFO: system events, propagation status, experiment readiness
 *
 * 5-minute refresh cadence. Links to relevant admin tools for remediation.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AlertSeverity = "critical" | "warning" | "info";
type AlertStatus = "open" | "acknowledged" | "resolved";

interface Alert {
  id: string;
  severity: AlertSeverity;
  category: string;
  title: string;
  detail: string;
  advertiser?: string;
  flight?: string;
  flightId?: number;
  format?: string;
  metric?: string;
  action?: string;
  raisedAt: string;
  acknowledgedAt?: string;
  status: AlertStatus;
}

interface AlertsData {
  alerts: Alert[];
  summary: {
    critical: number;
    warning: number;
    info: number;
    acknowledged: number;
    resolved: number;
  };
  generatedAt: string;
  networkId: number;
}

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { bg: string; border: string; badge: string; dot: string; label: string }
> = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    label: "CRITICAL",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    label: "WARNING",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-400",
    label: "INFO",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  pacing: "Pacing",
  "fill-rate": "Fill Rate",
  creative: "Creative",
  budget: "Budget",
  auction: "Auction",
  system: "System",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function AlertCard({ alert }: { alert: Alert }) {
  const cfg = SEVERITY_CONFIG[alert.severity];
  const isResolved = alert.status === "resolved";
  const isAcknowledged = alert.status === "acknowledged";

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        isResolved
          ? "bg-stone-50 border-stone-200 opacity-60"
          : isAcknowledged
          ? "bg-white border-stone-200"
          : `${cfg.bg} ${cfg.border}`
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              isResolved ? "bg-stone-300" : isAcknowledged ? "bg-stone-400" : cfg.dot
            }`}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                  isResolved
                    ? "bg-stone-100 text-stone-400"
                    : isAcknowledged
                    ? "bg-stone-100 text-stone-500"
                    : cfg.badge
                }`}
              >
                {isResolved ? "RESOLVED" : isAcknowledged ? "ACK'D" : cfg.label}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-stone-100 text-stone-500 text-[10px] font-medium">
                {CATEGORY_LABELS[alert.category] ?? alert.category}
              </span>
              {alert.advertiser && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-600 text-[10px] font-medium">
                  {alert.advertiser}
                </span>
              )}
              {alert.format && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-500 text-[10px]">
                  {alert.format}
                </span>
              )}
            </div>
            <p className={`text-sm font-semibold ${isResolved ? "text-stone-400" : "text-stone-900"}`}>
              {alert.title}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-stone-400">{timeAgo(alert.raisedAt)}</p>
          {alert.acknowledgedAt && (
            <p className="text-[10px] text-stone-400 mt-0.5">
              ack {timeAgo(alert.acknowledgedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Detail */}
      <p className={`text-xs leading-relaxed ml-5 mb-3 ${isResolved ? "text-stone-400" : "text-stone-600"}`}>
        {alert.detail}
      </p>

      {/* Metric + action row */}
      <div className="ml-5 flex flex-wrap gap-4 items-start">
        {alert.metric && (
          <div className="flex items-center gap-1.5">
            <svg className="h-3 w-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-mono text-stone-500">{alert.metric}</span>
          </div>
        )}
        {alert.action && !isResolved && (
          <div className="flex items-start gap-1.5 max-w-lg">
            <svg className="h-3 w-3 text-stone-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-stone-500 italic">{alert.action}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlertsClient() {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | AlertSeverity | "resolved">("all");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  async function fetchAlerts() {
    try {
      const res = await fetch("/api/admin/alerts", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefreshed(new Date());
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // 5-min refresh
    return () => clearInterval(interval);
  }, []);

  const filtered = data?.alerts.filter((a) => {
    if (activeFilter === "all") return a.status !== "resolved";
    if (activeFilter === "resolved") return a.status === "resolved";
    return a.severity === activeFilter && a.status !== "resolved";
  }) ?? [];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-stone-400 hover:text-stone-600 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-lg">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-stone-900">Flight Ops Alerts</h1>
                <p className="text-xs text-stone-400">FoodTrove Media · Ad Operations · Kevel Network 12024</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastRefreshed && (
                <span className="text-xs text-stone-400">
                  Updated {timeAgo(lastRefreshed.toISOString())}
                </span>
              )}
              <button
                onClick={() => { setLoading(true); fetchAlerts(); }}
                className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-all bg-white shadow-sm"
              >
                Refresh ↺
              </button>
              <Link href="/admin/pacing" className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-all bg-white shadow-sm">
                Pacing ↗
              </Link>
              <Link href="/admin/campaigns" className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-all bg-white shadow-sm">
                Campaigns ↗
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center h-64 text-sm text-stone-400">
            Loading alerts…
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
            Failed to load alerts: {error}
          </div>
        )}
        {data && (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{data.summary.critical}</p>
                <p className="text-xs text-red-500 font-medium mt-1">Critical</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{data.summary.warning}</p>
                <p className="text-xs text-amber-500 font-medium mt-1">Warning</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{data.summary.info}</p>
                <p className="text-xs text-blue-500 font-medium mt-1">Info</p>
              </div>
              <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-stone-500">{data.summary.acknowledged}</p>
                <p className="text-xs text-stone-400 font-medium mt-1">Acknowledged</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{data.summary.resolved}</p>
                <p className="text-xs text-emerald-500 font-medium mt-1">Resolved</p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {(["all", "critical", "warning", "info", "resolved"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeFilter === f
                      ? "bg-stone-800 text-white shadow-sm"
                      : "bg-white border border-stone-200 text-stone-500 hover:border-stone-300"
                  }`}
                >
                  {f === "all"
                    ? `All Open (${data.summary.critical + data.summary.warning + data.summary.info + data.summary.acknowledged})`
                    : f === "resolved"
                    ? `Resolved (${data.summary.resolved})`
                    : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Alert list */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
                  <svg className="h-8 w-8 text-emerald-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-stone-600">No alerts in this view</p>
                  <p className="text-xs text-stone-400 mt-1">All operations nominal for the selected filter.</p>
                </div>
              ) : (
                filtered.map((alert) => <AlertCard key={alert.id} alert={alert} />)
              )}
            </div>

            {/* Footer */}
            <p className="text-xs text-stone-400 text-center mt-8">
              Network 12024 · Generated {new Date(data.generatedAt).toLocaleTimeString()} · 5-min refresh · Alerts rotate on 5-min cadence for demo
            </p>
          </>
        )}
      </div>
    </div>
  );
}
