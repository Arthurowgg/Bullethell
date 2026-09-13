// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/missions.js
// Missions read live progress from Save.data.stats / raidsCleared.
// check(save) -> {cur, max, done}
// ---------------------------------------------------------------------------

export const MISSIONS = [
  { id: 'm_first', name: 'PRIMEIRO PASSO', desc: 'Vença 1 partida ou incursão', reward: { frag: 100 }, check: (s) => [s.stats.wins, 1] },
  { id: 'm_kill100', name: 'CONTROLE DE PRAGAS', desc: 'Derrote 100 inimigos', reward: { frag: 120 }, check: (s) => [s.stats.kills, 100] },
  { id: 'm_kill500', name: 'EXTERMINADOR', desc: 'Derrote 500 inimigos', reward: { frag: 300, cred: 20 }, check: (s) => [s.stats.kills, 500] },
  { id: 'm_lvl10', name: 'EVOLUÇÃO', desc: 'Alcance o nível 10 em uma partida', reward: { frag: 200 }, check: (s) => [s.stats.levelReached, 10] },
  { id: 'm_raids', name: 'CAÇADOR DE INCURSÕES', desc: 'Complete 3 incursões', reward: { frag: 250, cred: 25 }, check: (s) => [Object.keys(s.raidsCleared).length, 3] },
  { id: 'm_thanos', name: 'O FIM DA AMEAÇA', desc: 'Derrote Thanos Corrompido', reward: { frag: 500, cred: 60 }, check: (s) => [s.bossesDefeated.thanos || 0, 1] },
  { id: 'm_shop', name: 'COLECIONADOR', desc: 'Compre 3 cosméticos', reward: { cred: 15 }, check: (s) => [Object.keys(s.cosmeticsOwned).length, 3] },
  { id: 'm_core', name: 'NÚCLEO ATIVO', desc: 'Compre 5 melhorias no Nexus Core', reward: { frag: 180 }, check: (s) => [Object.values(s.nexusNodes).reduce((a, b) => a + b, 0), 5] },
  { id: 'm_runs', name: 'PERSISTÊNCIA', desc: 'Complete 10 partidas', reward: { frag: 220 }, check: (s) => [s.stats.runs, 10] },
  { id: 'm_heroes', name: 'ESQUADRÃO COMPLETO', desc: 'Desbloqueie 4 heróis', reward: { cred: 30 }, check: (s) => [Object.keys(s.heroesUnlocked).length, 4] },
];

export const HERO_UNLOCK_COST = {
  arachnid: 0,
  stormgod: 300,
  ironknight: 400,
  merc: 500,
  claws: 650,
  mystic: 800,
};
