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
  hitIds: null, wobble: 0, dead: false, trail: null, fx: null, age: 0,
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
      b.age = (b.age || 0) + dt;
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
      const a = Math.atan2(b.vy, b.vx);
      if (b.fx === 'kree') {
        ctx.globalAlpha = 0.3; ctx.fillStyle = '#4dd8ff';
        ctx.beginPath(); ctx.arc(b.x - Math.cos(a) * 7, b.y - Math.sin(a) * 7, 4, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.15;
        ctx.beginPath(); ctx.arc(b.x - Math.cos(a) * 13, b.y - Math.sin(a) * 13, 3, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (b.fx === 'hydra') {
        ctx.strokeStyle = '#c8c8d855';
        ctx.beginPath(); ctx.moveTo(b.x - Math.cos(a) * 7, b.y - Math.sin(a) * 7); ctx.lineTo(b.x, b.y); ctx.stroke();
      } else if (b.fx === 'frost') {
        const tw = Math.floor(b.age * 12) % 2;
        ctx.fillStyle = '#bfeaff';
        ctx.fillRect(b.x - Math.cos(a) * 9 + (tw ? 2 : -2), b.y - Math.sin(a) * 9, 1, 1);
        ctx.fillRect(b.x - Math.cos(a) * 13 - (tw ? 2 : -2), b.y - Math.sin(a) * 13, 1, 1);
      } else if (b.fx === 'destroyer') {
        ctx.globalAlpha = 0.35 + Math.sin(b.age * 30) * 0.1;
        ctx.fillStyle = '#ffd94a';
        ctx.beginPath(); ctx.arc(b.x, b.y, 9, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (b.fx === 'senti') {
        ctx.strokeStyle = '#b06bff66';
        ctx.beginPath(); ctx.arc(b.x, b.y, 8 + Math.sin(b.age * 10) * 2, 0, TAU); ctx.stroke();
      } else if (b.fx === 'myst') {
        ctx.globalAlpha = 0.4; ctx.fillStyle = '#4dff88';
        for (let i = 0; i < 3; i++) {
          const ra = b.age * 5 + i * 2.1;
          ctx.fillRect(b.x + Math.cos(ra) * 7 - 1, b.y + Math.sin(ra) * 7 - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
      } else if (b.fx === 'skrull') {
        ctx.fillStyle = '#b06bff55';
        ctx.fillRect(b.x - Math.cos(a) * 8 - 1, b.y - Math.sin(a) * 8 - 1, 2, 2);
      } else if (b.fx === 'drone' || b.fx === 'chit' || b.fx === 'aim' || b.fx === 'sak') {
        ctx.globalAlpha = 0.25; ctx.fillStyle = b.fx === 'drone' ? '#ff4d4d' : b.fx === 'chit' ? '#7fd4ff' : b.fx === 'aim' ? '#ffd94a' : '#ff9d4d';
        ctx.fillRect(b.x - Math.cos(a) * 6 - 1, b.y - Math.sin(a) * 6 - 1, 2, 2);
        ctx.globalAlpha = 1;
      }
      const s = SPR[b.sprite];
      if (s) drawSprite(ctx, s, b.x, b.y, b.fx === 'hydra' ? { rot: a } : undefined);
      else { ctx.fillStyle = '#ff5d8f'; ctx.fillRect(b.x - 2, b.y - 2, 4, 4); }
    }
    for (const b of this.player.live) {
      const s = SPR[b.sprite];
      const a = Math.atan2(b.vy, b.vx);
      const sc = b.scale || 1;
      if (!s) continue;
      if (b.fx === 'arachnid') {
        // layered web dart: spinning open web + twin silk threads + node glints
        if (SPR.web_spider) { ctx.globalAlpha = 0.55; drawSprite(ctx, SPR.web_spider, b.x, b.y, { rot: b.age * 9, scale: sc }); ctx.globalAlpha = 1; }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x - Math.cos(a) * 9 - 1, b.y - Math.sin(a) * 9 - 1, 1, 1);
        ctx.fillRect(b.x - Math.cos(a) * 5, b.y - Math.sin(a) * 5, 1, 1);
        ctx.strokeStyle = '#ffffff99';
        ctx.beginPath();
        ctx.moveTo(b.x - Math.cos(a) * 14 + Math.sin(a) * 2, b.y - Math.sin(a) * 14 - Math.cos(a) * 2);
        ctx.lineTo(b.x, b.y);
        ctx.moveTo(b.x - Math.cos(a) * 14 - Math.sin(a) * 2, b.y - Math.sin(a) * 14 + Math.cos(a) * 2);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        drawSprite(ctx, s, b.x, b.y, { rot: a, scale: sc });
      } else if (b.fx === 'stormgod') {
        // zigzag zap tail
        ctx.strokeStyle = '#9feaffaa';
        ctx.beginPath();
        let px = b.x, py = b.y;
        ctx.moveTo(px, py);
        for (let i = 1; i <= 3; i++) {
          const d = i * 5;
          const j = ((i + Math.floor(b.age * 20)) % 2 ? 2 : -2);
          px = b.x - Math.cos(a) * d + Math.sin(a) * j;
          py = b.y - Math.sin(a) * d - Math.cos(a) * j;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
        drawSprite(ctx, s, b.x, b.y, { rot: a, scale: sc });
      } else if (b.fx === 'ironknight') {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#4dd8ff';
        ctx.beginPath(); ctx.arc(b.x, b.y, 6 + Math.sin(b.age * 30) * 1, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        drawSprite(ctx, s, b.x, b.y, { scale: sc });
      } else if (b.fx === 'merc') {
        ctx.strokeStyle = '#ffd94a66';
        ctx.beginPath();
        ctx.moveTo(b.x - Math.cos(a) * 12, b.y - Math.sin(a) * 12);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        drawSprite(ctx, s, b.x, b.y, { rot: b.age * 25, scale: sc });
      } else if (b.fx === 'claws') {
        drawSprite(ctx, s, b.x, b.y, { rot: a, alpha: Math.min(1, b.life * 4), scale: sc });
      } else if (b.fx === 'mystic') {
        const ra = b.age * 6;
        ctx.fillStyle = '#ffd94a';
        ctx.fillRect(b.x + Math.cos(ra) * 7 - 1, b.y + Math.sin(ra) * 7 - 1, 2, 2);
        drawSprite(ctx, s, b.x, b.y, { rot: ra * 0.5, scale: sc });
      } else {
        drawSprite(ctx, s, b.x, b.y, { scale: sc });
      }
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
