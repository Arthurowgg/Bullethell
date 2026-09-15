// ---------------------------------------------------------------------------
// MARVEL NEXUS — core/icons.js
// Tiny procedural pixel icons (8x8), two tones, NO background. Crisp at any
// integer scale, universal across menus/HUD/pause/config.
// ---------------------------------------------------------------------------

// 'X' = main color, 'o' = accent color, '.' = empty
const IC = {
  music: [
    '...XXXX.',
    '...X..X.',
    '...X..X.',
    '...X....',
    '...X....',
    '.XXX....',
    '.XXX.o..',
    '..oo....',
  ],
  speaker: [
    '...X....',
    '..XX.o..',
    '.XXX.o.o',
    'XXXX.o.o',
    'XXXX.o.o',
    '.XXX.o.o',
    '..XX.o..',
    '...X....',
  ],
  shake: [
    '........',
    '.o.XXX.o',
    '...X.X..',
    'o.XXX.o.',
    '.o.X.Xo.',
    '...XXX..',
    '.o.....o',
    '........',
  ],
  dmg: [
    '...oo...',
    '.o.XX.o.',
    '..XXXX..',
    'oXXXXXXo',
    '..XXXX..',
    '.o.XX.o.',
    '...oo...',
    '........',
  ],
  aim: [
    '...XX...',
    '...XX...',
    '.o....o.',
    'XX.oo.XX',
    'XX.oo.XX',
    '.o....o.',
    '...XX...',
    '...XX...',
  ],
  pixel: [
    'XX..XX..',
    'XX..XX..',
    '........',
    'XX..oX..',
    'XX..oo..',
    '........',
    'oX..XX..',
    'oo..XX..',
  ],
  full: [
    'XX...XX.',
    'X.....X.',
    '........',
    '........',
    '........',
    '........',
    'X.....X.',
    'XX...XX.',
  ],
  gear: [
    '..X..X..',
    '.XXXXXX.',
    'XXXooXXX',
    '.XoooX..',
    '.XoooX..',
    'XXXooXXX',
    '.XXXXXX.',
    '..X..X..',
  ],
  play: [
    '..X.....',
    '..XX....',
    '..XXX...',
    '..XXXX..',
    '..XXX...',
    '..XX....',
    '..X.....',
    '........',
  ],
  restart: [
    '.XXXX...',
    'X...X...',
    'X....XX.',
    '........',
    'X....X..',
    'X...X.o.',
    '.XXXX.o.',
    '........',
  ],
  quit: [
    'XXXX.X..',
    'X..X.XX.',
    'X..X.X.X',
    'X..XXX.X',
    'X..X.X.X',
    'X..X.XX.',
    'XXXX.X..',
    '........',
  ],
  x: [
    '........',
    '.XX..XX.',
    '..XX.XX.',
    '...XXX..',
    '..XX.XX.',
    '.XX..XX.',
    '........',
    '........',
  ],
  book: [
    '.XXXXXX.',
    'XX....XX',
    'X.o..o.X',
    'X......X',
    'X.o..o.X',
    'X......X',
    'XX....XX',
    '.XXXXXX.',
  ],
  cart: [
    '........',
    '.XXXX...',
    '.X..X...',
    '.XooX.X.',
    '.XooXXX.',
    '.X....X.',
    '..o..o..',
    '........',
  ],
  mask: [
    '........',
    '.XXXXXX.',
    'XX.oo.XX',
    'XX.oo.XX',
    '.XX..XX.',
    '..XXXX..',
    '........',
    '........',
  ],
  // ---- hero ability icons (Q / E) ----
  q_arachnid: [
    'X..XX..X',
    '.X.XX.X.',
    '..XooX..',
    'XXooooXX',
    'XXooooXX',
    '..XooX..',
    '.X.XX.X.',
    'X..XX..X',
  ],
  e_arachnid: [
    'X.X..X.X',
    '.XXX.XX.',
    'X..oo..X',
    '.X.oo.X.',
    'X..oo..X',
    '.XX..XX.',
    'X.X..X.X',
    '........',
  ],
  q_stormgod: [
    '...XXX..',
    '..XXX...',
    '.XXXXX..',
    '...XX...',
    '..XX....',
    '.XX.o...',
    'XX..o...',
    'X.......',
  ],
  e_stormgod: [
    '.XXXXXX.',
    '.XooooX.',
    '.XooooX.',
    '...XX...',
    '...XX...',
    '...XX...',
    '..XXXX..',
    '........',
  ],
  q_ironknight: [
    '...X....',
    '..XXX...',
    '..XXX...',
    '.XXXXX..',
    '.XXXXX..',
    '..XXX...',
    '.XX.XX..',
    'X.....X.',
  ],
  e_ironknight: [
    '........',
    '.X.X.X..',
    '.X.X.X..',
    '.XXX.XX.',
    '.X.X.X..',
    '.X.X.X..',
    '........',
    '........',
  ],
  q_merc: [
    'X.....X.',
    '.X...X..',
    '..X.X...',
    '...X....',
    '..X.X...',
    '.X...X..',
    'X.o.o.X.',
    '..o.o...',
  ],
  e_merc: [
    '....XX..',
    '...XX...',
    '..XX....',
    '.XX..XX.',
    'oX..XX..',
    '...XX.o.',
    '..XX..X.',
    '.XX.....',
  ],
  q_claws: [
    '..X..X..',
    '.XX..XX.',
    '.XX..XX.',
    'XXXX.XXX',
    '.XX..XX.',
    '.XX..XX.',
    '..X..X..',
    '........',
  ],
  e_claws: [
    '...XXXX.',
    '..XXXXX.',
    'XXXXXXo.',
    'XXXXXXXo',
    'XXXXXXo.',
    '..XXXXX.',
    '...XXXX.',
    '........',
  ],
  q_mystic: [
    '..oooo..',
    '.X....X.',
    'X..XX..X',
    'o.X..X.o',
    'o.X..X.o',
    'X..XX..X',
    '.X....X.',
    '..oooo..',
  ],
  e_mystic: [
    '..XXXX..',
    '.X....X.',
    'X..oo..X',
    'X.o..o.X',
    'X.o..o.X',
    'X..oo..X',
    '.X....X.',
    '..XXXX..',
  ],
};

const cache = new Map();
const HAS_DOM = typeof document !== 'undefined' && !!document.createElement;

function iconCanvas(id, main, acc) {
  const key = id + '|' + main + '|' + acc;
  let c = cache.get(key);
  if (c !== undefined) return c;
  if (!HAS_DOM || !IC[id]) { cache.set(key, null); return null; }
  c = document.createElement('canvas');
  c.width = 8; c.height = 8;
  const g = c.getContext('2d');
  const rows = IC[id];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const ch = rows[y][x];
      if (ch === 'X') { g.fillStyle = main; g.fillRect(x, y, 1, 1); }
      else if (ch === 'o') { g.fillStyle = acc; g.fillRect(x, y, 1, 1); }
    }
  }
  cache.set(key, c);
  return c;
}

/** draw a tiny icon centered at x,y. scale must stay integer-friendly. */
export function drawIcon(ctx, id, x, y, o = {}) {
  const main = o.color || '#cfc8f2';
  const acc = o.accent || '#ffffff';
  const s = o.scale || 1;
  const c = iconCanvas(id, main, acc);
  if (!c) return;
  const dw = Math.round(8 * s), dh = Math.round(8 * s);
  ctx.drawImage(c, Math.round(x - dw / 2), Math.round(y - dh / 2), dw, dh);
}

export function hasIcon(id) { return !!IC[id]; }

/** debug/helper: raw bitmap rows for an icon id */
export function iconRows(id) { return IC[id] || null; }
export const ICON_IDS = Object.keys(IC);
