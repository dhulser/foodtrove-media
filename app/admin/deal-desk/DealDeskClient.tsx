"use client";
import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  deliveredPct?: number;
}

interface InsertionOrder {
  id: string;
  dealName: string;
  advertiserName: string;
  advertiserId?: number;
  contactName: string;
  contactEmail: string;
  stage: DealStage;
  owner: string;
  totalValue: number;
  lineItems: IOLineItem[];
  notes: string;
  noteUpdatedAt?: string;
  noteUpdatedBy?: string;
  createdAt: string;
  proposedAt?: string;
  signedAt?: string;
  liveAt?: string;
  closedAt?: string;
  probability: number;
}

interface Summary {
  totalDeals: number;
  liveCount: number;
  signedCount: number;
  pipelineCount: number;
  lostCount: number;
  totalLiveValue: number;
  totalSignedValue: number;
  q2Contracted: number;
  weightedPipeline: number;
  totalPipelineValue: number;
  deliveredRevenue: number;
  avgDealSize: number;
  stageBreakdown: Record<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STAGE_LABEL: Record<DealStage, string> = {
  prospect: "Prospect",
  proposal: "Proposal",
  negotiation: "Negotiation",
  signed: "Signed",
  live: "Live",
  closed: "Closed",
  lost: "Lost",
};

const STAGE_COLOR: Record<DealStage, string> = {
  prospect: "bg-stone-100 text-stone-600",
  proposal: "bg-blue-100 text-blue-700",
  negotiation: "bg-amber-100 text-amber-700",
  signed: "bg-violet-100 text-violet-700",
  live: "bg-emerald-100 text-emerald-700",
  closed: "bg-teal-100 text-teal-700",
  lost: "bg-red-100 text-red-600",
};

const FORMAT_LABELS: Record<string, string> = {
  billboard: "Billboard 970×250",
  leaderboard: "Leaderboard 728×90",
  mrec: "MRec 300×250",
};

function fmt(n: number, currency = true): string {
  if (currency) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
  return n.toLocaleString("en-US");
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function dateStr(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

// ─── Stage funnel bar ─────────────────────────────────────────────────────────
function FunnelBar({ breakdown }: { breakdown: Record<string, number> }) {
  const stages: DealStage[] = ["prospect", "proposal", "negotiation", "signed", "live"];
  const counts = stages.map((s) => breakdown[s] ?? 0);
  const max = Math.max(...counts, 1);

  return (
    <div className="flex items-end gap-2 h-16">
      {stages.map((s, i) => {
        const h = Math.max((counts[i] / max) * 48, 4);
        return (
          <div key={s} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs font-bold text-stone-700">{counts[i]}</span>
            <div
              className={`w-full rounded-t ${STAGE_COLOR[s].split(" ")[0].replace("bg-", "bg-")}`}
              style={{ height: h }}
            />
            <span className="text-[10px] text-stone-400 leading-none text-center">
              {STAGE_LABEL[s]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KPI({
  label,
  value,
  sub,
  accent = "stone",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  const colors: Record<string, string> = {
    stone: "text-stone-900",
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    violet: "text-violet-700",
    amber: "text-amber-700",
  };
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className={`text-xl font-bold ${colors[accent] ?? "text-stone-900"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-stone-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Line item row ────────────────────────────────────────────────────────────
function LineItemRow({ li, isLive }: { li: IOLineItem; isLive: boolean }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-stone-100 last:border-0">
      <div className="w-36 shrink-0">
        <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-700 text-xs rounded font-medium">
          {FORMAT_LABELS[li.format]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-stone-700 font-medium truncate">{li.flightName}</div>
        <div className="text-xs text-stone-400 mt-0.5">
          {dateStr(li.startDate)} → {dateStr(li.endDate)}
          {li.flightId && (
            <span className="ml-2 text-stone-300">Flight #{li.flightId}</span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 w-24">
        <div className="text-sm font-semibold text-stone-900">{fmt(li.totalValue)}</div>
        <div className="text-xs text-stone-400">
          ${li.cpm.toFixed(2)} CPM · {(li.impressions / 1000000).toFixed(1)}M imps
        </div>
      </div>
      {isLive && li.deliveredPct !== undefined && (
        <div className="shrink-0 w-20">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  li.deliveredPct >= 45
                    ? "bg-emerald-500"
                    : li.deliveredPct >= 30
                    ? "bg-amber-400"
                    : "bg-red-400"
                }`}
                style={{ width: `${li.deliveredPct}%` }}
              />
            </div>
            <span className="text-xs text-stone-500 w-8 text-right">{li.deliveredPct}%</span>
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">delivered</div>
        </div>
      )}
      <div className="shrink-0 w-40 hidden lg:flex flex-wrap gap-1">
        {li.contextualKeywords.slice(0, 3).map((k) => (
          <span
            key={k}
            className="px-1.5 py-0.5 bg-stone-50 border border-stone-200 text-[10px] text-stone-500 rounded"
          >
            {k}
          </span>
        ))}
        {li.contextualKeywords.length > 3 && (
          <span className="text-[10px] text-stone-400">
            +{li.contextualKeywords.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Deal card ────────────────────────────────────────────────────────────────
function DealCard({
  deal,
  expanded,
  onToggle,
  onSaveNote,
}: {
  deal: InsertionOrder;
  expanded: boolean;
  onToggle: () => void;
  onSaveNote: (id: string, note: string) => Promise<void>;
}) {
  const [editNote, setEditNote] = useState(deal.notes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isLive = deal.stage === "live";
  const isClosed = ["closed", "lost"].includes(deal.stage);

  const deliveredRevenue = isLive
    ? deal.lineItems.reduce(
        (s, li) => s + li.totalValue * ((li.deliveredPct ?? 0) / 100),
        0
      )
    : 0;

  async function handleSave() {
    setSaving(true);
    await onSaveNote(deal.id, editNote);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm transition-all ${
        expanded ? "border-stone-300 shadow-md" : "border-stone-200"
      }`}
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        {/* Stage badge */}
        <div className="shrink-0 mt-0.5">
          <span
            className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${STAGE_COLOR[deal.stage]}`}
          >
            {STAGE_LABEL[deal.stage]}
          </span>
        </div>

        {/* Deal info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-bold text-stone-900 leading-tight">
                {deal.dealName}
              </div>
              <div className="text-xs text-stone-400 mt-0.5">
                {deal.advertiserName} · {deal.contactName} ·{" "}
                <span className="text-stone-500">{deal.owner}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-bold text-stone-900">
                {fmt(deal.totalValue)}
              </div>
              {!isClosed && deal.probability < 100 && (
                <div className="text-xs text-stone-400">
                  {pct(deal.probability)} probability
                </div>
              )}
              {isLive && deliveredRevenue > 0 && (
                <div className="text-xs text-emerald-600 font-medium">
                  {fmt(Math.round(deliveredRevenue))} delivered
                </div>
              )}
            </div>
          </div>

          {/* Timeline pills */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {deal.createdAt && (
              <span className="text-[10px] text-stone-400">
                Created {relTime(deal.createdAt)}
              </span>
            )}
            {deal.proposedAt && (
              <>
                <span className="text-stone-300">·</span>
                <span className="text-[10px] text-stone-400">
                  Proposed {dateStr(deal.proposedAt)}
                </span>
              </>
            )}
            {deal.signedAt && (
              <>
                <span className="text-stone-300">·</span>
                <span className="text-[10px] text-violet-500 font-medium">
                  Signed {dateStr(deal.signedAt)}
                </span>
              </>
            )}
            {deal.liveAt && (
              <>
                <span className="text-stone-300">·</span>
                <span className="text-[10px] text-emerald-500 font-medium">
                  Live {dateStr(deal.liveAt)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Expand caret */}
        <div className="shrink-0 mt-1">
          <svg
            className={`w-4 h-4 text-stone-400 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-stone-100 px-5 pb-5 pt-4">
          {/* Signed/lost callout */}
          {deal.stage === "signed" && !deal.liveAt && (
            <div className="mb-4 p-3 bg-violet-50 border border-violet-200 rounded-xl text-sm text-violet-700">
              <span className="font-semibold">Signed — pending flight creation.</span>{" "}
              Casey needs to create Kevel flights and upload creatives before this can go live.
            </div>
          )}
          {deal.stage === "lost" && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <span className="font-semibold">Lost.</span> Deal closed without booking.
              Review notes for win-back context.
            </div>
          )}
          {deal.stage === "prospect" && (
            <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600">
              <span className="font-semibold">Prospect.</span> No proposal sent yet.
              Probability: {deal.probability}%.
            </div>
          )}

          {/* Line items */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
              IO Line Items
            </div>
            {deal.lineItems.map((li, i) => (
              <LineItemRow key={i} li={li} isLive={isLive} />
            ))}
            <div className="flex justify-end mt-2 pt-2 border-t border-stone-100">
              <span className="text-sm font-bold text-stone-900">
                Total: {fmt(deal.totalValue)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
              Deal Notes
            </div>
            <textarea
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              rows={3}
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Add deal context, next steps, or blockers..."
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-stone-400">
                {deal.noteUpdatedAt
                  ? `Last saved ${relTime(deal.noteUpdatedAt)} by ${deal.noteUpdatedBy}`
                  : "No saved notes yet"}
              </span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DealDeskClient() {
  const [deals, setDeals] = useState<InsertionOrder[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<DealStage | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stages: Array<DealStage | "all"> = [
    "all",
    "live",
    "signed",
    "negotiation",
    "proposal",
    "prospect",
    "lost",
  ];

  const load = useCallback(async () => {
    try {
      const url =
        stageFilter === "all"
          ? "/api/admin/deal-desk"
          : `/api/admin/deal-desk?stage=${stageFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setDeals(data.deals ?? []);
      setSummary(data.summary ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [stageFilter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function saveNote(id: string, note: string) {
    await fetch("/api/admin/deal-desk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, note, updatedBy: "Tyler Brooks" }),
    });
    // Refresh notes in state
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, notes: note, noteUpdatedAt: new Date().toISOString(), noteUpdatedBy: "Tyler Brooks" }
          : d
      )
    );
  }

  // Total pipeline weighted value
  const weightedPipeline = summary?.weightedPipeline ?? 0;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Deal Desk</h1>
                <p className="text-sm text-stone-400">
                  Insertion orders · Deal pipeline · Kevel flight tracking
                </p>
              </div>
            </div>
            <a
              href="/admin"
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              ← Admin hub
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI strip */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <KPI
              label="Q2 Contracted"
              value={fmt(summary.q2Contracted)}
              sub={`${summary.liveCount + summary.signedCount} deals`}
              accent="emerald"
            />
            <KPI
              label="Live Revenue"
              value={fmt(summary.deliveredRevenue)}
              sub={`of ${fmt(summary.totalLiveValue)} booked`}
              accent="emerald"
            />
            <KPI
              label="Signed — Pending"
              value={fmt(summary.totalSignedValue)}
              sub={`${summary.signedCount} deal${summary.signedCount !== 1 ? "s" : ""}`}
              accent="violet"
            />
            <KPI
              label="Weighted Pipeline"
              value={fmt(weightedPipeline)}
              sub={`of ${fmt(summary.totalPipelineValue)} total`}
              accent="blue"
            />
            <KPI
              label="Avg Deal Size"
              value={fmt(summary.avgDealSize)}
              sub="live + signed"
              accent="stone"
            />
            <KPI
              label="Deals in Flight"
              value={String(summary.liveCount)}
              sub={`${summary.pipelineCount} in pipeline`}
              accent="stone"
            />
          </div>
        )}

        {/* Pipeline funnel */}
        {summary && (
          <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-8 shadow-sm">
            <div className="text-sm font-semibold text-stone-700 mb-4">
              Deal Pipeline — Stage Distribution
            </div>
            <FunnelBar breakdown={summary.stageBreakdown} />
            <div className="mt-3 flex items-center gap-4 text-xs text-stone-400 flex-wrap">
              <span>
                <strong className="text-stone-600">{summary.stageBreakdown.prospect ?? 0}</strong>{" "}
                prospect
              </span>
              <span>
                <strong className="text-stone-600">{summary.stageBreakdown.proposal ?? 0}</strong>{" "}
                proposal
              </span>
              <span>
                <strong className="text-stone-600">{summary.stageBreakdown.negotiation ?? 0}</strong>{" "}
                negotiation
              </span>
              <span>
                <strong className="text-violet-600">{summary.stageBreakdown.signed ?? 0}</strong>{" "}
                signed
              </span>
              <span>
                <strong className="text-emerald-600">{summary.stageBreakdown.live ?? 0}</strong>{" "}
                live
              </span>
              <span>
                <strong className="text-red-500">{summary.stageBreakdown.lost ?? 0}</strong>{" "}
                lost
              </span>
            </div>
          </div>
        )}

        {/* Stage filter tabs */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {stages.map((s) => {
            const count =
              s === "all"
                ? deals.length
                : deals.filter((d) => d.stage === s).length;
            return (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  stageFilter === s
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                }`}
              >
                {s === "all" ? "All Deals" : STAGE_LABEL[s as DealStage]}{" "}
                {count > 0 && (
                  <span className={stageFilter === s ? "opacity-60" : "opacity-50"}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Deals list */}
        {loading ? (
          <div className="text-sm text-stone-400 py-12 text-center">Loading deals…</div>
        ) : deals.length === 0 ? (
          <div className="text-sm text-stone-400 py-12 text-center">
            No deals in {stageFilter === "all" ? "pipeline" : STAGE_LABEL[stageFilter as DealStage]}.
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                expanded={expandedId === deal.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === deal.id ? null : deal.id))
                }
                onSaveNote={saveNote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
