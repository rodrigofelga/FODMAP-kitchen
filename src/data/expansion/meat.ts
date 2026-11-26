import { group, type R } from './helper';

/**
 * Meat, poultry and game. Plain, unseasoned meat contains no FODMAPs (Monash:
 * "plain meats" are low FODMAP — SL25, MLIST), so plain cuts are EAT with
 * verification 'group': they are not individually laboratory-tested. Marinated,
 * cured, smoked or processed products are LIMIT (label check for garlic, onion,
 * wheat, lactose and polyols); breaded or battered products are AVOID (wheat).
 */
const B = ['meat'] as const;
const P = ['meat', 'pork'] as const;
const C = ['meat', 'poultry'] as const;
const m = (t: readonly ('meat' | 'pork' | 'poultry')[]) => ({ t: [...t], src: ['SL25' as const, 'MLIST' as const] });
const lab = (t: readonly ('meat' | 'pork' | 'poultry')[]) => ({ t: [...t], w: ['garlicOnion' as const, 'wheat' as const, 'lactose' as const] });

const beef: R[] = [
  ['beef-sirloin', 'Beef sirloin steak (plain)', 'Contrafilé (simples)', 'eat', 'group', { ...m(B), a: ['contra-filé', 'striploin', 'new york strip', 'bife de contrafilé'] }],
  ['beef-tenderloin', 'Beef tenderloin / filet mignon (plain)', 'Filé mignon bovino (simples)', 'eat', 'group', { ...m(B), a: ['filé mignon', 'file mignon', 'filet mignon'] }],
  ['beef-ribeye', 'Beef ribeye (plain)', 'Bife ancho / ribeye (simples)', 'eat', 'group', { ...m(B), a: ['ancho', 'olho de bife', 'entrecôte', 'rib steak'] }],
  ['beef-picanha', 'Picanha / top sirloin cap (plain)', 'Picanha (simples)', 'eat', 'group', { ...m(B), a: ['picanha', 'coulotte', 'rump cap'] }],
  ['beef-alcatra', 'Beef rump / top sirloin (plain)', 'Alcatra (simples)', 'eat', 'group', { ...m(B), a: ['alcatra', 'top sirloin', 'rump steak'] }],
  ['beef-maminha', 'Beef tri-tip (plain)', 'Maminha (simples)', 'eat', 'group', { ...m(B), a: ['maminha', 'tri-tip'] }],
  ['beef-fraldinha', 'Beef flank / bavette (plain)', 'Fraldinha (simples)', 'eat', 'group', { ...m(B), a: ['fraldinha', 'flank steak', 'bavette', 'vazio'] }],
  ['beef-skirt', 'Beef skirt steak (plain)', 'Diafragma bovino / skirt (simples)', 'eat', 'group', { ...m(B), a: ['skirt steak', 'diafragma', 'arrachera'] }],
  ['beef-brisket', 'Beef brisket (plain)', 'Peito bovino (simples)', 'eat', 'group', { ...m(B), a: ['peito bovino', 'brisket', 'granito'] }],
  ['beef-chuck', 'Beef chuck (plain)', 'Acém (simples)', 'eat', 'group', { ...m(B), a: ['acém', 'acem', 'chuck', 'pescoço bovino'] }],
  ['beef-short-ribs', 'Beef short ribs (plain)', 'Costela bovina (simples)', 'eat', 'group', { ...m(B), a: ['costela', 'costela de boi', 'costela bovina', 'ribs'] }],
  ['beef-shank', 'Beef shank (plain)', 'Músculo bovino (simples)', 'eat', 'group', { ...m(B), a: ['músculo', 'musculo', 'ossobuco', 'shin'] }],
  ['beef-oxtail', 'Oxtail (plain)', 'Rabada (simples)', 'eat', 'group', { ...m(B), a: ['rabada', 'rabo de boi'] }],
  ['beef-cupim', 'Cupim / beef hump (plain)', 'Cupim (simples)', 'eat', 'group', { ...m(B), a: ['cupim', 'hump'] }],
  ['beef-coxao-mole', 'Beef topside (plain)', 'Coxão mole (simples)', 'eat', 'group', { ...m(B), a: ['coxão mole', 'coxao mole', 'chã de dentro', 'inside round', 'topside'] }],
  ['beef-coxao-duro', 'Beef silverside / outside round (plain)', 'Coxão duro (simples)', 'eat', 'group', { ...m(B), a: ['coxão duro', 'chã de fora', 'outside round', 'silverside'] }],
  ['beef-lagarto', 'Beef eye of round (plain)', 'Lagarto (simples)', 'eat', 'group', { ...m(B), a: ['lagarto', 'eye of round', 'tatu'] }],
  ['beef-patinho', 'Beef knuckle / sirloin tip (plain)', 'Patinho (simples)', 'eat', 'group', { ...m(B), a: ['patinho', 'knuckle', 'sirloin tip'] }],
  ['beef-paleta', 'Beef shoulder clod (plain)', 'Paleta bovina (simples)', 'eat', 'group', { ...m(B), a: ['paleta', 'shoulder clod', 'raquete'] }],
  ['beef-t-bone', 'T-bone steak (plain)', 'T-bone / bisteca bovina (simples)', 'eat', 'group', { ...m(B), a: ['t-bone', 'bisteca bovina', 'porterhouse'] }],
  ['beef-flat-iron', 'Flat iron steak (plain)', 'Flat iron / raquete (simples)', 'eat', 'group', { ...m(B), a: ['flat iron', 'top blade'] }],
  ['beef-stew-cubes', 'Beef stewing cubes (plain, unseasoned)', 'Carne em cubos para ensopado (sem tempero)', 'eat', 'group', { ...m(B), a: ['carne para ensopado', 'stew beef', 'carne em cubos'] }],
  ['beef-liver', 'Beef liver (plain)', 'Fígado bovino (simples)', 'eat', 'group', { ...m(B), a: ['fígado', 'figado', 'liver'] }],
  ['beef-tongue', 'Beef tongue (plain)', 'Língua bovina (simples)', 'eat', 'group', { ...m(B), a: ['língua', 'lingua'] }],
  ['beef-heart', 'Beef heart (plain)', 'Coração bovino (simples)', 'eat', 'group', { ...m(B), a: ['coração de boi'] }],
  ['beef-tripe', 'Beef tripe (plain)', 'Bucho / dobradinha (simples)', 'eat', 'group', { ...m(B), a: ['bucho', 'dobradinha', 'tripa', 'tripe'] }],
  ['beef-kidney', 'Beef kidney (plain)', 'Rim bovino (simples)', 'eat', 'group', { ...m(B), a: ['rim', 'kidney'] }],
  ['beef-bone-marrow', 'Beef bone marrow (plain)', 'Tutano bovino (simples)', 'eat', 'group', { ...m(B), a: ['tutano', 'marrow', 'osso buco'] }],
  ['veal', 'Veal (plain)', 'Vitela (simples)', 'eat', 'group', { ...m(B), a: ['vitela', 'vitelo'] }],
  ['carne-seca', 'Carne-seca / jerked beef (salt-cured; label check)', 'Carne-seca / charque (curada no sal; leia o rótulo)', 'limit', 'group', { ...lab(B), a: ['carne seca', 'charque', 'jabá', 'jerked beef'] }],
  ['carne-de-sol', 'Carne de sol (salted, sun-dried beef; label check)', 'Carne de sol (salgada; leia o rótulo)', 'limit', 'group', { ...lab(B), a: ['carne de sol', 'carne do sertão'] }],
  ['beef-jerky', 'Beef jerky (marinated; label check)', 'Beef jerky / carne desidratada temperada (leia o rótulo)', 'limit', 'group', { ...lab(B), a: ['jerky', 'carne desidratada'], w: ['garlicOnion', 'honey', 'hfcs'] }],
  ['corned-beef', 'Corned beef (label check)', 'Corned beef / carne enlatada (leia o rótulo)', 'limit', 'group', { ...lab(B), a: ['carne enlatada', 'corned beef'] }],
  ['roast-beef-deli', 'Deli roast beef (label check)', 'Rosbife fatiado de frios (leia o rótulo)', 'limit', 'group', { ...lab(B), a: ['rosbife', 'roast beef'] }],
  ['pastrami', 'Pastrami (spice rub; label check)', 'Pastrami (tempero; leia o rótulo)', 'limit', 'group', { ...lab(B), a: ['pastrami'] }],
  ['montreal-smoked-meat', 'Montreal smoked meat (spice rub; label check)', 'Carne defumada estilo Montreal (tempero; leia o rótulo)', 'limit', 'group', { ...lab(B), a: ['smoked meat', 'viande fumée'] }],
  ['bresaola', 'Bresaola (cured beef; label check)', 'Bresaola (carne curada; leia o rótulo)', 'limit', 'group', { ...lab(B) }],
  ['beef-sausage', 'Beef sausages (label check)', 'Linguiça bovina (leia o rótulo)', 'limit', 'group', { ...lab(B), a: ['linguiça de boi', 'beef sausage'] }],
  ['marinated-steak', 'Pre-marinated steak (label check)', 'Carne já temperada / marinada (leia o rótulo)', 'limit', 'group', { ...lab(B), a: ['carne temperada', 'marinated beef'] }],
];

const ground: R[] = [
  ['ground-pork', 'Ground pork (plain)', 'Carne suína moída (simples)', 'eat', 'group', { ...m(P), a: ['porco moído', 'pork mince'] }],
  ['ground-chicken', 'Ground chicken (plain)', 'Frango moído (simples)', 'eat', 'group', { ...m(C), a: ['frango moído', 'chicken mince'] }],
  ['ground-turkey', 'Ground turkey (plain)', 'Peru moído (simples)', 'eat', 'group', { ...m(C), a: ['peru moído', 'turkey mince'] }],
  ['ground-lamb', 'Ground lamb (plain)', 'Cordeiro moído (simples)', 'eat', 'group', { ...m(B), a: ['cordeiro moído', 'lamb mince'] }],
];

const pork: R[] = [
  ['pork-loin', 'Pork loin (plain)', 'Lombo suíno (simples)', 'eat', 'group', { ...m(P), a: ['lombo', 'lombo de porco', 'pork loin'] }],
  ['pork-tenderloin', 'Pork tenderloin (plain)', 'Filé mignon suíno (simples)', 'eat', 'group', { ...m(P), a: ['filé mignon suíno', 'filezinho de porco'] }],
  ['pork-chops', 'Pork chops (plain)', 'Bisteca / costeleta suína (simples)', 'eat', 'group', { ...m(P), a: ['bisteca suína', 'costeleta', 'pork chop'] }],
  ['pork-belly', 'Pork belly (plain)', 'Barriga de porco / panceta (simples)', 'eat', 'group', { ...m(P), a: ['barriga de porco', 'panceta', 'pork belly'] }],
  ['pork-ribs', 'Pork ribs (plain)', 'Costelinha suína (simples)', 'eat', 'group', { ...m(P), a: ['costelinha', 'costela de porco', 'spare ribs', 'back ribs'] }],
  ['pork-shoulder', 'Pork shoulder / butt (plain)', 'Paleta / copa-lombo suíno (simples)', 'eat', 'group', { ...m(P), a: ['paleta suína', 'copa lombo', 'pulled pork', 'pork butt'] }],
  ['pork-leg', 'Pork leg / pernil (plain)', 'Pernil suíno (simples)', 'eat', 'group', { ...m(P), a: ['pernil', 'leg of pork'] }],
  ['pork-knuckle', 'Pork knuckle / hock (plain)', 'Joelho de porco (simples)', 'eat', 'group', { ...m(P), a: ['joelho de porco', 'eisbein', 'ham hock'] }],
  ['pork-feet', 'Pork feet, ears and tail (plain, as in feijoada cuts)', 'Pé, orelha e rabo de porco (simples)', 'eat', 'group', { ...m(P), a: ['pé de porco', 'orelha de porco', 'rabo de porco'] }],
  ['pork-liver', 'Pork liver (plain)', 'Fígado suíno (simples)', 'eat', 'group', { ...m(P), a: ['fígado de porco'] }],
  ['torresmo', 'Torresmo / pork crackling (plain, salted)', 'Torresmo (simples, só sal)', 'eat', 'group', { ...m(P), a: ['torresmo', 'pork crackling', 'chicharrón', 'pork rinds'] }],
  ['prosciutto', 'Prosciutto / Parma ham (label check)', 'Presunto cru / Parma (leia o rótulo)', 'limit', 'group', { ...lab(P), a: ['presunto cru', 'parma'] }],
  ['salami', 'Salami (label check)', 'Salame (leia o rótulo)', 'limit', 'group', { ...lab(P), a: ['salame'] }],
  ['mortadela', 'Mortadella (label check)', 'Mortadela (leia o rótulo)', 'limit', 'group', { ...lab(P), a: ['mortadella', 'bologna'] }],
  ['peameal-bacon', 'Peameal / back bacon (label check)', 'Bacon canadense / lombo canadense (leia o rótulo)', 'limit', 'group', { ...lab(P), a: ['back bacon', 'lombo canadense', 'canadian bacon'] }],
  ['pancetta', 'Pancetta (cured; label check)', 'Pancetta curada (leia o rótulo)', 'limit', 'group', { ...lab(P) }],
  ['copa', 'Copa / capicola (label check)', 'Copa (leia o rótulo)', 'limit', 'group', { ...lab(P), a: ['capicola', 'coppa'] }],
  ['paio', 'Paio sausage (label check)', 'Paio (leia o rótulo)', 'limit', 'group', { ...lab(P) }],
  ['calabresa', 'Calabresa sausage (label check)', 'Linguiça calabresa (leia o rótulo)', 'limit', 'group', { ...lab(P), a: ['calabresa', 'linguiça calabresa'], tr: ['spicy'] }],
  ['pork-sausage', 'Pork sausages (label check)', 'Linguiça suína / toscana (leia o rótulo)', 'limit', 'group', { ...lab(P), a: ['linguiça toscana', 'breakfast sausage', 'bratwurst'] }],
  ['blood-sausage', 'Blood sausage (label check)', 'Morcela / chouriço de sangue (leia o rótulo)', 'limit', 'group', { ...lab(P), a: ['morcela', 'black pudding', 'boudin noir'] }],
  ['smoked-pork-ribs', 'Smoked pork ribs (label check)', 'Costelinha defumada (leia o rótulo)', 'limit', 'group', { ...lab(P), a: ['costela defumada'] }],
  ['carne-de-porco-salgada', 'Salted pork (for feijoada; label check)', 'Carne de porco salgada (para feijoada; leia o rótulo)', 'limit', 'group', { ...lab(P), a: ['carne salgada', 'salt pork'] }],
];

const lamb: R[] = [
  ['lamb-leg', 'Lamb leg (plain)', 'Pernil de cordeiro (simples)', 'eat', 'group', { ...m(B), a: ['pernil de cordeiro', 'leg of lamb'] }],
  ['lamb-chops', 'Lamb chops (plain)', 'Costeleta de cordeiro (simples)', 'eat', 'group', { ...m(B), a: ['costeleta de cordeiro', 'carré de cordeiro', 'rack of lamb'] }],
  ['lamb-shoulder', 'Lamb shoulder (plain)', 'Paleta de cordeiro (simples)', 'eat', 'group', { ...m(B), a: ['paleta de cordeiro'] }],
  ['lamb-shank', 'Lamb shank (plain)', 'Pernil traseiro / jarrete de cordeiro (simples)', 'eat', 'group', { ...m(B), a: ['jarrete de cordeiro'] }],
  ['mutton', 'Mutton (plain)', 'Carneiro (simples)', 'eat', 'group', { ...m(B), a: ['carneiro', 'ovino'] }],
  ['goat', 'Goat meat (plain)', 'Carne de bode / cabrito (simples)', 'eat', 'group', { ...m(B), a: ['bode', 'cabrito', 'caprino'] }],
  ['lamb-liver', 'Lamb liver (plain)', 'Fígado de cordeiro (simples)', 'eat', 'group', { ...m(B) }],
  ['lamb-sausage', 'Lamb sausages / merguez (label check)', 'Linguiça de cordeiro / merguez (leia o rótulo)', 'limit', 'group', { ...lab(B), a: ['merguez'], tr: ['spicy'] }],
];

const poultry: R[] = [
  ['chicken-whole', 'Whole chicken (plain)', 'Frango inteiro (simples)', 'eat', 'group', { ...m(C), a: ['frango inteiro', 'galinha'] }],
  ['chicken-drumsticks', 'Chicken drumsticks (plain)', 'Coxinha da asa / drumette (simples)', 'eat', 'group', { ...m(C), a: ['drumette', 'coxinha da asa'] }],
  ['chicken-liver', 'Chicken liver (plain)', 'Fígado de frango (simples)', 'eat', 'group', { ...m(C), a: ['fígado de galinha'] }],
  ['chicken-hearts', 'Chicken hearts (plain)', 'Coração de frango (simples)', 'eat', 'group', { ...m(C), a: ['coraçãozinho', 'coração de galinha'] }],
  ['chicken-gizzards', 'Chicken gizzards (plain)', 'Moela de frango (simples)', 'eat', 'group', { ...m(C), a: ['moela'] }],
  ['chicken-feet', 'Chicken feet (plain)', 'Pé de galinha (simples)', 'eat', 'group', { ...m(C), a: ['pé de frango'] }],
  ['galeto', 'Spring chicken / Cornish hen (plain)', 'Galeto (simples)', 'eat', 'group', { ...m(C), a: ['galeto', 'cornish hen', 'poussin'] }],
  ['turkey-breast', 'Turkey breast (plain, fresh)', 'Peito de peru fresco (simples)', 'eat', 'group', { ...m(C), a: ['peito de peru fresco'] }],
  ['duck', 'Duck (plain)', 'Pato (simples)', 'eat', 'group', { ...m(C), a: ['pato', 'magret'] }],
  ['goose', 'Goose (plain)', 'Ganso (simples)', 'eat', 'group', { ...m(C), a: ['ganso'] }],
  ['quail', 'Quail (plain)', 'Codorna (simples)', 'eat', 'group', { ...m(C), a: ['codorna'] }],
  ['guinea-fowl', 'Guinea fowl (plain)', 'Galinha-d’angola (simples)', 'eat', 'group', { ...m(C), a: ['galinha d angola', 'capote', 'pintade'] }],
  ['pheasant', 'Pheasant (plain)', 'Faisão (simples)', 'eat', 'group', { ...m(C), a: ['faisão'] }],
  ['rotisserie-chicken', 'Rotisserie chicken (seasoning check)', 'Frango de padaria / assado de rotisseria (verifique o tempero)', 'limit', 'group', { ...lab(C), a: ['frango assado', 'frango de padaria', 'poulet rôti'] }],
  ['chicken-sausage', 'Chicken sausages (label check)', 'Linguiça de frango (leia o rótulo)', 'limit', 'group', { ...lab(C), a: ['linguiça de frango'] }],
  ['turkey-deli', 'Deli turkey breast (label check)', 'Peito de peru fatiado (frios; leia o rótulo)', 'limit', 'group', { ...lab(C), a: ['peito de peru', 'blanquet de peru', 'sliced turkey'] }],
  ['turkey-bacon', 'Turkey bacon (label check)', 'Bacon de peru (leia o rótulo)', 'limit', 'group', { ...lab(C) }],
  ['chicken-nuggets', 'Chicken nuggets (breaded)', 'Nuggets de frango (empanados)', 'avoid', 'group', { t: ['meat', 'poultry', 'gluten'], w: ['wheat', 'garlicOnion'], a: ['nuggets', 'empanado'] }],
  ['fried-chicken-battered', 'Fried chicken (wheat batter)', 'Frango frito empanado (massa de trigo)', 'avoid', 'group', { t: ['meat', 'poultry', 'gluten'], w: ['wheat', 'garlicOnion'], a: ['frango frito', 'frango à passarinho empanado', 'kfc'] }],
  ['chicken-marinated', 'Pre-marinated chicken (label check)', 'Frango temperado / marinado pronto (leia o rótulo)', 'limit', 'group', { ...lab(C), a: ['frango temperado', 'frango marinado'] }],
];

const game: R[] = [
  ['venison', 'Venison / deer (plain)', 'Carne de veado / cervo (simples)', 'eat', 'group', { ...m(B), a: ['veado', 'cervo', 'deer'] }],
  ['bison', 'Bison (plain)', 'Bisão (simples)', 'eat', 'group', { ...m(B), a: ['bisão', 'buffalo'] }],
  ['elk', 'Elk / wapiti (plain)', 'Alce-americano / wapiti (simples)', 'eat', 'group', { ...m(B), a: ['wapiti', 'elk'] }],
  ['moose', 'Moose (plain)', 'Alce (simples)', 'eat', 'group', { ...m(B), a: ['alce', 'orignal'] }],
  ['wild-boar', 'Wild boar (plain)', 'Javali (simples)', 'eat', 'group', { ...m(P), a: ['javali', 'sanglier'] }],
  ['water-buffalo', 'Water buffalo meat (plain)', 'Carne de búfalo (simples)', 'eat', 'group', { ...m(B), a: ['búfalo', 'bubalino'] }],
  ['hare', 'Hare (plain)', 'Lebre (simples)', 'eat', 'group', { ...m(B), a: ['lebre'] }],
  ['ostrich', 'Ostrich (plain)', 'Avestruz (simples)', 'eat', 'group', { ...m(B), a: ['avestruz'] }],
];

export const MEAT = group('meat', [...beef, ...ground, ...pork, ...lamb, ...poultry, ...game]);
