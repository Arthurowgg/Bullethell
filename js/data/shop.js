// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/shop.js
// COSMÉTICA: poucos itens, altíssima qualidade. Cada skin tem emblema
// animado próprio (sheets), efeitos de tiro/rastro/aura e identidade visual
// distinta — nunca um simples recolor.
// ---------------------------------------------------------------------------

export const RARITY_SHOP = {
  1: { name: 'COMUM', color: '#9aa5b1' },
  2: { name: 'RARO', color: '#4dd8ff' },
  3: { name: 'ÉPICO', color: '#b06bff' },
  4: { name: 'LENDÁRIO', color: '#ffd94a' },
};

export const SKINS = [
  {
    id: 'venom', hero: 'arachnid', name: 'ARANHA VENOM', rarity: 4, price: 650, currency: 'frag',
    desc: 'Traje simbiótico negro com bio-eletricidade rubra. As teias viram descargas de veneno e o rastro deixa arcos elétricos vermelhos.',
    fx: { shot: 'b_bolt', shotTint: '#ff4d4d', trail: '#ff2b2b', aura: '#ff2b2b' },
  },
  {
    id: 'crimson', hero: 'stormgod', name: 'TEMPESTADE RUBRA', rarity: 4, price: 650, currency: 'frag',
    desc: 'O trovão ancestral tingido de carmesim: raios, martelo e tempestade queimam em vermelho sobre o aço negro.',
    fx: { shotTint: '#ff4d6b', trail: '#ff4d6b', aura: '#ff4d6b' },
  },
  {
    id: 'midnight', hero: 'ironknight', name: 'PROTÓTIPO MEIA-NOITE', rarity: 4, price: 650, currency: 'frag',
    desc: 'Armadura furtiva preto-ouro com reator de plasma âmbar. Repulsores e mísseis ganham brilho incandescente.',
    fx: { shotTint: '#ff8c3b', trail: '#ffd94a', aura: '#ff8c3b' },
  },
];

export const skinById = (id) => SKINS.find((s) => s.id === id);
