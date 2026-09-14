// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/upgrades.js
// 30 in-run upgrades, each with a pixel icon (assets/sprites/icons/up_XX.png,
// generated 10 per sheet). Order here matches icon numbering.
// ---------------------------------------------------------------------------

export const UPGRADES = [
  { id: 'dmg', name: 'PROTOCOLO OFENSIVO', desc: '+20% de dano', rarity: 1, max: 5, icon: 'up_01', apply: (s) => (s.dmg *= 1.2) },
  { id: 'rate', name: 'GATILHO VELOZ', desc: '+15% velocidade de ataque', rarity: 1, max: 5, icon: 'up_02', apply: (s) => (s.rate *= 1.15) },
  { id: 'proj', name: 'PROJÉTIL EXTRA', desc: '+1 projétil por disparo', rarity: 3, max: 3, icon: 'up_03', apply: (s) => (s.extraProj += 1) },
  { id: 'speed', name: 'BOTAS NEXUS', desc: '+10% velocidade de movimento', rarity: 1, max: 4, icon: 'up_04', apply: (s) => (s.speed *= 1.1) },
  { id: 'hp', name: 'BLINDAGEM', desc: '+25 de vida máxima e cura 25', rarity: 1, max: 5, icon: 'up_05', apply: (s) => { s.maxHp += 25; s.hp = Math.min(s.maxHp, s.hp + 25); } },
  { id: 'range', name: 'ALCANCE ESTENDIDO', desc: '+15% alcance e velocidade de projéteis', rarity: 2, max: 3, icon: 'up_06', apply: (s) => { s.projSpeed *= 1.15; s.range *= 1.15; } },
  { id: 'cd', name: 'FLUXO TEMPORAL', desc: '-15% cooldown de habilidades', rarity: 2, max: 3, icon: 'up_07', apply: (s) => (s.cdr *= 0.85) },
  { id: 'bounce', name: 'RICOCHETE', desc: 'Projéteis quicam 1x nas paredes', rarity: 3, max: 2, icon: 'up_08', apply: (s) => (s.bounce += 1) },
  { id: 'fire', name: 'ELEMENTO ÍGNEO', desc: 'Inimigos queimam por 3s', rarity: 2, max: 1, icon: 'up_09', apply: (s) => (s.burn = 4) },
  { id: 'ice', name: 'ELEMENTO GÉLIDO', desc: 'Ataques congelam por 1s', rarity: 2, max: 1, icon: 'up_10', apply: (s) => (s.chill = 1) },
  { id: 'orbit', name: 'SENTINELAS ORBITAIS', desc: '+1 orbe orbital que fere inimigos', rarity: 3, max: 3, icon: 'up_11', apply: (s) => (s.orbit += 1) },
  { id: 'magnet', name: 'MAGNETO NEXUS', desc: '+60% raio de coleta', rarity: 1, max: 3, icon: 'up_12', apply: (s) => (s.magnet *= 1.6) },
  { id: 'crit', name: 'PRECISÃO FATAL', desc: '+10% chance de crítico', rarity: 2, max: 4, icon: 'up_13', apply: (s) => (s.crit += 0.1) },
  { id: 'vamp', name: 'SEDE DE NEXUS', desc: '5% do dano vira vida', rarity: 3, max: 2, icon: 'up_14', apply: (s) => (s.lifesteal += 0.05) },
  { id: 'dash', name: 'REFLEXOS', desc: '-0,4s cooldown de esquiva', rarity: 2, max: 2, icon: 'up_15', apply: (s) => (s.dashCd = Math.max(0.6, s.dashCd - 0.4)) },
  { id: 'xp', name: 'SABEDORIA CÓSMICA', desc: '+20% de experiência', rarity: 1, max: 3, icon: 'up_16', apply: (s) => (s.xpGain *= 1.2) },
  { id: 'thorns', name: 'CAMPO REATIVO', desc: 'Causa dano de contato a inimigos', rarity: 2, max: 2, icon: 'up_17', apply: (s) => (s.thorns += 6) },
  { id: 'aegis', name: 'ÉGIDE NEXUS', desc: 'Começa a próxima vida com +1 escudo', rarity: 3, max: 2, icon: 'up_18', apply: (s) => (s.shield += 1) },
  // ----- hero-specific -----
  { id: 'web_heavy', hero: 'arachnid', name: 'TEIAS PESADAS', desc: 'Teias prendem inimigos ao acertar', rarity: 3, max: 1, icon: 'up_19', apply: (s) => (s.webRoot = 0.6) },
  { id: 'web_split', hero: 'arachnid', name: 'TEIA DIVIDIDA', desc: 'Teias se dividem ao acertar', rarity: 3, max: 1, icon: 'up_20', apply: (s) => (s.webSplit = true) },
  { id: 'thor_static', hero: 'stormgod', name: 'ESTÁTICA', desc: 'Raios encadeiam +2 alvos', rarity: 3, max: 2, icon: 'up_21', apply: (s) => (s.chains += 2) },
  { id: 'thor_mjol', hero: 'stormgod', name: 'TROVÃO PERMANENTE', desc: 'Martelo orbital constante', rarity: 3, max: 1, icon: 'up_22', apply: (s) => (s.permHammer = true) },
  { id: 'iron_homing', hero: 'ironknight', name: 'MÍSSEIS INTELIGENTES', desc: 'Dispara mísseis teleguiados periodicamente', rarity: 3, max: 1, icon: 'up_23', apply: (s) => (s.autoMissile = true) },
  { id: 'iron_over', hero: 'ironknight', name: 'UNIBEAM', desc: 'A cada 6s, varredura de laser frontal', rarity: 3, max: 1, icon: 'up_24', apply: (s) => (s.unibeam = true) },
  { id: 'dp_blades', hero: 'merc', name: 'LÂMINAS GÊMEAS', desc: 'Seus projéteis sempre ricocheteiam 2x', rarity: 3, max: 1, icon: 'up_25', apply: (s) => (s.bounce += 2) },
  { id: 'dp_lucky', hero: 'merc', name: 'SORTE GRANDE', desc: '+25% crítico e +10% dano', rarity: 3, max: 1, icon: 'up_26', apply: (s) => { s.crit += 0.25; s.dmg *= 1.1; } },
  { id: 'wolv_fury', hero: 'claws', name: 'SANGUE FERVENTE', desc: 'Golpes curam 2 de vida', rarity: 3, max: 1, icon: 'up_27', apply: (s) => (s.hitHeal = 2) },
  { id: 'wolv_wide', hero: 'claws', name: 'GOLPE AMPLO', desc: '+40% alcance do corte', rarity: 2, max: 2, icon: 'up_28', apply: (s) => (s.range *= 1.4) },
  { id: 'st_slow', hero: 'mystic', name: 'TEMPO LENTO', desc: 'Inimigos próximos ficam 20% mais lentos', rarity: 3, max: 1, icon: 'up_29', apply: (s) => (s.auraSlow = true) },
  { id: 'st_rune', hero: 'mystic', name: 'RUNAS DUPLAS', desc: '+2 runas de proteção', rarity: 3, max: 1, icon: 'up_30', apply: (s) => (s.runes += 2) },
];

export const RARITY = {
  1: { name: 'COMUM', color: '#9aa5b1' },
  2: { name: 'RARO', color: '#4dd8ff' },
  3: { name: 'ÉPICO', color: '#b06bff' },
};

export function rollUpgradeChoices(save, heroId, stats, taken, n = 3) {
  const pool = UPGRADES.filter((u) => {
    if (u.hero && u.hero !== heroId) return false;
    const rank = taken[u.id] || 0;
    if (rank >= (u.max || 1)) return false;
    return true;
  });
  const weighted = [];
  for (const u of pool) {
    const w = u.rarity === 1 ? 5 : u.rarity === 2 ? 3 : 2;
    for (let i = 0; i < w; i++) weighted.push(u);
  }
  const out = [];
  while (out.length < n && weighted.length) {
    const i = (Math.random() * weighted.length) | 0;
    const u = weighted[i];
    if (!out.includes(u)) out.push(u);
    weighted.splice(weighted.indexOf(u), 1);
  }
  while (out.length < n) out.push(UPGRADES[0]);
  return out;
}
