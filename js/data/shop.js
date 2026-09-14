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
    id: 'miles', hero: 'arachnid', name: 'MILES MORALES', rarity: 4, price: 800, currency: 'frag',
    desc: 'O traje negro com teias vermelhas do Aranha do Brooklin: descargas de veneno nas teias e rastro de bio-eletricidade rubra.',
    fx: { shotTint: '#ff2b2b', trail: '#ff2b2b', aura: '#ff2b2b' },
  },
  {
    id: 'ragnarok', hero: 'stormgod', name: 'GLADIADOR DO TROVÃO', rarity: 4, price: 650, currency: 'frag',
    desc: 'Sem elmo, cabelo curto e pintura de guerra: o trovão da arena de Sakaar com raios dourados e rastro de tempestade.',
    fx: { shotTint: '#ffd94a', trail: '#9feaff', aura: '#9feaff' },
  },
  {
    id: 'hulkbuster', hero: 'ironknight', name: 'ARMADURA COLOSSAL', rarity: 4, price: 700, currency: 'frag',
    desc: 'A armadura pesada vermelho-prata de contenção: repulsores âmbar, mísseis de impacto e aura incandescente.',
    fx: { shotTint: '#ffd94a', trail: '#ff8c3b', aura: '#ff8c3b' },
  },
  {
    id: 'xforce', hero: 'merc', name: 'ESQUADRÃO X', rarity: 4, price: 600, currency: 'frag',
    desc: 'O uniforme tático preto e cinza da força encoberta: lentes vermelhas escuras e lâminas com rastro de fumaça.',
    fx: { shotTint: '#c95df2', trail: '#8a84a8', aura: '#8a84a8' },
  },
  {
    id: 'umbral', hero: 'mystic', name: 'MANTO UMBRAL', rarity: 4, price: 650, currency: 'frag',
    desc: 'O manto do mago mergulhado em magia sombria: runas violeta, olhos em brasa e um rastro de névoa púrpura.',
    fx: { shotTint: '#b06bff', trail: '#b06bff', aura: '#b06bff' },
  },
];

export const skinById = (id) => SKINS.find((s) => s.id === id);
