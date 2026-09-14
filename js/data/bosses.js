// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/bosses.js
// Boss kits: phases reference attack pattern names implemented in
// game/boss.js. Damage scalars keep every fight tunable in one place.
// ---------------------------------------------------------------------------

export const BOSSES = {
  ultron: {
    id: 'ultron', shot: 'shot_boss_ultron', name: 'ULTRON PRIME', sprite: 'boss_ultron',
    hp: 1400, radius: 16, speed: 34, contact: 18, theme: 'factory',
    phases: [
      { until: 1.0, attacks: ['ringBurst', 'geoCross', 'droneWave'] },
      { until: 0.55, attacks: ['spiralArms', 'laserSweep', 'droneWave', 'ringBurst'] },
      { until: 0.0, attacks: ['coreMeltdown', 'spiralArms', 'laserSweep', 'ringBurst'] },
    ],
    intro: 'A FÁBRICA CORROMPIDA DESPERTA',
  },
  loki: {
    id: 'loki', shot: 'shot_boss_loki', name: 'LOKI, SENHOR DA ILUSÃO', sprite: 'boss_loki',
    hp: 1600, radius: 14, speed: 60, contact: 16, theme: 'palace',
    phases: [
      { until: 1.0, attacks: ['illusionFan', 'daggerRain', 'blink'] },
      { until: 0.55, attacks: ['mirrorSpiral', 'daggerRain', 'blink', 'cloneRing'] },
      { until: 0.0, attacks: ['grandIllusion', 'mirrorSpiral', 'daggerRain', 'blink'] },
    ],
    intro: 'AS ILUSÕES TOMAM FORMA',
  },
  hela: {
    id: 'hela', shot: 'shot_boss_hela', name: 'HELA, RAINHA DA MORTE', sprite: 'boss_hela',
    hp: 1900, radius: 15, speed: 44, contact: 18, theme: 'asgard',
    phases: [
      { until: 1.0, attacks: ['bladeFan', 'weaponRain', 'necroWave'] },
      { until: 0.55, attacks: ['bladeSpiral', 'weaponRain', 'spectreCall', 'bladeFan'] },
      { until: 0.0, attacks: ['deathBloom', 'bladeSpiral', 'weaponRain', 'spectreCall'] },
    ],
    intro: 'A MORTE CAMINHA SOBRE ASGARD',
  },
  devourer: {
    id: 'devourer', shot: 'shot_boss_devourer', name: 'DEVORADOR DO NEXUS', sprite: 'boss_devourer',
    hp: 2300, radius: 18, speed: 30, contact: 20, theme: 'collapse',
    phases: [
      { until: 1.0, attacks: ['voidSpiral', 'gravityWell', 'cosmicWave'] },
      { until: 0.55, attacks: ['voidSpiral', 'gravityWell', 'tentacleSweep', 'cosmicWave'] },
      { until: 0.0, attacks: ['devour', 'voidSpiral', 'gravityWell', 'cosmicWave'] },
    ],
    intro: 'A DIMENSÃO COLAPSA SOBRE VOCÊ',
  },
  thanos: {
    id: 'thanos', shot: 'shot_boss_thanos', name: 'THANOS CORROMPIDO', sprite: 'boss_thanos',
    hp: 3000, radius: 18, speed: 36, contact: 22, theme: 'throne',
    phases: [
      { until: 1.0, attacks: ['meteorRain', 'powerRing', 'stoneBeam'] },
      { until: 0.66, attacks: ['meteorRain', 'gauntletSpiral', 'stoneBeam', 'shockwave'] },
      { until: 0.33, attacks: ['realityWave', 'gauntletSpiral', 'meteorRain', 'shockwave'] },
      { until: 0.0, attacks: ['nexusCollapse', 'gauntletSpiral', 'stoneBeam', 'meteorRain', 'shockwave'] },
    ],
    intro: 'O NEXUS CORROMPIDO EXIGE O FIM',
  },
};

export const bossById = (id) => BOSSES[id];
