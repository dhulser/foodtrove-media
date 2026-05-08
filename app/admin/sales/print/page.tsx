/**
 * /admin/sales/print — Print-optimized sales report for PDF export
 *
 * Fetches the same data as /admin/sales but renders in a clean single-column
 * layout optimized for printing/PDF. Tyler can use this to generate
 * per-advertiser PDF attachments for renewal conversations.
 *
 * Usage:
 *   /admin/sales/print              → full network report (all advertisers)
 *   /admin/sales/print?adv=6254651  → single-advertiser view
 *
 * In browser: open URL → Ctrl+P / Cmd+P → Save as PDF
 * The @media print CSS (in globals.css) hides Nav/Footer when printing.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales Report — FoodTrove Media",
};

interface FormatEntry {
  name: string;
  format: string;
  keywords: string;
  cpm: number;
  isContextual: boolean;
  isActive: boolean;
  flightId: number;
  monthlyEstImpressions: number;
}

interface AdvertiserReport {
  id: number;
  name: string;
  isActive: boolean;
  campaigns: number;
  activeFlights: number;
  formats: FormatEntry[];
  avgCpm: number;
  estimatedMonthlyRevenue: number;
}

interface InventoryEntry {
  placement: string;
  size: string;
  location: string;
  estimatedMonthlyImpressions: number;
  currentCpm: number;
  advertisers: (string | undefined)[];
}

interface SalesReport {
  generatedAt: string;
  network: string;
  summary: {
    totalAdvertisers: number;
    totalActiveFlights: number;
    estimatedMonthlyRevenue: number;
    avgNetworkCpm: number;
  };
  advertisers: AdvertiserReport[];
  inventory: InventoryEntry[];
}

function fmt(n: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

async function getReport(): Promise<SalesReport | null> {
  const apiKey = process.env.KEVEL_API_KEY;
  if (!apiKey) return null;

  try {
    // Server-side fetch — call internal API route directly
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const resp = await fetch(`${base}/api/admin/sales-report`, {
      cache: "no-store",
    });
    if (!resp.ok) return null;
    return resp.json() as Promise<SalesReport>;
  } catch {
    return null;
  }
}

export default async function SalesPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ adv?: string }>;
}) {
  const { adv: advFilter } = await searchParams;
  const report = await getReport();

  if (!report) {
    notFound();
  }

  const generatedAt = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  // Filter to specific advertiser if requested
  const advertisers = advFilter
    ? report.advertisers.filter((a) => String(a.id) === advFilter)
    : report.advertisers;

  if (advertisers.length === 0) {
    notFound();
  }

  const isSingleAdvertiser = advertisers.length === 1;
  const primaryAdv = advertisers[0];

  return (
    <>
      {/* Inline print-specific styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            nav, footer, .no-print { display: none !important; }
            main { padding: 0 !important; }
            @page { size: A4; margin: 15mm 12mm; }
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .page-break { page-break-before: always; }
          }
        `,
        }}
      />

      <div className="max-w-4xl mx-auto px-6 py-8 bg-white min-h-screen">

        {/* Print controls — hidden in print */}
        <div className="no-print flex items-center gap-3 mb-6 pb-4 border-b border-stone-200">
          <a
            href="/admin/sales"
            className="flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition"
          >
            ← Back
          </a>
          <button
            onClick={undefined}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition"
            suppressHydrationWarning
          >
            ⬇ Download PDF
          </button>
          <script
            dangerouslySetInnerHTML={{
              __html: `document.querySelector('.no-print button').addEventListener('click', () => window.print())`,
            }}
          />
          <span className="text-xs text-stone-400 ml-2">
            Or use Ctrl+P / Cmd+P → Save as PDF
          </span>
          {/* Per-advertiser links */}
          <div className="ml-auto flex items-center gap-2">
            {report.advertisers.map((adv) => (
              <a
                key={adv.id}
                href={`/admin/sales/print?adv=${adv.id}`}
                className={`px-2.5 py-1 text-xs rounded-full border font-medium transition ${
                  String(adv.id) === advFilter
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "text-stone-600 border-stone-200 hover:bg-stone-50"
                }`}
              >
                {adv.name.split(" ")[0]}
              </a>
            ))}
            {advFilter && (
              <a
                href="/admin/sales/print"
                className="px-2.5 py-1 text-xs rounded-full border font-medium text-stone-600 border-stone-200 hover:bg-stone-50"
              >
                All
              </a>
            )}
          </div>
        </div>

        {/* Report Header */}
        <div className="flex justify-between items-end border-b-2 border-emerald-600 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🛒</span>
              <h1 className="text-xl font-black text-emerald-700 tracking-tight">
                FoodTrove Media
              </h1>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              {isSingleAdvertiser
                ? `${primaryAdv.name} — Campaign Report`
                : "Sales Report — All Advertisers"}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">{report.network}</p>
          </div>
          <div className="text-right text-xs text-stone-500 leading-relaxed">
            <div>Generated: {generatedAt}</div>
            <div>
              Advertiser ID:{" "}
              {isSingleAdvertiser ? primaryAdv.id : "All active"}
            </div>
            <div className="font-semibold text-stone-700 mt-0.5">
              Confidential
            </div>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {isSingleAdvertiser ? (
            <>
              <KpiCard
                label="Active Flights"
                value={String(primaryAdv.activeFlights)}
                sub="Live placements"
                color="text-emerald-600"
              />
              <KpiCard
                label="Ad Formats"
                value={String(primaryAdv.formats.length)}
                sub="Running formats"
                color="text-blue-600"
              />
              <KpiCard
                label="Avg CPM"
                value={fmt(primaryAdv.avgCpm)}
                sub="Across all formats"
                color="text-amber-600"
              />
              <KpiCard
                label="Est. Monthly Revenue"
                value={fmt(primaryAdv.estimatedMonthlyRevenue, 0)}
                sub="Run-rate estimate"
                color="text-emerald-700"
              />
            </>
          ) : (
            <>
              <KpiCard
                label="Advertisers"
                value={String(report.summary.totalAdvertisers)}
                sub="Active campaigns"
                color="text-emerald-600"
              />
              <KpiCard
                label="Active Flights"
                value={String(report.summary.totalActiveFlights)}
                sub="All formats"
                color="text-blue-600"
              />
              <KpiCard
                label="Avg CPM"
                value={fmt(report.summary.avgNetworkCpm)}
                sub="Blended network rate"
                color="text-amber-600"
              />
              <KpiCard
                label="Est. Mo. Revenue"
                value={fmt(report.summary.estimatedMonthlyRevenue, 0)}
                sub="Run-rate estimate"
                color="text-emerald-700"
              />
            </>
          )}
        </div>

        {/* Advertiser detail */}
        <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-3">
          {isSingleAdvertiser ? "Campaign Performance" : "Advertiser Roster"}
        </h3>

        {advertisers.map((adv) => (
          <div
            key={adv.id}
            className="border border-stone-200 rounded-xl mb-5 overflow-hidden"
          >
            {/* Advertiser header */}
            <div className="bg-stone-50 px-5 py-4 flex justify-between items-start border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-stone-900">
                    {adv.name}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      adv.isActive ? "text-emerald-600" : "text-stone-400"
                    }`}
                  >
                    {adv.isActive ? "● Active" : "○ Paused"}
                  </span>
                </div>
                <div className="text-xs text-stone-400 mt-0.5">
                  Advertiser #{adv.id} · {adv.campaigns} campaign
                  {adv.campaigns !== 1 ? "s" : ""} · {adv.activeFlights} active
                  flight{adv.activeFlights !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="text-stone-500 text-xs">Avg CPM</div>
                <div className="font-bold text-stone-800">{fmt(adv.avgCpm)}</div>
                <div className="text-stone-500 text-xs mt-1">Est. Mo. Revenue</div>
                <div className="font-black text-emerald-600 text-base">
                  {fmt(adv.estimatedMonthlyRevenue, 0)}
                </div>
              </div>
            </div>

            {/* Flights table */}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-100 bg-white">
                  <th className="text-left px-5 py-2 font-semibold text-stone-500 uppercase tracking-wide">
                    Format
                  </th>
                  <th className="text-left px-5 py-2 font-semibold text-stone-500 uppercase tracking-wide">
                    Flight Name
                  </th>
                  <th className="text-left px-5 py-2 font-semibold text-stone-500 uppercase tracking-wide">
                    Targeting
                  </th>
                  <th className="text-right px-5 py-2 font-semibold text-stone-500 uppercase tracking-wide">
                    Est. Impr/Mo
                  </th>
                  <th className="text-right px-5 py-2 font-semibold text-stone-500 uppercase tracking-wide">
                    CPM
                  </th>
                  <th className="text-right px-5 py-2 font-semibold text-stone-500 uppercase tracking-wide">
                    Rev/Mo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {adv.formats.map((f) => (
                  <tr key={f.flightId} className="hover:bg-stone-50/50">
                    <td className="px-5 py-3 font-semibold text-stone-800">
                      {f.format}
                    </td>
                    <td className="px-5 py-3 text-stone-500 max-w-[160px] truncate">
                      {f.name}
                    </td>
                    <td className="px-5 py-3">
                      {f.isContextual && (
                        <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 mr-1">
                          Contextual
                        </span>
                      )}
                      <span className="font-mono text-stone-400 text-[10px]">
                        {f.keywords}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-stone-600">
                      {fmtNum(f.monthlyEstImpressions)}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-amber-600">
                      {fmt(f.cpm)}
                    </td>
                    <td className="px-5 py-3 text-right font-black text-emerald-600">
                      {fmt((f.cpm / 1000) * f.monthlyEstImpressions, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Inventory — full report only */}
        {!isSingleAdvertiser && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-3">
              Ad Inventory Summary
            </h3>
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left px-5 py-2.5 font-semibold text-stone-500 uppercase tracking-wide">
                      Placement
                    </th>
                    <th className="text-left px-5 py-2.5 font-semibold text-stone-500 uppercase tracking-wide">
                      Size
                    </th>
                    <th className="text-right px-5 py-2.5 font-semibold text-stone-500 uppercase tracking-wide">
                      Est. Mo. Impr.
                    </th>
                    <th className="text-right px-5 py-2.5 font-semibold text-stone-500 uppercase tracking-wide">
                      Floor CPM
                    </th>
                    <th className="text-right px-5 py-2.5 font-semibold text-stone-500 uppercase tracking-wide">
                      Sold To
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {report.inventory.map((inv) => (
                    <tr key={inv.placement} className="hover:bg-stone-50/50">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-stone-800">
                          {inv.placement}
                        </div>
                        <div className="text-stone-400 text-[10px]">
                          {inv.location}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-stone-500">
                        {inv.size}
                      </td>
                      <td className="px-5 py-3 text-right text-stone-600">
                        {fmtNum(inv.estimatedMonthlyImpressions)}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-amber-600">
                        {fmt(inv.currentCpm)}
                      </td>
                      <td className="px-5 py-3 text-right text-stone-500">
                        {inv.advertisers.filter(Boolean).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-50 border-t border-stone-200 font-bold">
                    <td colSpan={2} className="px-5 py-2.5 text-stone-700">
                      Totals / Average
                    </td>
                    <td className="px-5 py-2.5 text-right text-stone-700">
                      {fmtNum(
                        report.inventory.reduce(
                          (s, i) => s + i.estimatedMonthlyImpressions,
                          0
                        )
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right text-amber-600">
                      {fmt(
                        report.inventory.reduce(
                          (s, i) => s + i.currentCpm,
                          0
                        ) / report.inventory.length
                      )}{" "}
                      <span className="font-normal text-stone-400">avg</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Per-advertiser link list — full report only, print-visible */}
        {!isSingleAdvertiser && (
          <div className="mt-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-xs font-semibold text-stone-600 mb-2">
              Per-Advertiser PDF Reports
            </p>
            <p className="text-xs text-stone-500 mb-3">
              To generate a single-advertiser PDF, navigate to the URL below and
              use Ctrl+P / Cmd+P → Save as PDF:
            </p>
            {report.advertisers.map((adv) => (
              <div key={adv.id} className="text-xs text-stone-700 mb-1">
                <span className="font-semibold">{adv.name}</span>{" "}
                <span className="text-emerald-700 font-mono">
                  /admin/sales/print?adv={adv.id}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs font-semibold text-amber-700 mb-1">
            Methodology note
          </p>
          <p className="text-xs text-amber-600 leading-relaxed">
            Revenue estimates use impression volume projections × live CPM rates
            from Kevel Network 12024. Monthly impression figures are run-rate
            estimates — not actuals from the Kevel impression log (analytics
            integration pending). CPM rates reflect current highest bidder per
            format; additional advertiser competition increases floor CPMs. All
            data is fetched in real-time from live campaign configuration.
            {isSingleAdvertiser && (
              <>
                {" "}
                Total FoodTrove network est. monthly revenue:{" "}
                <strong>
                  {fmt(report.summary.estimatedMonthlyRevenue, 0)}
                </strong>
                .
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
      <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
      <p className="text-[10px] text-stone-400 mt-0.5">{sub}</p>
    </div>
  );
}
