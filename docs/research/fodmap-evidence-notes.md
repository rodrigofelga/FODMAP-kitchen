# FODMAP evidence notes (research 25 Nov 2026; implemented in the Nov 2026 expansion)

Full citations with URLs and dates live in `src/data/sources.ts` and are shown in the app (Food Guide → Sources and limitations). A reference serve is an amount the source reports as low in FODMAPs. It is **not** a maximum safe amount, and the Monash app may hold newer values. Group guidance (e.g. "plain meats") is never presented as individual laboratory testing.

## Vinegar
- Implemented: merged into one EAT record `vinegar` ("white, wine, rice or cider"); the legacy id `vinegar-plain` still resolves to it so recipes, favourites and saved lists keep working. Balsamic is a separate LIMIT (`unverified`) record.
- Before: `vinegar` (seasonings, EAT) and `vinegar-plain` (sauces, EAT; the PDF also prints it in the EAT column). Both were EAT, so this was a duplicate, not a misclassification.
- Recipes use `vinegar` (dinner.ts:52) and `vinegar-plain` (dinner.ts:116, dinner.ts:438 rice vinegar, lunch.ts:409).
- No Monash serve found that compares balsamic with apple cider vinegar.

## [FIB21] Monash "Getting enough fibre", 14 Jan 2021 (J. Varney): low FODMAP serves
**Nuts and seeds**
- almond 12 g (10 nuts); hazelnut 15 g; peanut 28 g (32 nuts); walnut 30 g
- Brazil nut 40 g (10); macadamia 40 g (20)
- sunflower seed 6 g; linseed 15 g; chia 24 g (2 tbsp); tahini 30 g; almond meal 24 g

**Grains**
- rolled oats 52 g (uncooked); quinoa 155 g (cooked); brown rice 180 g (cooked)
- buckwheat 135 g (cooked); soba 90 g (dry); bulgur 44 g (uncooked)
- popcorn 60 g

**Fruit**
- unripe banana 100 g; mandarin 125 g; gold and green kiwi 150 g; orange 130 g
- pineapple 140 g; raspberry 60 g; passionfruit 46 g (2 fruit); pomegranate 45 g
- rhubarb 150 g; fresh coconut 64 g; dried goji 10 g

**Vegetables**
- 75 g each: green bean, red capsicum, eggplant, kale, potato, silverbeet, broccoli, carrot, parsnip, baby spinach
- corn on the cob 38 g; sun-dried tomato 8 g

**Legumes and soy**
- canned chickpea 42 g; boiled green lentil 23 g; firm tofu 160 g

## [DA24] Monash dairy alternatives, 20 Feb 2024
- UHT coconut milk: low at 3/4 cup, moderate at 250 ml
- oat milk: low up to 104 ml, high at 250 ml
- soy milk: low only if made from soy protein (whole-bean soy milk is high)
- almond milk: low, no ml figure published

## Alcohol
- Primary (Monash ALC18, 22 Jan 2018; ALC22, 23 Jun 2022): rum, red wine above 250 ml and sticky/dessert wine tested high. Spritzers and mineral water suggested as alternatives.
- Secondary (A Little Bit Yummy, RD-reviewed, cites Monash app v3.0.8, updated 13 Nov 2026): beer low (no ml serve given); red, white and dry white wine 150 ml; sparkling and sweet wine 1 glass; gin, vodka, whisky, brandy 30 ml; tequila reports conflict; cider untested and potentially high; alcohol-free beer untested.
- Implemented: rum, sticky wine, cider, rum cocktails AVOID; beer and lager LIMIT (low FODMAP per secondary data; alcohol, carbonation and gluten remain triggers — not classified high-FODMAP for lack of primary data); wine/spirits LIMIT with secondary serves. Alcohol is never EAT and is never presented as recommended.

## Tea and coffee
- Monash COVID self-care blog: chamomile high in fructans at 1 cup; peppermint and green tea low.
- Secondary (Kate Scarlata RDN, 6 Feb 2017, cites the Monash app): low — black, white, green, peppermint, rooibos, buchu, honeybush, weak chai, weak dandelion; high — fennel, chamomile, oolong. No primary ml serves found for coffee; caffeine listed as a non-FODMAP trigger.

## [FLAV15] Monash "Adding flavour without adding symptoms" (19 Mar 2015, updated 2026)
- Named as suitable: parsley, coriander (leaf), thyme, basil, rosemary, chives, ginger, cumin, coriander seed, turmeric, asafoetida (a pinch), chilli (capsaicin can irritate), lemon/lime juice, maple syrup, garlic-infused oil. These are EAT (`listed`).
- Herbs and spices not named individually (cinnamon, cloves, bay leaf, mint, etc.) are LIMIT (`group`) — not individually published.

## Fruit stacking (ST16, ST19, ST22)
- Monash advises spacing fruit and notes that several green serves together can add up. No published formula combines several fruits, so recipes with two or more fruits stay LIMIT even when each fruit is within its own serve. Each fruit is compared only with its own published serve, in the same unit.

## Not found / could not be read (kept cautious)
- Flocão (pre-cooked maize flakes): no FODMAP data — LIMIT (`unverified`).
- Primary gram serves for ricotta, cream cheese, halloumi, cottage cheese (secondary ~40 g only; not applied) — LIMIT (`listed`, portion-dependent). Requeijão, minas frescal and coalho: low-FODMAP suitability not established — LIMIT.
- Coffee ml serves, cola, coconut water and kombucha (secondary and conflicting only).
- Dark chocolate 30 g and peanut butter serves (secondary only; not applied — stay LIMIT).
- Individual Brazilian fruits (cupuaçu, cajá, pitanga, etc.): no data — LIMIT (`unverified`).
- Pages unavailable: Monash herbs/spices article (404), fermented drinks (404), vegan article (404); fodmapeveryday.com (403).
