// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/enemies.js
// The 12 OFFICIAL enemy archetypes, each with a distinct bullet-hell role,
// projectile and pattern. `behavior` keys into the AI in game/enemy.js.
// Legacy archetypes (symbiote/sorcerer/spectre/chaos) remain for the codex.
// ---------------------------------------------------------------------------

export const ENEMIES = {
  // ---- early waves -------------------------------------------------------
  drone: {
    id: 'drone', shot: 'shot_en_drone', name: 'DRONE DE ULTRON', sprite: 'en_drone', spriteB: 'en_drone_b',
    hp: 22, speed: 46, radius: 7, contact: 8, xp: 1, fragments: 1,
    behavior: 'seq',
    attack: { cd: 2.2 },
    desc: 'Robôs de tecnologia que disparam bolts vermelhos sequenciais, rápidos e precisos.',
  },
  chitauri: {
    id: 'chitauri', shot: 'shot_en_chitauri', name: 'SOLDADO CHITAURI', sprite: 'en_chitauri', spriteB: 'en_chitauri_b',
    hp: 16, speed: 78, radius: 6, contact: 10, xp: 1, fragments: 1,
    behavior: 'burst',
    attack: { cd: 2.8 },
    desc: 'Tropa de pressão que avança em grupo e solta rajadas azuis em sequência.',
  },
  outrider: {
    id: 'outrider', shot: null, name: 'OUTRIDER', sprite: 'en_outrider', spriteB: 'en_outrider',
    hp: 20, speed: 105, radius: 7, contact: 12, xp: 2, fragments: 2,
    behavior: 'outrider',
    attack: null,
    desc: 'Fera de perseguição: cerca, salta e investe. Puro impacto, sem projéteis.',
  },
  // ---- mid waves ---------------------------------------------------------
  kree: {
    id: 'kree', shot: 'shot_en_kree', name: 'SOLDADO KREE', sprite: 'en_kree', spriteB: 'en_kree',
    hp: 30, speed: 42, radius: 7, contact: 10, xp: 2, fragments: 2,
    behavior: 'sniper',
    attack: { cd: 3.2 },
    desc: 'Atirador de longo alcance: plasma pesado e lento com rastro energético.',
  },
  sakaaran: {
    id: 'sakaaran', shot: 'shot_en_sakaaran', name: 'SOLDADO SAKAARAN', sprite: 'en_sakaaran', spriteB: 'en_sakaaran',
    hp: 26, speed: 60, radius: 7, contact: 10, xp: 2, fragments: 2,
    behavior: 'strafe',
    attack: { cd: 2.6 },
    desc: 'Pressão intermediária: flanqueia em vaivém com rajadas tecnológicas alternadas.',
  },
  aim: {
    id: 'aim', shot: 'shot_en_aim', name: 'AGENTE DA A.I.M.', sprite: 'en_aim', spriteB: 'en_aim',
    hp: 24, speed: 50, radius: 7, contact: 9, xp: 2, fragments: 2,
    behavior: 'gunner',
    attack: { cd: 3.0 },
    desc: 'Especialista tecnológico: rajadas direcionadas e bombardeio de área previsível.',
  },
  hydra: {
    id: 'hydra', shot: 'shot_en_hydra', name: 'SOLDADO DA HIDRA', sprite: 'en_hydra', spriteB: 'en_hydra',
    hp: 18, speed: 66, radius: 6, contact: 9, xp: 2, fragments: 2,
    behavior: 'guns',
    attack: { cd: 2.4 },
    desc: 'Combate à distância: rajadas rápidas de balas pequenas e velozes.',
  },
  // ---- advanced waves ----------------------------------------------------
  mysterio: {
    id: 'mysterio', shot: 'shot_en_mysterio', name: 'MYSTERIO', sprite: 'en_mysterio', spriteB: 'en_mysterio',
    hp: 60, speed: 44, radius: 8, contact: 12, xp: 4, fragments: 4,
    behavior: 'illusion',
    attack: { cd: 3.4 },
    desc: 'Mestre do caos: esferas ilusórias que curvam e ataques que vêm de direções falsas.',
  },
  jotun: {
    id: 'jotun', shot: 'shot_en_frost', name: 'GIGANTE DE GELO', sprite: 'en_jotun', spriteB: 'en_jotun_b',
    hp: 70, speed: 34, radius: 9, contact: 16, xp: 4, fragments: 4,
    behavior: 'frost',
    attack: { cd: 3.6 },
    desc: 'Pesado de Jotunheim: leques lentos de fragmentos de gelo perigosos.',
  },
  destroyer: {
    id: 'destroyer', shot: 'shot_en_destroyer', name: 'DESTRUIDOR', sprite: 'en_destroyer', spriteB: 'en_destroyer',
    hp: 160, speed: 22, radius: 10, contact: 18, xp: 8, fragments: 8,
    behavior: 'beam',
    attack: { cd: 4.2 },
    desc: 'Autômato elite: telegrafa e dispara orbes de energia brilhantes e letais.',
  },
  // ---- very advanced -----------------------------------------------------
  skrull: {
    id: 'skrull', shot: 'shot_en_skrull', name: 'SUPER-SKRULL', sprite: 'en_skrull', spriteB: 'en_skrull',
    hp: 90, speed: 56, radius: 8, contact: 14, xp: 6, fragments: 6,
    behavior: 'alt',
    attack: { cd: 2.8 },
    desc: 'Elite especial: alterna leques de energia e anéis de chama derivados dos seus poderes.',
  },
  sentinel: {
    id: 'sentinel', shot: 'shot_en_senti', name: 'SENTINELA', sprite: 'en_sentinel', spriteB: 'en_sentinel_b',
    hp: 130, speed: 24, radius: 10, contact: 16, xp: 6, fragments: 6,
    behavior: 'senti',
    attack: { cd: 3.6 },
    desc: 'Colosso raro: disparos energéticos grandes com trajetória claramente visível.',
  },

  // ---- legacy (codex only) -------------------------------------------------
  symbiote: {
    id: 'symbiote', shot: 'shot_en_symbiote', name: 'SIMBIONTE CORROMPIDO', sprite: 'en_symbiote', spriteB: 'en_symbiote_b',
    hp: 30, speed: 62, radius: 7, contact: 12, xp: 2, fragments: 2,
    behavior: 'erratic',
    attack: { cd: 4 },
    desc: 'Criaturas irregulares que surgem do chão e se dividem.',
    splits: 'symbiote_small',
  },
  symbiote_small: {
    id: 'symbiote_small', shot: 'shot_en_symbiote', name: 'SIMBIONTE MENOR', sprite: 'en_symbiote_b', spriteB: 'en_symbiote',
    hp: 10, speed: 92, radius: 5, contact: 6, xp: 1, fragments: 1,
    behavior: 'swarm',
    attack: null,
    desc: 'Fragmento de simbionte.',
  },
  sorcerer: {
    id: 'sorcerer', shot: 'shot_en_sorcerer', name: 'ZELOTA DAS TREVAS', sprite: 'en_sorcerer', spriteB: 'en_sorcerer_b',
    hp: 34, speed: 40, radius: 7, contact: 8, xp: 2, fragments: 2,
    behavior: 'kite',
    attack: { cd: 3 },
    desc: 'Conjuradores que distorcem o espaço com espirais.',
  },
  spectre: {
    id: 'spectre', shot: 'shot_en_spectre', name: 'ESPECTRO DE HELA', sprite: 'en_spectre', spriteB: 'en_spectre_b',
    hp: 26, speed: 58, radius: 7, contact: 10, xp: 2, fragments: 2,
    behavior: 'phase',
    attack: { cd: 2.8 },
    desc: 'Espíritos que atravessam tudo e reaparecem perto de você.',
  },
  chaos: {
    id: 'chaos', shot: 'shot_en_chaos', name: 'FRAGMENTO DO CAOS', sprite: 'en_chaos', spriteB: 'en_chaos_b',
    hp: 8, speed: 70, radius: 4, contact: 6, xp: 1, fragments: 1,
    behavior: 'wander',
    attack: null,
    desc: 'Entidades de energia que explodem ao morrer.',
    explodeOnDeath: true,
  },
};

// ---- variants: 4 per official enemy (same family art, distinct stats/role) ----
const VAR_TIERS = [
  { k: 'v1', suf: 'VELOZ',    hp: 1.4, spd: 1.3, dmg: 1.2, xp: 2, fr: 2, color: '#4dd8ff', r: 0 },
  { k: 'v2', suf: 'BLINDADO', hp: 2.4, spd: 0.8, dmg: 1.5, xp: 3, fr: 3, color: '#ffd94a', r: 2 },
  { k: 'v3', suf: 'MÍSTICO',  hp: 1.7, spd: 1.0, dmg: 1.9, xp: 3, fr: 3, color: '#b06bff', r: 0 },
  { k: 'v4', suf: 'PRIME',    hp: 3.2, spd: 0.75, dmg: 2.2, xp: 5, fr: 5, color: '#ff4d4d', r: 3 },
];
for (const baseId of ['drone', 'chitauri', 'outrider', 'kree', 'sakaaran', 'aim', 'hydra', 'mysterio', 'jotun', 'destroyer', 'skrull', 'sentinel']) {
  const b = ENEMIES[baseId];
  for (const t of VAR_TIERS) {
    const id = baseId + '_' + t.k;
    ENEMIES[id] = {
      ...b,
      id,
      name: b.name + ' ' + t.suf,
      sprite: 'en_' + baseId + '_' + t.k,
      spriteB: 'en_' + baseId + '_' + t.k,
      hp: Math.round(b.hp * t.hp),
      speed: Math.round(b.speed * t.spd),
      contact: Math.round(b.contact * t.dmg),
      xp: t.xp, fragments: t.fr,
      radius: b.radius + t.r,
      variantColor: t.color,
      variantOf: baseId,
    };
  }
}

export const enemyById = (id) => ENEMIES[id];
