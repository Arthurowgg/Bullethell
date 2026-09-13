// ---------------------------------------------------------------------------
// MARVEL NEXUS — core/font.js
// A 5x7 bitmap font rendered as pre-cached glyph canvases (browser) so every
// label in the game is authentic pixel type. Node-safe: in headless mode the
// glyph cache falls back to a no-op and drawText measures only.
// ---------------------------------------------------------------------------
import { clamp } from './util.js';

export const FONT_W = 5;
export const FONT_H = 7;

// 7 rows of 5 bits per glyph (MSB = leftmost pixel).
const G = {
  A: '0E,11,11,1F,11,11,11', B: '1E,11,11,1E,11,11,1E', C: '0E,11,10,10,10,11,0E',
  D: '1E,11,11,11,11,11,1E', E: '1F,10,10,1E,10,10,1F', F: '1F,10,10,1E,10,10,10',
  G: '0E,11,10,17,11,11,0F', H: '11,11,11,1F,11,11,11', I: '0E,04,04,04,04,04,0E',
  J: '07,02,02,02,02,12,0C', K: '11,12,14,18,14,12,11', L: '10,10,10,10,10,10,1F',
  M: '11,1B,15,15,11,11,11', N: '11,19,15,13,11,11,11', O: '0E,11,11,11,11,11,0E',
  P: '1E,11,11,1E,10,10,10', Q: '0E,11,11,11,15,12,0D', R: '1E,11,11,1E,14,12,11',
  S: '0F,10,10,0E,01,01,1E', T: '1F,04,04,04,04,04,04', U: '11,11,11,11,11,11,0E',
  V: '11,11,11,11,11,0A,04', W: '11,11,11,15,15,1B,11', X: '11,11,0A,04,0A,11,11',
  Y: '11,11,0A,04,04,04,04', Z: '1F,01,02,04,08,10,1F',
  0: '0E,11,13,15,19,11,0E', 1: '04,0C,04,04,04,04,0E', 2: '0E,11,01,02,04,08,1F',
  3: '1F,02,04,02,01,11,0E', 4: '02,06,0A,12,1F,02,02', 5: '1F,10,1E,01,01,11,0E',
  6: '06,08,10,1E,11,11,0E', 7: '1F,01,02,04,08,08,08', 8: '0E,11,11,0E,11,11,0E',
  9: '0E,11,11,0F,01,02,1C',
  ' ': '00,00,00,00,00,00,00', '.': '00,00,00,00,00,0C,0C', ',': '00,00,00,00,0C,0C,08',
  ':': '00,0C,0C,00,0C,0C,00', ';': '00,0C,0C,00,0C,04,08', '!': '04,04,04,04,04,00,04',
  '?': '0E,11,01,02,04,00,04', "'": '04,04,00,00,00,00,00', '"': '0A,0A,00,00,00,00,00',
  '-': '00,00,00,1F,00,00,00', '+': '00,04,04,1F,04,04,00', '/': '01,02,02,04,08,08,10',
  '(': '02,04,08,08,08,04,02', ')': '08,04,02,02,02,04,08', '[': '0E,08,08,08,08,08,0E',
  ']': '0E,02,02,02,02,02,0E', '%': '11,01,02,04,08,10,11', '*': '00,0A,04,1F,04,0A,00',
  '#': '0A,1F,0A,0A,0A,1F,0A', '<': '02,04,08,10,08,04,02', '>': '08,04,02,01,02,04,08',
  '=': '00,00,1F,00,1F,00,00', '$': '04,0F,14,0E,05,1E,04', '&': '0C,12,14,08,15,12,0D',
  '@': '0E,11,17,15,17,10,0F', '_': '00,00,00,00,00,00,1F', '|': '04,04,04,04,04,04,04',
  '°': '0C,0C,00,00,00,00,00',
};

// Accents drawn above the base glyph cell (2-3 px tall).
const MARKS = {
  acute: ['02', '04'], grave: ['08', '04'], circum: ['04', '0A'],
  tilde: ['0D', '12'],
};
// Cedilla drawn below the base glyph.
const CEDILLA = ['04', '08'];

// Uppercase accented letters -> [base, mark]
const ACC = {
  'Á': ['A', 'acute'], 'É': ['E', 'acute'], 'Í': ['I', 'acute'], 'Ó': ['O', 'acute'], 'Ú': ['U', 'acute'],
  'Â': ['A', 'circum'], 'Ê': ['E', 'circum'], 'Ô': ['O', 'circum'],
  'Ã': ['A', 'tilde'], 'Õ': ['O', 'tilde'], 'Ç': ['C', 'cedilla'], 'Ü': ['U', 'circum'],
};

const HAS_DOM = typeof document !== 'undefined' && !!document.createElement;

const glyphCache = new Map(); // key: char|color -> canvas or null

function rowsOf(ch) {
  if (G[ch]) return G[ch].split(',').map((h) => parseInt(h, 16));
  return G[' '].split(',').map((h) => parseInt(h, 16));
}

function makeGlyphCanvas(ch, color) {
  const c = document.createElement('canvas');
  c.width = FONT_W; c.height = FONT_H;
  const g = c.getContext('2d');
  g.fillStyle = color;
  const rows = rowsOf(ch);
  for (let y = 0; y < 7; y++) {
    const bits = rows[y];
    for (let x = 0; x < 5; x++) if (bits & (1 << (4 - x))) g.fillRect(x, y, 1, 1);
  }
  return c;
}

function getGlyph(ch, color) {
  const key = ch + '|' + color;
  let c = glyphCache.get(key);
  if (c === undefined) {
    c = HAS_DOM ? makeGlyphCanvas(ch, color) : null;
    glyphCache.set(key, c);
  }
  return c;
}

/** Measure a string width in internal pixels. */
export function textWidth(str, scale = 1, spacing = 1) {
  const adv = (FONT_W + spacing) * scale;
  return Math.max(0, String(str).length * adv - spacing * scale);
}

const LINE_H = 9;

/**
 * Draw pixel text.
 * opts: scale, color, align ('left'|'center'|'right'), shadow (color|true), spacing
 */
export function drawText(ctx, str, x, y, opts = {}) {
  const scale = opts.scale || 1;
  const color = opts.color || '#e8e8ff';
  const spacing = opts.spacing == null ? 1 : opts.spacing;
  str = String(str).toUpperCase();
  const w = textWidth(str, scale, spacing);
  let sx = x;
  if (opts.align === 'center') sx = Math.round(x - w / 2);
  else if (opts.align === 'right') sx = Math.round(x - w);

  const adv = (FONT_W + spacing) * scale;
  const px = Math.round(sx), py = Math.round(y);
  const draw = (col) => {
    let cx = px;
    for (const ch of str) {
      const acc = ACC[ch];
      const base = acc ? acc[0] : ch;
      const g = getGlyph(base, col);
      if (g) ctx.drawImage(g, cx, py, FONT_W * scale, FONT_H * scale);
      if (acc && HAS_DOM) {
        const mark = acc[1];
        if (mark === 'cedilla') {
          const rows = CEDILLA;
          ctx.fillStyle = col;
          for (let r = 0; r < rows.length; r++) {
            const bits = parseInt(rows[r], 16);
            for (let bx = 0; bx < 5; bx++) if (bits & (1 << (4 - bx))) ctx.fillRect(cx + bx * scale, py + (7 + r) * scale, scale, scale);
          }
        } else {
          const rows = MARKS[mark];
          ctx.fillStyle = col;
          for (let r = 0; r < rows.length; r++) {
            const bits = parseInt(rows[r], 16);
            for (let bx = 0; bx < 5; bx++) if (bits & (1 << (4 - bx))) ctx.fillRect(cx + bx * scale, py + (r - 2) * scale, scale, scale);
          }
        }
      }
      cx += adv;
    }
  };
  if (opts.shadow) {
    // draw shadow pass
    ctx.save();
    const prev = ctx.__nxShadow;
    ctx.__nxShadow = true;
    ctx.translate(scale, scale);
    draw(typeof opts.shadow === 'string' ? opts.shadow : '#05040a');
    ctx.restore();
  }
  draw(color);
}

export function drawTextLines(ctx, str, x, y, opts = {}) {
  const lines = String(str).split('\n');
  const lh = (opts.lineHeight || LINE_H) * (opts.scale || 1);
  lines.forEach((ln, i) => drawText(ctx, ln, x, y + i * lh, opts));
  return lines.length * lh;
}

export const lineHeight = (scale = 1) => LINE_H * scale;
