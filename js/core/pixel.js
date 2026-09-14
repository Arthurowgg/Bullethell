// ---------------------------------------------------------------------------
// MARVEL NEXUS — core/pixel.js
// The sprite compiler. Everything visual in the game is authored as pixel
// data (the `Pix` raster) — either from ASCII maps or primitive draw calls —
// and compiled to a canvas in the browser, or exported to PNG through
// ImageMagick by tools/build_sprites.mjs in Node.
// ---------------------------------------------------------------------------

export const C = {
  // shared palette anchors
  outline: '#0b0a14',
  white: '#f4f2ff',
  black: '#101018',
};

export class Pix {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }
  static from(p) { return p; }

  _set(x, y, col, a = 255) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const [r, g, b, al] = parseColor(col);
    const na = (al * a) / 255;
    if (na >= this.data[i + 3]) {
      this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = Math.min(255, na);
    } else {
      // simple alpha blend
      const t = na / 255, ia = 1 - t;
      this.data[i] = this.data[i] * ia + r * t;
      this.data[i + 1] = this.data[i + 1] * ia + g * t;
      this.data[i + 2] = this.data[i + 2] * ia + b * t;
      this.data[i + 3] = Math.min(255, this.data[i + 3] + na);
    }
  }

  px(x, y, col, a) { this._set(x, y, col, a); return this; }

  rect(x, y, w, h, col, a) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this._set(i, j, col, a);
    return this;
  }

  hline(x, y, w, col) { return this.rect(x, y, w, 1, col); }
  vline(x, y, h, col) { return this.rect(x, y, 1, h, col); }

  /** Stroked rectangle outline */
  frame(x, y, w, h, col) {
    this.hline(x, y, w, col); this.hline(x, y + h - 1, w, col);
    this.vline(x, y, h, col); this.vline(x + w - 1, y, h, col);
    return this;
  }

  circle(cx, cy, r, col, fill = true) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (fill ? d <= r * r : d > (r - 1.4) * (r - 1.4) && d <= r * r) this._set(cx + x, cy + y, col);
    }
    return this;
  }

  disc(cx, cy, r, col) { return this.circle(cx, cy, r, col, true); }

  /** Filled diamond */
  diamond(cx, cy, r, col) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
      if (Math.abs(x) + Math.abs(y) <= r) this._set(cx + x, cy + y, col);
    return this;
  }

  tri(x1, y1, x2, y2, x3, y3, col) {
    const minx = Math.min(x1, x2, x3), maxx = Math.max(x1, x2, x3);
    const miny = Math.min(y1, y2, y3), maxy = Math.max(y1, y2, y3);
    const s = (a, b, c, d, e, f) => (b - a[1]) * (c - a[0]) - (b - a[0]) * (d - a[1]) >= 0;
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
      const d1 = s([x, y], x1, y1, x2, y2), d2 = s([x, y], x2, y2, x3, y3), d3 = s([x, y], x3, y3, x1, y1);
      const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) this._set(x, y, col);
    }
    return this;
  }

  /** Mirror left half onto right half (author half a sprite, get symmetry). */
  mirrorX() {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < (this.w >> 1); x++) {
        const a = (y * this.w + x) * 4, b = (y * this.w + (this.w - 1 - x)) * 4;
        this.data[b] = this.data[a]; this.data[b + 1] = this.data[a + 1];
        this.data[b + 2] = this.data[a + 2]; this.data[b + 3] = this.data[a + 3];
      }
    }
    return this;
  }

  /** Dark outline pass: any transparent pixel adjacent to opaque becomes `col`. */
  outline(col = C.outline, thick = 1) {
    const src = this.data.slice();
    const has = (x, y) => {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
      return src[(y * this.w + x) * 4 + 3] > 40;
    };
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (has(x, y)) continue;
      let near = false;
      for (let dy = -thick; dy <= thick && !near; dy++)
        for (let dx = -thick; dx <= thick; dx++)
          if ((dx || dy) && has(x + dx, y + dy)) { near = true; break; }
      if (near) {
        const [r, g, b] = parseColor(col);
        const i = (y * this.w + x) * 4;
        this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = 255;
      }
    }
    return this;
  }

  clone() {
    const p = new Pix(this.w, this.h);
    p.data.set(this.data);
    return p;
  }

  /** Raw RGBA buffer (used by the ImageMagick exporter). */
  rgba() { return Buffer ? Buffer.from(this.data.buffer.slice(0)) : this.data; }

  toCanvas() {
    if (!globalThis.document) return null;
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    const g = c.getContext('2d');
    const img = g.createImageData(this.w, this.h);
    img.data.set(this.data);
    g.putImageData(img, 0, 0);
    return c;
  }
}

const colorCache = new Map();
export function parseColor(col) {
  let v = colorCache.get(col);
  if (v) return v;
  if (col[0] === '#') {
    let h = col.slice(1);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255];
  } else if (col.startsWith('rgb')) {
    const m = col.match(/[\d.]+/g).map(Number);
    v = [m[0], m[1], m[2], m.length > 3 ? Math.round(m[3] * 255) : 255];
  } else v = [255, 0, 255, 255];
  colorCache.set(col, v);
  return v;
}

/** Compile an ASCII map (rows of chars, '.' = transparent) with a palette. */
export function fromMap(rows, palette) {
  const h = rows.length, w = rows[0].length;
  const p = new Pix(w, h);
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = palette[ch];
      if (col) p.px(x, y, col);
    }
  }
  return p;
}

export const SPR = {}; // registry of compiled canvases, filled by data/sprites.js

export function reg(name, pixOrCanvas) {
  SPR[name] = pixOrCanvas && pixOrCanvas.toCanvas ? (globalThis.document ? pixOrCanvas.toCanvas() : pixOrCanvas) : pixOrCanvas;
  return SPR[name];
}

/** draw a sprite centered with flip / tint / alpha. Tints cached. */
const tintCache = new Map();
export function drawSprite(ctx, spr, x, y, o = {}) {
  if (!spr) return;
  const w = spr.width, h = spr.height;
  const s = o.scale || 1;
  const dw = w * (o.scaleX || s), dh = h * (o.scaleY || s);
  let img = spr;
  if (o.tint) {
    const key = (spr.__id || (spr.__id = Math.random())) + o.tint;
    let t = tintCache.get(key);
    if (!t && globalThis.document) {
      t = document.createElement('canvas');
      t.width = w; t.height = h;
      const g = t.getContext('2d');
      g.drawImage(spr, 0, 0);
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = o.tint;
      g.fillRect(0, 0, w, h);
      tintCache.set(key, t);
    }
    if (t) img = t;
  }
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (o.rot) ctx.rotate(o.rot);
  if (o.flip) ctx.scale(-1, 1);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.drawImage(img, -dw / 2, -dh / 2 + (o.dy || 0), dw, dh);
  ctx.restore();
}
