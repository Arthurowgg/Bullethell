// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/nexuscore.js
// Permanent progression tree (NEXUS CORE). Costs are Nexus Fragments.
// apply(save, stats) folds purchased ranks into the run's starting stats.
// ---------------------------------------------------------------------------

export const NEXUS_NODES = [
  { id: 'vital', name: 'VITALIDADE', desc: '+10 vida inicial por nível', max: 5, cost: [60, 90, 130, 180, 240], col: 0, row: 0, apply: (r, s) => (s.maxHp += 10 * r) },
  { id: 'power', name: 'POTÊNCIA', desc: '+4% de dano por nível', max: 5, cost: [60, 90, 130, 180, 240], col: 1, row: 0, apply: (r, s) => (s.dmg *= 1 + 0.04 * r) },
  { id: 'agil', name: 'AGILIDADE', desc: '+3% velocidade por nível', max: 4, cost: [50, 80, 120, 170], col: 2, row: 0, apply: (r, s) => (s.speed *= 1 + 0.03 * r) },
  { id: 'saber', name: 'SABER', desc: '+8% XP por nível', max: 4, cost: [50, 80, 120, 170], col: 3, row: 0, apply: (r, s) => (s.xpGain *= 1 + 0.08 * r) },
  { id: 'crit', name: 'FOCO', desc: '+3% crítico por nível', max: 4, cost: [70, 110, 160, 220], col: 1, row: 1, apply: (r, s) => (s.crit += 0.03 * r) },
  { id: 'fortune', name: 'FORTUNA', desc: '+12% fragmentos ganhos por nível', max: 4, cost: [70, 110, 160, 220], col: 2, row: 1, apply: (r, s) => (s.fragGain *= 1 + 0.12 * r) },
  { id: 'tech', name: 'TECNOLOGIA', desc: '-5% cooldowns por nível', max: 3, cost: [90, 140, 200], col: 0, row: 1, apply: (r, s) => (s.cdr *= 1 - 0.05 * r) },
  { id: 'relic', name: 'RELICÁRIO', desc: '+1 opção de upgrade por nível', max: 1, cost: [400], col: 3, row: 1, apply: (r, s) => (s.upChoices += r) },
  { id: 'aegis', name: 'ÉGIDE', desc: 'Começa com 1 escudo por nível', max: 2, cost: [150, 260], col: 1, row: 2, apply: (r, s) => (s.shield += r) },
  { id: 'genesis', name: 'GÊNESIS', desc: '+1 vida extra por nível (revive)', max: 1, cost: [500], col: 2, row: 2, apply: (r, s) => (s.revives += r) },
];

export function applyNexus(save, stats) {
  for (const n of NEXUS_NODES) {
    const r = save.nexusNodes[n.id] || 0;
    if (r > 0) n.apply(r, stats);
  }
}

export function nodeCost(node, rank) { return node.cost[Math.min(rank, node.cost.length - 1)]; }
