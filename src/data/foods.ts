/**
 * Food guide imported verbatim from "IBS_FODMAP_Five_Page_Refined.pdf" (5 pages).
 *
 * Every entry below corresponds to one bullet in the PDF. Names, Brazilian names,
 * classifications and parenthetical caveats are preserved exactly as printed.
 * Where the PDF text itself is cut off mid-sentence, `sourceTruncated` is set and
 * nothing has been invented to complete it.
 *
 * `aliases` are search helpers only (mostly Portuguese equivalents) and carry no
 * dietary meaning. `tags` are used to compute diet suitability (vegetarian etc.).
 *
 * Dietary accuracy audit (Nov 2026): records marked `audit: 'corrected'` differ
 * from the PDF, and records marked `audit: 'added'` (page 0) are not in the PDF.
 * Both rest only on Monash University FODMAP publications (2026 3-step diet
 * sheet, high/low food list, label-reading guidance) and UpToDate graphic 90186
 * (Shepherd, Lomer & Gibson 2013). No serving threshold was invented: a food that
 * is a FODMAP source without a published low serve is LIMIT, not AVOID.
 */

import { EXPANSION } from './expansion';
import type { SourceId } from './sources';
import type { Unit } from './types';

export type FoodStatus = 'eat' | 'limit' | 'avoid';

export type FoodCategory =
  | 'vegetables'
  | 'fruit'
  | 'starches'
  | 'meat'
  | 'seafood'
  | 'protein'
  | 'dairy'
  | 'legumes'
  | 'seasonings'
  | 'sauces'
  | 'snacks'
  | 'drinks'
  | 'prepared';

export type FoodTag =
  | 'meat'
  | 'poultry'
  | 'pork'
  | 'fish'
  | 'seafood'
  | 'egg'
  | 'dairy'
  | 'nuts'
  | 'peanut'
  | 'gluten'
  | 'alcohol'
  | 'spicy';

/**
 * How a classification is supported (see src/data/expansion/helper.ts):
 * serve > listed > clinical > secondary > group > unverified; 'guide' means the
 * original guide's classification, not independently verified.
 */
export type Verification = 'serve' | 'listed' | 'clinical' | 'secondary' | 'group' | 'unverified' | 'guide';

/** Non-FODMAP reasons a food or drink may cause symptoms. */
export type Trigger = 'caffeine' | 'alcohol' | 'carbonation' | 'acidity' | 'fat' | 'spicy';

/** Ingredients to look for on the label. */
export type LabelWarn = 'hfcs' | 'honey' | 'fruitJuice' | 'polyols' | 'inulin' | 'lactose' | 'garlicOnion' | 'wheat' | 'sweeteners';

/**
 * A published low-FODMAP reference serve. It is the amount the source reports as
 * low ("green"), not a maximum safe amount. `alt` is the same serve in the
 * household unit the source printed (never a conversion made by this app).
 */
export interface Serve {
  amount: number;
  unit: Unit;
  alt?: { qty: number; unit: Unit };
  src: SourceId;
}

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  status: FoodStatus;
  /** PDF page the entry appears on (1–5); 0 for audit additions. */
  page: number;
  aliases?: string[];
  tags?: FoodTag[];
  /** The PDF line is visibly cut off; the printed text is kept as-is. */
  sourceTruncated?: boolean;
  /** Changed ('corrected') or added ('added') by the Nov 2026 dietary accuracy audit. */
  audit?: 'corrected' | 'added';
  verification: Verification;
  sources?: SourceId[];
  serve?: Serve;
  /** A practical portion (a can, a glass) — not a tested threshold. */
  portion?: { amount: number; unit: 'g' | 'ml' };
  triggers?: Trigger[];
  warn?: LabelWarn[];
}

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  vegetables: 'Vegetables & herbs',
  fruit: 'Fruit',
  starches: 'Rice, bread & starches',
  meat: 'Meat, poultry & game',
  seafood: 'Fish & seafood',
  protein: 'Eggs, tofu & other proteins',
  dairy: 'Dairy & alternatives',
  legumes: 'Beans, legumes & nuts',
  seasonings: 'Oils, herbs & seasonings',
  sauces: 'Sauces & condiments',
  snacks: 'Snacks, sweets & desserts',
  drinks: 'Drinks & alcohol',
  prepared: 'Prepared meals & other',
};

export const CATEGORY_ORDER: FoodCategory[] = [
  'vegetables',
  'fruit',
  'starches',
  'meat',
  'seafood',
  'protein',
  'dairy',
  'legumes',
  'seasonings',
  'sauces',
  'snacks',
  'drinks',
  'prepared',
];

export const STATUS_LABELS: Record<FoodStatus, string> = {
  eat: 'EAT',
  limit: 'LIMIT',
  avoid: 'AVOID',
};

type Row = [id: string, name: string, extra?: Partial<Pick<Food, 'aliases' | 'tags' | 'sourceTruncated' | 'audit'>>];

function rows(category: FoodCategory, status: FoodStatus, page: number, list: Row[]): Food[] {
  return list.map(([id, name, extra]) => ({ id, name, category, status, page, verification: 'guide' as Verification, ...extra }));
}

const GUIDE_FOODS: Food[] = [
  // ───────────── Page 1 — Vegetables & herbs ─────────────
  ...rows('vegetables', 'eat', 1, [
    ['carrots', 'Carrots', { aliases: ['cenoura'] }],
    ['cucumber', 'Cucumber', { aliases: ['pepino'] }],
    ['eggplant', 'Eggplant', { aliases: ['berinjela', 'aubergine'] }],
    ['kale', 'Kale', { aliases: ['couve kale', 'couve-crespa'], audit: 'corrected' }],
    ['lettuce', 'Lettuce', { aliases: ['alface'] }],
    ['potatoes-white', 'Potatoes (white)', { aliases: ['batata', 'batata inglesa'] }],
    ['spinach', 'Spinach', { aliases: ['espinafre'] }],
    ['tomatoes', 'Tomatoes', { aliases: ['tomate'] }],
  ]),
  ...rows('vegetables', 'limit', 1, [
    ['avocado-small', 'Avocado (small portion)', { aliases: ['abacate'] }],
    ['beets', 'Beets / beetroot', { aliases: ['beterraba'] }],
    ['bell-peppers-red', 'Bell peppers (red)', { aliases: ['pimentão vermelho', 'pimentao'] }],
    ['broccoli-heads', 'Broccoli heads', { aliases: ['brócolis', 'brocolis'] }],
    ['brussels-sprouts', 'Brussels sprouts', { aliases: ['couve-de-bruxelas'] }],
    ['butternut-squash', 'Butternut squash', { aliases: ['abóbora', 'abobora', 'abóbora cabotiá'] }],
    ['cabbage', 'Cabbage (green, red, Savoy)', { aliases: ['repolho'] }],
    ['celery-stalks', 'Celery stalks', { aliases: ['salsão', 'aipo'] }],
    ['green-beans', 'Green beans', { aliases: ['vagem'] }],
    ['green-onion-tops', 'Green onions (green tops only)', { aliases: ['cebolinha', 'scallion'] }],
    ['okra', 'Okra', { aliases: ['quiabo'] }],
    ['pimenta-biquinho', 'Pimenta biquinho', { tags: ['spicy'] }],
    ['sweet-corn', 'Sweet corn', { aliases: ['milho', 'milho verde'] }],
    ['sweet-potatoes', 'Sweet potatoes', { aliases: ['batata-doce', 'batata doce'] }],
    ['zucchini', 'Zucchini', { aliases: ['abobrinha', 'courgette'] }],
  ]),
  ...rows('vegetables', 'avoid', 1, [
    ['artichokes', 'Artichokes', { aliases: ['alcachofra'] }],
    ['asparagus', 'Asparagus', { aliases: ['aspargo'] }],
    ['broccoli-stalks-large', 'Broccoli stalks (large portion)', { aliases: ['talo de brócolis'] }],
    ['cauliflower', 'Cauliflower', { aliases: ['couve-flor'] }],
    ['garlic', 'Garlic', { aliases: ['alho'] }],
    ['leeks-white', 'Leeks (white part)', { aliases: ['alho-poró', 'alho poro'] }],
    ['mushrooms', 'Mushrooms (button, portobello, shiitake)', { aliases: ['cogumelo', 'champignon'] }],
    ['onions-red', 'Onions (red)', { aliases: ['cebola roxa'] }],
    ['onions-yellow', 'Onions (yellow)', { aliases: ['cebola', 'white onion', 'cebola branca'] }],
    ['shallots', 'Shallots', { aliases: ['chalota', 'echalote'] }],
    ['snow-peas-large', 'Snow peas (large portion)', { aliases: ['ervilha-torta'] }],
  ]),

  // ───────────── Page 1 — Fruit ─────────────
  ...rows('fruit', 'eat', 1, [
    ['banana-firm', 'Banana (firm/unripe)', { aliases: ['banana verde', 'banana firme'] }],
    ['cantaloupe', 'Cantaloupe', { aliases: ['melão cantalupo', 'melao'] }],
    ['grapes', 'Grapes', { aliases: ['uva'] }],
    ['kiwi', 'Kiwi'],
    ['mandarins-moderate', 'Mandarins (moderate)', { aliases: ['tangerina', 'mexerica', 'bergamota'] }],
    ['oranges', 'Oranges', { aliases: ['laranja'] }],
    ['papaya', 'Papaya', { aliases: ['mamão', 'mamao'] }],
    ['pineapple', 'Pineapple', { aliases: ['abacaxi'] }],
    ['strawberries', 'Strawberries', { aliases: ['morango'] }],
  ]),
  ...rows('fruit', 'limit', 1, [
    ['apricots', 'Apricots', { aliases: ['damasco'] }],
    ['banana-ripe', 'Banana (ripe/spotted)', { aliases: ['banana madura'] }],
    ['blackberries', 'Blackberries', { aliases: ['amora'] }],
    ['blueberries', 'Blueberries', { aliases: ['mirtilo'] }],
    ['grapefruit', 'Grapefruit', { aliases: ['toranja'] }],
    ['honeydew', 'Honeydew melon', { aliases: ['melão'] }],
    ['jabuticaba', 'Jabuticaba (portion data uncertain)'],
    ['mandarins-large', 'Mandarins (large portions)', { aliases: ['tangerina', 'mexerica'] }],
    ['plums-small', 'Plums (small portions)', { aliases: ['ameixa'] }],
    ['raspberries', 'Raspberries', { aliases: ['framboesa'] }],
  ]),
  ...rows('fruit', 'avoid', 1, [
    ['apples-gala', 'Apples (Gala)', { aliases: ['maçã', 'maca'] }],
    ['cherries', 'Cherries', { aliases: ['cereja'] }],
    ['dried-fruit', 'Dried fruit (dates, figs, raisins)', { aliases: ['tâmara', 'figo', 'uva-passa', 'passas'] }],
    ['mango', 'Mango', { aliases: ['manga'] }],
    ['nectarines', 'Nectarines', { aliases: ['nectarina'] }],
    ['peaches', 'Peaches', { aliases: ['pêssego', 'pessego'] }],
    ['pears', 'Pears', { aliases: ['pera', 'pêra', 'nashi', 'nashi pear', 'pera nashi'] }],
    ['plums-large', 'Plums (large portions)', { aliases: ['ameixa'] }],
    ['watermelon', 'Watermelon', { aliases: ['melancia'] }],
  ]),

  // ───────────── Page 2 — Rice, bread & starches ─────────────
  ...rows('starches', 'eat', 2, [
    ['brown-rice', 'Brown rice', { aliases: ['arroz integral'] }],
    ['polenta', 'Polenta (plain)', { aliases: ['fubá', 'fuba', 'angu', 'cornmeal'] }],
    ['potatoes', 'Potatoes', { aliases: ['batata'] }],
    ['quinoa', 'Quinoa'],
    ['rice-basmati', 'Rice (basmati)', { aliases: ['arroz basmati'] }],
    ['rice-white', 'Rice (white)', { aliases: ['arroz branco', 'arroz'] }],
    ['rice-noodles', 'Rice noodles', { aliases: ['macarrão de arroz', 'bifum'] }],
  ]),
  ...rows('starches', 'limit', 2, [
    ['air-fried-fries', 'Air-fried French fries', { aliases: ['batata frita na airfryer'] }],
    ['barley-small', 'Barley (small portions)', { aliases: ['cevada'], tags: ['gluten'] }],
    ['broa-de-fuba', 'Broa de fubá (recipe check)', { aliases: ['broa'] }],
    ['corn-tortilla-wraps', 'Corn tortilla wraps', { aliases: ['tortilha de milho'] }],
    ['farinha-de-mandioca', 'Farinha de mandioca', { aliases: ['cassava flour', 'manioc flour'] }],
    ['farofa-yoki', 'Farofa pronta Yoki (ingredient check)', { aliases: ['farofa pronta'] }],
    ['gluten-free-bread', 'Gluten-free bread (ingredient check)', { aliases: ['pão sem glúten'] }],
    ['gluten-free-pasta', 'Gluten-free pasta', { aliases: ['macarrão sem glúten', 'quinoa pasta', 'corn pasta', 'macarrão de milho', 'macarrão de quinoa'] }],
    ['oats-rolled', 'Oats (rolled)', { aliases: ['aveia', 'aveia em flocos'] }],
    ['pao-de-queijo', 'Pão de queijo (recipe check)', { aliases: ['cheese bread', 'pao de queijo'], tags: ['dairy', 'egg'] }],
    ['plain-crackers-rice-corn', 'Plain crackers (rice/corn)', { aliases: ['biscoito de arroz'] }],
    ['sourdough', 'Sourdough bread (true long-fermented)', { aliases: ['pão de fermentação natural', 'levain'], tags: ['gluten'] }],
    ['tortilla-wraps-corn', 'Tortilla wraps (corn, suitable portion)', { aliases: ['tortilha'] }],
  ]),
  ...rows('starches', 'avoid', 2, [
    ['barley-large', 'Barley (large portions)', { aliases: ['cevada'], tags: ['gluten'] }],
    ['brown-bread-wheat', 'Brown bread (regular wheat)', { aliases: ['pão integral'], tags: ['gluten'] }],
    ['couscous-large', 'Couscous (large portions)', { aliases: ['cuscuz marroquino'], tags: ['gluten'] }],
    ['pasta-wheat-regular', 'Pasta (regular wheat)', { aliases: ['macarrão'], tags: ['gluten'] }],
    ['regular-bread-buns', 'Regular bread buns', { aliases: ['pão de hambúrguer'], tags: ['gluten'] }],
    ['rye-bread', 'Rye bread', { aliases: ['pão de centeio', 'rye crispbread', 'torrada de centeio'], tags: ['gluten'] }],
    ['toast-wheat', 'Toast (regular wheat)', { aliases: ['torrada'], tags: ['gluten'] }],
    ['homemade-bread-white', 'Homemade bread (white wheat flour, not long-fermented)', { aliases: ['pão caseiro'], tags: ['gluten'], audit: 'corrected' }],
    ['wheat-bread-white', 'Wheat bread (white)', { aliases: ['pão francês', 'pão de forma'], tags: ['gluten'] }],
    ['wheat-pasta', 'Wheat pasta', { aliases: ['macarrão de trigo'], tags: ['gluten'] }],
  ]),

  // ───────────── Page 2 — Meat, fish & eggs ─────────────
  ...rows('protein', 'eat', 2, [
    ['beef-lean', 'Beef (plain, lean)', { aliases: ['carne bovina', 'patinho', 'alcatra', 'carne'], tags: ['meat'] }],
    ['chicken-breast', 'Chicken breast', { aliases: ['peito de frango', 'frango'], tags: ['meat', 'poultry'] }],
    ['chicken-legs', 'Chicken legs (plain)', { aliases: ['coxa de frango'], tags: ['meat', 'poultry'] }],
    ['chicken-thighs', 'Chicken thighs (plain)', { aliases: ['sobrecoxa'], tags: ['meat', 'poultry'] }],
    ['chicken-wings', 'Chicken wings (unseasoned)', { aliases: ['asa de frango', 'tulipa'], tags: ['meat', 'poultry'] }],
    ['crab', 'Crab', { aliases: ['caranguejo', 'siri'], tags: ['seafood'] }],
    ['eggs', 'Eggs', { aliases: ['ovo', 'ovos'], tags: ['egg'] }],
    ['fish-plain', 'Fish (plain)', { aliases: ['peixe', 'tilápia', 'pescada'], tags: ['fish'] }],
    ['ground-beef', 'Ground beef (plain)', { aliases: ['carne moída', 'carne moida'], tags: ['meat'] }],
    ['pork-plain', 'Pork (plain)', { aliases: ['carne de porco', 'lombo', 'porco'], tags: ['meat', 'pork'] }],
    ['rabbit', 'Rabbit', { aliases: ['coelho'], tags: ['meat'] }],
    ['salmon', 'Salmon', { aliases: ['salmão', 'salmao'], tags: ['fish'] }],
    ['shrimp', 'Shrimp', { aliases: ['camarão', 'camarao'], tags: ['seafood'] }],
    ['turkey', 'Turkey (plain)', { aliases: ['peru'], tags: ['meat', 'poultry'] }],
  ]),
  ...rows('protein', 'limit', 2, [
    ['bacon', 'Bacon', { tags: ['meat', 'pork'] }],
    ['burger-plain-patty', 'Burger (plain patty; bun and toppings checked)', { aliases: ['hambúrguer'], tags: ['meat'] }],
    ['canned-sardines', 'Canned sardines (plain)', { aliases: ['sardinha em lata'], tags: ['fish'] }],
    ['canned-tuna-oil', 'Canned tuna in oil', { aliases: ['atum em lata', 'atum'], tags: ['fish'] }],
    ['cold-cuts-ham', 'Cold cuts (ham)', { aliases: ['frios', 'presunto'], tags: ['meat', 'pork'] }],
    ['ham', 'Ham (ingredient check)', { aliases: ['presunto'], tags: ['meat', 'pork'] }],
    ['hot-dog-sausages', 'Hot dog sausages (ingredient check)', { aliases: ['salsicha'], tags: ['meat', 'pork'] }],
    ['linguica', 'Linguiça (ingredient check)', { aliases: ['linguica', 'sausage'], tags: ['meat', 'pork'] }],
    ['meatballs-safe', 'Meatballs (no wheat/onion/garlic)', { aliases: ['almôndega'], tags: ['meat'] }],
    ['pepperoni', 'Pepperoni (ingredient check)', { tags: ['meat', 'pork', 'spicy'] }],
    ['chourico', 'Portuguese chouriço (ingredient check)', { aliases: ['chourico', 'chorizo'], tags: ['meat', 'pork'] }],
  ]),
  ...rows('protein', 'avoid', 2, [
    ['breaded-chicken', 'Breaded chicken (regular wheat/garlic coating)', { aliases: ['frango empanado'], tags: ['meat', 'poultry', 'gluten'] }],
    ['coxinha', 'Coxinha (traditional wheat/onion recipe)', { tags: ['meat', 'poultry', 'gluten'] }],
    ['meatballs-onion-garlic', 'Meatballs with onion/garlic', { aliases: ['almôndega'], tags: ['meat'] }],
    ['processed-meats-garlic-onion', 'Processed meats with garlic/onion', { aliases: ['embutidos'], tags: ['meat'] }],
  ]),

  // ───────────── Page 3 — Dairy & alternatives ─────────────
  ...rows('dairy', 'eat', 3, [
    ['lactose-free-milk', 'Lactose-free milk', { aliases: ['leite sem lactose', 'leite zero lactose'], tags: ['dairy'] }],
    ['lactose-free-yogurt', 'Lactose-free yogurt', { aliases: ['iogurte sem lactose'], tags: ['dairy'] }],
  ]),
  ...rows('dairy', 'limit', 3, [
    ['greek-yogurt', 'Greek yogurt (lactose varies)', { aliases: ['iogurte grego'], tags: ['dairy'] }],
    ['kefir-lactose-free', 'Kefir (lactose-free only; label check)', { tags: ['dairy'] }],
    ['mozzarella', 'Mozzarella / mussarela cheese', { aliases: ['queijo mussarela', 'muçarela', 'queijo'], tags: ['dairy'] }],
    ['silk-protein-choc-milk', 'Silk Protein lactose-free chocolate milk (ingredient check)', { tags: ['dairy'], audit: 'corrected' }],
    ['sour-cream', 'Sour cream (lactose-free preferred)', { aliases: ['creme azedo'], tags: ['dairy'] }],
    ['whey-isolate', 'Whey isolate protein (ingredient check)', { aliases: ['whey'], tags: ['dairy'] }],
  ]),
  ...rows('dairy', 'avoid', 3, [
    ['cream-regular', 'Cream (regular)', { aliases: ['creme de leite', 'nata'], tags: ['dairy'] }],
    ['ice-cream-regular-dairy', 'Ice cream (regular dairy)', { aliases: ['sorvete'], tags: ['dairy'] }],
    ['milk-regular', 'Milk (cow, goat, sheep; regular)', { aliases: ['leite', 'leite integral'], tags: ['dairy'] }],
    ['kefir-regular', 'Regular kefir', { tags: ['dairy'] }],
    ['yogurt-regular', 'Regular yogurt / Activia (unless lactose-free)', { aliases: ['iogurte'], tags: ['dairy'] }],
  ]),

  // ───────────── Page 3 — Beans, legumes & nuts ─────────────
  ...rows('legumes', 'eat', 3, [['firm-tofu', 'Firm tofu', { aliases: ['tofu firme', 'tofu'] }]]),
  ...rows('legumes', 'limit', 3, [
    ['almonds-small', 'Almonds (small portions)', { aliases: ['amêndoa', 'amendoa'], tags: ['nuts'] }],
    ['chickpeas-canned', 'Canned chickpeas (rinsed, small portions)', { aliases: ['grão-de-bico', 'grao de bico'] }],
    ['kidney-beans-canned', 'Canned kidney beans (rinsed, small portions)', { aliases: ['feijão vermelho'] }],
    ['lentils-canned', 'Canned lentils (rinsed, small portions)', { aliases: ['lentilha'] }],
    ['chia-seeds', 'Chia seeds', { aliases: ['chia', 'semente de chia'] }],
    ['peanut-butter', 'Natural peanut butter', { aliases: ['pasta de amendoim'], tags: ['peanut'] }],
    ['pacoca', 'Paçoca (ingredient/portion check)', { aliases: ['pacoca'], tags: ['peanut'] }],
    ['peanuts', 'Peanuts', { aliases: ['amendoim'], tags: ['peanut'] }],
    ['pistachios', 'Pistachios (very small portions; often high-FODMAP)', { aliases: ['pistache'], tags: ['nuts'] }],
    ['pumpkin-seeds', 'Pumpkin seeds', { aliases: ['semente de abóbora'] }],
    ['walnuts', 'Walnuts', { aliases: ['nozes'], tags: ['nuts'] }],
  ]),
  ...rows('legumes', 'avoid', 3, [
    ['baked-beans', 'Baked beans'],
    ['black-beans-regular', 'Black beans (regular servings)', { aliases: ['feijão preto', 'feijao preto', 'feijoada'] }],
    ['butter-beans-regular', 'Butter beans (regular servings)', { aliases: ['feijão-manteiga'] }],
    ['cashews-regular', 'Cashews (regular servings)', { aliases: ['castanha de caju', 'caju'], tags: ['nuts'] }],
    ['kidney-beans-regular', 'Kidney beans (regular servings)', { aliases: ['feijão vermelho', 'feijão carioca', 'feijao'] }],
    ['lima-beans-regular', 'Lima beans (regular servings)', { aliases: ['feijão-de-lima', 'fava'] }],
    ['mung-beans-regular', 'Mung beans (regular servings)', { aliases: ['feijão-mungo'], audit: 'corrected' }],
    ['soybeans-whole-regular', 'Soybeans (whole, regular servings)', { aliases: ['soja'] }],
    ['split-peas-regular', 'Split peas (regular servings)', { aliases: ['ervilha seca'] }],
  ]),

  // ───────────── Page 3 — Oils, herbs & seasonings ─────────────
  ...rows('seasonings', 'eat', 3, [
    ['black-pepper', 'Black pepper', { aliases: ['pimenta-do-reino'] }],
    ['butter', 'Butter', { aliases: ['manteiga'], tags: ['dairy'] }],
    ['canola-oil', 'Canola cooking oil', { aliases: ['óleo de canola', 'oleo'] }],
    ['evoo', 'Extra virgin olive oil', { aliases: ['azeite extravirgem', 'azeite'] }],
    ['lemon', 'Lemon', { aliases: ['limão siciliano', 'limao'] }],
    ['lime', 'Lime', { aliases: ['limão', 'limão tahiti'] }],
    ['olive-oil', 'Olive oil', { aliases: ['azeite'] }],
    ['olives', 'Olives', { aliases: ['azeitona'] }],
    ['paprika', 'Paprika', { aliases: ['páprica'], audit: 'corrected' }],
    ['parsley', 'Parsley', { aliases: ['salsinha', 'salsa'] }],
    ['rosemary', 'Rosemary', { aliases: ['alecrim'] }],
    ['salt', 'Salt', { aliases: ['sal'] }],
    ['thyme', 'Thyme', { aliases: ['tomilho'] }],
    ['vinegar', 'Vinegar', { aliases: ['vinagre'] }],
  ]),
  ...rows('seasonings', 'limit', 3, [
    ['cilantro', 'Cilantro', { aliases: ['coentro'] }],
    ['curry-powder', 'Curry powder (ingredient check)', { aliases: ['curry'] }],
    ['dill', 'Dill', { aliases: ['endro', 'dill'] }],
    ['ginger', 'Ginger', { aliases: ['gengibre'] }],
    ['hot-pepper', 'Hot pepper / chili (symptom tolerance)', { aliases: ['pimenta', 'chili'], tags: ['spicy'] }],
    ['malagueta', 'Malagueta pepper', { aliases: ['pimenta malagueta'], tags: ['spicy'] }],
    ['margarine', 'Margarine (plain)', { aliases: ['margarina'] }],
    ['oregano', 'Oregano', { aliases: ['orégano'] }],
    ['pepper-type', 'Pepper (black or bell; see type)', { aliases: ['pimenta', 'pimentão'] }],
    ['turmeric', 'Turmeric', { aliases: ['açafrão-da-terra', 'cúrcuma'] }],
  ]),
  ...rows('seasonings', 'avoid', 3, [
    ['garlic-powder', 'Garlic powder', { aliases: ['alho em pó'] }],
    ['onion-powder', 'Onion powder', { aliases: ['cebola em pó'] }],
    ['seasoning-mixes-garlic-onion', 'Seasoning mixes with garlic/onion', { aliases: ['tempero pronto', 'sazón', 'caldo'] }],
  ]),

  // ───────────── Page 4 — Sauces & condiments ─────────────
  ...rows('sauces', 'eat', 4, [
    ['maple-syrup', 'Maple syrup', { aliases: ['xarope de bordo'] }],
    ['mayonnaise-plain', 'Mayonnaise (plain; label check)', { aliases: ['maionese'], tags: ['egg'] }],
    ['soy-sauce', 'Soy sauce (small amount)', { aliases: ['shoyu', 'molho de soja'], tags: ['gluten'] }],
    ['vinegar-plain', 'Vinegar (plain)', { aliases: ['vinagre'] }],
  ]),
  ...rows('sauces', 'limit', 4, [
    ['franks-hot-sauce', 'Frank’s Original hot sauce (ingredient and spice check)', { tags: ['spicy'], audit: 'corrected' }],
    ['hellmanns-mayo', 'Hellmann’s Real Mayonnaise (label check)', { aliases: ['maionese hellmanns'], tags: ['egg'] }],
    ['ketchup', 'Ketchup (small amount)'],
    ['molho-ingles', 'Molho inglês / Worcestershire (label check)', { aliases: ['worcestershire'] }],
    ['mustard', 'Mustard (plain)', { aliases: ['mostarda'] }],
    ['renes-caesar', 'Rene’s Caesar dressing (label check)', { aliases: ['molho caesar'] }],
    ['salsa-no-garlic-onion', 'Salsa (without garlic/onion)', { aliases: ['molho salsa'] }],
    ['tomato-paste', 'Tomato paste (plain, modest portion)', { aliases: ['extrato de tomate'] }],
    ['tomato-sauce-plain', 'Tomato sauce (plain; no garlic/onion)', { aliases: ['molho de tomate', 'passata'] }],
  ]),
  ...rows('sauces', 'avoid', 4, [
    ['garlic-aioli', 'Garlic aioli', { aliases: ['aioli', 'maionese de alho'] }],
    ['knorr-onion-garlic', 'Knorr seasonings with onion/garlic', { aliases: ['caldo knorr'] }],
    ['onion-garlic-salsa', 'Regular onion/garlic salsa', { aliases: ['vinagrete com cebola'] }],
    ['sauces-onion-garlic', 'Sauces containing onion/garlic', { aliases: ['molho pronto'] }],
  ]),

  // ───────────── Page 4 — Snacks, sweets & desserts ─────────────
  ...rows('snacks', 'eat', 4, [['plain-rice-cakes', 'Plain rice cakes', { aliases: ['biscoito de arroz', 'bolacha de arroz'] }]]),
  ...rows('snacks', 'limit', 4, [
    ['banana-bread-lf', 'Banana bread (low-FODMAP recipe only)', { aliases: ['bolo de banana'] }],
    ['birthday-cake-lf', 'Birthday cake (low-FODMAP recipe only)', { aliases: ['bolo de aniversário'] }],
    ['cake-bolo', 'Cake / bolo (recipe check)', { aliases: ['bolo'] }],
    ['dark-chocolate-small', 'Chocolate (dark, small portion)', { aliases: ['chocolate amargo', 'chocolate meio amargo'] }],
    ['coconut', 'Coconut (type and portion)', { aliases: ['coco', 'leite de coco', 'coco ralado'] }],
    ['cookies-lf', 'Cookies (low-FODMAP recipe)', { aliases: ['biscoito', 'cookie'] }],
    ['crackers-plain', 'Crackers (plain rice/corn)', { aliases: ['bolacha'] }],
    ['goiabada', 'Doce de goiabada (small portion; sugar tolerance)', { aliases: ['goiabada', 'guava paste'] }],
    ['doce-de-leite-lf', 'Doce de leite (lactose-free version only)', { aliases: ['doce de leite zero lactose'], tags: ['dairy'] }],
    ['jam-lf', 'Jam (low-FODMAP fruit)', { aliases: ['geleia'] }],
    ['lays-original', 'Lays Original potato chips (label check)', { aliases: ['batata chips'] }],
    ['nachos-plain', 'Nachos (plain corn chips, mozzarella)', { aliases: ['nachos'], tags: ['dairy'] }],
    ['potato-chips-plain', 'Plain potato chips', { aliases: ['batata chips', 'batatinha'] }],
    ['popcorn', 'Popcorn', { aliases: ['pipoca'] }],
    ['sugar-cane-small', 'Sugar cane (small amount)', { aliases: ['cana-de-açúcar', 'caldo de cana', 'rapadura'] }],
  ]),
  ...rows('snacks', 'avoid', 4, [
    ['brownies-regular', 'Brownies (regular wheat/dairy)', { aliases: ['brownie'], tags: ['gluten', 'dairy'] }],
    ['candy-polyols', 'Candy with polyols', { aliases: ['bala diet', 'sorbitol', 'xilitol', 'sugar-free gum', 'sugar-free mints', 'sugar-free confectionery', 'chiclete sem açúcar', 'bala sem açúcar'] }],
    ['cookies-regular-wheat', 'Cookies (regular wheat)', { aliases: ['biscoito recheado'], tags: ['gluten'] }],
    ['doce-de-leite-regular', 'Doce de leite (regular)', { aliases: ['doce de leite'], tags: ['dairy'] }],
    ['donuts', 'Donuts', { aliases: ['rosquinha', 'sonho'], tags: ['gluten'] }],
    ['ice-cream-regular', 'Ice cream (regular)', { aliases: ['sorvete'], tags: ['dairy'] }],
    ['milk-chocolate-large', 'Milk chocolate (large portion)', { aliases: ['chocolate ao leite'], tags: ['dairy'] }],
    ['timbits', 'Timbits', { tags: ['gluten'] }],
  ]),

  // ───────────── Page 5 — Drinks & alcohol ─────────────
  ...rows('drinks', 'eat', 5, [
    ['black-coffee', 'Black coffee (regular, if tolerated)', { aliases: ['café', 'cafe', 'cafezinho', 'café preto'] }],
    ['still-water', 'Still water', { aliases: ['água', 'agua'] }],
  ]),
  ...rows('drinks', 'limit', 5, [
    ['cabernet', 'Cabernet Sauvignon (dry; after elimination)', { aliases: ['vinho tinto'], tags: ['alcohol'] }],
    ['cachaca', 'Cachaça (after elimination)', { aliases: ['cachaca', 'pinga'], tags: ['alcohol'] }],
    ['carbonated-water', 'Carbonated water (bloating trigger)', { aliases: ['água com gás'] }],
    ['gin', 'Gin (after elimination)', { tags: ['alcohol'] }],
    ['green-tea', 'Green tea', { aliases: ['chá verde'] }],
    ['merlot', 'Merlot (dry; after elimination)', { aliases: ['vinho tinto'], tags: ['alcohol'] }],
    ['orange-juice-small', 'Orange juice (small glass)', { aliases: ['suco de laranja'] }],
    ['rum', 'Rum (after elimination)', { tags: ['alcohol'] }],
    ['suco-de-caju', 'Suco de caju (recipe/portion check)', { aliases: ['cashew juice', 'caju'] }],
    ['whiskey', 'Whiskey (after elimination)', { aliases: ['uísque'], tags: ['alcohol'] }],
  ]),
  ...rows('drinks', 'avoid', 5, [
    ['beer', 'Beer / IPA (during trial)', { aliases: ['cerveja'], tags: ['alcohol', 'gluten'] }],
    ['caesar-cocktail', 'Caesar cocktail (during trial)', { tags: ['alcohol'] }],
    ['clamato', 'Clamato juice (ingredient check; avoid during trial)'],
    ['soft-drinks', 'Pop / soft drinks (during symptom trial)', { aliases: ['refrigerante', 'soda', 'guaraná'] }],
    ['tonic-water', 'Tonic water (during trial)', { aliases: ['água tônica'] }],
    ['wine-spirits-trial', 'Wine and spirits (during trial)', { aliases: ['vinho', 'destilados'], tags: ['alcohol'] }],
  ]),

  // ───────────── Page 5 — Prepared meals & other ─────────────
  ...rows('prepared', 'eat', 5, [
    ['grilled-chicken-rice', 'Plain grilled chicken and rice', { aliases: ['frango grelhado com arroz'], tags: ['meat', 'poultry'], audit: 'corrected' }],
  ]),
  ...rows('prepared', 'limit', 5, [
    ['fermented-foods', 'Fermented foods (type and portion)', { aliases: ['fermentados'] }],
    ['french-fries-air-fried', 'French fries (air-fried)', { aliases: ['batata frita'] }],
    ['pickled-foods', 'Pickled foods (type and portion)', { aliases: ['picles', 'conserva'] }],
    ['pizza-lf', 'Pizza (low-FODMAP crust/toppings only)', { aliases: ['pizza'] }],
    ['spring-rolls-rice-paper', 'Spring rolls (rice-paper version; filling check)', { aliases: ['rolinho primavera', 'papel de arroz'] }],
    ['sushi-plain', 'Sushi (plain fish/rice; sauces checked)', { aliases: ['sushi'], tags: ['fish'] }],
  ]),
  ...rows('prepared', 'avoid', 5, [
    ['pizza-regular', 'Pizza (regular wheat crust with garlic/onion)', { aliases: ['pizza'], tags: ['gluten'] }],
    ['spring-rolls-wheat', 'Spring rolls (wheat wrapper or onion/garlic filling)', { aliases: ['rolinho primavera'], tags: ['gluten'] }],
    ['sushi-onion-garlic', 'Sushi with onion/garlic sauces or high-FODMAP ingredients', { aliases: ['sushi'], tags: ['fish'], audit: 'corrected' }],
  ]),

  // ───────────── Audit additions (Nov 2026) — not in the PDF ─────────────
  // Sources: [M-2026] Monash 3-step FODMAP diet sheet 2026; [M-LIST] Monash high/low
  // FODMAP food list; [M-LABEL] Monash label-reading guidance (2021); [UTD] UpToDate
  // graphic 90186 v2.0. The comment on each record names its sources.
  ...rows('vegetables', 'eat', 0, [
    ['green-bell-pepper', 'Bell peppers (green)', { aliases: ['pimentão verde', 'green capsicum'], audit: 'added' }], // M-2026, M-LIST
    ['bean-sprouts', 'Bean sprouts (moyashi)', { aliases: ['moyashi', 'broto de feijão', 'bean shoots'], audit: 'added' }], // M-2026
    ['bok-choy', 'Bok choy', { aliases: ['pak choi', 'acelga chinesa'], audit: 'added' }], // M-2026, M-LIST
  ]),
  ...rows('vegetables', 'limit', 0, [
    ['fennel', 'Fennel (source of fructans; portion check)', { aliases: ['erva-doce', 'funcho'], audit: 'added' }], // UTD
    ['sugar-snap-peas', 'Sugar snap peas (source of excess fructose; portion check)', { aliases: ['ervilha-torta americana', 'snap peas'], audit: 'added' }], // UTD
  ]),
  ...rows('vegetables', 'avoid', 0, [
    ['green-peas', 'Green peas', { aliases: ['ervilha', 'ervilha fresca', 'ervilha em lata', 'peas'], audit: 'added' }], // M-2026, M-LIST, UTD
    ['spring-onion-white', 'Spring onion (white part)', { aliases: ['cebolinha (parte branca)', 'scallion white part'], audit: 'added' }], // M-LIST, UTD
    ['jerusalem-artichoke', 'Jerusalem artichoke', { aliases: ['tupinambo', 'alcachofra-de-jerusalém'], audit: 'added' }], // M-LABEL
  ]),
  ...rows('fruit', 'avoid', 0, [
    ['figs-fresh', 'Figs (fresh)', { aliases: ['figo fresco'], audit: 'added' }], // M-LIST
  ]),
  ...rows('starches', 'eat', 0, [
    ['quinoa-flakes', 'Quinoa flakes', { aliases: ['flocos de quinoa'], audit: 'added' }], // M-2026, M-LIST
    ['gf-corn-flakes', 'Corn flakes (gluten-free; label check for honey/fructose syrups)', { aliases: ['corn flakes sem glúten', 'sucrilhos sem glúten'], audit: 'added' }], // M-2026
    ['spelt-sourdough', 'Spelt sourdough bread', { aliases: ['pão de espelta de fermentação natural'], tags: ['gluten'], audit: 'added' }], // M-2026, M-LIST
  ]),
  ...rows('starches', 'avoid', 0, [
    ['wheat-flour', 'Wheat flour', { aliases: ['farinha de trigo'], tags: ['gluten'], audit: 'added' }], // M-LABEL, M-2026, UTD
    ['wheat-cereals', 'Wheat-based breakfast cereals, muesli and granola', { aliases: ['cereal matinal', 'muesli', 'granola'], tags: ['gluten'], audit: 'added' }], // M-2026, M-LIST, M-LABEL
    ['legume-flours', 'Legume flours (chickpea, soy, lupin)', { aliases: ['farinha de grão-de-bico', 'farinha de soja', 'farinha de tremoço'], audit: 'added' }], // M-LABEL
  ]),
  ...rows('protein', 'eat', 0, [
    ['tempeh', 'Tempeh', { audit: 'added' }], // M-2026, M-LIST
  ]),
  ...rows('protein', 'avoid', 0, [
    ['falafel', 'Falafel', { audit: 'added' }], // M-LIST, UTD (chickpeas)
    ['vegetarian-mince', 'Vegetarian mince (label check)', { aliases: ['carne vegetal moída', 'proteína vegetal'], audit: 'added' }], // M-LIST
  ]),
  ...rows('dairy', 'eat', 0, [
    ['hard-cheeses', 'Hard cheeses (e.g. cheddar, parmesan)', { aliases: ['parmesão', 'queijo parmesão', 'cheddar', 'queijo duro'], tags: ['dairy'], audit: 'added' }], // M-2026, M-LIST
    ['feta', 'Feta cheese', { aliases: ['queijo feta'], tags: ['dairy'], audit: 'added' }], // M-2026, M-LIST
    ['brie-camembert', 'Brie / camembert', { aliases: ['brie', 'camembert', 'queijo brie'], tags: ['dairy'], audit: 'added' }], // M-2026, M-LIST table
    ['almond-milk', 'Almond milk', { aliases: ['leite de amêndoas', 'bebida de amêndoas'], tags: ['nuts'], audit: 'added' }], // M-2026, M-LIST
    ['rice-milk', 'Rice milk', { aliases: ['leite de arroz', 'bebida de arroz'], audit: 'added' }], // M-LIST
  ]),
  ...rows('dairy', 'limit', 0, [
    ['soy-milk', 'Soy milk (low if made from soy protein; high if made from whole soybeans)', { aliases: ['leite de soja', 'bebida de soja'], audit: 'added' }], // M-2026, M-LIST
  ]),
  ...rows('dairy', 'avoid', 0, [
    ['condensed-milk', 'Sweetened condensed milk (unless lactose-free)', { aliases: ['leite condensado'], tags: ['dairy'], audit: 'added' }], // M-2026, M-LIST, UTD (milk)
    ['evaporated-milk', 'Evaporated milk', { aliases: ['leite evaporado'], tags: ['dairy'], audit: 'added' }], // M-2026, M-LIST
    ['custard', 'Custard (regular dairy)', { aliases: ['creme de confeiteiro'], tags: ['dairy'], audit: 'added' }], // M-2026, M-LIST, UTD
  ]),
  ...rows('legumes', 'eat', 0, [
    ['macadamias', 'Macadamia nuts', { aliases: ['macadâmia', 'noz macadâmia'], tags: ['nuts'], audit: 'added' }], // M-2026, M-LIST
  ]),
  ...rows('seasonings', 'limit', 0, [
    ['colorau', 'Colorau / annatto seasoning (blend check)', { aliases: ['colorífico', 'urucum', 'annatto'], audit: 'added' }], // not paprika; blends vary, not addressed by the sources
  ]),
  ...rows('sauces', 'limit', 0, [
    ['bbq-sauce', 'Barbecue sauce (label check for onion/garlic)', { aliases: ['molho barbecue'], audit: 'added' }], // M-LIST, M-LABEL
    ['chutney', 'Chutney (label check)', { audit: 'added' }], // M-LIST
  ]),
  ...rows('snacks', 'eat', 0, [
    ['sugar', 'Table sugar (sucrose; low FODMAP, though large amounts of sweets may still cause symptoms)', { aliases: ['açúcar', 'acucar', 'açúcar refinado', 'table sugar'], audit: 'added' }], // M-2026, M-LIST
    ['rice-malt-syrup', 'Rice malt syrup', { aliases: ['xarope de malte de arroz'], audit: 'added' }], // M-2026, M-LIST
  ]),
  ...rows('snacks', 'avoid', 0, [
    ['honey', 'Honey', { aliases: ['mel'], audit: 'added' }], // M-2026, M-LIST, M-LABEL, UTD
    ['hfcs', 'High-fructose corn syrup / glucose-fructose syrup', { aliases: ['HFCS', 'glucose-fructose', 'xarope de glicose-frutose', 'xarope de milho rico em frutose'], audit: 'added' }], // M-2026, M-LIST, M-LABEL, UTD
    ['prebiotic-fibres', 'Prebiotic fibres: inulin, chicory root, FOS / oligofructose, GOS', { aliases: ['inulin', 'inulina', 'chicory root', 'raiz de chicória', 'FOS', 'oligofrutose', 'GOS', 'fibra prebiótica'], audit: 'added' }], // M-LABEL, UTD
    ['polyol-sweeteners', 'Polyol sweeteners: sorbitol (E420), mannitol (E421), isomalt (E953), maltitol (E965), lactitol (E966), xylitol (E967)', { aliases: ['sorbitol', 'manitol', 'mannitol', 'isomalte', 'maltitol', 'lactitol', 'xilitol', 'xylitol', 'E420', 'E421', 'E953', 'E965', 'E966', 'E967'], audit: 'added' }], // M-LABEL, UTD
  ]),
  ...rows('drinks', 'eat', 0, [
    ['cranberry-juice', 'Cranberry juice (label check for apple/pear concentrate)', { aliases: ['suco de cranberry', 'suco de oxicoco'], audit: 'added' }], // M-LIST
  ]),
  ...rows('drinks', 'avoid', 0, [
    ['apple-pear-juice', 'Apple juice, pear juice and fruit-juice concentrates', { aliases: ['suco de maçã', 'suco de pera', 'suco concentrado', 'concentrado de frutas'], audit: 'added' }], // M-2026, M-LABEL, UTD
  ]),
];

// ───────────── Nov 2026 evidence review ─────────────
// Classification corrections approved in the Nov 2026 review (sources in
// src/data/sources.ts; notes in docs/research/fodmap-evidence-notes.md).
const CORRECTIONS: Record<string, Partial<Food>> = {
  rum: { status: 'avoid', name: 'Rum (tested high in FODMAPs)' },
  beer: { status: 'limit', name: 'Beer, regular (reported low FODMAP; alcohol, carbonation and gluten still matter)' },
  cilantro: { status: 'eat' },
  ginger: { status: 'eat' },
  turmeric: { status: 'eat' },
  'green-onion-tops': { status: 'eat' },
  vinegar: { name: 'Vinegar (white, wine, rice or cider)' },
  'butternut-squash': { aliases: ['abóbora-pescoço', 'abóbora paulista', 'butternut'] },
};

type Meta = [Verification, SourceId[], Serve?];
const s = (amount: number, unit: Unit, src: SourceId, alt?: [number, Unit]): Serve =>
  alt ? { amount, unit, src, alt: { qty: alt[0], unit: alt[1] } } : { amount, unit, src };
const PLAIN: Meta = ['group', ['SL25', 'MLIST']];

/** Verification metadata for records from the original guide and the first audit. */
const META: Record<string, Meta> = {
  // Vegetables — SL25 lists these "low at 1 standard serve (75 g)"; FIB21 gives gram serves.
  carrots: ['serve', ['SL25', 'FIB21'], s(75, 'g', 'FIB21', [1, 'unit'])],
  cucumber: ['serve', ['SL25'], s(75, 'g', 'SL25')],
  eggplant: ['serve', ['SL25', 'FIB21'], s(75, 'g', 'FIB21', [1, 'cup'])],
  kale: ['serve', ['SL25', 'FIB21'], s(75, 'g', 'FIB21', [0.5, 'cup'])],
  lettuce: ['serve', ['SL25'], s(75, 'g', 'SL25')],
  'potatoes-white': ['serve', ['SL25', 'FIB21'], s(75, 'g', 'FIB21')],
  potatoes: ['serve', ['SL25', 'FIB21'], s(75, 'g', 'FIB21')],
  spinach: ['listed', ['SL25']],
  'green-bell-pepper': ['serve', ['SL25', 'M2026'], s(75, 'g', 'SL25')],
  'bok-choy': ['serve', ['SL25', 'M2026'], s(75, 'g', 'SL25')],
  'bean-sprouts': ['listed', ['M2026']],
  'bell-peppers-red': ['serve', ['FIB21'], s(75, 'g', 'FIB21')],
  'broccoli-heads': ['serve', ['SL25'], s(75, 'g', 'SL25')],
  cabbage: ['listed', ['SL25', 'ST16']],
  'green-beans': ['serve', ['SL25', 'FIB21'], s(75, 'g', 'FIB21', [15, 'unit'])],
  'green-onion-tops': ['listed', ['FAQ', 'FLAV15']],
  'sweet-corn': ['serve', ['SL25'], s(75, 'g', 'SL25')],
  'sweet-potatoes': ['serve', ['SL25', 'ST16'], s(75, 'g', 'ST16', [0.5, 'cup'])],
  zucchini: ['serve', ['M2026'], s(65, 'g', 'M2026')],
  'snow-peas-large': ['listed', ['SL25']],
  fennel: ['clinical', ['UTD']],
  'sugar-snap-peas': ['clinical', ['UTD']],
  beets: ['clinical', ['UTD']],
  cauliflower: ['clinical', ['UTD', 'MLIST']],
  shallots: ['clinical', ['UTD']],
  garlic: ['listed', ['M2026', 'MLIST', 'UTD']],
  'onions-red': ['listed', ['M2026', 'MLIST', 'UTD']],
  'onions-yellow': ['listed', ['M2026', 'MLIST', 'UTD']],
  'leeks-white': ['clinical', ['UTD']],
  'spring-onion-white': ['listed', ['MLIST', 'UTD']],
  mushrooms: ['listed', ['MLIST', 'UTD']],
  asparagus: ['listed', ['MLIST', 'UTD']],
  artichokes: ['clinical', ['UTD']],
  'green-peas': ['listed', ['M2026', 'MLIST', 'UTD']],
  'jerusalem-artichoke': ['listed', ['LABEL']],
  // Fruit
  'banana-firm': ['serve', ['SL25', 'FIB21'], s(100, 'g', 'FIB21', [1, 'unit'])],
  cantaloupe: ['serve', ['M2026'], s(120, 'g', 'M2026', [0.75, 'cup'])],
  kiwi: ['serve', ['SL25', 'FIB21'], s(150, 'g', 'FIB21', [2, 'unit'])],
  'mandarins-moderate': ['serve', ['SL25', 'FIB21'], s(125, 'g', 'FIB21', [2, 'unit'])],
  'mandarins-large': ['listed', ['SL25']],
  oranges: ['serve', ['SL25', 'FIB21'], s(130, 'g', 'FIB21', [1, 'unit'])],
  papaya: ['listed', ['SL25']],
  pineapple: ['serve', ['SL25', 'FIB21'], s(140, 'g', 'FIB21', [1, 'cup'])],
  strawberries: ['serve', ['SL25', 'M2026'], s(5, 'unit', 'M2026')],
  blueberries: ['listed', ['SL25']],
  raspberries: ['serve', ['SL25', 'FIB21'], s(60, 'g', 'FIB21', [30, 'unit'])],
  apricots: ['clinical', ['UTD']],
  'apples-gala': ['listed', ['M2026', 'MLIST', 'UTD']],
  cherries: ['listed', ['MLIST', 'UTD']],
  'dried-fruit': ['listed', ['MLIST', 'M2026']],
  mango: ['listed', ['MLIST', 'UTD']],
  nectarines: ['listed', ['MLIST', 'UTD']],
  peaches: ['listed', ['MLIST', 'UTD']],
  pears: ['listed', ['MLIST', 'UTD']],
  watermelon: ['listed', ['MLIST', 'UTD']],
  'figs-fresh': ['listed', ['MLIST']],
  // Starches
  quinoa: ['serve', ['SL25', 'FIB21'], s(155, 'g', 'FIB21', [1, 'cup'])],
  'brown-rice': ['serve', ['SL25', 'FIB21'], s(180, 'g', 'FIB21', [1, 'cup'])],
  'rice-white': ['listed', ['SL25']],
  'rice-basmati': ['listed', ['SL25']],
  'rice-noodles': ['listed', ['SL25']],
  polenta: ['listed', ['GR']],
  sourdough: ['listed', ['SL25']],
  'gluten-free-bread': ['listed', ['SL25']],
  'gluten-free-pasta': ['listed', ['SL25']],
  'oats-rolled': ['serve', ['SL25', 'FIB21'], s(52, 'g', 'FIB21', [0.5, 'cup'])],
  'plain-crackers-rice-corn': ['group', ['MLIST']],
  'quinoa-flakes': ['listed', ['M2026', 'MLIST']],
  'gf-corn-flakes': ['listed', ['M2026', 'SL25']],
  'spelt-sourdough': ['listed', ['M2026', 'MLIST']],
  'wheat-flour': ['listed', ['LABEL', 'M2026', 'UTD']],
  'wheat-cereals': ['listed', ['M2026', 'MLIST', 'LABEL']],
  'legume-flours': ['listed', ['LABEL']],
  'wheat-bread-white': ['listed', ['M2026', 'MLIST', 'UTD']],
  'wheat-pasta': ['listed', ['M2026', 'MLIST', 'UTD']],
  'pasta-wheat-regular': ['listed', ['M2026', 'MLIST', 'UTD']],
  'rye-bread': ['listed', ['MLIST', 'UTD']],
  'homemade-bread-white': ['listed', ['M2026', 'MLIST', 'UTD']],
  // Meat, fish, eggs, plant proteins
  'beef-lean': PLAIN,
  'chicken-breast': PLAIN,
  'chicken-legs': PLAIN,
  'chicken-thighs': PLAIN,
  'chicken-wings': PLAIN,
  'ground-beef': PLAIN,
  'pork-plain': PLAIN,
  rabbit: PLAIN,
  turkey: PLAIN,
  crab: PLAIN,
  'fish-plain': PLAIN,
  salmon: PLAIN,
  shrimp: PLAIN,
  eggs: ['listed', ['SL25']],
  tempeh: ['listed', ['M2026', 'MLIST']],
  'firm-tofu': ['serve', ['SL25', 'FIB21'], s(160, 'g', 'FIB21', [0.67, 'cup'])],
  falafel: ['clinical', ['MLIST', 'UTD']],
  'vegetarian-mince': ['listed', ['MLIST']],
  // Dairy
  'lactose-free-milk': ['listed', ['SL25']],
  'lactose-free-yogurt': ['listed', ['SL25']],
  'hard-cheeses': ['listed', ['M2026', 'MLIST']],
  feta: ['listed', ['M2026', 'MLIST']],
  'brie-camembert': ['listed', ['M2026', 'MLIST']],
  'almond-milk': ['listed', ['M2026', 'MLIST', 'DA24']],
  'rice-milk': ['listed', ['MLIST']],
  'soy-milk': ['listed', ['M2026', 'MLIST', 'DA24']],
  'milk-regular': ['listed', ['M2026', 'MLIST', 'UTD']],
  'yogurt-regular': ['listed', ['M2026', 'MLIST', 'UTD']],
  'ice-cream-regular-dairy': ['listed', ['MLIST', 'UTD']],
  'condensed-milk': ['listed', ['M2026', 'MLIST', 'UTD']],
  'evaporated-milk': ['listed', ['M2026', 'MLIST']],
  custard: ['listed', ['M2026', 'MLIST', 'UTD']],
  // Legumes, nuts, seeds
  macadamias: ['serve', ['SL25', 'FIB21'], s(40, 'g', 'FIB21', [20, 'unit'])],
  peanuts: ['serve', ['SL25', 'FIB21'], s(28, 'g', 'FIB21', [32, 'unit'])],
  walnuts: ['serve', ['SL25', 'FIB21'], s(30, 'g', 'FIB21', [10, 'unit'])],
  'almonds-small': ['serve', ['FIB21'], s(12, 'g', 'FIB21', [10, 'unit'])],
  'chia-seeds': ['serve', ['SL25', 'FIB21'], s(24, 'g', 'FIB21', [2, 'tbsp'])],
  'pumpkin-seeds': ['listed', ['SL25']],
  'peanut-butter': ['listed', ['SL25']],
  'chickpeas-canned': ['serve', ['FIB21', 'UTD'], s(42, 'g', 'FIB21', [0.25, 'cup'])],
  'lentils-canned': ['clinical', ['UTD']],
  'cashews-regular': ['listed', ['M2026', 'MLIST', 'UTD']],
  pistachios: ['listed', ['M2026', 'MLIST', 'UTD']],
  'kidney-beans-regular': ['listed', ['M2026', 'MLIST', 'UTD']],
  'baked-beans': ['listed', ['MLIST', 'UTD']],
  // Seasonings and oils
  'canola-oil': ['group', ['SL25']],
  evoo: ['group', ['SL25']],
  'olive-oil': ['group', ['SL25']],
  butter: ['group', ['SL25']],
  margarine: ['group', ['SL25']],
  parsley: ['listed', ['FLAV15']],
  rosemary: ['listed', ['FLAV15']],
  thyme: ['listed', ['FLAV15']],
  cilantro: ['listed', ['FLAV15']],
  ginger: ['listed', ['FLAV15']],
  turmeric: ['listed', ['FLAV15']],
  dill: ['group', ['SL25']],
  oregano: ['group', ['SL25']],
  paprika: ['group', ['SL25']],
  'black-pepper': ['listed', ['FLAV15']],
  salt: ['listed', ['FLAV15']],
  lemon: ['listed', ['FLAV15']],
  lime: ['listed', ['FLAV15']],
  'hot-pepper': ['listed', ['FLAV15']],
  malagueta: ['listed', ['FLAV15']],
  vinegar: ['listed', ['SL25']],
  'garlic-powder': ['listed', ['LABEL', 'UTD']],
  'onion-powder': ['listed', ['LABEL', 'UTD']],
  'seasoning-mixes-garlic-onion': ['listed', ['FLAV15', 'LABEL']],
  colorau: ['unverified', []],
  // Sauces
  'maple-syrup': ['listed', ['FLAV15']],
  'soy-sauce': ['listed', ['MLIST']],
  'mayonnaise-plain': ['listed', ['SL25', 'MLIST']],
  mustard: ['listed', ['SL25']],
  'bbq-sauce': ['listed', ['MLIST', 'LABEL']],
  chutney: ['listed', ['MLIST']],
  'jam-lf': ['listed', ['SL25']],
  'tomato-sauce-plain': ['listed', ['SL25']],
  // Snacks and sweeteners
  popcorn: ['serve', ['GR', 'FIB21'], s(60, 'g', 'FIB21', [3.5, 'cup'])],
  'plain-rice-cakes': ['group', ['MLIST']],
  sugar: ['listed', ['M2026', 'MLIST']],
  'rice-malt-syrup': ['listed', ['M2026', 'MLIST']],
  honey: ['listed', ['M2026', 'MLIST', 'LABEL', 'UTD']],
  hfcs: ['listed', ['M2026', 'MLIST', 'LABEL', 'UTD']],
  'prebiotic-fibres': ['listed', ['LABEL', 'UTD']],
  'polyol-sweeteners': ['listed', ['LABEL', 'UTD']],
  'candy-polyols': ['listed', ['LABEL', 'UTD']],
  // Drinks
  'still-water': ['group', ['ALC22']],
  'black-coffee': ['secondary', ['KS17']],
  'green-tea': ['listed', ['COVID']],
  'carbonated-water': ['listed', ['ALC22']],
  cabernet: ['secondary', ['ALC22', 'ALBY'], s(150, 'ml', 'ALBY')],
  merlot: ['secondary', ['ALC22', 'ALBY'], s(150, 'ml', 'ALBY')],
  gin: ['secondary', ['ALBY'], s(30, 'ml', 'ALBY')],
  whiskey: ['secondary', ['ALBY'], s(30, 'ml', 'ALBY')],
  rum: ['listed', ['ALC22', 'ALBY']],
  beer: ['secondary', ['ALBY']],
  cachaca: ['unverified', []],
  'cranberry-juice': ['listed', ['MLIST']],
  'apple-pear-juice': ['listed', ['M2026', 'LABEL', 'UTD']],
  'grilled-chicken-rice': ['group', ['SL25']],
};

const TRIGGERS: Record<string, Trigger[]> = {
  'black-coffee': ['caffeine'],
  'green-tea': ['caffeine'],
  'carbonated-water': ['carbonation'],
  'soft-drinks': ['carbonation', 'caffeine'],
  'tonic-water': ['carbonation'],
  beer: ['alcohol', 'carbonation'],
  cabernet: ['alcohol'],
  merlot: ['alcohol'],
  gin: ['alcohol'],
  whiskey: ['alcohol'],
  rum: ['alcohol'],
  cachaca: ['alcohol'],
  'wine-spirits-trial': ['alcohol'],
  'caesar-cocktail': ['alcohol'],
  'orange-juice-small': ['acidity'],
  'hot-pepper': ['spicy'],
  malagueta: ['spicy'],
  'pimenta-biquinho': ['spicy'],
  'franks-hot-sauce': ['spicy'],
};

const PORTIONS: Record<string, [number, 'g' | 'ml']> = {
  beer: [355, 'ml'],
  cabernet: [150, 'ml'],
  merlot: [150, 'ml'],
  gin: [30, 'ml'],
  whiskey: [30, 'ml'],
  rum: [30, 'ml'],
  cachaca: [50, 'ml'],
  'soft-drinks': [355, 'ml'],
  'tonic-water': [200, 'ml'],
  'orange-juice-small': [125, 'ml'],
  'cranberry-juice': [200, 'ml'],
  'black-coffee': [250, 'ml'],
  'green-tea': [250, 'ml'],
  'still-water': [250, 'ml'],
  'carbonated-water': [355, 'ml'],
};

const MEAT_IDS = new Set([
  'beef-lean', 'chicken-breast', 'chicken-legs', 'chicken-thighs', 'chicken-wings', 'ground-beef', 'pork-plain', 'rabbit', 'turkey',
  'bacon', 'burger-plain-patty', 'cold-cuts-ham', 'ham', 'hot-dog-sausages', 'linguica', 'meatballs-safe', 'pepperoni', 'chourico',
  'breaded-chicken', 'meatballs-onion-garlic', 'processed-meats-garlic-onion',
]);
const SEAFOOD_IDS = new Set(['crab', 'fish-plain', 'salmon', 'shrimp', 'canned-sardines', 'canned-tuna-oil']);

function review(f: Food): Food {
  const fix = CORRECTIONS[f.id];
  const out: Food = { ...f, ...fix };
  if (fix && (fix.status || fix.name) && !out.audit) out.audit = 'corrected';
  const meta = META[f.id];
  if (meta) {
    out.verification = meta[0];
    if (meta[1].length) out.sources = meta[1];
    if (meta[2]) out.serve = meta[2];
  } else if (f.audit === 'added') {
    out.verification = 'listed';
  }
  if (TRIGGERS[f.id]) out.triggers = TRIGGERS[f.id];
  if (PORTIONS[f.id]) out.portion = { amount: PORTIONS[f.id][0], unit: PORTIONS[f.id][1] };
  if (MEAT_IDS.has(f.id)) out.category = 'meat';
  if (SEAFOOD_IDS.has(f.id)) out.category = 'seafood';
  return out;
}

/**
 * Ids kept only so existing recipes, favourites, meal plans and saved lists keep
 * resolving; they are not shown in the Food Guide. 'vinegar-plain' duplicated
 * 'vinegar' (both EAT) and now mirrors that record.
 */
export const LEGACY_IDS: Record<string, string> = { 'vinegar-plain': 'vinegar' };

export const FOODS: Food[] = [...GUIDE_FOODS.filter((f) => !LEGACY_IDS[f.id]).map(review), ...EXPANSION];

/** Text printed at the bottom of every page of the PDF. */
export const GUIDE_FOOTER =
  'Initial elimination: 2–6 weeks, then reintroduce. Portion size, ingredients and tolerance matter.';

/** "Simple Brazilian-style meal ideas" panel from page 1 of the PDF. */
export const GUIDE_MEAL_IDEAS: { slot: string; text: string }[] = [
  { slot: 'Breakfast', text: 'Scrambled eggs, strawberries, oatmeal with lactose-free milk; black coffee if tolerated' },
  { slot: 'Morning snack', text: 'Kiwi or orange; rice cakes with natural peanut butter' },
  { slot: 'Lunch', text: 'Arroz branco, grilled chicken breast, carrots and spinach with olive oil' },
  { slot: 'Afternoon snack', text: 'Lactose-free yogurt with blueberries; or mozzarella in a modest portion' },
  { slot: 'Dinner', text: 'Grilled fish or lean beef, rice or potatoes, cucumber and lettuce salad' },
  { slot: 'Evening snack', text: 'Plain popcorn or homemade corn-chip nachos with mozzarella' },
];

const BY_ID: Map<string, Food> = new Map(FOODS.map((f) => [f.id, f]));
for (const [legacy, target] of Object.entries(LEGACY_IDS)) BY_ID.set(legacy, { ...BY_ID.get(target)!, id: legacy });

/** Every record by id, including legacy ids that mirror their replacement. */
export const FOOD_BY_ID: Map<string, Food> = BY_ID;
