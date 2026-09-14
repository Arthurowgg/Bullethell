// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/nexuscore.js
// NEXUS (loja > upgrades permanentes): evolução customizada por herói,
// ligada ao estilo de jogo de cada um. Custos em Fragmentos do Nexus.
// ---------------------------------------------------------------------------

export const HERO_NODES = [
  { id: 'ara1', hero: 'arachnid', name: 'TEIAS CONDUTIVAS', desc: 'Suas teias prendem inimigos por 0,3s por nível ao acertar.', max: 2, cost: [140, 260], apply: (r, s) => { s.webRoot = 0.3 * r; } },
  { id: 'ara2', hero: 'arachnid', name: 'PASSOS DE SEDA', desc: '+4% de velocidade de movimento por nível.', max: 3, cost: [80, 140, 220], apply: (r, s) => { s.speed *= 1 + 0.04 * r; } },
  { id: 'tho1', hero: 'stormgod', name: 'FÚRIA DA TEMPESTADE', desc: '+1 alvo em cadeia por nível nos raios.', max: 2, cost: [150, 280], apply: (r, s) => { s.chains += r; } },
  { id: 'tho2', hero: 'stormgod', name: 'CORAÇÃO DE ASGARD', desc: '+12 de vida máxima por nível.', max: 3, cost: [80, 140, 220], apply: (r, s) => { s.maxHp += 12 * r; } },
  { id: 'iro1', hero: 'ironknight', name: 'MIRA CALIBRADA', desc: '+4% de chance de crítico por nível.', max: 3, cost: [100, 170, 250], apply: (r, s) => { s.crit += 0.04 * r; } },
  { id: 'iro2', hero: 'ironknight', name: 'PROTOCOLO VELOZ', desc: '-6% cooldown de habilidades por nível.', max: 2, cost: [140, 260], apply: (r, s) => { s.cdr *= 1 - 0.06 * r; } },
  { id: 'mer1', hero: 'merc', name: 'BALAS SORTUDAS', desc: '+3% crítico e +3% dano por nível.', max: 3, cost: [100, 170, 250], apply: (r, s) => { s.crit += 0.03 * r; s.dmg *= 1 + 0.03 * r; } },
  { id: 'mer2', hero: 'merc', name: 'ADRENALINA', desc: '+5% velocidade de ataque por nível.', max: 3, cost: [90, 150, 230], apply: (r, s) => { s.rate *= 1 + 0.05 * r; } },
  { id: 'cla1', hero: 'claws', name: 'SANGUE FERVENTE', desc: 'Golpes curam 1 de vida por nível.', max: 2, cost: [150, 280], apply: (r, s) => { s.hitHeal += r; } },
  { id: 'cla2', hero: 'claws', name: 'PELE DE AÇO', desc: '+10 de vida máxima por nível.', max: 3, cost: [80, 140, 220], apply: (r, s) => { s.maxHp += 10 * r; } },
  { id: 'mys1', hero: 'mystic', name: 'RUNA ADICIONAL', desc: '+1 runa de proteção orbital por nível.', max: 2, cost: [180, 320], apply: (r, s) => { s.runes += r; } },
  { id: 'mys2', hero: 'mystic', name: 'MENTE EXPANDIDA', desc: '+8% de experiência por nível.', max: 3, cost: [80, 140, 220], apply: (r, s) => { s.xpGain *= 1 + 0.08 * r; } },
];

export function applyNexus(save, stats, heroId) {
  for (const n of HERO_NODES) {
    if (n.hero !== heroId) continue;
    const r = save.nexusNodes[n.id] || 0;
    if (r > 0) n.apply(r, stats);
  }
}

export function nodeCost(node, rank) { return node.cost[Math.min(rank, node.cost.length - 1)]; }
