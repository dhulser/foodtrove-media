"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface InvoiceLineItem {
  flightId: number;
  flightName: string;
  format: string;
  startDate: string;
  endDate: string;
  bookedImpressions: number;
  deliveredImpressions: number;
  deliveryPct: number;
  cpm: number;
  grossRevenue: number;
  makeGoodCredit: number;
  earlyFinishCredit: number;
  netRevenue: number;
  status: string;
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
  status: string;
  // Audit trail
  draftedAt: string;
  finalizedAt: string | null;
  sentAt: string | null;
  paidAt: string | null;
  // Notes
  notes: string;
  // Make-good gate
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

interface BillingData {
  summary: BillingSummary;
  invoices: AdvertiserInvoice[];
  liveCPMFromKevel: { flightId: number; cpm: number } | null;
  generatedAt: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtImpressions(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
}

function fmtTs(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZoneName: "short",
  });
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    paid: "bg-emerald-900/60 text-emerald-300 border border-emerald-700",
    sent: "bg-blue-900/60 text-blue-300 border border-blue-700",
    draft: "bg-zinc-700 text-zinc-300 border border-zinc-600",
    pending: "bg-amber-900/60 text-amber-300 border border-amber-700",
  };
  return styles[status] ?? styles.draft;
}

function deliveryColor(pct: number) {
  if (pct >= 95) return "text-emerald-400";
  if (pct >= 80) return "text-amber-400";
  return "text-red-400";
}

export default function BillingClient({ initialData }: { initialData: BillingData | null }) {
  const [data, setData] = useState<BillingData | null>(initialData);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Notes state — keyed by advertiserId (client-side only for demo)
  const [notesState, setNotesState] = useState<Record<string, string>>({});
  // Make-good review confirmed — keyed by advertiserId
  const [makeGoodConfirmed, setMakeGoodConfirmed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!initialData) {
      setLoading(true);
      fetch("/api/admin/billing")
        .then((r) => r.json())
        .then((d) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [initialData]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Loading billing data…</div>
      </div>
    );
  }

  const { summary, invoices } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 text-sm">← Admin</Link>
          <span className="text-zinc-700">/</span>
          <h1 className="text-lg font-semibold text-zinc-100">Billing & Invoicing</h1>
          <span className="ml-2 text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{summary.period}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {data.liveCPMFromKevel && (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              Live Kevel CPM: ${data.liveCPMFromKevel.cpm.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Gross Revenue", value: fmt(summary.totalGrossRevenue), sub: `${summary.invoiceCount} invoices`, color: "text-zinc-100" },
            { label: "Make-Good Credits", value: fmt(summary.totalCredits), sub: `${summary.underDeliveryAlerts} under-delivery flights`, color: "text-amber-400" },
            { label: "Net Revenue", value: fmt(summary.totalNetRevenue), sub: "after credits", color: "text-emerald-400" },
            { label: "Avg Delivery", value: `${summary.avgDeliveryPct}%`, sub: `${summary.paidCount} paid / ${summary.pendingCount} pending`, color: summary.avgDeliveryPct >= 90 ? "text-emerald-400" : "text-amber-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs text-zinc-500 mb-1">{kpi.label}</div>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-zinc-600 mt-1">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Invoice list */}
        <div className="space-y-4">
          {invoices.map((inv) => {
            const isExpanded = expandedInvoice === inv.advertiserId;
            const notes = notesState[inv.advertiserId] ?? inv.notes;
            const mgConfirmed = makeGoodConfirmed[inv.advertiserId] ?? false;
            const canFinalize = !inv.makeGoodPendingReview || mgConfirmed;

            return (
              <div key={inv.advertiserId} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                {/* Invoice header */}
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
                  onClick={() => setExpandedInvoice(isExpanded ? null : inv.advertiserId)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-semibold text-zinc-100">{inv.advertiserName}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{inv.invoiceNumber} · Due {inv.dueDate}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-zinc-400">Gross</div>
                      <div className="font-semibold">{fmt(inv.subtotal)}</div>
                    </div>
                    {inv.makeGoodCredits > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-zinc-400">Credits</div>
                        <div className="font-semibold text-amber-400">−{fmt(inv.makeGoodCredits)}</div>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-sm text-zinc-400">Net</div>
                      <div className="font-bold text-emerald-400">{fmt(inv.netTotal)}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(inv.status)}`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                    <span className="text-zinc-600 text-sm">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Line items — expanded */}
                {isExpanded && (
                  <div className="border-t border-zinc-800">

                    {/* Make-good review banner — hard stop before finalize */}
                    {inv.makeGoodPendingReview && !mgConfirmed && (
                      <div className="mx-5 mt-4 rounded-lg border border-red-700 bg-red-950/50 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className="text-red-400 text-lg mt-0.5">⚠</span>
                          <div className="flex-1">
                            <div className="font-semibold text-red-300 text-sm">Make-good credits require review before finalizing</div>
                            <div className="text-red-400/80 text-xs mt-1">
                              This invoice has {fmt(inv.makeGoodCredits)} in make-good credits applied. Loop in Tyler before sending — this context matters for the renewal conversation.
                              The Finalize button is disabled until you confirm below.
                            </div>
                          </div>
                          <button
                            className="text-xs px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded font-medium transition-colors whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMakeGoodConfirmed((prev) => ({ ...prev, [inv.advertiserId]: true }));
                            }}
                          >
                            Confirm reviewed with Tyler
                          </button>
                        </div>
                      </div>
                    )}
                    {inv.makeGoodPendingReview && mgConfirmed && (
                      <div className="mx-5 mt-4 rounded-lg border border-emerald-800 bg-emerald-950/30 px-4 py-2 flex items-center gap-2 text-xs text-emerald-400">
                        <span>✓</span> Make-good credits reviewed — invoice ready to finalize
                      </div>
                    )}

                    <table className="w-full text-sm mt-4">
                      <thead>
                        <tr className="bg-zinc-800/50">
                          <th className="text-left px-5 py-2.5 text-zinc-400 font-medium">Flight</th>
                          <th className="text-left px-3 py-2.5 text-zinc-400 font-medium">Format</th>
                          <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">Booked</th>
                          <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">Delivered</th>
                          <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">Delivery%</th>
                          <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">CPM</th>
                          <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">Gross</th>
                          <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">Credit</th>
                          <th className="text-right px-5 py-2.5 text-zinc-400 font-medium">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.lineItems.map((li) => (
                          <tr key={li.flightId} className="border-t border-zinc-800/50 hover:bg-zinc-800/20">
                            <td className="px-5 py-3">
                              <div className="text-zinc-100 font-medium truncate max-w-[200px]">{li.flightName}</div>
                              <div className="text-zinc-600 text-xs">{li.startDate} → {li.endDate}</div>
                            </td>
                            <td className="px-3 py-3 text-zinc-400">{li.format}</td>
                            <td className="px-3 py-3 text-right text-zinc-300">{fmtImpressions(li.bookedImpressions)}</td>
                            <td className="px-3 py-3 text-right text-zinc-300">{fmtImpressions(li.deliveredImpressions)}</td>
                            <td className={`px-3 py-3 text-right font-semibold ${deliveryColor(li.deliveryPct)}`}>
                              {li.deliveryPct}%
                              {li.deliveryPct < 95 && <span className="ml-1 text-xs">⚠</span>}
                            </td>
                            <td className="px-3 py-3 text-right text-zinc-400">${li.cpm.toFixed(2)}</td>
                            <td className="px-3 py-3 text-right text-zinc-300">{fmt(li.grossRevenue)}</td>
                            <td className="px-3 py-3 text-right text-amber-400">
                              {li.makeGoodCredit > 0 ? `−${fmt(li.makeGoodCredit)}` : "—"}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-zinc-100">{fmt(li.netRevenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-zinc-700 bg-zinc-800/30">
                          <td colSpan={6} className="px-5 py-3 text-zinc-400 text-sm font-medium">Invoice Total</td>
                          <td className="px-3 py-3 text-right font-semibold text-zinc-100">{fmt(inv.subtotal)}</td>
                          <td className="px-3 py-3 text-right font-semibold text-amber-400">
                            {inv.makeGoodCredits > 0 ? `−${fmt(inv.makeGoodCredits)}` : "—"}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-400">{fmt(inv.netTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Audit trail timestamps */}
                    <div className="mx-5 my-4 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
                      <div className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Audit Trail</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        {[
                          { label: "Drafted", ts: inv.draftedAt },
                          { label: "Finalized", ts: inv.finalizedAt },
                          { label: "Sent", ts: inv.sentAt },
                          { label: "Paid", ts: inv.paidAt },
                        ].map(({ label, ts }) => (
                          <div key={label}>
                            <div className="text-zinc-500 mb-0.5">{label}</div>
                            <div className={ts ? "text-zinc-300" : "text-zinc-600"}>{fmtTs(ts)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes field */}
                    <div className="mx-5 mb-4">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Invoice Notes
                      </label>
                      <textarea
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                        rows={3}
                        placeholder="Add notes — why a credit was applied, anything unusual, context for Tyler…"
                        value={notes}
                        onChange={(e) => {
                          e.stopPropagation();
                          setNotesState((prev) => ({ ...prev, [inv.advertiserId]: e.target.value }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Invoice actions */}
                    <div className="px-5 py-3 border-t border-zinc-800/50 flex items-center justify-between bg-zinc-900">
                      <div className="text-xs text-zinc-500">
                        Invoice #{inv.invoiceNumber} · Generated {inv.invoiceDate} · Due {inv.dueDate}
                      </div>
                      <div className="flex gap-2">
                        {inv.status === "draft" && (
                          <button
                            disabled={!canFinalize}
                            title={!canFinalize ? "Review make-good credits with Tyler first" : ""}
                            className={`px-3 py-1.5 text-white rounded text-xs font-medium transition-colors ${
                              canFinalize
                                ? "bg-blue-700 hover:bg-blue-600 cursor-pointer"
                                : "bg-blue-900/40 text-blue-400/50 cursor-not-allowed"
                            }`}
                          >
                            Finalize Invoice
                          </button>
                        )}
                        {inv.status === "sent" && (
                          <button className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium transition-colors">
                            Mark Paid
                          </button>
                        )}
                        <button className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded text-xs font-medium transition-colors">
                          Export PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Make-good policy note */}
        <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg px-5 py-4 text-sm text-amber-300/80">
          <span className="font-semibold text-amber-300">Make-good policy:</span> Flights delivering &lt;95% of booked impressions receive a 50% credit on the shortfall at booked CPM. Credits require Tyler review before invoices are finalized. Flagged invoices show a blocking banner — confirm reviewed before the Finalize button activates.
        </div>

      </div>
    </div>
  );
}
