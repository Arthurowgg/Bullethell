// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/patterns.js
// One-shot bullet-hell emitters. `api.spawn(opts)` creates an enemy bullet.
// All patterns keep readable safe gaps: counts/speeds are tuned, not random.
// ---------------------------------------------------------------------------
import { TAU, rand, pick } from '../core/util.js';

export const Patterns = {
  /** even ring with optional rotation offset & gap facing the player */
  ring(x, y, n, speed, api, o = {}) {
    const off = o.offset || 0;
    const gap = o.gapAngle != null ? o.gapAngle : null;
    const gapSize = o.gapSize || 0.5;
    for (let i = 0; i < n; i++) {
      const a = off + (i / n) * TAU;
      if (gap != null) {
        let d = a - gap;
        while (d > Math.PI) d -= TAU;
        while (d < -Math.PI) d += TAU;
        if (Math.abs(d) < gapSize) continue;
      }
      api.spawn({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, ...o.b });
    }
  },

  /** fan of n bullets centered on angle */
  fan(x, y, angle, spread, n, speed, api, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = angle + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread);
      api.spawn({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, ...o.b });
    }
  },

  aimed(x, y, tx, ty, n, spread, speed, api, o = {}) {
    const base = Math.atan2(ty - y, tx - x);
    this.fan(x, y, base, spread, n, speed, api, o);
  },

  /** 8-directional geometric burst */
  cross8(x, y, speed, api, o = {}) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + (o.offset || 0);
      api.spawn({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, ...o.b });
    }
  },

  /** double ring offset (diamond) */
  diamond(x, y, n, speed, api, o = {}) {
    this.ring(x, y, n, speed, api, o);
    this.ring(x, y, n, speed * 0.8, api, { ...o, offset: (o.offset || 0) + Math.PI / n });
  },

  /** rain from the top toward the player column */
  rain(arena, tx, count, speed, api, o = {}) {
    const b = arena.bounds;
    for (let i = 0; i < count; i++) {
      const x = Math.max(b.x + 8, Math.min(b.x + b.w - 8, tx + rand(-70, 70)));
      api.spawn({ x, y: b.y + 4, vx: rand(-12, 12), vy: speed, ...o.b });
    }
  },

  /** horizontal wave sweeping down */
  wave(arena, y, speed, api, o = {}) {
    const b = arena.bounds;
    for (let x = b.x + 10; x < b.x + b.w; x += 26) {
      api.spawn({ x, y, vx: 0, vy: speed, wobble: o.wobble || 0, ...o.b });
    }
  },

  homing(x, y, speed, api, o = {}) {
    const a = rand(0, TAU);
    api.spawn({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, homing: o.turn || 2.2, ...o.b });
  },
};

/** Continuous spiral emitter with lifecycle. */
export class Spiral {
  constructor(x, y, { arms = 2, step = 0.35, speed = 70, rot = 2.4, b = {} } = {}) {
    this.x = x; this.y = y;
    this.arms = arms; this.step = step; this.speed = speed; this.rot = rot; this.b = b;
    this.a = rand(0, TAU); this.t = 0; this.acc = 0;
  }
  moveTo(x, y) { this.x = x; this.y = y; }
  update(dt, api) {
    this.t += dt;
    this.acc += dt;
    this.a += this.rot * dt;
    while (this.acc > this.step) {
      this.acc -= this.step;
      for (let i = 0; i < this.arms; i++) {
        const a = this.a + (i / this.arms) * TAU;
        api.spawn({ x: this.x, y: this.y, vx: Math.cos(a) * this.speed, vy: Math.sin(a) * this.speed, ...this.b });
      }
    }
  }
}
