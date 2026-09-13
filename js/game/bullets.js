// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/bullets.js
// Pooled bullet systems (player & enemy) + hazard containers (lasers with
// telegraphs, dangerous zones). Built to keep thousands of bullets cheap.
// ---------------------------------------------------------------------------
import { Pool, TAU } from '../core/util.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { VIEW_W, VIEW_H } from './arena.js';

const makeBullet = () => ({
  x: 0, y: 0, vx: 0, vy: 0, r: 3, dmg: 1, life: 4,
  sprite: 'b_enemy', pierce: 0, bounce: 0, homing: 0, friendly: false,
  hitIds: null, wobble: 0, dead: false, trail: null,
});

export class BulletSystem {
  constructor() {
    this.player = new Pool(makeBullet, (b) => { b.hitIds = null; }, 256);
    this.enemy = new Pool(makeBullet, (b) => { b.hitIds = null; }, 1500);
  }

  clear() { this.player.clear(); this.enemy.clear(); }

  spawnPlayer(o) {
    const b = this.player.spawn();
    Object.assign(b, { pierce: 0, bounce: 0, homing: 0, life: 3, r: 3, sprite: 'b_player', trail: null, wobble: 0, dead: false }, o, { friendly: true });
    if (b.pierce > 0) b.hitIds = new Set();
    return b;
  }

  spawnEnemy(o) {
    if (this.enemy.count > 1600) return null; // hard cap for perf safety
    const b = this.enemy.spawn();
    Object.assign(b, { pierce: 0, bounce: 0, homing: 0, life: 9, r: 3, sprite: 'b_enemy', trail: null, wobble: 0, dead: false }, o, { friendly: false });
    return b;
  }

  update(dt, arena, targetsForHoming) {
    const bnd = arena.bounds;
    const upd = (b) => {
      b.life -= dt;
      if (b.life <= 0) { b.dead = true; return; }
      if (b.homing && targetsForHoming && targetsForHoming.length) {
        let best = null, bd = 1e9;
        for (const t of targetsForHoming) {
          const d = (t.x - b.x) ** 2 + (t.y - b.y) ** 2;
          if (d < bd) { bd = d; best = t; }
        }
        if (best) {
          const cur = Math.atan2(b.vy, b.vx);
          const want = Math.atan2(best.y - b.y, best.x - b.x);
          let d = want - cur;
          while (d > Math.PI) d -= TAU;
          while (d < -Math.PI) d += TAU;
          const turn = Math.min(Math.abs(d), b.homing * dt) * Math.sign(d);
          const sp = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(cur + turn) * sp;
          b.vy = Math.sin(cur + turn) * sp;
        }
      }
      if (b.wobble) {
        const sp = Math.hypot(b.vx, b.vy);
        const a = Math.atan2(b.vy, b.vx) + Math.sin(b.life * 10) * b.wobble * dt;
        b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.bounce > 0) {
        let bounced = false;
        if (b.x < bnd.x + b.r) { b.x = bnd.x + b.r; b.vx = Math.abs(b.vx); bounced = true; }
        if (b.x > bnd.x + bnd.w - b.r) { b.x = bnd.x + bnd.w - b.r; b.vx = -Math.abs(b.vx); bounced = true; }
        if (b.y < bnd.y + b.r) { b.y = bnd.y + b.r; b.vy = Math.abs(b.vy); bounced = true; }
        if (b.y > bnd.y + bnd.h - b.r) { b.y = bnd.y + bnd.h - b.r; b.vy = -Math.abs(b.vy); bounced = true; }
        if (bounced) b.bounce--;
      } else if (!arena.inBounds(b.x, b.y, 8)) {
        b.dead = true;
      }
    };
    for (const b of this.player.live) upd(b);
    for (const b of this.enemy.live) upd(b);
    this.player.sweep();
    this.enemy.sweep();
  }

  draw(ctx) {
    for (const b of this.enemy.live) {
      const s = SPR[b.sprite];
      if (s) drawSprite(ctx, s, b.x, b.y);
      else { ctx.fillStyle = '#ff5d8f'; ctx.fillRect(b.x - 2, b.y - 2, 4, 4); }
    }
    for (const b of this.player.live) {
      const s = SPR[b.sprite];
      if (s) drawSprite(ctx, s, b.x, b.y);
    }
  }
}

// ---------------------------------------------------------------------------
// Hazards: telegraphed lasers + dangerous zones
// ---------------------------------------------------------------------------
export class Hazards {
  constructor() { this.lasers = []; this.zones = []; }
  clear() { this.lasers.length = 0; this.zones.length = 0; }

  laser(x1, y1, x2, y2, { telegraph = 0.8, duration = 0.5, width = 6, color = '#ff3b3b', damage = 18 } = {}) {
    this.lasers.push({ x1, y1, x2, y2, t: 0, telegraph, duration, width, color, damage, fired: false });
  }

  zone(x, y, r, { telegraph = 0.9, duration = 1.2, color = '#ff5df2', damage = 12, grow = 0 } = {}) {
    this.zones.push({ x, y, r, t: 0, telegraph, duration, color, damage, grow, hitPlayer: false });
  }

  update(dt) {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.t += dt;
      if (l.t > l.telegraph + l.duration) this.lasers.splice(i, 1);
    }
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.t += dt;
      if (z.t > z.telegraph + z.duration) this.zones.splice(i, 1);
    }
  }

  /** player damage sources; returns list of hits taken this frame */
  playerHits(px, py, pr) {
    const hits = [];
    for (const l of this.lasers) {
      if (l.t < l.telegraph) continue;
      const d = distToSeg(px, py, l.x1, l.y1, l.x2, l.y2);
      if (d < l.width / 2 + pr) hits.push(l.damage);
    }
    for (const z of this.zones) {
      if (z.t < z.telegraph) continue;
      const rr = z.r + (z.grow ? z.grow * (z.t - z.telegraph) : 0);
      if ((px - z.x) ** 2 + (py - z.y) ** 2 < (rr + pr * 0.5) ** 2 && !z.hitPlayer) {
        z.hitPlayer = true;
        hits.push(z.damage);
      }
    }
    return hits;
  }

  draw(ctx) {
    // zones
    for (const z of this.zones) {
      const tel = z.t < z.telegraph;
      const pulse = tel ? (Math.sin(z.t * 20) * 0.5 + 0.5) : 1;
      ctx.globalAlpha = tel ? 0.25 + pulse * 0.2 : 0.4;
      ctx.fillStyle = z.color;
      ctx.beginPath();
      const rr = tel ? z.r : z.r + (z.grow ? z.grow * (z.t - z.telegraph) : 0);
      ctx.arc(z.x, z.y, rr, 0, TAU);
      ctx.fill();
      if (tel) {
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // lasers
    for (const l of this.lasers) {
      if (l.t < l.telegraph) {
        const a = 0.3 + (Math.sin(l.t * 24) * 0.5 + 0.5) * 0.5;
        ctx.globalAlpha = a;
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      } else {
        const lifeT = (l.t - l.telegraph) / l.duration;
        const w = l.width * (1 - lifeT * 0.4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, w * 0.4);
        ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = l.color;
        ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
}

export function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}
