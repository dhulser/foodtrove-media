# FoodTrove Storefront — Implementation Plan

**Author:** Kai Okafor  
**Status:** In progress  
**Last updated:** 2026-05-06 (session 3)  
**Stack:** Next.js 16 (App Router) + Tailwind 4 + TypeScript + Static JSON catalog + Kevel ad slots

---

## Overview

Building the FoodTrove shopper-facing storefront from scratch. This is a browse-only e-commerce frontend — no checkout, no payments. The primary purpose is to create a visually polished, demo-ready retail media network surface with ad placements wired to Kevel from day one.

---

## Department Taxonomy

8 departments, each with 9–12 SKUs:

| ID | Name | SKU Count |
|----|------|-----------|
| produce | Produce | 12 |
| dairy | Dairy & Eggs | 12 |
| bakery | Bakery & Bread | 12 |
| snacks | Snacks & Chips | 12 |
| beverages | Beverages | 12 |
| meat-seafood | Meat & Seafood | 9 |
| frozen | Frozen Foods | 10 |
| household | Household & Cleaning | 12 |

**Total: ~91 SKUs across 8 departments.** Each SKU has: name, brand, SKU code, price, unit, description, tags, rating, review count, in-stock flag, sponsored flag.

---

## Page Structure

### `/` — Homepage
- Placement: `home-hero-billboard` (970×250, above fold)
- Hero section (brand, CTA)
- Department grid (8 cards)
- Placement: `home-mid-leaderboard` (728×90)
- Featured/Sponsored products grid (12 items)
- Value props strip

### `/shop` — All Departments
- Simple grid of department cards
- No ad placements (low-traffic utility page)

### `/shop/[slug]` — Department Page (SSG)
- Placement: `dept-{id}-top-leaderboard` (728×90, above grid)
- Sponsored products section (products with `sponsored: true`)
- Full product grid
- Placement: `dept-{id}-inline-{n}` (728×90, every 10 products, inline)
- Right rail (desktop): `dept-{id}-right-rail-mrec` + `-mrec-2` (300×250 × 2, sticky)

### `/shop/[slug]/[productId]` — Product Detail Page (dynamic)
- Breadcrumb nav
- Hero: product image + details + rating + price + Add to Cart (visual only)
- Right rail (desktop): `product-{id}-right-rail` (300×250, sticky)
- Placement: `product-{id}-mid-leaderboard` (728×90)
- Related products grid (up to 6 items from same department)

---

## Ad Placement Spec

| Placement ID Pattern | Page | Size | Position |
|----------------------|------|------|----------|
| `home-hero-billboard` | Home | 970×250 | Above fold, full-width center |
| `home-mid-leaderboard` | Home | 728×90 | Between dept grid and featured products |
| `dept-{id}-top-leaderboard` | Department | 728×90 | Above product grid |
| `dept-{id}-right-rail-mrec` | Department | 300×250 | Right rail, sticky (2 units) |
| `dept-{id}-inline-{n}` | Department | 728×90 | Every 10 products in grid |
| `product-{id}-right-rail` | Product | 300×250 | Right rail, sticky |
| `product-{id}-mid-leaderboard` | Product | 728×90 | Between product and related |

**Total placement types: 7.**

AdSlot behavior:
- Credentials present → fires `/api/ad-decision` → renders live creative
- No credentials → debug placeholder (if `debug=true`) or subtle fallback
- No fill / error → `FallbackCreative` component — never blank space

---

## Component Structure

```
components/
  Nav.tsx              — Sticky header + department nav strip
  Footer.tsx           — Brand info, department links, utility links
  ProductCard.tsx      — Product grid card (server component) — uses ProductImage
  ProductImage.tsx     — Styled product image fallback (deterministic per product)
  AddToCartButton.tsx  — Client component (needs event handler)
  AdSlot.tsx           — Kevel ad slot wrapper (client component, live + fallback)

lib/
  types.ts             — TypeScript types (Product, Department, AdSlotSize, etc.)
  catalog.ts           — Data access functions (getDepartmentBySlug, getFeaturedProducts, etc.)
  catalog.json         — Static product catalog (all 8 departments, all SKUs)
  kevel.ts             — Kevel Decision API client (fetchAdDecision, getWinner, fireImpression)

app/
  layout.tsx           — Root layout (Nav + Footer + metadata)
  page.tsx             — Homepage
  globals.css          — Tailwind 4 base styles
  api/
    ad-decision/
      route.ts         — Server-side Kevel proxy (keeps API key server-side)
  shop/
    page.tsx           — All departments
    [slug]/
      page.tsx         — Department page (SSG via generateStaticParams)
      [productId]/
        page.tsx       — Product detail (dynamic)
```

---

## Kevel Integration

### Current state (no credentials)
- `AdSlot.tsx` renders debug placeholders in dev mode, subtle fallbacks in prod
- `lib/kevel.ts` is complete — `fetchAdDecision`, `getWinner`, `fireImpression`
- `/api/ad-decision` route is wired — ready to receive requests
- Graceful no-fill handling: `FallbackCreative` renders on empty response, not blank space

### When credentials land
1. Set `KEVEL_NETWORK_ID` and `KEVEL_API_KEY` in environment
2. Set `siteId` and optional `adTypes` on each `<AdSlot>` instance
3. AdSlot automatically transitions from placeholder to live decisioning
4. No page layout changes needed — component boundary is clean

### Environment variables needed
```
KEVEL_NETWORK_ID=<network id>
KEVEL_API_KEY=<api key>
```

---

## Build Status

`npm run build` passes clean as of 2026-05-06 session 3. **14 pages/routes:**
- `/`, `/_not-found`, `/shop`
- `/api/ad-decision` (dynamic — Kevel proxy)
- `/shop/produce`, `/shop/dairy`, `/shop/bakery`, `/shop/snacks`, `/shop/beverages`, `/shop/meat-seafood`, `/shop/frozen`, `/shop/household`
- `/shop/[slug]/[productId]` (dynamic, rendered on demand)

---

## Remaining Work

- [ ] Deployment / hosting decision (Vercel, self-hosted, etc.) — blocked on Diana's direction
- [ ] Kevel API credentials — blocked on James provisioning them
- [ ] Live AdSlot rendering — unblocks when credentials land (1-2 days from there)
- [ ] Real product photography — not needed for demo; ProductImage fallbacks cover it
- [ ] Search functionality (search bar UI exists, no handler wired)
- [ ] Cart state (AddToCartButton exists, browse-only MVP — no state needed now)
- [ ] GitHub repo setup — Diana mentioned James wants work visible

---

## Session Log

### Session 1 (2026-05-06 ~01:24)
- Initialized Next.js 16 / Tailwind 4 / TypeScript project
- Built static product catalog (8 departments, ~91 SKUs)
- Built all pages: `/`, `/shop`, `/shop/[slug]`, `/shop/[slug]/[productId]`
- Built all components: Nav, Footer, ProductCard, AddToCartButton, AdSlot
- Wired 7 ad placement types as labeled debug placeholders
- Build green (13 static pages)

### Session 2 (2026-05-06 ~01:38)
- Estimated Kevel integration timeline: 1 day realistic, 2 with buffer
- Confirmed styled fallbacks approach (Diana approved)
- Diana noted: graceful degradation on no-fill is required before integration is "done"

### Session 3 (2026-05-06 ~03:12)
- Built `ProductImage.tsx` — deterministic per-product styled fallbacks (unique hue per product ID, not generic emoji)
- Updated `ProductCard.tsx` and product detail page to use `ProductImage`
- Built `lib/kevel.ts` — complete Kevel Decision API client with typed interfaces
- Built `AdSlot.tsx` v2 — live ad decisioning + `FallbackCreative` for no-fill/error (not blank)
- Built `/api/ad-decision` API route — server-side Kevel proxy (API key stays server-side)
- Build green (14 routes, TypeScript clean)
