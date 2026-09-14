// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/run.js
// Run stats factory: hero base + Nexus Core permanent bonuses + passives.
// Also XP curve helpers.
// ---------------------------------------------------------------------------
import { applyNexus } from '../data/nexuscore.js';

export function newRunStats(hero, save) {
  const s = {
    maxHp: hero.hp, hp: hero.hp,
    speed: hero.speed,
    dmg: 1, rate: 1, extraProj: 0, projSpeed: 1, range: 1, cdr: 1,
    bounce: 0, burn: 0, chill: 0, orbit: 0, magnet: 46, crit: 0.05, lifesteal: 0,
    dashCd: 1.6, xpGain: 1, thorns: 0,
    chains: hero.attack.chains || 3,
    webRoot: 0, webSplit: false, permHammer: false, autoMissile: false, unibeam: false,
    hitHeal: 0, auraSlow: false, runes: hero.id === 'mystic' ? 2 : 0,
    shield: 0, revives: 0, upChoices: 3, fragGain: 1,
    level: 1, xp: 0,
  };
  if (save) applyNexus(save, s, hero.id);
  // hero passives
  switch (hero.id) {
    case 'arachnid': s.speed *= 1.15; s.dashCd *= 0.8; break;
    case 'ironknight': s.crit += 0.1; break;
    case 'merc': break; // regen handled in player
    case 'stormgod': break;
    case 'claws': break;
    case 'mystic': break;
  }
  return s;
}

export const xpNeed = (lvl) => Math.floor(10 + lvl * 7 + lvl * lvl * 0.6);

export function gainXp(run, amount, onLevel) {
  run.xp += amount * run.xpGain;
  while (run.xp >= xpNeed(run.level)) {
    run.xp -= xpNeed(run.level);
    run.level++;
    onLevel && onLevel(run.level);
  }
}
