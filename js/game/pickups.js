// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/pickups.js
// XP gems, hearts, fragments. Magnet attraction toward the player.
// ---------------------------------------------------------------------------
import { Pool, dist2, TAU, rand } from '../core/util.js';
import { SPR, drawSprite } from '../core/pixel.js';

const make = () => ({ x: 0, y: 0, vx: 0, vy: 0, kind: 'xp', value: 1, t: 0, dead: false });

export class Pickups {
  constructor() {
    this.pool = new Pool(make, () => {}, 256);
  }
  clear() { this.pool.clear(); }

  drop(x, y, kind, value = 1) {
    if (this.pool.count > 300) return;
    const p = this.pool.spawn();
    p.x = x; p.y = y;
    const a = rand(0, TAU);
    p.vx = Math.cos(a) * 40; p.vy = Math.sin(a) * 40 - 20;
    p.kind = kind; p.value = value; p.t = 0;
  }

  update(dt, G) {
    const P = G.player;
    const magnet = G.runStats.magnet;
    for (const p of this.pool.live) {
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 1 - 3 * dt; p.vy *= 1 - 3 * dt;
      const d2 = dist2(p.x, p.y, P.x, P.y);
      if (d2 < magnet * magnet && P.alive) {
        const d = Math.sqrt(d2) || 1;
        const pull = 260 * (1 - d / magnet) + 60;
        p.x += ((P.x - p.x) / d) * pull * dt;
        p.y += ((P.y - p.y) / d) * pull * dt;
      }
      if (d2 < (P.r + 5) ** 2 && P.alive) {
        p.dead = true;
        G.collect(p);
      }
      if (p.t > 20) p.dead = true;
    }
    this.pool.sweep();
  }

  draw(ctx) {
    for (const p of this.pool.live) {
      const blink = p.t > 15 && Math.floor(p.t * 6) % 2 === 0;
      if (blink) continue;
      const s = p.kind === 'xp' ? SPR.gem : p.kind === 'heart' ? SPR.heart : SPR.fragment;
      if (s) drawSprite(ctx, s, p.x, p.y + Math.round(Math.sin(p.t * 5) * 1));
    }
  }
}
