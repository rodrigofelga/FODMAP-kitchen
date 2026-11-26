import type { Food, FoodCategory, FoodStatus, FoodTag, LabelWarn, Serve, Trigger, Verification } from '../foods';
import type { SourceId } from '../sources';
import type { Unit } from '../types';

/**
 * Compact row format for the 2026 Food Guide expansion.
 * [id, English name, Brazilian Portuguese name, status, verification, options]
 *
 * Classification rules (see docs/research/fodmap-evidence-notes.md):
 * - 'serve'      a Monash publication names this food with a low-FODMAP reference serve.
 * - 'listed'     a Monash publication names this food individually as low or high.
 * - 'clinical'   classified from a clinical reference (UpToDate).
 * - 'secondary'  a dietitian-reviewed secondary source reports Monash data.
 * - 'group'      classified from food-group guidance only (e.g. "plain meats",
 *                "wheat", "onion/garlic"); NOT individually tested.
 * - 'unverified' no FODMAP data found; kept LIMIT (or AVOID when it contains a
 *                known high-FODMAP ingredient) and labelled "not established".
 */
export interface Opts {
  a?: string[];
  t?: FoodTag[];
  s?: Serve;
  p?: [number, 'g' | 'ml'];
  tr?: Trigger[];
  w?: LabelWarn[];
  src?: SourceId[];
}

export type R = [id: string, en: string, pt: string, status: FoodStatus, v: Verification, o?: Opts];

export const PT: Record<string, string> = {};

const DEFAULT_SRC: Partial<Record<Verification, SourceId[]>> = { group: ['SL25'] };

export function group(category: FoodCategory, list: R[]): Food[] {
  return list.map(([id, en, pt, status, v, o = {}]) => {
    PT[id] = pt;
    const f: Food = { id, name: en, category, status, page: 0, audit: 'added', verification: v };
    const src = o.src ?? DEFAULT_SRC[v];
    if (src) f.sources = src;
    if (o.a) f.aliases = o.a;
    if (o.t) f.tags = o.t;
    if (o.s) f.serve = o.s;
    if (o.p) f.portion = { amount: o.p[0], unit: o.p[1] };
    if (o.tr) f.triggers = o.tr;
    if (o.w) f.warn = o.w;
    return f;
  });
}

/** A published low-FODMAP reference serve (not a maximum). `alt` is the same serve in a household unit, as published. */
export function sv(amount: number, unit: Unit, src: SourceId, alt?: [number, Unit]): Serve {
  const s: Serve = { amount, unit, src };
  if (alt) s.alt = { qty: alt[0], unit: alt[1] };
  return s;
}
