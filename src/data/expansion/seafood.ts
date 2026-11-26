import { group, type R } from './helper';

/**
 * Fish and seafood. Plain fish and shellfish contain no FODMAPs; Monash lists
 * plain fish/seafood among low-FODMAP proteins (MLIST, SL25 protein group), so
 * plain species are EAT with verification 'group' (not individually tested).
 * Smoked, cured, canned-with-sauce, surimi and pickled products are LIMIT
 * (label check); breaded or battered products are AVOID (wheat).
 */
const F = { t: ['fish' as const], src: ['SL25' as const, 'MLIST' as const] };
const S = { t: ['seafood' as const], src: ['SL25' as const, 'MLIST' as const] };
const Fl = { t: ['fish' as const], w: ['garlicOnion' as const, 'wheat' as const] };

const fish: R[] = [
  ['cod', 'Cod (fresh, plain)', 'Bacalhau fresco (simples)', 'eat', 'group', { ...F, a: ['bacalhau fresco', 'morue'] }],
  ['salt-cod', 'Salt cod (desalted, plain)', 'Bacalhau salgado (dessalgado, simples)', 'eat', 'group', { ...F, a: ['bacalhau', 'bacalhau do porto', 'bacalhoada'] }],
  ['haddock', 'Haddock (plain)', 'Hadoque (simples)', 'eat', 'group', { ...F, a: ['hadoque', 'églefin'] }],
  ['halibut', 'Halibut (plain)', 'Halibute / alabote (simples)', 'eat', 'group', { ...F, a: ['alabote', 'flétan'] }],
  ['sole', 'Sole (plain)', 'Linguado (simples)', 'eat', 'group', { ...F, a: ['linguado', 'sole'] }],
  ['flounder', 'Flounder / plaice (plain)', 'Solha (simples)', 'eat', 'group', { ...F, a: ['solha', 'plaice'] }],
  ['tilapia', 'Tilapia (plain)', 'Tilápia (simples)', 'eat', 'group', { ...F, a: ['tilápia', 'tilapia', 'saint peter'] }],
  ['trout', 'Trout (plain)', 'Truta (simples)', 'eat', 'group', { ...F, a: ['truta', 'rainbow trout', 'truite'] }],
  ['arctic-char', 'Arctic char (plain)', 'Salvelino-ártico (simples)', 'eat', 'group', { ...F, a: ['omble chevalier', 'char'] }],
  ['tuna-fresh', 'Tuna (fresh, plain)', 'Atum fresco (simples)', 'eat', 'group', { ...F, a: ['atum fresco', 'ahi', 'thon'] }],
  ['canned-tuna-water', 'Canned tuna in water or brine', 'Atum em lata em água ou salmoura', 'eat', 'group', { ...F, a: ['atum ralado', 'atum sólido em água'] }],
  ['canned-salmon', 'Canned salmon (plain, in water or brine)', 'Salmão em lata (simples, em água ou salmoura)', 'eat', 'group', { ...F, a: ['salmão enlatado'] }],
  ['mackerel', 'Mackerel (plain)', 'Cavala (simples)', 'eat', 'group', { ...F, a: ['cavala', 'maquereau', 'sororoca'] }],
  ['sardines-fresh', 'Sardines (fresh, plain)', 'Sardinha fresca (simples)', 'eat', 'group', { ...F, a: ['sardinha fresca'] }],
  ['anchovies', 'Anchovies (plain, salted or in oil)', 'Anchova / aliche (simples, salgada ou em óleo)', 'eat', 'group', { ...F, a: ['aliche', 'anchova', 'enchova'] }],
  ['herring', 'Herring (fresh, plain)', 'Arenque fresco (simples)', 'eat', 'group', { ...F, a: ['arenque', 'hareng'] }],
  ['sea-bass', 'Sea bass / robalo (plain)', 'Robalo (simples)', 'eat', 'group', { ...F, a: ['robalo', 'branzino', 'bar'] }],
  ['sea-bream', 'Sea bream (plain)', 'Dourada / pargo-rosa (simples)', 'eat', 'group', { ...F, a: ['dourada', 'daurade', 'orata'] }],
  ['red-snapper', 'Red snapper (plain)', 'Pargo / vermelho (simples)', 'eat', 'group', { ...F, a: ['pargo', 'vermelho', 'cioba'] }],
  ['grouper', 'Grouper (plain)', 'Garoupa (simples)', 'eat', 'group', { ...F, a: ['garoupa', 'badejo', 'mérou'] }],
  ['mahi-mahi', 'Mahi-mahi / dorado (plain)', 'Dourado-do-mar (simples)', 'eat', 'group', { ...F, a: ['dourado do mar', 'dorado'] }],
  ['swordfish', 'Swordfish (plain)', 'Peixe-espada / espadarte (simples)', 'eat', 'group', { ...F, a: ['espadarte', 'peixe espada'] }],
  ['pollock', 'Pollock (plain)', 'Polaca / escamudo (simples)', 'eat', 'group', { ...F, a: ['polaca', 'escamudo', 'goberge'] }],
  ['hake', 'Hake (plain)', 'Merluza (simples)', 'eat', 'group', { ...F, a: ['merluza', 'merlu'] }],
  ['catfish', 'Catfish (plain)', 'Bagre (simples)', 'eat', 'group', { ...F, a: ['bagre', 'mandi'] }],
  ['basa', 'Basa / pangasius (plain)', 'Panga / basa (simples)', 'eat', 'group', { ...F, a: ['panga', 'pangasius', 'swai'] }],
  ['carp', 'Carp (plain)', 'Carpa (simples)', 'eat', 'group', { ...F, a: ['carpa'] }],
  ['monkfish', 'Monkfish (plain)', 'Tamboril (simples)', 'eat', 'group', { ...F, a: ['tamboril', 'lotte'] }],
  ['pirarucu', 'Pirarucu / arapaima (plain)', 'Pirarucu (simples)', 'eat', 'group', { ...F, a: ['arapaima', 'pirarucu seco'] }],
  ['tambaqui', 'Tambaqui (plain)', 'Tambaqui (simples)', 'eat', 'group', { ...F, a: ['costela de tambaqui'] }],
  ['surubim', 'Surubim / pintado (plain)', 'Surubim / pintado (simples)', 'eat', 'group', { ...F, a: ['pintado', 'cachara'] }],
  ['pacu', 'Pacu (plain)', 'Pacu (simples)', 'eat', 'group', { ...F }],
  ['pescada', 'Pescada / weakfish (plain)', 'Pescada (simples)', 'eat', 'group', { ...F, a: ['pescada amarela', 'pescadinha', 'weakfish'] }],
  ['corvina', 'Corvina / croaker (plain)', 'Corvina (simples)', 'eat', 'group', { ...F, a: ['croaker', 'corvina'] }],
  ['tainha', 'Mullet (plain)', 'Tainha (simples)', 'eat', 'group', { ...F, a: ['tainha', 'mullet', 'parati'] }],
  ['sablefish', 'Sablefish / black cod (plain)', 'Peixe-carvão-do-pacífico / black cod (simples)', 'eat', 'group', { ...F, a: ['black cod', 'morue charbonnière'] }],
  ['whitefish', 'Lake whitefish (plain)', 'Coregono / whitefish (simples)', 'eat', 'group', { ...F, a: ['corégone', 'lake whitefish'] }],
  ['walleye', 'Walleye / pickerel (plain)', 'Walleye / lúcio-perca (simples)', 'eat', 'group', { ...F, a: ['doré', 'pickerel', 'sander'] }],
  ['smelt', 'Smelt (plain)', 'Eperlano (simples)', 'eat', 'group', { ...F, a: ['éperlan', 'manjuba'] }],
  ['eel', 'Eel (plain)', 'Enguia (simples)', 'eat', 'group', { ...F, a: ['enguia', 'unagi'] }],
  ['fish-roe', 'Fish roe / caviar (plain)', 'Ovas de peixe / caviar (simples)', 'eat', 'group', { ...F, a: ['ovas', 'caviar', 'ikura', 'masago'] }],
  ['smoked-salmon', 'Smoked salmon (label check)', 'Salmão defumado (leia o rótulo)', 'limit', 'group', { ...Fl, a: ['salmão defumado', 'lox', 'saumon fumé'] }],
  ['smoked-fish', 'Other smoked fish (label check)', 'Outros peixes defumados (leia o rótulo)', 'limit', 'group', { ...Fl, a: ['peixe defumado', 'smoked mackerel', 'kipper'] }],
  ['pickled-herring', 'Pickled herring (sugar/onion brine; label check)', 'Arenque em conserva (salmoura com açúcar/cebola; leia o rótulo)', 'limit', 'group', { ...Fl, a: ['rollmops', 'arenque marinado'] }],
  ['canned-fish-sauce', 'Canned fish in tomato or flavoured sauce (label check)', 'Peixe em lata com molho de tomate ou temperado (leia o rótulo)', 'limit', 'group', { ...Fl, a: ['sardinha com molho de tomate', 'atum com molho'] }],
  ['surimi', 'Surimi / imitation crab (label check: wheat, sorbitol)', 'Kani / surimi (leia o rótulo: trigo, sorbitol)', 'limit', 'group', { t: ['fish'], w: ['wheat', 'polyols'], a: ['kani', 'kani kama', 'imitation crab', 'crab sticks'] }],
  ['fish-cakes', 'Fish cakes (label check)', 'Bolinho de peixe pronto (leia o rótulo)', 'limit', 'group', { ...Fl, a: ['fish cakes', 'bolinho de bacalhau congelado'] }],
  ['fish-sticks', 'Fish sticks / fingers (breaded)', 'Iscas / palitos de peixe empanados', 'avoid', 'group', { t: ['fish', 'gluten'], w: ['wheat'], a: ['fish fingers', 'peixe empanado'] }],
  ['battered-fish', 'Battered fish (fish and chips)', 'Peixe frito empanado (fish and chips)', 'avoid', 'group', { t: ['fish', 'gluten'], w: ['wheat'], a: ['fish and chips', 'peixe empanado'] }],
];

const shellfish: R[] = [
  ['lobster', 'Lobster (plain)', 'Lagosta (simples)', 'eat', 'group', { ...S, a: ['lagosta', 'homard'] }],
  ['crayfish', 'Crayfish / langoustine (plain)', 'Lagostim (simples)', 'eat', 'group', { ...S, a: ['lagostim', 'pitu', 'écrevisse'] }],
  ['scallops', 'Scallops (plain)', 'Vieiras (simples)', 'eat', 'group', { ...S, a: ['vieira', 'pétoncle', 'coquille saint-jacques'] }],
  ['mussels', 'Mussels (plain)', 'Mexilhões (simples)', 'eat', 'group', { ...S, a: ['mexilhão', 'marisco', 'sururu', 'moules'] }],
  ['oysters', 'Oysters (plain)', 'Ostras (simples)', 'eat', 'group', { ...S, a: ['ostra', 'huîtres'] }],
  ['clams', 'Clams (plain)', 'Vôngoles / mariscos (simples)', 'eat', 'group', { ...S, a: ['vôngole', 'berbigão', 'palourdes'] }],
  ['squid', 'Squid (plain)', 'Lula (simples)', 'eat', 'group', { ...S, a: ['lula', 'calamar'] }],
  ['octopus', 'Octopus (plain)', 'Polvo (simples)', 'eat', 'group', { ...S, a: ['polvo', 'pieuvre'] }],
  ['cuttlefish', 'Cuttlefish (plain)', 'Choco / siba (simples)', 'eat', 'group', { ...S, a: ['choco', 'siba', 'seiche'] }],
  ['snow-crab', 'Snow crab / king crab legs (plain)', 'Patas de caranguejo-das-neves / king crab (simples)', 'eat', 'group', { ...S, a: ['king crab', 'crabe des neiges'] }],
  ['dried-shrimp', 'Dried shrimp (plain, salted)', 'Camarão seco (simples, salgado)', 'eat', 'group', { ...S, a: ['camarão seco', 'camarão defumado'] }],
  ['fried-calamari', 'Fried calamari (wheat batter)', 'Lula à dorê / anéis de lula empanados', 'avoid', 'group', { t: ['seafood', 'gluten'], w: ['wheat'], a: ['calamari', 'lula empanada'] }],
  ['breaded-shrimp', 'Breaded or battered shrimp', 'Camarão empanado', 'avoid', 'group', { t: ['seafood', 'gluten'], w: ['wheat'], a: ['camarão empanado', 'tempura de camarão'] }],
];

export const SEAFOOD = group('seafood', [...fish, ...shellfish]);
