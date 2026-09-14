// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/arena.js
// Fixed top-down arena (640x360 internal). Static background is pre-rendered
// once per theme into an offscreen canvas.
// ---------------------------------------------------------------------------
import { SPR } from '../core/pixel.js';
import { THEMES } from '../data/sprites.js';
import { RNG, rand, pick } from '../core/util.js';

export const VIEW_W = 640;
export const VIEW_H = 360;
export const WALL = 12;

export class Arena {
  constructor(themeId = 'nexus', seed = 7) {
    this.theme = THEMES[themeId] || THEMES.nexus;
    this.themeId = themeId;
    this.rng = new RNG(seed * 131 + 17);
    this.bounds = { x: WALL, y: WALL, w: VIEW_W - WALL * 2, h: VIEW_H - WALL * 2 };
    this.obstacles = this._makeObstacles();
    this.blocked = this._makeBlocked();
    this.bg = this._renderBg();
  }

  // invisible walkable mask: blocked rects = "fora do mapa"
  resolveCircle(x, y, r) {
    for (const o of this.blocked) {
      const cx = Math.max(o.x, Math.min(x, o.x + o.w));
      const cy = Math.max(o.y, Math.min(y, o.y + o.h));
      const dx = x - cx, dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < r * r && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        y = cy + (dy / d) * r;
      } else if (d2 <= 0.0001) {
        y = o.y - r;
      }
    }
    return [x, y];
  }

  inWalk(x, y) {
    if (x < this.bounds.x || x > this.bounds.x + this.bounds.w || y < this.bounds.y || y > this.bounds.y + this.bounds.h) return false;
    for (const o of this.blocked) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  }

  randomWalkable(margin = 14) {
    for (let i = 0; i < 24; i++) {
      const x = rand(this.bounds.x + margin, this.bounds.x + this.bounds.w - margin);
      const y = rand(this.bounds.y + margin, this.bounds.y + this.bounds.h - margin);
      if (this.inWalk(x, y)) return [x, y];
    }
    return [VIEW_W / 2, VIEW_H / 2];
  }

  _makeBlocked() {
    // per-world invisible "out of bounds" shapes (props/edges of the art)
    const B = (x, y, w, h) => ({ x, y, w, h });
    const t = this.themeId;
    const c = [];
    const corner = 46; // all worlds: soft corner cuts
    c.push(B(0, 0, corner, 26), B(0, 0, 26, corner));
    c.push(B(VIEW_W - corner, 0, corner, 26), B(VIEW_W - 26, 0, 26, corner));
    c.push(B(0, VIEW_H - 26, corner, 26), B(0, VIEW_H - corner, 26, corner));
    c.push(B(VIEW_W - corner, VIEW_H - 26, corner, 26), B(VIEW_W - 26, VIEW_H - corner, 26, corner));
    if (t === 'wakanda') { c.push(B(20, 20, 60, 44), B(VIEW_W - 84, 20, 64, 40), B(24, VIEW_H - 62, 56, 42), B(VIEW_W - 80, VIEW_H - 60, 60, 40)); }
    if (t === 'asgard') { c.push(B(0, 0, 90, 60), B(VIEW_W - 90, 0, 90, 60), B(0, VIEW_H - 60, 90, 60), B(VIEW_W - 90, VIEW_H - 60, 90, 60)); }
    if (t === 'newyork') { c.push(B(0, 0, 120, 70), B(VIEW_W - 120, 0, 120, 70), B(0, VIEW_H - 70, 120, 70), B(VIEW_W - 120, VIEW_H - 70, 120, 70)); }
    if (t === 'boss_ultron') { c.push(B(0, 0, 140, 90), B(VIEW_W - 140, 0, 140, 90), B(0, VIEW_H - 80, 140, 80), B(VIEW_W - 140, VIEW_H - 80, 140, 80)); }
    if (t === 'boss_loki') { c.push(B(0, 0, 120, 80), B(VIEW_W - 120, 0, 120, 80), B(0, VIEW_H - 80, 120, 80), B(VIEW_W - 120, VIEW_H - 80, 120, 80)); }
    if (t === 'boss_hela') { c.push(B(0, 0, 130, 84), B(VIEW_W - 130, 0, 130, 84), B(0, VIEW_H - 84, 130, 84), B(VIEW_W - 130, VIEW_H - 84, 130, 84)); }
    if (t === 'boss_devourer') { c.push(B(0, 0, 150, 100), B(VIEW_W - 150, 0, 150, 100), B(0, VIEW_H - 100, 150, 100), B(VIEW_W - 150, VIEW_H - 100, 150, 100)); }
    if (t === 'boss_thanos') { c.push(B(0, 0, 130, 90), B(VIEW_W - 130, 0, 130, 90), B(0, VIEW_H - 80, 130, 80), B(VIEW_W - 130, VIEW_H - 80, 130, 80)); }
    return c;
  }

  _makeObstacles() { return []; }

  setTheme(themeId) {
    this.themeId = themeId;
    this.theme = THEMES[themeId] || this.theme;
    this.blocked = this._makeBlocked();
    this.bg = this._renderBg();
  }

  _renderBg() {
    if (!globalThis.document) return null;
    const c = document.createElement('canvas');
    c.width = VIEW_W; c.height = VIEW_H;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const wimg = SPR['world_' + this.themeId];
    if (wimg) {
      g.drawImage(wimg, 0, 0, VIEW_W, VIEW_H);
      return c;
    }
    // floor tiles
    const f0 = SPR['floor_' + this.themeId + '_0'] || SPR.floor_nexus_0;
    const f1 = SPR['floor_' + this.themeId + '_1'] || SPR.floor_nexus_1;
    for (let y = 0; y < VIEW_H; y += 16) {
      for (let x = 0; x < VIEW_W; x += 16) {
        const alt = ((x + y) / 16) % 2 === 0 || this.rng.next() < 0.08;
        g.drawImage(this.rng.next() < 0.12 && f1 ? f1 : (alt && f1 ? f1 : f0), x, y);
      }
    }
    // accent glow center
    g.globalAlpha = 0.12;
    g.fillStyle = this.theme.accent;
    g.fillRect(VIEW_W / 2 - 60, VIEW_H / 2 - 60, 120, 120);
    g.globalAlpha = 1;
    // walls
    const wall = SPR['wall_' + this.themeId] || SPR.wall_nexus;
    for (let x = 0; x < VIEW_W; x += 16) {
      g.drawImage(wall, x, 0);
      g.drawImage(wall, x, VIEW_H - 12);
    }
    for (let y = 0; y < VIEW_H; y += 16) {
      g.save(); g.translate(0, y); g.drawImage(wall, 0, 0, 16, 12); g.restore();
      g.drawImage(wall, 0, y, 12, 16);
      g.drawImage(wall, VIEW_W - 12, y, 12, 16);
    }
    // dressing
    const cons = SPR['console_' + this.themeId];
    if (cons) {
      const spots = [[20, 20], [VIEW_W - 38, 20], [20, VIEW_H - 38]];
      for (const [x, y] of spots) if (this.rng.next() < 0.9) g.drawImage(cons, x, y);
    }
    const ban = SPR['banner_' + this.themeId];
    if (ban) for (let x = 60; x < VIEW_W - 40; x += 90) if (this.rng.next() < 0.6) g.drawImage(ban, x, 13);
    const por = SPR['portal_' + this.themeId];
    if (por) g.drawImage(por, VIEW_W / 2 - 12, 16);
    const crate = SPR.crate;
    for (const o of this.obstacles) if (crate) g.drawImage(crate, o.x, o.y);
    // vignette
    const grad = g.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 120, VIEW_W / 2, VIEW_H / 2, 380);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.42)');
    g.fillStyle = grad;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    return c;
  }

  draw(ctx) {
    if (this.bg) ctx.drawImage(this.bg, 0, 0);
    else { ctx.fillStyle = this.theme.floor; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  }

  /** clamp a point inside playable area (radius aware) */
  clamp(x, y, r) {
    const b = this.bounds;
    return [
      Math.min(b.x + b.w - r, Math.max(b.x + r, x)),
      Math.min(b.y + b.h - r, Math.max(b.y + r, y)),
    ];
  }

  /** resolve circle vs obstacle crates; returns corrected [x,y] */
  collideObstacles(x, y, r) {
    for (const o of this.obstacles) {
      const cx = Math.max(o.x, Math.min(x, o.x + o.w));
      const cy = Math.max(o.y, Math.min(y, o.y + o.h));
      const dx = x - cx, dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < r * r && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        y = cy + (dy / d) * r;
      } else if (d2 <= 0.0001) {
        y = o.y - r;
      }
    }
    return [x, y];
  }

  inBounds(x, y, margin = 0) {
    const b = this.bounds;
    return x > b.x - margin && x < b.x + b.w + margin && y > b.y - margin && y < b.y + b.h + margin;
  }
}
