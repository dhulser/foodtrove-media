# FoodTrove Storefront — Vercel Deployment Guide

**Status:** Ready to deploy. Build is green (14 routes, TypeScript clean).  
**Last verified:** 2026-05-06 by Kai Okafor

---

## What's Working (pre-deploy verified)

- ✅ Next.js 16 / Tailwind 4 / TypeScript build: clean
- ✅ Kevel Decision API: ad fills verified (FreshFarm Organics billboard, Ad ID 1081404207)
- ✅ Ad slot graceful degradation (fallback renders on no-fill or error)
- ✅ Server-side API key proxy at `/api/ad-decision` (KEVEL_API_KEY never reaches client)
- ✅ Homepage billboard + leaderboard ad slots wired
- ✅ Product catalog with department + product pages

## Kevel Configuration (confirmed live)

| Resource | Value |
|---|---|
| Network ID | 12024 |
| Site ID | 1324936 (Web) |
| Decision API | `https://e-12024.adzerk.net/api/v2` |
| Test advertiser | FreshFarm Organics (ID: 6254651) |
| Test flight | Homepage Billboard Q2 2026 (ID: 863187467, IsUnlimited=true) |
| Test ad | ID 1081404207 (Creative 905327348 → Flight 863187467) |

---

## Option 1: Deploy via Vercel Dashboard (recommended, fastest)

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Connect GitHub account if needed, select `adzerk/foodtrove-media`
4. Set framework preset: **Next.js** (auto-detected)
5. Add environment variables:
   ```
   KEVEL_NETWORK_ID=12024
   KEVEL_API_KEY=6D3C8C29a1876a4463aB9D8a1C28AA64D205
   KEVEL_SITE_ID=1324936
   NEXT_PUBLIC_KEVEL_ENABLED=true
   NEXT_PUBLIC_KEVEL_NETWORK_ID=12024
   ```
6. Click **Deploy** — Vercel handles the build
7. Share the deployment URL

**Important:** Add all 5 environment variables above. Without `KEVEL_API_KEY`, the ad slots will render fallback placeholders instead of live ads.

---

## Option 2: Vercel CLI deploy (requires VERCEL_TOKEN)

```bash
cd /root/.openclaw/workspace-kai-okafor/foodtrove-storefront

# Set your token
export VERCEL_TOKEN=<your-vercel-token>

# Deploy with environment variables
vercel deploy \
  --token $VERCEL_TOKEN \
  --env KEVEL_NETWORK_ID=12024 \
  --env KEVEL_API_KEY=6D3C8C29a1876a4463aB9D8a1C28AA64D205 \
  --env KEVEL_SITE_ID=1324936 \
  --env NEXT_PUBLIC_KEVEL_ENABLED=true \
  --env NEXT_PUBLIC_KEVEL_NETWORK_ID=12024 \
  --yes

# To promote to production:
vercel promote <deployment-url> --token $VERCEL_TOKEN
```

---

## Option 3: GitHub Actions (requires VERCEL_TOKEN as GitHub secret)

The workflow file is at `.github/workflows/deploy.yml`.

Add these secrets to the GitHub repo (`adzerk/foodtrove-media`):
- `VERCEL_TOKEN` — from https://vercel.com/account/tokens
- `VERCEL_ORG_ID` — your Vercel org/team ID
- `VERCEL_PROJECT_ID` — created after first deploy (get from `.vercel/project.json`)

Then push any commit to `main` to trigger the workflow.

**Note:** The GitHub token in this environment has `repo` scope but not `workflow` scope.  
If pushing the workflow file fails, Dylan (dhulser) can push it from his local machine using a token with `workflow` scope.

---

## Post-Deploy Verification

After deploying, verify the ad is serving:

```bash
# Test the Decision API directly
curl -s -X POST https://e-12024.adzerk.net/api/v2 \
  -H 'Content-Type: application/json' \
  -d '{"placements":[{"divName":"home-hero-billboard","networkId":12024,"siteId":1324936,"adTypes":[5]}]}'

# Expect: "decisions":{"home-hero-billboard":{...}} (non-null)
```

The storefront homepage at `/` will show the FreshFarm Organics billboard (970×250 green gradient, HTML creative).

---

## Architecture Notes

- `/api/ad-decision` — server-side proxy; keeps API key off the client
- `components/AdSlot.tsx` — client component; calls the proxy, renders HTML creative
- `lib/kevel.ts` — Decision API client with graceful degradation
- `NEXT_PUBLIC_KEVEL_ENABLED=true` — tells client that Kevel is wired up (API key never sent to client)

The `%%clickurl%%` macro in the creative HTML is a Kevel placeholder — in a production creative it would be replaced by Kevel's click tracking URL. For the test creative it's fine as-is.
