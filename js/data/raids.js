// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/raids.js
// The 5 incursions. Each raid binds a boss, arena theme, music, difficulty
// and rewards. Unlock chain: clearing one opens the next.
// ---------------------------------------------------------------------------

export const RAIDS = [
  {
    id: 'raid_ultron', boss: 'ultron', theme: 'factory', music: 'boss',
    name: 'INCURSÃO 1 — FÁBRICA CORROMPIDA', short: 'FÁBRICA',
    desc: 'Núcleos de máquinas despertam em ondas. Lasers industriais e padrões geométricos.',
    difficulty: 1, stars: 1, unlockLevel: 1,
    rewardFragments: 120, rewardCredits: 20,
    hazard: 'lasers',
  },
  {
    id: 'raid_loki', boss: 'loki', theme: 'palace', music: 'boss',
    name: 'INCURSÃO 2 — PALÁCIO DIMENSIONAL', short: 'PALÁCIO',
    desc: 'Clones falsos, portais e projéteis ilusórios que confundem sem ser injustos.',
    difficulty: 2, stars: 2, unlockLevel: 2,
    rewardFragments: 160, rewardCredits: 25,
    hazard: 'portals',
  },
  {
    id: 'raid_hela', boss: 'hela', theme: 'asgard', music: 'boss',
    name: 'INCURSÃO 3 — ASGARD DESTRUÍDA', short: 'ASGARD',
    desc: 'Lâminas espectrais, chuva de armas e portais de mortos sobre ruínas douradas.',
    difficulty: 3, stars: 3, unlockLevel: 3,
    rewardFragments: 200, rewardCredits: 30,
    hazard: 'ruins',
  },
  {
    id: 'raid_devourer', boss: 'devourer', theme: 'collapse', music: 'boss',
    name: 'INCURSÃO 4 — NÚCLEO EM COLAPSO', short: 'COLAPSO',
    desc: 'Gravidade alterada e ondas cósmicas no coração de uma dimensão que morre.',
    difficulty: 4, stars: 4, unlockLevel: 4,
    rewardFragments: 260, rewardCredits: 40,
    hazard: 'gravity',
  },
  {
    id: 'raid_thanos', boss: 'thanos', theme: 'throne', music: 'boss',
    name: 'INCURSÃO 5 — TRONO DO NEXUS', short: 'TRONO',
    desc: 'O combate final contra Thanos Corrompido. Padrões extremos, recompensas únicas.',
    difficulty: 5, stars: 5, unlockLevel: 5,
    rewardFragments: 400, rewardCredits: 80,
    hazard: 'none',
  },
];

export const raidById = (id) => RAIDS.find((r) => r.id === id);

export function raidUnlocked(raid, save) {
  const idx = RAIDS.indexOf(raid);
  if (idx === 0) return save.accountLevel >= raid.unlockLevel;
  return !!save.raidsCleared[RAIDS[idx - 1].id] && save.accountLevel >= raid.unlockLevel;
}
