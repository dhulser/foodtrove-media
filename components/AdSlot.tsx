/**
 * Kevel Ad Slot — renders live Kevel ad decisions or a graceful fallback.
 *
 * Behavior:
 * - If KEVEL_NETWORK_ID + KEVEL_API_KEY are set: fires Decision API request,
 *   renders the winning creative (HTML body or image)
 * - If no credentials: renders a labeled placeholder (current state)
 * - If credentials are set but no fill returned: renders the fallback creative,
 *   NOT blank space — blank space is not acceptable on a live storefront
 * - If network error: same as no-fill — fallback, not blank
 *
 * Placement spec:
 * - leaderboard:         728×90  — site header, above-fold banner
 * - billboard:           970×250 — homepage hero ad unit
 * - medium-rectangle:    300×250 — sidebar, product page right rail
 * - half-page:           300×600 — deep sidebar unit
 * - inline-product:      variable — sponsored product in product grid
 *
 * When Kevel credentials land:
 * 1. Set KEVEL_NETWORK_ID and KEVEL_API_KEY in environment
 * 2. Pass siteId and optional adTypes props
 * 3. Remove debug={true} from all AdSlot usages (or keep for staging)
 */
"use client";

import { useEffect, useRef, useState } from "react";
import type { AdSlotSize } from "@/lib/types";

// Client-safe credential check — uses NEXT_PUBLIC_ env vars (never the API key)
function kevelEnabled(): boolean {
  return process.env.NEXT_PUBLIC_KEVEL_ENABLED === "true";
}

const SIZE_MAP: Record<AdSlotSize, { width: number; height: number; label: string }> = {
  leaderboard: { width: 728, height: 90, label: "Leaderboard (728×90)" },
  billboard: { width: 970, height: 250, label: "Billboard (970×250)" },
  "medium-rectangle": { width: 300, height: 250, label: "Medium Rectangle (300×250)" },
  "half-page": { width: 300, height: 600, label: "Half Page (300×600)" },
  skyscraper: { width: 160, height: 600, label: "Skyscraper (160×600)" },
  "inline-product": { width: 220, height: 320, label: "Inline Product" },
};

// Fallback creative — rendered when Kevel returns no fill or errors
// Visually distinct from blank space; indicates an ad placement exists
function FallbackCreative({ size, label }: { size: AdSlotSize; label: string }) {
  const { width, height } = SIZE_MAP[size];
  return (
    <div
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded"
      style={{ minHeight: height }}
      role="img"
      aria-label="Advertisement placeholder"
    >
      <div className="flex flex-col items-center gap-1 opacity-40">
        <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        <span className="text-[9px] font-mono text-stone-400">AD</span>
      </div>
    </div>
  );
}

// Debug placeholder — only shown in dev/demo mode (debug=true)
function DebugPlaceholder({ size, label, placementId }: { size: AdSlotSize; label: string; placementId: string }) {
  const { height } = SIZE_MAP[size];
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2"
      style={{ minHeight: height }}
    >
      <span className="text-xs font-mono text-stone-400 text-center leading-tight">
        {label}
      </span>
      <span className="text-[10px] font-mono text-stone-300">
        placement: {placementId}
      </span>
      <div className="mt-1 px-2 py-0.5 rounded bg-amber-100 border border-amber-300">
        <span className="text-[10px] font-semibold text-amber-700">KEVEL AD SLOT</span>
      </div>
    </div>
  );
}

interface AdSlotProps {
  size: AdSlotSize;
  placementId: string;
  siteId?: number;
  adTypes?: number[];
  className?: string;
  /** Show debug borders and placement label (dev/demo mode) */
  debug?: boolean;
}

type AdState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "filled"; html: string; clickUrl: string; impressionUrl: string }
  | { status: "no-fill" }
  | { status: "no-credentials" };

export default function AdSlot({
  size,
  placementId,
  siteId,
  adTypes,
  className = "",
  debug = false,
}: AdSlotProps) {
  const { width, height, label } = SIZE_MAP[size];
  const [adState, setAdState] = useState<AdState>({ status: "idle" });
  const impressionFired = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAd() {
      // Check if credentials are available without importing server-side env directly
      const hasCredentials = kevelEnabled();
      if (!hasCredentials) {
        if (!cancelled) setAdState({ status: "no-credentials" });
        return;
      }

      if (!cancelled) setAdState({ status: "loading" });

      try {
        // Call our internal Next.js API route (keeps API key server-side)
        const response = await fetch("/api/ad-decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placementId,
            siteId,
            adTypes,
          }),
        });

        if (!response.ok || cancelled) {
          if (!cancelled) setAdState({ status: "no-fill" });
          return;
        }

        const data = await response.json();

        if (data.filled && data.html) {
          if (!cancelled) {
            setAdState({
              status: "filled",
              html: data.html,
              clickUrl: data.clickUrl ?? "",
              impressionUrl: data.impressionUrl ?? "",
            });
          }
        } else {
          if (!cancelled) setAdState({ status: "no-fill" });
        }
      } catch {
        if (!cancelled) setAdState({ status: "no-fill" });
      }
    }

    loadAd();
    return () => { cancelled = true; };
  }, [placementId, siteId, adTypes]);

  // Fire impression pixel once ad is visible
  useEffect(() => {
    if (adState.status === "filled" && !impressionFired.current && adState.impressionUrl) {
      impressionFired.current = true;
      fetch(adState.impressionUrl, { method: "GET", mode: "no-cors" }).catch(() => {
        // Non-fatal — swallow silently
      });
    }
  }, [adState]);

  const isNoCredentials = adState.status === "no-credentials" || adState.status === "idle";
  const isDebugMode = debug && isNoCredentials;

  return (
    <div
      id={`kevel-ad-${placementId}`}
      data-placement-id={placementId}
      data-ad-size={size}
      data-ad-state={adState.status}
      className={`relative overflow-hidden ${isDebugMode ? "bg-stone-50 border border-dashed border-stone-300" : ""} ${className}`}
      style={{ width: size === "inline-product" ? "100%" : width, minHeight: height }}
      aria-label="Advertisement"
    >
      {/* Filled: render live creative */}
      {adState.status === "filled" && (
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: adState.html }}
        />
      )}

      {/* No fill or error: render subtle fallback (not blank) */}
      {(adState.status === "no-fill") && (
        <FallbackCreative size={size} label={label} />
      )}

      {/* No credentials: debug placeholder in dev mode, fallback in prod */}
      {isNoCredentials && (
        isDebugMode ? (
          <DebugPlaceholder size={size} label={label} placementId={placementId} />
        ) : (
          <FallbackCreative size={size} label={label} />
        )
      )}

      {/* Loading state: same dimensions, invisible */}
      {adState.status === "loading" && (
        <div className="absolute inset-0 bg-stone-50 animate-pulse" />
      )}
    </div>
  );
}
