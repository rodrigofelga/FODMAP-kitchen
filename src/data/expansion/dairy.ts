import { group, sv, type R } from './helper';

/**
 * Eggs, dairy and dairy alternatives.
 * - Eggs: plain eggs are listed low (SL25 protein: "eggs"); other bird eggs are 'group'.
 * - Hard / aged cheeses: Monash lists hard cheeses as low FODMAP (M2026, MLIST);
 *   individual varieties below are 'group' — not individually tested.
 * - Ricotta, cream cheese, haloumi: Monash FAQ says they contain moderate lactose
 *   (portion-dependent → LIMIT). No primary gram serve was located, so none is shown.
 * - Fresh Brazilian cheeses (requeijão, minas frescal, coalho…): no FODMAP data;
 *   LIMIT, "low-FODMAP suitability not established".
 * - Plant beverages: DA24 (20 Feb 2024). Oat milk low up to 104 ml; UHT coconut
 *   milk beverage low at ¾ cup, moderate at 1 cup — different from canned coconut milk.
 */
const D = ['dairy'] as const;
const hard = { t: [...D], src: ['M2026' as const, 'MLIST' as const] };
const nd = (pt: boolean) => ({ t: [...D], w: pt ? (['lactose'] as const).slice() : [] });

const eggs: R[] = [
  ['duck-eggs', 'Duck eggs', 'Ovos de pata', 'eat', 'group', { t: ['egg'], a: ['ovo de pata'] }],
  ['quail-eggs', 'Quail eggs', 'Ovos de codorna', 'eat', 'group', { t: ['egg'], a: ['ovo de codorna'] }],
  ['egg-whites', 'Egg whites', 'Claras de ovo', 'eat', 'group', { t: ['egg'], a: ['clara', 'claras', 'liquid egg whites'] }],
  ['egg-yolks', 'Egg yolks', 'Gemas de ovo', 'eat', 'group', { t: ['egg'], a: ['gema', 'gemas'] }],
];

const cheese: R[] = [
  ['swiss-cheese', 'Swiss / Emmental cheese', 'Queijo suíço / emmental', 'eat', 'group', { ...hard, a: ['emmental', 'queijo suíço', 'gruyère', 'gruyere'] }],
  ['gouda', 'Gouda cheese (aged)', 'Queijo gouda (curado)', 'eat', 'group', { ...hard, a: ['gouda'] }],
  ['edam', 'Edam cheese', 'Queijo edam', 'eat', 'group', { ...hard, a: ['edam', 'queijo do reino'] }],
  ['pecorino', 'Pecorino cheese', 'Queijo pecorino', 'eat', 'group', { ...hard, a: ['pecorino romano'] }],
  ['manchego', 'Manchego cheese', 'Queijo manchego', 'eat', 'group', { ...hard }],
  ['provolone', 'Provolone cheese', 'Queijo provolone', 'eat', 'group', { ...hard, a: ['provolone'] }],
  ['monterey-jack', 'Monterey Jack / Colby cheese', 'Queijo Monterey Jack / Colby', 'eat', 'group', { ...hard, a: ['colby', 'jack cheese'] }],
  ['havarti', 'Havarti cheese', 'Queijo havarti', 'eat', 'group', { ...hard }],
  ['lactose-free-cheese', 'Lactose-free cheese', 'Queijo sem lactose', 'eat', 'listed', { t: [...D], src: ['SL25'], a: ['queijo zero lactose'] }],
  ['goat-cheese', 'Goat cheese, soft (chèvre)', 'Queijo de cabra macio (chèvre)', 'limit', 'unverified', { ...nd(true), a: ['chèvre', 'queijo de cabra'] }],
  ['blue-cheese', 'Blue cheese', 'Queijo azul / gorgonzola', 'limit', 'unverified', { ...nd(true), a: ['gorgonzola', 'roquefort', 'stilton'] }],
  ['burrata', 'Burrata', 'Burrata', 'limit', 'unverified', { ...nd(true) }],
  ['mascarpone', 'Mascarpone', 'Mascarpone', 'limit', 'unverified', { ...nd(true) }],
  ['paneer', 'Paneer', 'Paneer', 'limit', 'unverified', { ...nd(true) }],
  ['ricotta', 'Ricotta (moderate lactose; small portion)', 'Ricota (lactose moderada; porção pequena)', 'limit', 'listed', { ...nd(true), src: ['FAQ', 'DIAB'], a: ['ricota'] }],
  ['cream-cheese', 'Cream cheese (moderate lactose; small portion)', 'Cream cheese (lactose moderada; porção pequena)', 'limit', 'listed', { ...nd(true), src: ['FAQ', 'DIAB'], a: ['cream cheese', 'philadelphia', 'queijo cremoso'] }],
  ['halloumi', 'Halloumi (moderate lactose; small portion)', 'Halloumi (lactose moderada; porção pequena)', 'limit', 'listed', { ...nd(true), src: ['FAQ'], a: ['haloumi', 'queijo coalho cipriota'] }],
  ['cottage-cheese', 'Cottage cheese (lactose; small portion)', 'Queijo cottage (lactose; porção pequena)', 'limit', 'listed', { ...nd(true), src: ['DIAB'], a: ['cottage'] }],
  ['requeijao', 'Requeijão (low-FODMAP suitability not established)', 'Requeijão (adequação baixo FODMAP não estabelecida)', 'limit', 'unverified', { ...nd(true), a: ['requeijão cremoso', 'catupiry'] }],
  ['minas-frescal', 'Queijo minas frescal (low-FODMAP suitability not established)', 'Queijo minas frescal (adequação baixo FODMAP não estabelecida)', 'limit', 'unverified', { ...nd(true), a: ['minas frescal', 'queijo branco', 'queijo fresco'] }],
  ['queijo-coalho', 'Queijo coalho (low-FODMAP suitability not established)', 'Queijo coalho (adequação baixo FODMAP não estabelecida)', 'limit', 'unverified', { ...nd(true), a: ['coalho', 'queijo de coalho'] }],
  ['queijo-prato', 'Queijo prato (not tested)', 'Queijo prato (não testado)', 'limit', 'unverified', { ...nd(true), a: ['prato', 'queijo lanche'] }],
  ['queijo-minas-curado', 'Queijo minas padrão / meia-cura (not tested)', 'Queijo minas padrão / meia-cura (não testado)', 'limit', 'unverified', { ...nd(true), a: ['minas padrão', 'meia cura', 'queijo canastra', 'queijo serro'] }],
  ['cheese-curds', 'Cheese curds (poutine; not tested)', 'Coalhada de queijo para poutine (não testada)', 'limit', 'unverified', { ...nd(true), a: ['fromage en grains', 'squeaky cheese'] }],
  ['processed-cheese', 'Processed cheese slices / spread (label check)', 'Queijo processado fatiado / cremoso (leia o rótulo)', 'limit', 'unverified', { ...nd(true), a: ['queijo fatiado', 'cheez whiz', 'american cheese'] }],
  ['skyr-quark', 'Skyr / quark (not tested)', 'Skyr / quark (não testado)', 'limit', 'unverified', { ...nd(true), a: ['skyr', 'quark', 'iogurte islandês'] }],
];

const milks: R[] = [
  ['lactose-free-cream', 'Lactose-free cream', 'Creme de leite sem lactose', 'eat', 'listed', { t: [...D], src: ['SL25'], a: ['creme de leite zero lactose'] }],
  ['lactose-free-cream-cheese', 'Lactose-free cream cheese', 'Cream cheese sem lactose', 'eat', 'listed', { t: [...D], src: ['SL25'] }],
  ['ghee', 'Ghee (clarified butter)', 'Ghee / manteiga clarificada', 'eat', 'group', { t: [...D], src: ['SL25'], a: ['manteiga clarificada', 'manteiga de garrafa'] }],
  ['whipped-cream', 'Whipped cream (regular)', 'Chantili / creme batido (comum)', 'limit', 'unverified', { ...nd(true), a: ['chantilly', 'chantili'] }],
  ['creme-fraiche', 'Crème fraîche', 'Crème fraîche', 'limit', 'unverified', { ...nd(true) }],
  ['buttermilk', 'Buttermilk', 'Leitelho / buttermilk', 'avoid', 'group', { ...nd(true), src: ['MLIST'], a: ['leitelho'] }],
  ['goat-milk', 'Goat milk', 'Leite de cabra', 'avoid', 'group', { ...nd(true), src: ['MLIST'], a: ['leite de cabra'] }],
  ['sheep-milk', 'Sheep milk', 'Leite de ovelha', 'avoid', 'group', { ...nd(true), src: ['MLIST'] }],
  ['a2-milk', 'A2 milk (still contains lactose)', 'Leite A2 (ainda contém lactose)', 'avoid', 'group', { ...nd(true), src: ['MLIST'], a: ['leite a2'] }],
  ['milk-powder', 'Milk powder (regular)', 'Leite em pó (comum)', 'avoid', 'group', { ...nd(true), src: ['MLIST'], a: ['leite em pó', 'ninho'] }],
  ['drinkable-yogurt', 'Drinkable yogurt (regular dairy)', 'Iogurte para beber / bebida láctea (comum)', 'avoid', 'group', { ...nd(true), src: ['MLIST'], a: ['bebida láctea', 'iogurte líquido'] }],
  ['petit-suisse', 'Petit-suisse (regular dairy)', 'Petit-suisse / Danoninho (comum)', 'avoid', 'group', { ...nd(true), src: ['MLIST'], a: ['danoninho'] }],
  ['frozen-yogurt', 'Frozen yogurt (regular dairy)', 'Frozen yogurt (laticínio comum)', 'avoid', 'group', { ...nd(true), src: ['MLIST'], a: ['froyo'] }],
  ['fermented-milk-drink', 'Fermented milk drinks (Yakult type; label check)', 'Leite fermentado (tipo Yakult; leia o rótulo)', 'limit', 'unverified', { ...nd(true), a: ['yakult', 'leite fermentado'] }],
  ['lactose-free-ice-cream', 'Lactose-free ice cream (label check)', 'Sorvete sem lactose (leia o rótulo)', 'limit', 'unverified', { t: [...D], w: ['polyols', 'inulin'], a: ['sorvete zero lactose'] }],
  ['coconut-yogurt', 'Coconut yogurt', 'Iogurte de coco', 'eat', 'listed', { src: ['DA24'], a: ['iogurte vegetal de coco'] }],
  ['soy-yogurt', 'Soy yogurt (high at a standard serve)', 'Iogurte de soja (alto em uma porção padrão)', 'avoid', 'listed', { src: ['DA24'], a: ['iogurte vegetal de soja'] }],
  ['almond-yogurt', 'Almond yogurt (not tested)', 'Iogurte de amêndoas (não testado)', 'limit', 'unverified', { t: ['nuts'] }],
  ['oat-milk', 'Oat milk (low up to 104 ml)', 'Bebida de aveia (baixo até 104 ml)', 'limit', 'serve', { s: sv(104, 'ml', 'DA24'), p: [250, 'ml'], src: ['DA24'], a: ['leite de aveia', 'bebida de aveia', 'oatly'] }],
  ['coconut-milk-uht', 'Coconut milk beverage, UHT carton (low at ¾ cup)', 'Bebida de coco UHT, caixinha (baixo em ¾ xícara)', 'limit', 'serve', { s: sv(0.75, 'cup', 'DA24'), p: [250, 'ml'], src: ['DA24'], a: ['leite de coco de caixinha', 'bebida de coco', 'coconut beverage'] }],
  ['coconut-milk-canned', 'Coconut milk, canned (cooking; portion check)', 'Leite de coco em lata/vidro (culinário; verifique a porção)', 'limit', 'unverified', { tr: ['fat'], a: ['leite de coco', 'leite de coco sococo', 'coconut milk'] }],
  ['coconut-cream', 'Coconut cream (portion check)', 'Creme de coco (verifique a porção)', 'limit', 'unverified', { tr: ['fat'], a: ['creme de coco'] }],
  ['hemp-milk', 'Hemp milk (not tested)', 'Bebida de cânhamo (não testada)', 'limit', 'unverified', {}],
  ['macadamia-milk', 'Macadamia milk (not tested)', 'Bebida de macadâmia (não testada)', 'limit', 'unverified', { t: ['nuts'] }],
  ['cashew-milk', 'Cashew milk (not tested; cashews are high FODMAP)', 'Bebida de castanha-de-caju (não testada; caju é alto FODMAP)', 'limit', 'unverified', { t: ['nuts'] }],
  ['pea-milk', 'Pea protein milk (not tested)', 'Bebida de proteína de ervilha (não testada)', 'limit', 'unverified', { a: ['ripple'] }],
];

export const EGGS = group('protein', eggs);
export const DAIRY = group('dairy', [...cheese, ...milks]);
