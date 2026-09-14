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

  let done = 0;
  const total = jobs.length;
  return Promise.all(jobs.map((p) => p.then(() => { done++; onProgress && onProgress(done, total); })));
}
