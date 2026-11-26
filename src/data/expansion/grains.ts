import { group, sv, type R } from './helper';

/**
 * Grains, flours, breads and pasta; beans, nuts and seeds.
 * - Wheat, rye and barley products are AVOID (fructans; M2026, MLIST, UTD).
 * - Rice, maize/corn, potato and tapioca flours are named low by Monash (GR, FAQ).
 * - FIB21 serves are reference serves as published (uncooked/cooked as stated).
 * - Flocão de milho: no FODMAP data for the product itself; it is NOT given the
 *   rating of cornmeal or corn flakes (LIMIT, not tested).
 */
const W = { t: ['gluten' as const], w: ['wheat' as const], src: ['M2026' as const, 'MLIST' as const, 'UTD' as const] };

const grains: R[] = [
  ['rice-flour', 'Rice flour', 'Farinha de arroz', 'eat', 'listed', { src: ['GR', 'FAQ'], a: ['farinha de arroz', 'rice flour'] }],
  ['tapioca-starch', 'Tapioca starch / polvilho / goma de tapioca', 'Polvilho / goma de tapioca (amido de mandioca)', 'eat', 'listed', { src: ['GR'], a: ['polvilho', 'polvilho doce', 'polvilho azedo', 'goma de tapioca', 'tapioca', 'tapioca flour', 'fécula de mandioca'] }],
  ['cornstarch', 'Cornstarch (amido de milho)', 'Amido de milho (maisena)', 'eat', 'listed', { src: ['GR', 'FAQ'], a: ['amido de milho', 'maisena', 'cornflour', 'fécule de maïs'] }],
  ['potato-starch', 'Potato starch / potato flour', 'Fécula / farinha de batata', 'eat', 'listed', { src: ['FAQ'], a: ['fécula de batata', 'farinha de batata'] }],
  ['cornmeal', 'Cornmeal / fubá (plain maize flour)', 'Fubá / farinha de milho fina (simples)', 'eat', 'listed', { src: ['GR', 'FAQ'], a: ['fubá', 'fuba', 'cornmeal', 'maize flour', 'masa harina'] }],
  ['flocao-milho', 'Flocão de milho (pre-cooked maize flakes for cuscuz; not tested)', 'Flocão de milho (flocos pré-cozidos para cuscuz; não testado)', 'limit', 'unverified', { a: ['flocão', 'flocao', 'farinha de milho flocada', 'milharina'] }],
  ['farinha-de-milho-flocada', 'Farinha de milho (coarse corn flakes for farofa; not tested)', 'Farinha de milho em flocos para farofa (não testada)', 'limit', 'unverified', { a: ['farinha de milho', 'biju de milho'] }],
  ['canjica', 'Canjica / white hominy (not tested)', 'Canjica / mungunzá (milho branco; não testado)', 'limit', 'unverified', { a: ['canjica', 'mungunzá', 'hominy', 'pozole'] }],
  ['gf-couscous', 'Gluten-free couscous', 'Cuscuz marroquino sem glúten', 'eat', 'listed', { src: ['SL25'], a: ['couscous sem glúten'] }],
  ['millet', 'Millet', 'Painço / milheto', 'eat', 'listed', { src: ['SL25'], a: ['painço', 'milheto', 'millet'] }],
  ['buckwheat', 'Buckwheat groats (cooked)', 'Trigo-sarraceno em grão (cozido)', 'eat', 'serve', { s: sv(135, 'g', 'FIB21', [0.75, 'cup']), src: ['GR', 'FIB21'], a: ['trigo sarraceno', 'kasha', 'sarrasin'] }],
  ['buckwheat-flour', 'Buckwheat flour', 'Farinha de trigo-sarraceno', 'eat', 'listed', { src: ['GR'], a: ['farinha de trigo sarraceno', 'farine de sarrasin'] }],
  ['jasmine-rice', 'Jasmine rice', 'Arroz jasmim', 'eat', 'group', { src: ['SL25'], a: ['arroz jasmim', 'jasmine'] }],
  ['arborio-rice', 'Arborio / risotto rice', 'Arroz arbóreo (para risoto)', 'eat', 'group', { src: ['SL25'], a: ['arroz arbóreo', 'arroz carnaroli', 'risotto rice'] }],
  ['parboiled-rice', 'Parboiled rice', 'Arroz parboilizado', 'eat', 'group', { src: ['SL25'], a: ['arroz parboilizado', 'converted rice'] }],
  ['sushi-rice', 'Sushi rice (plain, cooked)', 'Arroz japonês para sushi (simples)', 'eat', 'group', { src: ['SL25'], a: ['arroz japonês', 'gohan', 'arroz de sushi'] }],
  ['wild-rice', 'Wild rice (different grain; not tested here)', 'Arroz selvagem (outro grão; não testado aqui)', 'limit', 'unverified', { a: ['arroz selvagem', 'riz sauvage'] }],
  ['black-rice', 'Black rice (not tested here)', 'Arroz negro (não testado aqui)', 'limit', 'unverified', { a: ['arroz negro', 'arroz preto'] }],
  ['red-rice', 'Red rice (not tested here)', 'Arroz vermelho (não testado aqui)', 'limit', 'unverified', { a: ['arroz vermelho'] }],
  ['puffed-rice', 'Puffed rice cereal (label check for malt)', 'Arroz tufado / flocos de arroz (verifique malte)', 'limit', 'group', { src: ['LABEL'], w: ['wheat'], a: ['arroz tufado', 'rice krispies', 'rice bubbles'] }],
  ['sorghum', 'Sorghum (not tested here)', 'Sorgo (não testado aqui)', 'limit', 'unverified', { a: ['sorgo', 'jowar'] }],
  ['amaranth', 'Amaranth (not tested here)', 'Amaranto (não testado aqui)', 'limit', 'unverified', { a: ['amaranto'] }],
  ['teff', 'Teff (not tested here)', 'Teff (não testado aqui)', 'limit', 'unverified', { a: ['teff'] }],
  ['bulgur', 'Bulgur (wheat; small serve only)', 'Trigo para quibe / bulgur (trigo; só porção pequena)', 'limit', 'serve', { s: sv(44, 'g', 'FIB21', [0.25, 'cup']), src: ['FIB21'], t: ['gluten'], a: ['trigo para quibe', 'bulgur', 'tabule'] }],
  ['soba', 'Soba noodles (dry; label check for wheat)', 'Macarrão soba (seco; verifique trigo)', 'limit', 'serve', { s: sv(90, 'g', 'FIB21', [0.33, 'cup']), src: ['FIB21'], w: ['wheat'], a: ['soba', 'lámen de trigo sarraceno'] }],
  ['glass-noodles', 'Glass noodles / bean thread (not tested here)', 'Bifum de feijão / harusame (não testado aqui)', 'limit', 'unverified', { a: ['harusame', 'macarrão de feijão', 'cellophane noodles'] }],
  ['gf-gnocchi', 'Gnocchi, gluten-free (label check)', 'Nhoque sem glúten (leia o rótulo)', 'limit', 'unverified', { w: ['garlicOnion'], a: ['nhoque sem glúten'] }],
  ['gf-breadcrumbs', 'Gluten-free breadcrumbs (label check)', 'Farinha de rosca sem glúten (leia o rótulo)', 'limit', 'unverified', { w: ['garlicOnion', 'inulin'], a: ['farinha de rosca sem glúten'] }],
  ['quick-oats', 'Quick / instant oats, plain (not tested here)', 'Aveia em flocos finos / instantânea (não testada aqui)', 'limit', 'unverified', { a: ['aveia em flocos finos', 'aveia instantânea', 'quick oats'] }],
  ['steel-cut-oats', 'Steel-cut oats (not tested here)', 'Aveia em grão cortada (não testada aqui)', 'limit', 'unverified', { a: ['aveia cortada', 'irish oats'] }],
  ['oat-bran', 'Oat bran (not tested here)', 'Farelo de aveia (não testado aqui)', 'limit', 'unverified', { a: ['farelo de aveia', 'son d’avoine'] }],
  ['flavoured-oatmeal', 'Flavoured instant oatmeal packets (label check)', 'Mingau de aveia instantâneo saborizado (leia o rótulo)', 'limit', 'unverified', { w: ['honey', 'inulin', 'fruitJuice'], a: ['quaker sabor', 'mingau pronto'] }],
  ['arrowroot', 'Arrowroot starch (not tested)', 'Araruta (não testada)', 'limit', 'unverified', { a: ['araruta', 'arrow-root'] }],
  ['coconut-flour', 'Coconut flour (not tested here)', 'Farinha de coco (não testada aqui)', 'limit', 'unverified', { a: ['farinha de coco'] }],
  ['spelt-flour', 'Spelt flour (not tested here)', 'Farinha de espelta (não testada aqui)', 'limit', 'unverified', { t: ['gluten'], a: ['espelta', 'épeautre'] }],
  ['udon', 'Udon noodles (wheat)', 'Macarrão udon (trigo)', 'avoid', 'group', { ...W, a: ['udon'] }],
  ['instant-ramen', 'Instant ramen noodles with seasoning sachet', 'Miojo / lámen instantâneo com tempero', 'avoid', 'group', { ...W, w: ['wheat', 'garlicOnion'], a: ['miojo', 'lámen', 'ramen', 'cup noodles'] }],
  ['egg-noodles', 'Egg noodles (wheat)', 'Macarrão de ovos (trigo)', 'avoid', 'group', { ...W, a: ['macarrão com ovos', 'nouilles aux œufs', 'lo mein'] }],
  ['gnocchi-wheat', 'Gnocchi (regular, with wheat flour)', 'Nhoque (comum, com farinha de trigo)', 'avoid', 'group', { ...W, a: ['nhoque', 'gnocchi'] }],
  ['lasagna-sheets', 'Lasagna sheets (wheat)', 'Massa de lasanha (trigo)', 'avoid', 'group', { ...W, a: ['massa de lasanha'] }],
  ['bagel', 'Bagel (wheat)', 'Bagel (trigo)', 'avoid', 'group', { ...W }],
  ['croissant', 'Croissant (wheat)', 'Croissant (trigo)', 'avoid', 'group', { ...W, a: ['croissant'], t: ['gluten', 'dairy'] }],
  ['pita', 'Pita bread (wheat)', 'Pão sírio / pita (trigo)', 'avoid', 'group', { ...W, a: ['pão sírio', 'pita'] }],
  ['naan', 'Naan (wheat)', 'Naan (trigo)', 'avoid', 'group', { ...W }],
  ['english-muffin', 'English muffin (wheat)', 'Muffin inglês (trigo)', 'avoid', 'group', { ...W }],
  ['flour-tortilla', 'Flour tortilla / wrap (wheat)', 'Tortilha / wrap de trigo', 'avoid', 'group', { ...W, a: ['wrap de trigo', 'rap10', 'tortilla de trigo'] }],
  ['pao-frances', 'Pão francês / bread roll (wheat)', 'Pão francês / pão de sal (trigo)', 'avoid', 'group', { ...W, a: ['pão francês', 'pão de sal', 'cacetinho', 'baguete', 'baguette'] }],
  ['wheat-crackers', 'Wheat crackers (cream crackers, Saltines)', 'Biscoito cream cracker / água e sal (trigo)', 'avoid', 'group', { ...W, a: ['cream cracker', 'água e sal', 'saltines', 'ritz'] }],
  ['pretzels', 'Pretzels (wheat)', 'Pretzels (trigo)', 'avoid', 'group', { ...W }],
  ['breadcrumbs', 'Breadcrumbs / panko (wheat)', 'Farinha de rosca / panko (trigo)', 'avoid', 'group', { ...W, a: ['farinha de rosca', 'panko', 'chapelure'] }],
  ['semolina', 'Semolina (wheat)', 'Sêmola / semolina (trigo)', 'avoid', 'group', { ...W, a: ['sêmola', 'semolina', 'cream of wheat'] }],
  ['farro', 'Farro / spelt grains / freekeh (wheat family)', 'Farro / freekeh (família do trigo)', 'avoid', 'group', { ...W, a: ['farro', 'freekeh', 'kamut'] }],
  ['rye-flour', 'Rye flour', 'Farinha de centeio', 'avoid', 'group', { ...W, a: ['farinha de centeio', 'centeio'] }],
  ['wheat-bran', 'Wheat bran / wheat germ', 'Farelo / gérmen de trigo', 'avoid', 'group', { ...W, a: ['farelo de trigo', 'gérmen de trigo', 'all-bran'] }],
];

const NUT = ['nuts'] as const;
const nuts: R[] = [
  ['brazil-nuts', 'Brazil nuts', 'Castanha-do-pará / castanha-do-brasil', 'eat', 'serve', { s: sv(40, 'g', 'FIB21', [10, 'unit']), src: ['SL25', 'FIB21'], t: [...NUT], a: ['castanha do pará', 'castanha do brasil', 'noix du brésil'] }],
  ['pecans', 'Pecans', 'Noz-pecã', 'eat', 'listed', { src: ['SL25'], t: [...NUT], a: ['noz pecã', 'pecan', 'pacanes'] }],
  ['chestnuts', 'Chestnuts', 'Castanha portuguesa', 'eat', 'listed', { src: ['SL25'], t: [...NUT], a: ['castanha portuguesa', 'marrons', 'châtaigne'] }],
  ['hazelnuts', 'Hazelnuts (small serve)', 'Avelãs (porção pequena)', 'limit', 'serve', { s: sv(15, 'g', 'FIB21', [10, 'unit']), src: ['FIB21'], t: [...NUT], a: ['avelã', 'noisettes'] }],
  ['pine-nuts', 'Pine nuts (not tested here)', 'Pinoli / pinhão europeu (não testado aqui)', 'limit', 'unverified', { t: [...NUT], a: ['pinoli', 'pignons'] }],
  ['pinhao', 'Pinhão (Brazilian araucaria seed; not tested)', 'Pinhão (não testado)', 'limit', 'unverified', { a: ['pinhão', 'pinhao'] }],
  ['baru-nuts', 'Baru nuts (not tested)', 'Castanha de baru (não testada)', 'limit', 'unverified', { t: [...NUT], a: ['baru'] }],
  ['mixed-nuts', 'Mixed nuts (often contain cashews/pistachios; label check)', 'Mix de castanhas (costuma ter caju/pistache; leia o rótulo)', 'limit', 'group', { src: ['MLIST'], t: [...NUT], a: ['mix de nuts', 'castanhas sortidas', 'trail mix'] }],
  ['almond-flour', 'Almond meal / flour (small serve)', 'Farinha de amêndoas (porção pequena)', 'limit', 'serve', { s: sv(24, 'g', 'FIB21', [0.25, 'cup']), src: ['FIB21'], t: [...NUT], a: ['farinha de amêndoa', 'almond meal', 'poudre d’amande'] }],
  ['almond-butter', 'Almond butter (not tested here)', 'Pasta de amêndoas (não testada aqui)', 'limit', 'unverified', { t: [...NUT], a: ['manteiga de amêndoa'] }],
  ['cashew-butter', 'Cashew butter', 'Pasta de castanha-de-caju', 'avoid', 'group', { src: ['M2026', 'MLIST', 'UTD'], t: [...NUT], a: ['manteiga de caju'] }],
  ['flaxseed', 'Flaxseed / linseed', 'Linhaça', 'eat', 'serve', { s: sv(15, 'g', 'FIB21', [1, 'tbsp']), src: ['SL25', 'FIB21'], a: ['linhaça', 'linhaça dourada', 'linseed', 'lin'] }],
  ['hemp-seeds', 'Hemp seeds (hulled)', 'Sementes de cânhamo', 'eat', 'listed', { src: ['SL25'], a: ['semente de cânhamo', 'hemp hearts', 'chanvre'] }],
  ['sesame-seeds', 'Sesame seeds', 'Gergelim', 'eat', 'listed', { src: ['SL25'], a: ['gergelim', 'sésamo', 'sésame'] }],
  ['sunflower-seeds', 'Sunflower seeds (small serve)', 'Sementes de girassol (porção pequena)', 'limit', 'serve', { s: sv(6, 'g', 'FIB21', [2, 'tsp']), src: ['SL25', 'FIB21'], a: ['semente de girassol', 'tournesol'] }],
  ['tahini', 'Tahini (sesame paste)', 'Tahine (pasta de gergelim)', 'eat', 'serve', { s: sv(30, 'g', 'FIB21', [2, 'tbsp']), src: ['FIB21'], a: ['tahine', 'tahini', 'pasta de gergelim'] }],
  ['poppy-seeds', 'Poppy seeds (not tested)', 'Semente de papoula (não testada)', 'limit', 'unverified', { a: ['papoula', 'pavot'] }],
  ['psyllium', 'Psyllium husk (not tested here)', 'Psyllium (não testado aqui)', 'limit', 'unverified', { a: ['psilium', 'psyllium', 'metamucil'] }],
  ['chickpeas-boiled', 'Chickpeas, dried and boiled', 'Grão-de-bico cozido (de grão seco)', 'avoid', 'group', { src: ['M2026', 'MLIST', 'UTD'], a: ['grão de bico cozido', 'pois chiches'] }],
  ['lentils-boiled', 'Green lentils, boiled (very small serve)', 'Lentilha verde cozida (porção muito pequena)', 'limit', 'serve', { s: sv(23, 'g', 'FIB21', [0.25, 'cup']), src: ['FIB21', 'UTD'], a: ['lentilha cozida', 'lentilles'] }],
  ['red-lentils', 'Red lentils (not tested here)', 'Lentilha vermelha (não testada aqui)', 'limit', 'unverified', { a: ['lentilha vermelha', 'masoor'] }],
  ['pinto-beans', 'Pinto / carioca beans', 'Feijão carioca / rajado', 'avoid', 'group', { src: ['M2026', 'MLIST', 'UTD'], a: ['feijão carioca', 'feijão rajado', 'pinto beans', 'feijão'] }],
  ['navy-beans', 'Navy / white beans', 'Feijão-branco', 'avoid', 'group', { src: ['M2026', 'MLIST', 'UTD'], a: ['feijão branco', 'haricots blancs', 'cannellini secos'] }],
  ['black-eyed-peas', 'Black-eyed peas', 'Feijão-fradinho / feijão-de-corda', 'avoid', 'group', { src: ['MLIST', 'UTD'], a: ['feijão fradinho', 'feijão de corda', 'feijão macassar'] }],
  ['adzuki-beans', 'Adzuki beans', 'Feijão-azuki', 'avoid', 'group', { src: ['MLIST', 'UTD'], a: ['azuki', 'feijão azuki'] }],
  ['fava-beans', 'Broad / fava beans', 'Fava', 'avoid', 'group', { src: ['MLIST', 'UTD'], a: ['fava', 'féveroles', 'broad beans'] }],
  ['lupini-beans', 'Lupini beans', 'Tremoço', 'avoid', 'group', { src: ['LABEL', 'UTD'], a: ['tremoço', 'lupin'] }],
  ['cannellini-canned', 'Cannellini beans, canned (not tested here)', 'Feijão cannellini em lata (não testado aqui)', 'limit', 'unverified', { a: ['cannellini em lata'] }],
  ['silken-tofu', 'Silken / soft tofu (not established)', 'Tofu macio / silken (não estabelecido)', 'limit', 'unverified', { a: ['tofu macio', 'tofu silken', 'tofu soyeux'] }],
  ['seitan', 'Seitan (wheat gluten; not tested here)', 'Seitan (glúten de trigo; não testado aqui)', 'limit', 'unverified', { t: ['gluten'], a: ['seitan', 'carne de glúten'] }],
];

export const GRAINS = group('starches', grains);
export const LEGUMES = group('legumes', nuts);
