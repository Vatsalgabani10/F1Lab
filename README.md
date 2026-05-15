# F1Lab

F1Lab is a Formula 1 analysis web app built with Next.js and Tailwind CSS.

## Main Selling Point: Race Winner Prediction

F1Lab’s core feature is a **race winner prediction system** for each Grand Prix.

For every race, users can open a dedicated prediction report and see:

- ranked win probabilities (`P1, P2, P3...`)
- why the model chose `P1` (top positive factors + main risks)
- score interpretation guide (`0-100`)
- beta model math used for ranking
- completed-race comparison: **actual `P1-P5` vs predicted `P1-P5`**

This prediction flow is the center of the product.

## Current Product Scope

- `Home`: visual landing page
- `Predictions`: full 2026 race list (scrollable)
- `Prediction Report`: one dedicated page per race with full model output
- `Completed Race Comparison`: actual `P1-P5` vs predicted `P1-P5`
- `Drivers`: standings-focused driver view

## Prediction Model (Beta)

The current model is a weighted hybrid prototype (`hybrid-v2-balanced`) with:

- weighted factor scoring per driver
- race-specific variance
- tempered softmax probability conversion
- capped top-win probability (for realism in beta)
- factor status system: `use`, `proxy`, `skip`

Note: this is not the final ML model yet; it is an explainable beta engine while data pipelines are being completed.

## How Prediction Flow Works

1. Open `/predictions`
2. Select any race from the full season list
3. View race-specific prediction report on `/predictions/[raceKey]`
4. For completed races, compare model picks against actual top-5 finish

## Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS
- MongoDB
- Cheerio

## Run Locally

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=f1lab
```

3. Start development server

```bash
npm run dev
```

4. Open the app

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run seed:seasons
```

## Data Notes

- Some endpoints rely on external official/public F1 result sources.
- If live fetch fails, the app can use fallback snapshots where available.
- Prediction outputs should be treated as beta model outputs, not betting advice.
