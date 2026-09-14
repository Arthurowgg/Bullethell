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
    this.bg = this._renderBg();
  }

  // push a circle out of every obstacle rect (hitbox do mapa)
  resolveCircle(x, y, r) {
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
        y = o.y - r; // degenerate: push up
      }
    }
    return [x, y];
  }

  _makeObstacles() {
    const obs = [];
    const n = this.rng.int(2, 4);
    for (let i = 0; i < n; i++) {
      const w = 16, h = 16;
      const x = this.rng.range(60, VIEW_W - 76);
      const y = this.rng.range(56, VIEW_H - 72);
      // keep center clear for the player spawn
      if (Math.hypot(x - VIEW_W / 2, y - VIEW_H / 2) < 90) continue;
      obs.push({ x, y, w, h });
    }
    return obs;
  }

  setTheme(themeId) {
    this.themeId = themeId;
    this.theme = THEMES[themeId] || this.theme;
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
      // visible hitbox props (rocks/cover) drawn over the art
      for (const o of this.obstacles) {
        g.fillStyle = '#00000066';
        g.fillRect(o.x + 2, o.y + o.h - 2, o.w, 4);
        const wall = this.theme.wallTop || '#6b7285';
        g.fillStyle = this.theme.wall || '#343a48';
        g.fillRect(o.x, o.y + 3, o.w, o.h - 3);
        g.fillStyle = wall;
        g.fillRect(o.x, o.y, o.w, 4);
        g.fillStyle = '#00000033';
        g.fillRect(o.x + 2, o.y + 6, o.w - 4, o.h - 10);
      }
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
