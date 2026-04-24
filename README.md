# Speciale Fitness — Lead Gen Dashboard

Password-protected dashboard for Nicholas to view lead gen output from the `aspeciale02/Nicholas_Project` repo.

**Password:** `speciale2026`

## What it shows

- **Leads** — B2C prospect cards with status tracking (New / Contacted / Responded / Booked). Status stored in `localStorage`.
- **SEO Pages** — Landing pages ready to publish to specialefitness.ca. Expandable with "Copy Content" button.
- **Outreach** — Personalized DMs and emails grouped by handle. Copy DM / Copy Email buttons.
- **Content Calendar** — 30-day Instagram/TikTok calendar. Filter by platform. Copy Caption / Copy Script.

Data pulled live from `aspeciale02/Nicholas_Project` via the GitHub API (no token required — public repo).

---

## Deploy to Vercel (5 minutes)

### Option A — Vercel dashboard (recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select `aspeciale02/speciale-fitness-dashboard`
4. Leave all settings default — no environment variables needed
5. Click **Deploy**

Done. Vercel auto-detects Next.js and builds it. You'll get a URL like `speciale-fitness-dashboard.vercel.app`.

### Option B — Vercel CLI

```bash
npm install -g vercel
cd /path/to/speciale-fitness-dashboard
vercel --prod
```

Follow the prompts. Link to `aspeciale02` account, accept defaults.

---

## Local development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## Tech stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- TypeScript
- No backend — reads from GitHub API, status in localStorage
- No environment variables required

---

## How lead status works

Each lead card has a status badge (New → Contacted → Responded → Booked). Click it to cycle. Stored in `localStorage` under `sf_status_<handle>`. This is per-browser — if Nicholas uses multiple devices, status won't sync. If sync becomes important, replace with a simple Supabase table.
