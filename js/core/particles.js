// ---------------------------------------------------------------------------
// MARVEL NEXUS — core/particles.js
// Pooled pixel particles + floating combat text + screen flash / shake.
// ---------------------------------------------------------------------------
import { Pool, rand, TAU } from './util.js';
import { drawText } from './font.js';

export class Particles {
  constructor() {
    this.pool = new Pool(
      () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 1, color: '#fff', grav: 0, drag: 0, shrink: false }),
      (o) => { o.life = 0; },
      512,
    );
    this.texts = [];
    this.flash = 0;
    this.flashColor = '#ffffff';
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  burst(x, y, color, n = 8, speed = 90, life = 0.4, size = 1, grav = 0) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const s = rand(speed * 0.3, speed);
      const p = this.pool.spawn();
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
      p.life = p.maxLife = rand(life * 0.5, life);
      p.size = size; p.color = color; p.grav = grav; p.drag = 4;
      p.shrink = true;
    }
  }

  spark(x, y, color, n = 4) { this.burst(x, y, color, n, 60, 0.25, 1); }

  explosion(x, y, colors = ['#ffd94a', '#ff8c3b', '#ff4d4d'], n = 22, speed = 140) {
    colors.forEach((c, i) => this.burst(x, y, c, Math.ceil(n / colors.length), speed * (1 - i * 0.2), 0.5, i === 0 ? 2 : 1, 60));
    this.addShake(4);
  }

  ring(x, y, color, n = 16, speed = 120) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const p = this.pool.spawn();
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * speed; p.vy = Math.sin(a) * speed;
      p.life = p.maxLife = 0.35;
      p.size = 1; p.color = color; p.drag = 3;
    }
  }

  text(x, y, str, color = '#ffffff', scale = 1) {
    if (this.texts.length > 60) this.texts.shift();
    this.texts.push({ x: x + rand(-4, 4), y, str, color, scale, life: 0.8 });
  }

  addFlash(color = '#ffffff', amount = 0.4) {
    this.flash = Math.min(1, this.flash + amount);
    this.flashColor = color;
  }

  addShake(amount) {
    this.shake = Math.min(10, this.shake + amount);
  }

  update(dt, enabled = true) {
    if (!enabled) this.shake = 0;
    const arr = this.pool.live;
    for (const p of arr) {
      p.life -= dt;
      if (p.life <= 0) { p.dead = true; continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.drag) { const d = Math.max(0, 1 - p.drag * dt); p.vx *= d; p.vy *= d; }
      if (p.grav) p.vy += p.grav * dt;
    }
    this.pool.sweep();
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y -= 26 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
    this.flash = Math.max(0, this.flash - dt * 2.2);
    this.shake = Math.max(0, this.shake - dt * 14);
    this.shakeX = this.shake ? Math.round(rand(-this.shake, this.shake) * 0.6) : 0;
    this.shakeY = this.shake ? Math.round(rand(-this.shake, this.shake) * 0.6) : 0;
  }

  draw(ctx) {
    for (const p of this.pool.live) {
      const a = p.life / p.maxLife;
      const s = p.shrink ? Math.max(1, Math.round(p.size * a)) : p.size;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life * 2.4);
      drawText(ctx, t.str, t.x, t.y, { scale: t.scale, color: t.color, align: 'center', shadow: true });
    }
    ctx.globalAlpha = 1;
  }

  drawFlash(ctx, W, H) {
    if (this.flash > 0) {
      ctx.globalAlpha = this.flash * 0.5;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  clear() { this.pool.clear(); this.texts.length = 0; this.flash = 0; this.shake = 0; }
}
