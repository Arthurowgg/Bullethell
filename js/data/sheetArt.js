// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/sheetArt.js
// Loads the ImageMagick-processed AI sheets over the procedural sprites:
// hero emblem frames (idle/idle-alt/attack/hurt), enemy sprites and boss
// sprites. Every load failure silently keeps the procedural fallback.
// ---------------------------------------------------------------------------
import { SPR } from '../core/pixel.js';
import { HEROES } from './heroes.js';

const HAS_IMG = typeof Image !== 'undefined';

export function loadSheetArt(onProgress) {
  if (!HAS_IMG) { onProgress && onProgress(1, 1); return Promise.resolve(); }

  const cnv = (img, scale) => {
    const c = document.createElement('canvas');
    c.width = img.width * scale; c.height = img.height * scale;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, c.width, c.height);
    return c;
  };

  const jobs = [];
  const load = (url, cb) => jobs.push(new Promise((res) => {
    const img = new Image();
    img.onload = () => { try { cb(img); } catch { /* keep fallback */ } res(); };
    img.onerror = () => res();
    img.src = url;
  }));

  // hero emblem frames
  for (const h of HEROES) {
    for (let i = 0; i < 4; i++) {
      load(`assets/sprites/heroes/${h.id}_f${i}.png`, (img) => {
        SPR['hero_' + h.id + '_f' + i] = cnv(img, 1);
        if (i === 0) {
          SPR['hero_' + h.id] = cnv(img, 1);
          SPR['hero_' + h.id + '_big'] = cnv(img, 4);
        }
      });
    }
  }
  // enemies
  for (const e of ['drone', 'chitauri', 'symbiote', 'sorcerer', 'sentinel', 'spectre', 'jotun', 'chaos']) {
    load(`assets/sprites/enemies/${e}.png`, (img) => { SPR['en_' + e] = cnv(img, 1); });
  }
  // bosses
  for (const b of ['ultron', 'loki', 'hela', 'devourer', 'thanos']) {
    load(`assets/sprites/bosses/${b}.png`, (img) => { SPR['boss_' + b] = cnv(img, 1); });
  }
  // per-hero walk loops + ability icons
  for (const h of HEROES) {
    for (let i = 0; i < 4; i++) {
      load(`assets/sprites/heroes_anim/${h.id}_w${i}.png`, (img) => { SPR['hero_' + h.id + '_w' + i] = cnv(img, 1); });
    }
    load(`assets/sprites/ui/abil_${h.id}_q.png`, (img) => { SPR['abil_' + h.id + '_q'] = cnv(img, 1); });
    load(`assets/sprites/ui/abil_${h.id}_e.png`, (img) => { SPR['abil_' + h.id + '_e'] = cnv(img, 1); });
  }
  // enemy variant sprites (4 per family)
  for (const e of ['drone', 'chitauri', 'symbiote', 'sorcerer', 'sentinel', 'spectre', 'jotun', 'chaos']) {
    load(`assets/sprites/enemies/${e}_b.png`, (img) => { SPR['en_' + e + '_b'] = cnv(img, 1); });
    for (let v = 1; v <= 4; v++) {
      load(`assets/sprites/enemies/${e}_v${v}.png`, (img) => { SPR['en_' + e + '_v' + v] = cnv(img, 1); });
    }
  }
  // world icons, boss portraits and custom boss bar frames
  for (const w of ['wakanda', 'asgard', 'newyork', 'boss_ultron', 'boss_loki', 'boss_hela', 'boss_devourer', 'boss_thanos']) {
    load(`assets/sprites/ui/wicon_${w}.png`, (img) => { SPR['wicon_' + w] = cnv(img, 1); });
  }
  for (const b of ['ultron', 'loki', 'hela', 'devourer', 'thanos']) {
    load(`assets/sprites/ui/portrait_${b}.png`, (img) => { SPR['portrait_' + b] = cnv(img, 1); });
    load(`assets/sprites/ui/bar_${b}.png`, (img) => { SPR['bar_' + b] = cnv(img, 1); });
  }
  // world backgrounds (3 main worlds + 5 boss-exclusive worlds)
  for (const w of ['wakanda', 'asgard', 'newyork', 'boss_ultron', 'boss_loki', 'boss_hela', 'boss_devourer', 'boss_thanos']) {
    load(`assets/sprites/worlds/${w}.png`, (img) => { SPR['world_' + w] = cnv(img, 1); });
  }
  // skin emblem frames
  for (const s of ['miles', 'ragnarok', 'hulkbuster', 'xforce', 'umbral']) {
    for (let i = 0; i < 4; i++) {
      load(`assets/sprites/skins/${s}_f${i}.png`, (img) => {
        SPR['skin_' + s + '_f' + i] = cnv(img, 1);
        if (i === 0) SPR['skin_' + s] = cnv(img, 1);
      });
    }
    load(`assets/sprites/skins_big/${s}.png`, (img) => { SPR['skin_' + s + '_big'] = cnv(img, 1); });
  }
  // upgrade icons (30)
  for (let i = 1; i <= 30; i++) {
    const k = 'up_' + String(i).padStart(2, '0');
    load(`assets/sprites/icons/${k}.png`, (img) => { SPR[k] = cnv(img, 1); });
  }
  // unique shots
  for (const h of ['arachnid', 'stormgod', 'ironknight', 'merc', 'claws', 'mystic'])
    load(`assets/sprites/shots/hero_${h}.png`, (img) => { SPR['shot_hero_' + h] = cnv(img, 1); });
  for (const e of ['drone', 'chitauri', 'symbiote', 'sorcerer', 'sentinel', 'spectre', 'jotun', 'chaos'])
    load(`assets/sprites/shots/en_${e}.png`, (img) => { SPR['shot_en_' + e] = cnv(img, 1); });
  for (const b of ['ultron', 'loki', 'hela', 'devourer', 'thanos', 'cosmic'])
    load(`assets/sprites/shots/boss_${b}.png`, (img) => { SPR['shot_boss_' + b] = cnv(img, 1); });
  // comic UI icons
  for (const u of ['swarm', 'elite', 'frags', 'alarm', 'burst', 'shield', 'bolt', 'portal'])
    load(`assets/sprites/ui/${u}.png`, (img) => { SPR['ui_' + u] = cnv(img, 1); });
  // Nexus lobby hub art
  for (const l of ['bg', 'core', 'portal_shop', 'portal_cos', 'portal_worlds',
    'wemb_wakanda', 'wemb_asgard', 'wemb_newyork',
    'nav_play', 'nav_nexus', 'nav_cos', 'nav_inc', 'nav_col', 'nav_mis', 'nav_dev', 'nav_gear']) {
    load(`assets/sprites/lobby/${l}.png`, (img) => { SPR['lobby_' + l] = cnv(img, 1); });
  }

  let done = 0;
  const total = jobs.length;
  return Promise.all(jobs.map((p) => p.then(() => { done++; onProgress && onProgress(done, total); })));
}
