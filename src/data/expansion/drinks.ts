import { group, sv, type R } from './helper';

/**
 * Beverages. FODMAP content is kept separate from non-FODMAP triggers
 * (caffeine, alcohol, carbonation, acidity): a drink can be low FODMAP and still
 * LIMIT because of a trigger. Alcohol is never presented as recommended.
 * - Primary: ALC22 (rum, red wine >250 ml and sticky wine tested high), DA24,
 *   COVID (peppermint and green tea low; chamomile high in fructans at 1 cup).
 * - Secondary, attributed as such: ALBY (RD-reviewed; Monash app v3.0.8) for beer
 *   (low, no serve given), wines 150 ml, spirits 30 ml; KS17 (RDN; Monash app) for teas.
 * - `p` is a practical portion (a can, a glass, a shot) — not a tested threshold.
 * Thresholds are never carried over to other varieties.
 */
const AL = { t: ['alcohol' as const], tr: ['alcohol' as const] };
const CARB = ['carbonation' as const];
const CAF = ['caffeine' as const];

const water: R[] = [
  ['soda-water', 'Soda water / club soda', 'Água com gás / club soda', 'limit', 'group', { tr: CARB, p: [355, 'ml'], src: ['ALC22'], a: ['club soda', 'soda limonada sem açúcar', 'eau gazeuse'] }],
  ['mineral-water', 'Sparkling mineral water', 'Água mineral com gás', 'limit', 'listed', { tr: CARB, p: [500, 'ml'], src: ['ALC22'], a: ['água mineral gaseificada', 'perrier', 'san pellegrino'] }],
  ['flavoured-sparkling-water', 'Flavoured sparkling water (label check)', 'Água gaseificada saborizada (leia o rótulo)', 'limit', 'group', { tr: CARB, p: [355, 'ml'], w: ['fruitJuice', 'sweeteners'], src: ['LABEL'], a: ['bubly', 'água saborizada', 'la croix'] }],
  ['coconut-water', 'Coconut water (portion check; data conflict)', 'Água de coco (verifique a porção; dados conflitantes)', 'limit', 'unverified', { p: [330, 'ml'], a: ['água de coco', 'eau de coco'] }],
  ['sports-drinks', 'Sports / electrolyte drinks (label check)', 'Isotônicos (leia o rótulo)', 'limit', 'group', { p: [500, 'ml'], w: ['hfcs', 'sweeteners'], src: ['LABEL'], a: ['gatorade', 'powerade', 'isotônico'] }],
  ['vitamin-water', 'Vitamin-enhanced waters (label check)', 'Águas vitaminadas (leia o rótulo)', 'limit', 'group', { p: [500, 'ml'], w: ['hfcs', 'polyols', 'sweeteners'], src: ['LABEL'], a: ['vitaminwater'] }],
];

const soft: R[] = [
  ['cola-regular', 'Cola, sugar-sweetened (e.g. Coca-Cola, Pepsi; check the sweetener)', 'Refrigerante de cola com açúcar (ex. Coca-Cola, Pepsi; verifique o adoçante)', 'limit', 'unverified', { tr: [...CARB, ...CAF], p: [355, 'ml'], w: ['hfcs'], a: ['coca-cola', 'coca', 'pepsi', 'cola'] }],
  ['cola-diet', 'Cola, diet / zero sugar', 'Refrigerante de cola zero / diet', 'limit', 'unverified', { tr: [...CARB, ...CAF], p: [355, 'ml'], w: ['sweeteners'], a: ['coca zero', 'coke zero', 'pepsi black', 'diet coke'] }],
  ['soft-drink-hfcs', 'Soft drinks sweetened with glucose-fructose / HFCS', 'Refrigerantes adoçados com xarope de glicose-frutose / HFCS', 'avoid', 'listed', { tr: CARB, p: [355, 'ml'], w: ['hfcs'], src: ['M2026', 'MLIST', 'LABEL'], a: ['glucose-fructose', 'high fructose corn syrup soda'] }],
  ['ginger-ale', 'Ginger ale (e.g. Canada Dry; check the sweetener)', 'Ginger ale (ex. Canada Dry; verifique o adoçante)', 'limit', 'unverified', { tr: CARB, p: [355, 'ml'], w: ['hfcs'], a: ['canada dry', 'ginger ale', 'schweppes ginger ale'] }],
  ['lemon-lime-soda', 'Lemon-lime soda (e.g. Sprite, 7UP; check the sweetener)', 'Refrigerante de limão (ex. Sprite, Soda; verifique o adoçante)', 'limit', 'unverified', { tr: CARB, p: [355, 'ml'], w: ['hfcs', 'fruitJuice'], a: ['sprite', '7up', 'soda limonada', 'h2oh'] }],
  ['orange-soda', 'Orange soda (e.g. Fanta; check sweetener and juice)', 'Refrigerante de laranja (ex. Fanta; verifique adoçante e suco)', 'limit', 'unverified', { tr: CARB, p: [355, 'ml'], w: ['hfcs', 'fruitJuice'], a: ['fanta', 'fanta laranja', 'sunkist', 'crush'] }],
  ['guarana-soda', 'Guaraná soda (e.g. Guaraná Antarctica, Kuat; guaraná not tested)', 'Guaraná (ex. Antarctica, Kuat; guaraná não testado)', 'limit', 'unverified', { tr: [...CARB, ...CAF], p: [350, 'ml'], w: ['fruitJuice'], a: ['guaraná antarctica', 'guarana', 'kuat', 'guaraná jesus'] }],
  ['root-beer', 'Root beer / cream soda (check the sweetener)', 'Root beer / cream soda (verifique o adoçante)', 'limit', 'unverified', { tr: CARB, p: [355, 'ml'], w: ['hfcs'], a: ['a&w', 'root beer', 'cream soda'] }],
  ['ginger-beer', 'Ginger beer, non-alcoholic (check the sweetener)', 'Ginger beer sem álcool (verifique o adoçante)', 'limit', 'unverified', { tr: CARB, p: [355, 'ml'], w: ['hfcs'], a: ['ginger beer'] }],
  ['tonic-diet', 'Diet tonic water (sweetener check)', 'Água tônica diet / zero (verifique o adoçante)', 'limit', 'unverified', { tr: CARB, p: [200, 'ml'], w: ['sweeteners', 'polyols'], a: ['tônica zero', 'schweppes zero'] }],
  ['energy-drinks', 'Energy drinks (e.g. Red Bull, Monster)', 'Energéticos (ex. Red Bull, Monster)', 'limit', 'unverified', { tr: [...CARB, ...CAF], p: [250, 'ml'], w: ['hfcs', 'sweeteners', 'polyols'], a: ['red bull', 'monster', 'energético'] }],
  ['iced-tea-bottled', 'Bottled iced tea (label check)', 'Chá gelado industrializado (leia o rótulo)', 'limit', 'unverified', { tr: CAF, p: [500, 'ml'], w: ['hfcs', 'fruitJuice'], a: ['nestea', 'lipton ice tea', 'matte leão gelado', 'chá pronto'] }],
  ['kombucha', 'Kombucha (commercial; data from secondary sources only)', 'Kombucha (industrializada; dados só de fontes secundárias)', 'limit', 'unverified', { tr: [...CARB, 'acidity', 'alcohol'], p: [330, 'ml'], a: ['kombucha'] }],
  ['kvass-water-kefir', 'Kvass / water kefir (not established)', 'Kvass / kefir de água (não estabelecido)', 'limit', 'unverified', { tr: [...CARB, 'acidity'], p: [250, 'ml'], a: ['kvass', 'kefir de água', 'tibicos'] }],
];

const juices: R[] = [
  ['tomato-juice', 'Tomato / vegetable cocktail juice (label check)', 'Suco de tomate / de legumes (leia o rótulo)', 'limit', 'unverified', { tr: ['acidity'], p: [250, 'ml'], w: ['garlicOnion'], a: ['suco de tomate', 'v8', 'jus de tomate'] }],
  ['grape-juice', 'Grape juice (e.g. suco de uva integral; not tested)', 'Suco de uva integral (não testado)', 'limit', 'unverified', { p: [200, 'ml'], a: ['suco de uva', 'jus de raisin'] }],
  ['pineapple-juice', 'Pineapple juice (not tested; fruit serves do not apply)', 'Suco de abacaxi (não testado; porção da fruta não se aplica)', 'limit', 'unverified', { tr: ['acidity'], p: [200, 'ml'], a: ['suco de abacaxi'] }],
  ['passion-fruit-juice', 'Passion fruit juice (not tested)', 'Suco de maracujá (não testado)', 'limit', 'unverified', { tr: ['acidity'], p: [200, 'ml'], a: ['suco de maracujá'] }],
  ['acerola-juice', 'Acerola juice (not tested)', 'Suco de acerola (não testado)', 'limit', 'unverified', { tr: ['acidity'], p: [200, 'ml'], a: ['suco de acerola'] }],
  ['guava-juice', 'Guava juice (not tested)', 'Suco de goiaba (não testado)', 'limit', 'unverified', { p: [200, 'ml'], a: ['suco de goiaba'] }],
  ['lemonade', 'Lemonade / limeade (homemade, with sugar)', 'Limonada caseira com açúcar', 'limit', 'group', { tr: ['acidity'], p: [250, 'ml'], src: ['FLAV15'], a: ['limonada', 'limonada suíça', 'citronnade'] }],
  ['carrot-juice', 'Carrot juice (not tested)', 'Suco de cenoura (não testado)', 'limit', 'unverified', { p: [200, 'ml'], a: ['suco de cenoura'] }],
  ['green-juice', 'Green / detox juice blends (often apple; label check)', 'Suco verde / detox (costuma ter maçã; leia o rótulo)', 'limit', 'group', { p: [250, 'ml'], w: ['fruitJuice'], src: ['LABEL'], a: ['suco verde', 'suco detox'] }],
  ['sugarcane-juice', 'Sugarcane juice / caldo de cana (not tested)', 'Caldo de cana (garapa; não testado)', 'limit', 'unverified', { p: [300, 'ml'], a: ['caldo de cana', 'garapa'] }],
  ['acai-smoothie', 'Açaí bowl / smoothie (guaraná syrup, banana; not tested)', 'Açaí na tigela / batido (xarope de guaraná, banana; não testado)', 'limit', 'unverified', { tr: CAF, p: [300, 'ml'], w: ['hfcs', 'fruitJuice'], a: ['açaí na tigela', 'açaí batido'] }],
  ['mango-juice', 'Mango juice / nectar', 'Suco / néctar de manga', 'avoid', 'group', { p: [200, 'ml'], src: ['M2026', 'MLIST', 'UTD'], a: ['suco de manga', 'néctar de manga'] }],
  ['watermelon-juice', 'Watermelon juice', 'Suco de melancia', 'avoid', 'group', { p: [250, 'ml'], src: ['MLIST', 'UTD'], a: ['suco de melancia'] }],
  ['peach-nectar', 'Peach / pear nectar', 'Néctar de pêssego / pera', 'avoid', 'group', { p: [200, 'ml'], src: ['MLIST', 'UTD'], a: ['néctar de pêssego', 'del valle pêssego'] }],
  ['mixed-fruit-juice', 'Mixed fruit juice / cocktail (usually apple or pear base)', 'Suco misto de frutas (geralmente à base de maçã ou pera)', 'avoid', 'group', { p: [200, 'ml'], w: ['fruitJuice'], src: ['M2026', 'LABEL'], a: ['suco misto', 'fruit punch', 'tropical juice'] }],
];

const beer: R[] = [
  ['lager', 'Lager / pilsner (low FODMAP data are for "beer" generally)', 'Cerveja lager / pilsen (dados baixo FODMAP são para “cerveja” em geral)', 'limit', 'secondary', { ...AL, t: ['alcohol', 'gluten'], tr: ['alcohol', 'carbonation'], p: [355, 'ml'], src: ['ALBY'], a: ['pilsen', 'lager', 'brahma', 'skol', 'molson canadian', 'labatt'] }],
  ['ipa', 'IPA / pale ale (variety not separately tested)', 'IPA / pale ale (variedade não testada separadamente)', 'limit', 'unverified', { ...AL, t: ['alcohol', 'gluten'], tr: ['alcohol', 'carbonation'], p: [355, 'ml'], a: ['ipa', 'pale ale', 'apa'] }],
  ['stout', 'Stout / porter / dark beer (not tested)', 'Cerveja stout / porter / escura (não testada)', 'limit', 'unverified', { ...AL, t: ['alcohol', 'gluten'], tr: ['alcohol', 'carbonation'], p: [355, 'ml'], a: ['stout', 'porter', 'guinness', 'cerveja preta'] }],
  ['wheat-beer', 'Wheat beer / witbier (not tested)', 'Cerveja de trigo / weiss (não testada)', 'limit', 'unverified', { ...AL, t: ['alcohol', 'gluten'], tr: ['alcohol', 'carbonation'], p: [355, 'ml'], a: ['weiss', 'witbier', 'hefeweizen', 'blanche'] }],
  ['gluten-free-beer', 'Gluten-free beer (not tested for FODMAPs)', 'Cerveja sem glúten (não testada para FODMAPs)', 'limit', 'unverified', { ...AL, tr: ['alcohol', 'carbonation'], p: [355, 'ml'], a: ['cerveja sem glúten'] }],
  ['alcohol-free-beer', 'Alcohol-free beer (not tested for FODMAPs)', 'Cerveja sem álcool (não testada para FODMAPs)', 'limit', 'unverified', { t: ['gluten'], tr: ['carbonation'], p: [355, 'ml'], src: ['ALBY'], a: ['cerveja zero', 'heineken 0.0', 'brahma zero', 'bière sans alcool'] }],
  ['cider', 'Cider (apple/pear based; untested, potentially high)', 'Sidra (à base de maçã/pera; não testada, possivelmente alta)', 'avoid', 'secondary', { ...AL, tr: ['alcohol', 'carbonation'], p: [355, 'ml'], src: ['ALBY'], a: ['sidra', 'cidre', 'hard cider'] }],
];

const wine: R[] = [
  ['red-wine', 'Red wine (low at 150 ml; tested high above 250 ml)', 'Vinho tinto (baixo em 150 ml; alto acima de 250 ml)', 'limit', 'secondary', { ...AL, s: sv(150, 'ml', 'ALBY'), p: [150, 'ml'], src: ['ALC22', 'ALBY'], a: ['vinho tinto', 'vin rouge', 'malbec', 'pinot noir'] }],
  ['white-wine', 'White wine, dry (low at 150 ml)', 'Vinho branco seco (baixo em 150 ml)', 'limit', 'secondary', { ...AL, s: sv(150, 'ml', 'ALBY'), p: [150, 'ml'], src: ['ALBY'], a: ['vinho branco', 'sauvignon blanc', 'chardonnay', 'vin blanc'] }],
  ['sparkling-wine', 'Sparkling wine (prosecco, champagne, espumante; low at 1 glass)', 'Espumante (prosecco, champanhe; baixo em 1 taça)', 'limit', 'secondary', { ...AL, tr: ['alcohol', 'carbonation'], p: [150, 'ml'], src: ['ALBY'], a: ['espumante', 'champanhe', 'prosecco', 'cava'] }],
  ['sweet-wine', 'Sweet white wine (e.g. moscato; low at 1 glass)', 'Vinho branco suave (ex. moscatel; baixo em 1 taça)', 'limit', 'secondary', { ...AL, p: [150, 'ml'], src: ['ALBY'], a: ['vinho suave', 'moscato', 'moscatel'] }],
  ['rose-wine', 'Rosé wine (not tested separately)', 'Vinho rosé (não testado separadamente)', 'limit', 'unverified', { ...AL, p: [150, 'ml'], a: ['rosé', 'vinho rosé'] }],
  ['sticky-wine', 'Dessert / fortified wine (port, sherry, ice wine)', 'Vinho de sobremesa / fortificado (porto, xerez, ice wine)', 'avoid', 'listed', { ...AL, p: [60, 'ml'], src: ['ALC22', 'ALBY'], a: ['vinho do porto', 'xerez', 'sherry', 'ice wine', 'vin de glace', 'licoroso'] }],
  ['low-gi-wine', 'Low-GI wine (reported high by Monash app)', 'Vinho de baixo índice glicêmico (relatado alto pelo app da Monash)', 'avoid', 'secondary', { ...AL, p: [150, 'ml'], src: ['ALBY'] }],
  ['wine-spritzer', 'Wine spritzer (wine + soda water)', 'Spritzer (vinho + água com gás)', 'limit', 'listed', { ...AL, tr: ['alcohol', 'carbonation'], p: [200, 'ml'], src: ['ALC22'], a: ['spritzer', 'vinho com água com gás'] }],
];

const spirits: R[] = [
  ['vodka', 'Vodka (low at 30 ml)', 'Vodca (baixa em 30 ml)', 'limit', 'secondary', { ...AL, s: sv(30, 'ml', 'ALBY'), p: [30, 'ml'], src: ['ALBY'], a: ['vodca', 'smirnoff', 'absolut'] }],
  ['brandy', 'Brandy / cognac (low at 30 ml)', 'Conhaque / brandy (baixo em 30 ml)', 'limit', 'secondary', { ...AL, s: sv(30, 'ml', 'ALBY'), p: [30, 'ml'], src: ['ALBY'], a: ['conhaque', 'cognac', 'brandy'] }],
  ['tequila', 'Tequila / mezcal (sources conflict on testing)', 'Tequila / mezcal (fontes divergem sobre testes)', 'limit', 'unverified', { ...AL, p: [30, 'ml'], src: ['ALBY'], a: ['tequila', 'mezcal'] }],
  ['sake', 'Sake (not tested)', 'Saquê (não testado)', 'limit', 'unverified', { ...AL, t: ['alcohol'], p: [90, 'ml'], a: ['saquê', 'sake'] }],
  ['liqueurs', 'Sweet liqueurs (coffee, amaretto, cream liqueurs; label check)', 'Licores doces (café, amaretto, cremosos; leia o rótulo)', 'limit', 'unverified', { ...AL, p: [30, 'ml'], w: ['lactose', 'hfcs'], a: ['licor', 'baileys', 'kahlúa', 'amaretto', 'licor 43'] }],
  ['aperitif-bitters', 'Aperitifs / bitters (Aperol, Campari; not tested)', 'Aperitivos / bitters (Aperol, Campari; não testados)', 'limit', 'unverified', { ...AL, p: [60, 'ml'], a: ['aperol', 'campari', 'cynar'] }],
  ['vermouth', 'Vermouth (not tested)', 'Vermute (não testado)', 'limit', 'unverified', { ...AL, p: [60, 'ml'], a: ['vermute', 'martini', 'cinzano'] }],
];

const cocktails: R[] = [
  ['caipirinha', 'Caipirinha (cachaça, lime, sugar; cachaça not tested)', 'Caipirinha (cachaça, limão, açúcar; cachaça não testada)', 'limit', 'unverified', { ...AL, tr: ['alcohol', 'acidity'], p: [200, 'ml'], a: ['caipirinha'] }],
  ['caipiroska', 'Caipiroska (vodka, lime, sugar)', 'Caipiroska (vodca, limão, açúcar)', 'limit', 'secondary', { ...AL, tr: ['alcohol', 'acidity'], p: [200, 'ml'], src: ['ALBY'], a: ['caipivodka', 'caipiroska'] }],
  ['gin-tonic', 'Gin and tonic (tonic is AVOID in the guide)', 'Gim-tônica (tônica é EVITAR no guia)', 'avoid', 'guide', { ...AL, tr: ['alcohol', 'carbonation'], p: [250, 'ml'], src: ['GUIDE'], a: ['gin tônica', 'g&t'] }],
  ['vodka-soda', 'Vodka soda with lime', 'Vodca com água com gás e limão', 'limit', 'secondary', { ...AL, tr: ['alcohol', 'carbonation'], p: [250, 'ml'], src: ['ALBY', 'ALC22'], a: ['vodka soda', 'highball'] }],
  ['vodka-cranberry', 'Vodka cranberry', 'Vodca com suco de cranberry', 'limit', 'secondary', { ...AL, p: [200, 'ml'], src: ['ALBY'], w: ['fruitJuice'], a: ['cape cod'] }],
  ['mojito', 'Mojito (rum)', 'Mojito (rum)', 'avoid', 'listed', { ...AL, tr: ['alcohol', 'carbonation'], p: [250, 'ml'], src: ['ALC22'], a: ['mojito'] }],
  ['pina-colada', 'Piña colada (rum, pineapple juice, coconut cream)', 'Piña colada (rum, suco de abacaxi, creme de coco)', 'avoid', 'listed', { ...AL, tr: ['alcohol', 'fat'], p: [250, 'ml'], src: ['ALC22'], a: ['pina colada'] }],
  ['cuba-libre', 'Rum and cola / Cuba libre', 'Cuba-libre (rum com cola)', 'avoid', 'listed', { ...AL, tr: ['alcohol', 'carbonation', 'caffeine'], p: [250, 'ml'], src: ['ALC22'], a: ['cuba libre', 'rum com coca'] }],
  ['margarita', 'Margarita (tequila, triple sec, lime)', 'Margarita (tequila, licor de laranja, limão)', 'limit', 'unverified', { ...AL, tr: ['alcohol', 'acidity'], p: [200, 'ml'], a: ['margarita'] }],
  ['moscow-mule', 'Moscow mule (vodka, ginger beer, lime)', 'Moscow mule (vodca, ginger beer, limão)', 'limit', 'unverified', { ...AL, tr: ['alcohol', 'carbonation'], p: [250, 'ml'], w: ['hfcs'], a: ['moscow mule'] }],
  ['sangria', 'Sangria (wine with fruit and juices)', 'Sangria (vinho com frutas e sucos)', 'avoid', 'group', { ...AL, p: [250, 'ml'], w: ['fruitJuice'], src: ['ALC22', 'MLIST'], a: ['sangria', 'clericot'] }],
  ['mimosa', 'Mimosa (sparkling wine, orange juice)', 'Mimosa (espumante, suco de laranja)', 'limit', 'secondary', { ...AL, tr: ['alcohol', 'carbonation', 'acidity'], p: [150, 'ml'], src: ['ALBY'], a: ['mimosa'] }],
  ['aperol-spritz', 'Aperol spritz (not tested)', 'Aperol spritz (não testado)', 'limit', 'unverified', { ...AL, tr: ['alcohol', 'carbonation'], p: [250, 'ml'], a: ['spritz'] }],
  ['batida', 'Batida (cachaça with condensed milk or fruit)', 'Batida (cachaça com leite condensado ou fruta)', 'avoid', 'group', { ...AL, t: ['alcohol', 'dairy'], p: [200, 'ml'], w: ['lactose'], src: ['MLIST'], a: ['batida de coco', 'batida de maracujá'] }],
  ['mocktails', 'Mocktails (juice and syrup base varies; label check)', 'Drinques sem álcool (base de suco e xarope varia; leia o rótulo)', 'limit', 'group', { p: [250, 'ml'], w: ['fruitJuice', 'hfcs'], src: ['ALC22'], a: ['mocktail', 'drink sem álcool'] }],
];

const hot: R[] = [
  ['espresso', 'Espresso (regular or decaf)', 'Café espresso (comum ou descafeinado)', 'eat', 'secondary', { tr: CAF, p: [30, 'ml'], src: ['KS17'], a: ['expresso', 'espresso', 'ristretto'] }],
  ['decaf-coffee', 'Decaf coffee, black', 'Café descafeinado, sem leite', 'eat', 'secondary', { p: [250, 'ml'], src: ['KS17'], a: ['descafeinado', 'decaf'] }],
  ['instant-coffee', 'Instant coffee (check for chicory; data conflict)', 'Café solúvel (verifique chicória; dados conflitantes)', 'limit', 'unverified', { tr: CAF, p: [250, 'ml'], w: ['inulin'], a: ['café solúvel', 'nescafé', 'instant coffee'] }],
  ['cold-brew', 'Cold brew coffee, black (not tested separately)', 'Café cold brew, sem leite (não testado separadamente)', 'limit', 'unverified', { tr: CAF, p: [250, 'ml'], a: ['cold brew'] }],
  ['chicory-coffee', 'Chicory coffee / coffee with chicory', 'Café com chicória', 'avoid', 'listed', { w: ['inulin'], p: [250, 'ml'], src: ['LABEL', 'UTD'], a: ['chicória', 'café de chicória', 'ricoré'] }],
  ['latte-regular', 'Latte / cappuccino with regular milk', 'Latte / cappuccino com leite comum', 'avoid', 'group', { t: ['dairy'], tr: CAF, p: [350, 'ml'], w: ['lactose'], src: ['M2026', 'MLIST'], a: ['latte', 'cappuccino', 'café com leite', 'pingado', 'flat white'] }],
  ['latte-lactose-free', 'Latte with lactose-free milk', 'Latte com leite sem lactose', 'eat', 'group', { t: ['dairy'], tr: CAF, p: [350, 'ml'], src: ['SL25', 'KS17'], a: ['café com leite sem lactose'] }],
  ['oat-latte', 'Oat milk latte (oat milk low only up to 104 ml)', 'Latte com bebida de aveia (aveia baixa só até 104 ml)', 'limit', 'group', { tr: CAF, p: [350, 'ml'], src: ['DA24'], a: ['oat latte'] }],
  ['mocha', 'Mocha / flavoured coffee drinks (syrups, chocolate; label check)', 'Mocha / cafés aromatizados (xaropes, chocolate; leia o rótulo)', 'limit', 'group', { t: ['dairy'], tr: CAF, p: [350, 'ml'], w: ['lactose', 'hfcs'], src: ['LABEL'], a: ['mocha', 'frappuccino', 'iced capp', 'double-double'] }],
  ['coffee-creamer', 'Coffee creamer / whitener (label check)', 'Creme para café / chantilly em pó (leia o rótulo)', 'limit', 'unverified', { w: ['lactose', 'hfcs'], a: ['coffee mate', 'creamer', 'creme para café'] }],
  ['black-tea', 'Black tea', 'Chá preto', 'eat', 'secondary', { tr: CAF, p: [250, 'ml'], src: ['KS17'], a: ['chá preto', 'english breakfast', 'earl grey', 'thé noir'] }],
  ['white-tea', 'White tea', 'Chá branco', 'eat', 'secondary', { tr: CAF, p: [250, 'ml'], src: ['KS17'], a: ['chá branco'] }],
  ['peppermint-tea', 'Peppermint tea', 'Chá de hortelã-pimenta', 'eat', 'listed', { p: [250, 'ml'], src: ['COVID', 'KS17'], a: ['chá de hortelã', 'chá de menta', 'tisane menthe'] }],
  ['rooibos', 'Rooibos / honeybush tea', 'Chá de rooibos / honeybush', 'eat', 'secondary', { p: [250, 'ml'], src: ['KS17'], a: ['rooibos', 'honeybush', 'chá vermelho'] }],
  ['chai-weak', 'Chai tea (made weak)', 'Chá chai (fraco)', 'limit', 'secondary', { tr: CAF, p: [250, 'ml'], src: ['KS17'], a: ['chai', 'masala chai'] }],
  ['dandelion-tea', 'Dandelion tea (made weak)', 'Chá de dente-de-leão (fraco)', 'limit', 'secondary', { p: [250, 'ml'], src: ['KS17'], a: ['dente de leão', 'pissenlit'] }],
  ['chamomile-tea', 'Chamomile tea (high in fructans at 1 cup)', 'Chá de camomila (alto em frutanos em 1 xícara)', 'avoid', 'listed', { p: [250, 'ml'], src: ['COVID', 'KS17'], a: ['camomila', 'chá de camomila', 'camomille'] }],
  ['fennel-tea', 'Fennel tea', 'Chá de erva-doce / funcho', 'avoid', 'secondary', { p: [250, 'ml'], src: ['KS17'], a: ['chá de erva-doce', 'chá de funcho'] }],
  ['oolong-tea', 'Oolong tea', 'Chá oolong', 'avoid', 'secondary', { tr: CAF, p: [250, 'ml'], src: ['KS17'], a: ['oolong', 'chá azul'] }],
  ['mate', 'Yerba mate / chimarrão / tereré (not tested)', 'Erva-mate / chimarrão / tereré (não testado)', 'limit', 'unverified', { tr: CAF, p: [250, 'ml'], a: ['chimarrão', 'erva mate', 'tereré', 'mate'] }],
  ['mate-toasted', 'Toasted mate tea (e.g. Matte Leão; not tested)', 'Chá mate tostado (ex. Matte Leão; não testado)', 'limit', 'unverified', { tr: CAF, p: [250, 'ml'], a: ['matte leão', 'chá mate'] }],
  ['matcha', 'Matcha (not tested separately)', 'Matcha (não testado separadamente)', 'limit', 'unverified', { tr: CAF, p: [250, 'ml'], a: ['matchá', 'matcha latte'] }],
  ['hibiscus-tea', 'Hibiscus tea (not tested)', 'Chá de hibisco (não testado)', 'limit', 'unverified', { tr: ['acidity'], p: [250, 'ml'], a: ['hibisco', 'flor de jamaica'] }],
  ['herbal-infusions-br', 'Brazilian herbal infusions: boldo, erva-cidreira, capim-santo (not tested)', 'Infusões brasileiras: boldo, erva-cidreira, capim-santo (não testadas)', 'limit', 'unverified', { p: [250, 'ml'], a: ['boldo', 'erva cidreira', 'capim santo', 'chá de capim-limão', 'melissa'] }],
  ['ginger-tea', 'Ginger tea, fresh (not tested as a drink)', 'Chá de gengibre fresco (não testado como bebida)', 'limit', 'unverified', { p: [250, 'ml'], a: ['chá de gengibre'] }],
  ['hot-chocolate-regular', 'Hot chocolate with regular milk', 'Chocolate quente com leite comum', 'avoid', 'group', { t: ['dairy'], p: [250, 'ml'], w: ['lactose'], src: ['M2026', 'MLIST'], a: ['chocolate quente', 'achocolatado', 'nescau', 'toddy', 'chocolat chaud'] }],
  ['hot-chocolate-lf', 'Hot chocolate with lactose-free milk (cocoa not tested here)', 'Chocolate quente com leite sem lactose (cacau não testado aqui)', 'limit', 'unverified', { t: ['dairy'], tr: CAF, p: [250, 'ml'], a: ['achocolatado sem lactose'] }],
  ['chocolate-milk', 'Chocolate milk, ready-to-drink (regular dairy)', 'Bebida achocolatada pronta (laticínio comum)', 'avoid', 'group', { t: ['dairy'], p: [250, 'ml'], w: ['lactose'], src: ['M2026', 'MLIST'], a: ['toddynho', 'chocolate milk', 'lait au chocolat'] }],
];

const shakes: R[] = [
  ['protein-shake-rtd', 'Ready-to-drink protein shakes (label check)', 'Shakes proteicos prontos (leia o rótulo)', 'limit', 'unverified', { t: ['dairy'], p: [330, 'ml'], w: ['lactose', 'inulin', 'polyols', 'sweeteners'], a: ['shake de proteína', 'fairlife', 'premier protein'] }],
  ['whey-concentrate', 'Whey protein concentrate (contains lactose)', 'Whey protein concentrado (contém lactose)', 'limit', 'unverified', { t: ['dairy'], p: [30, 'g'], w: ['lactose', 'sweeteners', 'inulin'], a: ['whey concentrado'] }],
  ['plant-protein-powder', 'Plant protein powders (pea, rice; not tested)', 'Proteína vegetal em pó (ervilha, arroz; não testada)', 'limit', 'unverified', { p: [30, 'g'], w: ['inulin', 'sweeteners'], a: ['proteína de ervilha', 'proteína vegana'] }],
  ['smoothie-lf', 'Homemade smoothie with low-FODMAP fruit and lactose-free milk (fruit amount matters)', 'Vitamina caseira com fruta baixo FODMAP e leite sem lactose (quantidade de fruta importa)', 'limit', 'group', { t: ['dairy'], p: [300, 'ml'], src: ['ST19', 'ST22'], a: ['vitamina', 'smoothie caseiro', 'batida de fruta'] }],
  ['smoothie-commercial', 'Commercial smoothies (often apple/mango juice base; label check)', 'Smoothies industrializados (costumam ter base de maçã/manga; leia o rótulo)', 'limit', 'group', { p: [300, 'ml'], w: ['fruitJuice', 'inulin'], src: ['LABEL'], a: ['smoothie pronto', 'innocent', 'booster juice'] }],
  ['meal-replacement', 'Meal-replacement drinks (label check: inulin, FOS, polyols)', 'Bebidas substitutas de refeição (leia o rótulo: inulina, FOS, polióis)', 'limit', 'unverified', { p: [250, 'ml'], w: ['inulin', 'polyols', 'lactose'], a: ['ensure', 'boost', 'sustagen'] }],
];

export const DRINKS = group('drinks', [...water, ...soft, ...juices, ...beer, ...wine, ...spirits, ...cocktails, ...hot, ...shakes]);
