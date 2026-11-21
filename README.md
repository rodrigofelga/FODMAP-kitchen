# My FODMAP Kitchen

A mobile-first, offline-capable Progressive Web App for following a low-FODMAP diet with Brazilian-style home cooking.

- **Food Guide** — all 251 foods from the supplied guide (`IBS_FODMAP_Five_Page_Refined.pdf`), in its three classifications (EAT · LIMIT / CHECK · AVOID FOR NOW), with Brazilian names kept, alphabetical order within each category, and search that understands Portuguese names.
- **Recipes** — 81 complete recipes (20 breakfast, 21 lunch, 20 dinner, 20 snacks), mostly Brazilian-style. Each has quantities, servings, timings, method, substitutions and an automatically computed dietary-suitability panel.
- **Ingredient Matcher** — pick what you have; get ready-to-cook and near-match recipes, with missing items listed and reasons for every inclusion or exclusion.
- **Meal Planner** — 7 days × breakfast, lunch, dinner and snack. Auto-generate a week, edit slots, keep several saved plans, and get a grocery list scaled to your household.
- **Settings** — household profiles, elimination/reintroduction phase, strict LIMIT handling, tolerated foods, excluded ingredients, diet filters, offline status, install, backup/restore and the dietary disclaimer.

No accounts, no servers, no paid services: everything runs in the browser, and data is kept in IndexedDB on the device.

## Dietary rules the app enforces

| Rule | Where |
| --- | --- |
| Recipes containing AVOID FOR NOW foods are never recommended during elimination | `src/lib/analysis.ts` · tests in `tests/unit/logic.test.ts` |
| LIMIT / CHECK foods are never treated as safe: each one is shown with its per-serving amount | `evaluateRecipe` |
| The recipe library contains no AVOID foods | `tests/unit/data.test.ts` |
| LIMIT foods labelled "small portion" stay within conservative per-serving caps in our recipes (an editorial QA guard, not source data) | `tests/unit/data.test.ts` |
| Pantry items the guide does not classify (rice flour, tapioca starch, sugar…) are labelled "Not in guide" | `src/data/pantry.ts` |

## Food photography

Photos come from [Foodiesfeed](https://www.foodiesfeed.com/) under its [licence](https://www.foodiesfeed.com/license) (CC0-equivalent; commercial use allowed, no attribution required). `scripts/fetch-images.mjs` follows Foodiesfeed's robots.txt and photo sitemap, fetches one page per photo at one request per second, downloads only the photo's own asset (never the sponsored Shutterstock or affiliate images on the page), and writes 4:3 WebP files at 480 and 960 px plus metadata (`src/data/images.json`): source page, asset URL, author, an AI-generated flag, licence and retrieval date.

Every candidate photo was reviewed by eye. Of the 81 recipes:

- **45** have a photo of the actual dish;
- **31** have a photo of a similar dish, labelled "Representative photo";
- **5** show a placeholder, because no accurate licensed photo was found. Foodiesfeed candidates were also rejected when they showed high-FODMAP foods such as honey, mango, watermelon, apple or red onion.

22 of these photos were supplied by the app owner (originals in `assets/owner-photos/`, mapped with a `file` entry in `scripts/image-map.json`). Owner photos that show ingredients the recipe leaves out (for example onion, mushrooms or peas) are labelled "Representative photo".

Rebuild the photos with `npm run images` (cached in `.image-cache/`).

## Development

```bash
npm ci
npm run dev          # http://localhost:5173
npm run check        # typecheck + lint + unit tests + production build
npm run test:e2e     # Playwright browser tests against `vite preview` (uses installed Edge; PW_CHANNEL=chrome to change)
```

## Deployment

Production is the Cloudflare **Worker** `fodmap-kitchen`, which serves `dist/` as static assets (`wrangler.jsonc`, SPA fallback enabled). It works two ways:

1. **Workers Builds (Git integration)** — a push to `main` triggers a build in Cloudflare. `wrangler.jsonc` sets `build.command = "npm run build"`, so `npx wrangler deploy` builds before uploading.
2. **Direct upload** — `npm run deploy` runs every check, then `wrangler deploy`.

Production URL: <https://fodmap-kitchen.rodrigofelga.workers.dev>

## Project layout

```
src/data/foods.ts         food guide (verbatim from the PDF)
src/data/pantry.ts        unclassified pantry staples
src/data/recipes/*.ts     recipes by meal
src/data/images.json      photo metadata (generated)
src/lib/                  analysis, matcher, planner, storage
src/pages/                screens
scripts/                  image + icon generators
tests/unit, tests/e2e     Vitest and Playwright suites
```

## Disclaimer

This app organises a personal food guide. It is not medical advice. Work with a doctor or registered dietitian on the elimination and reintroduction phases.
