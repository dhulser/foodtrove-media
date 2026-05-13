"use client";

/**
 * Advertiser Onboarding Wizard — /admin/onboarding
 *
 * 4-step self-serve flow for Tyler (Sales) and Casey (Ad Ops) to onboard
 * a new advertiser without touching the Kevel dashboard directly.
 *
 * Steps:
 *   1. Advertiser info (name, category, tagline, brand color)
 *   2. Format + CPM selection (billboard / leaderboard / MRec)
 *   3. Contextual targeting (keyword selection)
 *   4. Review + launch (creates all Kevel entities, shows result)
 *
 * On completion, all Kevel entity IDs are surfaced for Casey's records.
 */

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Format = "billboard" | "leaderboard" | "mrec";

interface FormState {
  advertiserName: string;
  campaignName: string;
  tagline: string;
  primaryColor: string;
  category: string;
  formats: Format[];
  cpms: Record<Format, number>;
  contextualKeywords: string[];
}

interface LogEntry {
  step: string;
  status: "ok" | "error";
  detail?: string;
}

interface LaunchResult {
  success: boolean;
  advertiserName?: string;
  advertiserId?: number;
  campaignId?: number;
  flights?: Record<Format, { flightId: number; creativeId: number; adMapId: number; cpm: number; keywords: string }>;
  decisionTestFilled?: boolean;
  propagationNote?: string | null;
  log?: LogEntry[];
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Organic & Natural",
  "Beverages",
  "Snacks & Nutrition",
  "Produce & Fresh",
  "Dairy & Eggs",
  "Meat & Seafood",
  "Pantry Staples",
  "Health & Wellness",
  "Baby & Family",
  "Household",
  "Pet",
];

const CONTEXTUAL_KEYWORDS = [
  { kw: "organic", label: "Organic" },
  { kw: "produce", label: "Produce" },
  { kw: "fresh", label: "Fresh" },
  { kw: "dairy", label: "Dairy" },
  { kw: "snacks", label: "Snacks" },
  { kw: "beverages", label: "Beverages" },
  { kw: "health", label: "Health & Wellness" },
  { kw: "pantry", label: "Pantry" },
  { kw: "meat", label: "Meat & Seafood" },
  { kw: "baby", label: "Baby & Family" },
  { kw: "household", label: "Household" },
  { kw: "pet", label: "Pet" },
];

const FORMAT_DETAILS: Record<Format, { label: string; size: string; description: string; floorCpm: number }> = {
  billboard: { label: "Billboard", size: "970×250", description: "Homepage hero — highest visibility, premium CPM", floorCpm: 4.0 },
  leaderboard: { label: "Leaderboard", size: "728×90", description: "Page top/bottom — high frequency touchpoint", floorCpm: 3.5 },
  mrec: { label: "Medium Rectangle", size: "300×250", description: "Product pages & sidebar — contextual relevance", floorCpm: 3.0 },
};

const PRESET_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

// ─── Step Components ──────────────────────────────────────────────────────────

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
      done ? "bg-emerald-500 text-white" :
      active ? "bg-blue-500 text-white" :
      "bg-gray-700 text-gray-400"
    }`}>
      {done ? "✓" : n}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingClient() {
  const [step, setStep] = useState(1);
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState<LaunchResult | null>(null);

  const [form, setForm] = useState<FormState>({
    advertiserName: "",
    campaignName: "",
    tagline: "",
    primaryColor: "#22c55e",
    category: "",
    formats: ["billboard", "leaderboard", "mrec"],
    cpms: { billboard: 5.0, leaderboard: 4.5, mrec: 4.0 },
    contextualKeywords: [],
  });

  function updateForm(updates: Partial<FormState>) {
    setForm((f) => ({ ...f, ...updates }));
  }

  function toggleFormat(fmt: Format) {
    const current = form.formats;
    if (current.includes(fmt)) {
      if (current.length === 1) return; // must have at least one
      updateForm({ formats: current.filter((f) => f !== fmt) });
    } else {
      updateForm({ formats: [...current, fmt] });
    }
  }

  function toggleKeyword(kw: string) {
    const current = form.contextualKeywords;
    if (current.includes(kw)) {
      updateForm({ contextualKeywords: current.filter((k) => k !== kw) });
    } else {
      updateForm({ contextualKeywords: [...current, kw] });
    }
  }

  async function handleLaunch() {
    setLaunching(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiserName: form.advertiserName,
          campaignName: form.campaignName || `${form.advertiserName} — Q2 2026`,
          tagline: form.tagline || `Fresh from ${form.advertiserName}`,
          primaryColor: form.primaryColor,
          category: form.category,
          formats: form.formats,
          cpms: form.cpms,
          contextualKeywords: form.contextualKeywords,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) setStep(5);
    } catch (err) {
      setResult({ success: false, error: String(err) });
    } finally {
      setLaunching(false);
    }
  }

  // ── Step 1: Advertiser Info ──────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Advertiser Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.advertiserName}
          onChange={(e) => updateForm({ advertiserName: e.target.value })}
          placeholder="e.g. Green Mountain Coffee"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name</label>
        <input
          type="text"
          value={form.campaignName}
          onChange={(e) => updateForm({ campaignName: e.target.value })}
          placeholder={`${form.advertiserName || "Advertiser"} — Q2 2026`}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Brand Tagline</label>
        <input
          type="text"
          value={form.tagline}
          onChange={(e) => updateForm({ tagline: e.target.value })}
          placeholder="e.g. Sustainably Sourced, Always Fresh"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Displayed on auto-generated ad creatives</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
        <select
          value={form.category}
          onChange={(e) => updateForm({ category: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Select category...</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Brand Color</label>
        <div className="flex gap-3 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => updateForm({ primaryColor: color })}
              className={`w-10 h-10 rounded-full transition-all ${form.primaryColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : "hover:scale-105"}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <input
            type="color"
            value={form.primaryColor}
            onChange={(e) => updateForm({ primaryColor: e.target.value })}
            className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-2 border-gray-600"
            title="Custom color"
          />
        </div>
      </div>

      <button
        onClick={() => setStep(2)}
        disabled={!form.advertiserName.trim()}
        className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next: Ad Formats & CPMs →
      </button>
    </div>
  );

  // ── Step 2: Formats + CPMs ───────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">Select the ad formats to activate. CPM determines auction priority — higher CPM wins more impressions.</p>
      
      {(Object.keys(FORMAT_DETAILS) as Format[]).map((fmt) => {
        const details = FORMAT_DETAILS[fmt];
        const selected = form.formats.includes(fmt);
        return (
          <div
            key={fmt}
            className={`border rounded-xl p-5 transition-colors cursor-pointer ${selected ? "border-blue-500 bg-blue-950/30" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`}
            onClick={() => toggleFormat(fmt)}
          >
            <div className="flex items-start gap-4">
              <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center shrink-0 ${selected ? "border-blue-500 bg-blue-500" : "border-gray-600"}`}>
                {selected && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold text-white">{details.label}</span>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{details.size}</span>
                  <span className="text-xs text-gray-500">Floor: ${details.floorCpm.toFixed(2)} CPM</span>
                </div>
                <p className="text-sm text-gray-400">{details.description}</p>
                {selected && (
                  <div className="mt-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <label className="text-sm text-gray-300 shrink-0">CPM: $</label>
                    <input
                      type="number"
                      min={details.floorCpm}
                      max={25}
                      step={0.5}
                      value={form.cpms[fmt]}
                      onChange={(e) => updateForm({ cpms: { ...form.cpms, [fmt]: parseFloat(e.target.value) || details.floorCpm } })}
                      className="w-24 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-500">
                      {form.cpms[fmt] > 8.5 ? "⬆ Premium — will win most auctions" :
                       form.cpms[fmt] > 6.0 ? "↔ Competitive" :
                       "⬇ Floor — may lose to existing advertisers"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex gap-3">
        <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
          ← Back
        </button>
        <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
          Next: Targeting →
        </button>
      </div>
    </div>
  );

  // ── Step 3: Contextual Keywords ──────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400 mb-1">
          Contextual keywords route ads to relevant pages. Leave empty for run-of-site (all pages).
        </p>
        <p className="text-xs text-gray-500">
          Example: selecting <span className="text-emerald-400">organic</span> + <span className="text-emerald-400">produce</span> targets department pages for organic food and fresh produce — same as Earthbound Farm.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CONTEXTUAL_KEYWORDS.map(({ kw, label }) => {
          const active = form.contextualKeywords.includes(kw);
          return (
            <button
              key={kw}
              onClick={() => toggleKeyword(kw)}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${active ? "border-emerald-500 bg-emerald-950/40 text-emerald-300" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}`}
            >
              {active ? "✓ " : ""}{label}
            </button>
          );
        })}
      </div>

      {form.contextualKeywords.length === 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-400">
          ℹ No contextual keywords selected — ads will run across all pages (run-of-site).
          This is fine for broad awareness campaigns.
        </div>
      )}

      {form.contextualKeywords.length > 0 && (
        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg px-4 py-3 text-sm text-emerald-300">
          ✓ Targeting: <strong>{form.contextualKeywords.join(", ")}</strong>
          <div className="text-xs text-emerald-400/70 mt-1">
            Ads will compete on pages with these keyword signals. Contextual placements typically command a CPM premium.
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
          ← Back
        </button>
        <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
          Review & Launch →
        </button>
      </div>
    </div>
  );

  // ── Step 4: Review + Launch ──────────────────────────────────────────────
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Advertiser</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="text-white font-medium">{form.advertiserName}</span></div>
          <div><span className="text-gray-500">Category:</span> <span className="text-white">{form.category || "—"}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Tagline:</span> <span className="text-white">{form.tagline || `Fresh from ${form.advertiserName}`}</span></div>
          <div><span className="text-gray-500">Campaign:</span> <span className="text-white">{form.campaignName || `${form.advertiserName} — Q2 2026`}</span></div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Brand color:</span>
            <div className="w-5 h-5 rounded-full border border-gray-600" style={{ backgroundColor: form.primaryColor }} />
            <span className="text-white text-xs font-mono">{form.primaryColor}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Flights to Create</h3>
        {form.formats.map((fmt) => (
          <div key={fmt} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">{FORMAT_DETAILS[fmt].label}</span>
              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">{FORMAT_DETAILS[fmt].size}</span>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 font-semibold">${form.cpms[fmt].toFixed(2)} CPM</span>
              {form.contextualKeywords.length > 0 && (
                <div className="text-xs text-gray-500 mt-0.5">+{form.contextualKeywords.length} contextual kw</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4 text-sm text-blue-300">
        <div className="font-semibold mb-1">What this creates in Kevel:</div>
        <ul className="space-y-0.5 text-blue-200/80">
          <li>• 1 advertiser record</li>
          <li>• 1 campaign</li>
          <li>• {form.formats.length} flight{form.formats.length > 1 ? "s" : ""} (one per format)</li>
          <li>• {form.formats.length} HTML creative{form.formats.length > 1 ? "s" : ""} (auto-generated from brand info)</li>
          <li>• {form.formats.length} creative-to-flight link{form.formats.length > 1 ? "s" : ""}</li>
          <li>• 1 Decision API test call to verify propagation</li>
        </ul>
        <div className="mt-2 text-xs text-blue-400/70">
          New flights typically take 15–30 min to appear in live Decision API results.
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep(3)} disabled={launching} className="flex-1 py-3 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 transition-colors">
          ← Back
        </button>
        <button
          onClick={handleLaunch}
          disabled={launching}
          className="flex-1 py-3 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {launching ? "Creating in Kevel…" : "🚀 Launch Campaign"}
        </button>
      </div>
    </div>
  );

  // ── Step 5: Result ───────────────────────────────────────────────────────
  const renderResult = () => {
    if (!result) return null;
    return (
      <div className="space-y-6">
        {result.success ? (
          <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-xl p-5">
            <div className="text-lg font-bold text-emerald-300 mb-1">
              ✓ {result.advertiserName} is live in Kevel
            </div>
            <div className="text-sm text-emerald-200/80">
              All entities created. New flights will appear in Decision API within 15–30 min.
            </div>
            {result.decisionTestFilled && (
              <div className="mt-2 text-sm text-emerald-400 font-medium">⚡ Decision API already filling — propagation was instant.</div>
            )}
            {result.propagationNote && (
              <div className="mt-2 text-sm text-yellow-400">{result.propagationNote}</div>
            )}
          </div>
        ) : (
          <div className="bg-red-950/40 border border-red-700/60 rounded-xl p-5">
            <div className="text-base font-bold text-red-300 mb-1">❌ Launch failed</div>
            <div className="text-sm text-red-200/80 font-mono">{result.error}</div>
          </div>
        )}

        {/* Entity IDs */}
        {result.success && (
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Kevel Entity IDs</h3>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              <div className="text-gray-500">Advertiser ID:</div>
              <div className="text-white">{result.advertiserId}</div>
              <div className="text-gray-500">Campaign ID:</div>
              <div className="text-white">{result.campaignId}</div>
              {result.flights && Object.entries(result.flights).map(([fmt, f]) => (
                <>
                  <div key={`${fmt}-label`} className="text-gray-500">{FORMAT_DETAILS[fmt as Format]?.label} Flight:</div>
                  <div key={`${fmt}-val`} className="text-white text-xs">
                    <div>Flight: {f.flightId}</div>
                    <div>Creative: {f.creativeId}</div>
                    <div>Ad Map: {f.adMapId}</div>
                  </div>
                </>
              ))}
            </div>
          </div>
        )}

        {/* Build log */}
        {result.log && result.log.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Build Log</h3>
            <div className="space-y-1.5">
              {result.log.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className={`shrink-0 font-bold ${entry.status === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                    {entry.status === "ok" ? "✓" : "✗"}
                  </span>
                  <span className="text-gray-300">{entry.step}</span>
                  {entry.detail && <span className="text-gray-500 ml-auto text-right">{entry.detail}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => { setStep(1); setResult(null); setForm({ advertiserName: "", campaignName: "", tagline: "", primaryColor: "#22c55e", category: "", formats: ["billboard", "leaderboard", "mrec"], cpms: { billboard: 5.0, leaderboard: 4.5, mrec: 4.0 }, contextualKeywords: [] }); }}
            className="flex-1 py-3 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Onboard Another Advertiser
          </button>
          <a
            href="/admin/trafficking"
            className="flex-1 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 text-center transition-colors"
          >
            View in Trafficking Console →
          </a>
        </div>
      </div>
    );
  };

  const steps = [
    { n: 1, label: "Advertiser Info" },
    { n: 2, label: "Formats & CPMs" },
    { n: 3, label: "Targeting" },
    { n: 4, label: "Review" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <a href="/admin" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Admin Hub</a>
          </div>
          <h1 className="text-2xl font-bold text-white">Advertiser Onboarding</h1>
          <p className="text-gray-400 text-sm mt-1">
            Self-serve campaign setup — creates real Kevel entities via Management API.
          </p>
        </div>

        {/* Step progress (only show during wizard, not on result) */}
        {step < 5 && (
          <div className="flex items-center gap-3 mb-8">
            {steps.map(({ n, label }, i) => (
              <div key={n} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <StepBadge n={n} active={step === n} done={step > n} />
                  <span className={`text-sm hidden sm:block ${step === n ? "text-white font-medium" : step > n ? "text-gray-400" : "text-gray-600"}`}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px w-8 ${step > n ? "bg-emerald-600" : "bg-gray-700"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderResult()}
        </div>

        {/* Info strip */}
        {step < 5 && (
          <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs text-gray-600">
            <div><div className="text-gray-400 font-semibold mb-0.5">Real API calls</div>Creates actual Kevel entities</div>
            <div><div className="text-gray-400 font-semibold mb-0.5">Auto creatives</div>HTML generated from brand info</div>
            <div><div className="text-gray-400 font-semibold mb-0.5">Live in 15–30 min</div>Decision API propagation</div>
          </div>
        )}
      </div>
    </div>
  );
}
