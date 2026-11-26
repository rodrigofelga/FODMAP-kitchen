# FODMAP Kitchen — implementation checklist (Nov 2026 expansion)

Resume from here. Evidence and sources: `fodmap-evidence-notes.md` (this folder) and `src/data/sources.ts`.

## Research
- [x] Monash fibre article (FIB21, 14 Jan 2021): gram serves for nuts, seeds, oats, popcorn, fruit, vegetables, tofu.
- [x] Monash dairy alternatives (DA24, 20 Feb 2024): oat milk ≤104 ml; UHT coconut beverage ¾ cup; soy protein vs whole bean; coconut yoghurt low, soy yoghurt high.
- [x] Monash alcohol (ALC22, ALC18): rum, red wine >250 ml, sticky wine high; spritzer and mineral water suggested.
- [x] Monash flavour article (FLAV15): parsley, coriander, thyme, basil, rosemary, chives, ginger, cumin, coriander seed, turmeric, asafoetida (pinch), chilli (capsaicin), lemon/lime juice, maple syrup, garlic-infused oil.
- [x] Secondary: A Little Bit Yummy (RD-reviewed; Monash app v3.0.8) — beer low (no serve), wine 150 ml, spirits 30 ml, tequila conflicting, cider untested.
- [x] Secondary: Kate Scarlata RDN (2017; Monash app) — teas.
- [ ] Not found (kept cautious): flocão, cheeses' gram serves (primary), coffee ml serves (primary), soft-drink serves, coconut water, kombucha, individual Brazilian fruits and cheeses, dark chocolate and peanut-butter serves.
- Pages that could not be read: Monash herbs/spices article (404), fermented drinks (404), vegan article (404); fodmapeveryday.com (403).

## Implemented (data)
- [x] Source table `src/data/sources.ts` with primary / clinical / secondary / guide kinds.
- [x] `Food.verification`, `sources`, `serve` (reference serve, not a maximum), `portion` (practical), `triggers`, `warn`.
- [x] Corrections: rum → AVOID; beer → LIMIT (secondary data; not high FODMAP); cilantro, ginger, turmeric, green onion tops → EAT; vinegar consolidated (legacy id `vinegar-plain` mirrors `vinegar`); kabocha separated from butternut.
- [x] Pantry → food records: rice flour, tapioca starch, cornstarch (EAT); flocão (LIMIT, not tested); cumin, basil (EAT); cinnamon, cloves, bay leaf, mint (LIMIT, group only); sesame seeds (EAT).
- [x] New categories: Meat, poultry & game; Fish & seafood.
- [x] Expansion: 913 records total (290 before).

## Implemented (app)
- [x] Analysis: verified serves (same unit only), fruit stacking, optional-ingredient conditional warnings, guide-only uncertainty note.
- [x] Food Guide UI: serve / portion / triggers / label / verification notes; Sources and limitations list. No Food Guide photographs (photos remain on the 81 recipes only).
- [x] Terminology: EAT / LIMIT / AVOID and COMER / LIMITAR / EVITAR across UI, recipe tips, filters, badges and tests.
- [x] Kale wording in pt recipes (couve → couve kale; collard greens are a separate record).
- [x] Recipe verdicts: 26 EAT (was 11), 55 LIMIT, 0 AVOID.

## Tests
- [x] typecheck, ESLint, 287 unit tests (new: tests/unit/expansion.test.ts — integrity, category targets, sources, beverages, vinegar legacy id, bilingual search, serves, stacking, optional logic, terminology, no guide photos).
- [x] Playwright: 58 passed (29 × mobile + desktop), incl. guide verification notes, sources, no guide images, conditional optional warnings, offline, pt-BR, grocery list, recipe photos.

## Deployment
- [ ] Commit, push, `npm run deploy`, verify production.

## Known limitations
- 189 records have no FODMAP data (`unverified`) and 358 rest on food-group guidance only; 111 keep the original guide classification without independent verification.
- Serves are reference amounts, not maxima; the Monash app may hold newer values.
- Not clinically validated; not a substitute for a dietitian.
