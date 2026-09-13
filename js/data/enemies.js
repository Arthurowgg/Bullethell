// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/enemies.js
// The 8 enemy archetypes. `behavior` keys into the AI in game/enemy.js.
// ---------------------------------------------------------------------------

export const ENEMIES = {
  drone: {
    id: 'drone', name: 'DRONE DE ULTRON', sprite: 'en_drone', spriteB: 'en_drone_b',
    hp: 22, speed: 46, radius: 7, contact: 8, xp: 1, fragments: 1,
    behavior: 'formation',
    attack: { cd: 2.4, kind: 'geoburst' },
    desc: 'Robôs em formação que disparam rajadas geométricas.',
  },
  chitauri: {
    id: 'chitauri', name: 'CHITAURI CORROMPIDO', sprite: 'en_chitauri', spriteB: 'en_chitauri_b',
    hp: 16, speed: 78, radius: 6, contact: 10, xp: 1, fragments: 1,
    behavior: 'swarm',
    attack: { cd: 3.2, kind: 'aimed' },
    desc: 'Tropas alienígenas que cercam o jogador em enxames.',
  },
  symbiote: {
    id: 'symbiote', name: 'SIMBIONTE CORROMPIDO', sprite: 'en_symbiote', spriteB: 'en_symbiote_b',
    hp: 30, speed: 62, radius: 7, contact: 12, xp: 2, fragments: 2,
    behavior: 'erratic',
    attack: { cd: 4, kind: 'spawnPool' },
    desc: 'Criaturas irregulares que surgem do chão e se dividem.',
    splits: 'symbiote_small',
  },
  symbiote_small: {
    id: 'symbiote_small', name: 'SIMBIONTE MENOR', sprite: 'en_symbiote_b', spriteB: 'en_symbiote',
    hp: 10, speed: 92, radius: 5, contact: 6, xp: 1, fragments: 1,
    behavior: 'swarm',
    attack: null,
    desc: 'Fragmento de simbionte.',
  },
  sorcerer: {
    id: 'sorcerer', name: 'FEITICEIRO DA REALIDADE', sprite: 'en_sorcerer', spriteB: 'en_sorcerer_b',
    hp: 34, speed: 40, radius: 7, contact: 8, xp: 2, fragments: 2,
    behavior: 'kite',
    attack: { cd: 3, kind: 'spiral' },
    desc: 'Conjuradores que distorcem o espaço com espirais.',
  },
  sentinel: {
    id: 'sentinel', name: 'SENTINELA DESTRUÍDA', sprite: 'en_sentinel', spriteB: 'en_sentinel_b',
    hp: 130, speed: 24, radius: 10, contact: 16, xp: 6, fragments: 6,
    behavior: 'slowTank',
    attack: { cd: 3.6, kind: 'laser' },
    desc: 'Colossos lentos com lasers em linha. Inimigos de elite.',
  },
  spectre: {
    id: 'spectre', name: 'ESPECTRO DE HELA', sprite: 'en_spectre', spriteB: 'en_spectre_b',
    hp: 26, speed: 58, radius: 7, contact: 10, xp: 2, fragments: 2,
    behavior: 'phase',
    attack: { cd: 2.8, kind: 'blades' },
    desc: 'Espíritos que atravessam tudo e reaparecem perto de você.',
  },
  jotun: {
    id: 'jotun', name: 'FERA DE JOTUNHEIM', sprite: 'en_jotun', spriteB: 'en_jotun_b',
    hp: 40, speed: 96, radius: 8, contact: 14, xp: 3, fragments: 3,
    behavior: 'charger',
    attack: { cd: 3.4, kind: 'icespikes' },
    desc: 'Feras de gelo velozes que congelam áreas da arena.',
  },
  chaos: {
    id: 'chaos', name: 'FRAGMENTO DO CAOS', sprite: 'en_chaos', spriteB: 'en_chaos_b',
    hp: 8, speed: 70, radius: 4, contact: 6, xp: 1, fragments: 1,
    behavior: 'wander',
    attack: null,
    desc: 'Entidades de energia que explodem ao morrer.',
    explodeOnDeath: true,
  },
};

export const enemyById = (id) => ENEMIES[id];
