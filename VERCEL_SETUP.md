# FoodTrove Storefront — Vercel Deployment Guide

**Status as of 2026-05-06:** Build is green. GitHub Actions workflow is ready at `.github/workflows/deploy.yml`. Needs Vercel account + token to activate.

---

## One-Time Setup (10 minutes)

### 1. Create Vercel Project

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import from GitHub: `adzerk/foodtrove-media`
3. Framework: **Next.js** (auto-detected)
4. Root Directory: `/` (leave as default — the `package.json` is at repo root)
5. **Do NOT deploy yet** — add env vars first (step 3)

### 2. Add Environment Variables in Vercel

In the Vercel project settings → Environment Variables, add:

| Variable | Value | Environments |
|---|---|---|
| `KEVEL_NETWORK_ID` | `12024` | Production, Preview, Development |
| `KEVEL_API_KEY` | `6D3C8C29a1876a4463aB9D8a1C28AA64D205` | Production, Preview |
| `KEVEL_SITE_ID` | `1324936` | Production, Preview, Development |
| `NEXT_PUBLIC_KEVEL_ENABLED` | `true` | Production, Preview, Development |
| `NEXT_PUBLIC_KEVEL_NETWORK_ID` | `12024` | Production, Preview, Development |

> ⚠️ `KEVEL_API_KEY` should be marked **Sensitive** in Vercel. It never reaches the client — the Next.js API route (`/api/ad-decision`) keeps it server-side.

### 3. Get Vercel Token and IDs for GitHub Actions

**Token:**
1. Vercel Dashboard → Settings → Tokens → Create Token
2. Name: `foodtrove-github-actions`
3. Copy the token — you won't see it again

**Project and Org IDs:**
1. In your project directory locally (or in Vercel project settings → General):
   - `VERCEL_ORG_ID` — your team/personal ID (shown in Vercel settings)
   - `VERCEL_PROJECT_ID` — shown in the project's General settings

**Add to GitHub Secrets:**
1. Go to: `https://github.com/adzerk/foodtrove-media/settings/secrets/actions`
2. Add these secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `KEVEL_NETWORK_ID` = `12024`
   - `KEVEL_API_KEY` = (the Kevel API key)
   - `KEVEL_SITE_ID` = `1324936`

### 4. Deploy

Push any commit to `main` — the GitHub Actions workflow will build and deploy automatically.

Or deploy manually from the Vercel dashboard once env vars are set.

---

## What's Deployed

| Page | URL | Notes |
|---|---|---|
| Homepage | `/` | Hero billboard + department grid + featured products |
| All Departments | `/shop` | Department overview |
| Department Page | `/shop/produce`, `/shop/dairy`, etc. | 8 departments, full product grids |
| Product Detail | `/shop/produce/organic-apples` | PDP with right-rail ad slot |
| Ad Decision API | `/api/ad-decision` | Server-side Kevel proxy (keeps API key secret) |

---

## Ad Slots (Kevel Placements)

| Placement ID | Size | Location |
|---|---|---|
| `home-hero-billboard` | 970×250 | Homepage, above-fold |
| `home-mid-leaderboard` | 728×90 | Homepage, below departments |
| `dept-{slug}-top-leaderboard` | 728×90 | Department page, above products |
| `dept-{slug}-right-rail-mrec` | 300×250 | Department page, right rail |
| `product-{id}-right-rail` | 300×250 | Product page, right rail |
| `product-{id}-mid-leaderboard` | 728×90 | Product page, below description |

---

## Known Issue — Test Campaign Not Serving

A test advertiser, campaign, flight, and creative exist in Kevel Network 12024:

| Resource | ID | Name |
|---|---|---|
| Advertiser | 6254651 | FreshFarm Organics |
| Campaign | 659158534 | FreshFarm Organics — Test Q2 2026 |
| Flight | 863187467 | FreshFarm — Homepage Billboard Q2 2026 |
| Creative (HTML) | 905327348 | FreshFarm — Billboard 970x250 HTML |

**Blocker:** The creative-to-flight link (Kevel "Creative Map") cannot be created via the Management API on this network. Endpoints `/creative/map` (POST) and `/flight/{id}/ad` (POST) both return 404. The GET endpoints for advertiser/campaign/flight/creative all work fine — only the create-creative-map endpoint is missing.

**Fix:** Log into the Kevel dashboard at https://app.kevel.co → Network 12024 → locate the FreshFarm campaign → attach the HTML creative (ID 905327348) to the flight (ID 863187467) manually through the UI.

Once that link is made, ad slots will fill on the live site.

---

## Local Development

```bash
cd /root/.openclaw/workspace-kai-okafor/foodtrove-storefront
npm run dev
```

Runs at http://localhost:3000. Uses `.env.local` for credentials (already configured).
