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
 */

export type FoodStatus = 'eat' | 'limit' | 'avoid';

export type FoodCategory =
  | 'vegetables'
  | 'fruit'
  | 'starches'
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

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  status: FoodStatus;
  /** PDF page the entry appears on (1–5). */
  page: number;
  aliases?: string[];
  tags?: FoodTag[];
  /** The PDF line is visibly cut off; the printed text is kept as-is. */
  sourceTruncated?: boolean;
}

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  vegetables: 'Vegetables & herbs',
  fruit: 'Fruit',
  starches: 'Rice, bread & starches',
  protein: 'Meat, fish & eggs',
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
  limit: 'LIMIT / CHECK',
  avoid: 'AVOID FOR NOW',
};

type Row = [id: string, name: string, extra?: Partial<Pick<Food, 'aliases' | 'tags' | 'sourceTruncated'>>];

function rows(category: FoodCategory, status: FoodStatus, page: number, list: Row[]): Food[] {
  return list.map(([id, name, extra]) => ({ id, name, category, status, page, ...extra }));
}

export const FOODS: Food[] = [
  // ───────────── Page 1 — Vegetables & herbs ─────────────
  ...rows('vegetables', 'eat', 1, [
    ['carrots', 'Carrots', { aliases: ['cenoura'] }],
    ['cucumber', 'Cucumber', { aliases: ['pepino'] }],
    ['eggplant', 'Eggplant', { aliases: ['berinjela', 'aubergine'] }],
    ['kale', 'Kale', { aliases: ['couve', 'couve kale'] }],
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
    ['onions-yellow', 'Onions (yellow)', { aliases: ['cebola'] }],
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
    ['pears', 'Pears', { aliases: ['pera', 'pêra'] }],
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
    ['gluten-free-pasta', 'Gluten-free pasta', { aliases: ['macarrão sem glúten'] }],
    ['homemade-bread-white', 'Homemade bread (white flour)', { aliases: ['pão caseiro'], tags: ['gluten'] }],
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
    ['rye-bread', 'Rye bread', { aliases: ['pão de centeio'], tags: ['gluten'] }],
    ['toast-wheat', 'Toast (regular wheat)', { aliases: ['torrada'], tags: ['gluten'] }],
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
    ['silk-protein-choc-milk', 'Silk Protein lactose-free chocolate milk (ingredient', { tags: ['dairy'], sourceTruncated: true }],
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
    ['mung-beans-regular', 'Mung beans (regular servings)', { aliases: ['feijão-mungo', 'moyashi'] }],
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
    ['paprika', 'Paprika', { aliases: ['páprica', 'colorau'] }],
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
    ['franks-hot-sauce', 'Frank’s Original hot sauce (ingredient and spice', { tags: ['spicy'], sourceTruncated: true }],
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
    ['candy-polyols', 'Candy with polyols', { aliases: ['bala diet', 'sorbitol', 'xilitol'] }],
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
    ['grilled-chicken-rice', 'Plain grilled chicken and rice Use during the initial', { aliases: ['frango grelhado com arroz'], tags: ['meat', 'poultry'], sourceTruncated: true }],
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
    ['sushi-onion-garlic', 'Sushi with onion/garlic sauces or high-FODMAP', { aliases: ['sushi'], tags: ['fish'], sourceTruncated: true }],
  ]),
];

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

export const FOOD_BY_ID: Map<string, Food> = new Map(FOODS.map((f) => [f.id, f]));
