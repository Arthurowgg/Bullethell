// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/boss.js
// Boss state machine: phases from data/bosses.js, attacks implemented here.
// Attacks are timed states; beams & gravity wells are boss-owned hazards.
// ---------------------------------------------------------------------------
import { TAU, rand, angleTo, dist, dist2, clamp } from '../core/util.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { Patterns, Spiral } from './patterns.js';

export class Boss {
  constructor(def, hpScale = 1) {
    this.def = def;
    this.x = 320; this.y = 90;
    this.r = def.radius;
    this.hp = def.hp * hpScale;
    this.maxHp = this.hp;
    this.phase = 0;
    this.atk = null;         // current attack state {name,t,sub}
    this.thinkT = 1.4;       // idle gap between attacks
    this.introT = 2.2;
    this.invuln = 0;
    this.flash = 0;
    this.frozen = 0; this.rooted = 0; this.burn = 0; this.burnT = 0;
    this.beam = null;        // {a, rot, t, dur, width, dmg}
    this.grav = null;        // {x,y,t,dur,pull}
    this.spirals = [];
    this.t = 0;
    this.dead = false;
    this.walk = 0;
  }

  hpFrac() { return this.hp / this.maxHp; }
  get SH() { return this.def.shot; }

  phaseFor(frac) {
    const ph = this.def.phases;
    for (let i = 0; i < ph.length; i++) if (frac > ph[i].until) return i;
    return ph.length - 1;
  }

  update(dt, G) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.frozen = Math.max(0, this.frozen - dt);
    const P = G.player;

    if (this.introT > 0) { this.introT -= dt; return; }

    // phase transitions
    const want = this.phaseFor(this.hpFrac());
    if (want > this.phase) {
      this.phase = want;
      this.invuln = 1.2;
      this.atk = null;
      this.thinkT = 1.4;
      // clear bullets for fairness + ring flash
      for (const b of G.bullets.enemy.live) { b.dead = true; G.particles.spark(b.x, b.y, '#ffffff', 1); }
      Patterns.ring(this.x, this.y, 24, 130, { spawn: (o) => G.bullets.spawnEnemy(o) }, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.7 });
      G.particles.addFlash('#ffffff', 0.5);
      G.particles.addShake(7);
      G.audio.sfx('phase');
    }

    // movement (hover toward a point above the player, unless rooted/frozen)
    if (this.rooted <= 0 && this.frozen <= 0 && !this.atkStill()) {
      const tx = clamp(P.x, 80, 560);
      const ty = clamp(P.y - 110, 50, 250);
      const d = dist(this.x, this.y, tx, ty);
      if (d > 6) {
        this.x += ((tx - this.x) / d) * this.def.speed * dt;
        this.y += ((ty - this.y) / d) * this.def.speed * dt;
      }
      this.walk += dt * 6;
    }
    if (this.rooted > 0) this.rooted -= dt;
    [this.x, this.y] = G.arena.clamp(this.x, this.y, this.r);

    // burn
    if (this.burnT > 0) { this.burnT -= dt; this.hp -= this.burn * dt; }

    // beam update
    if (this.beam) {
      const b = this.beam;
      b.t += dt;
      if (b.t > b.dur) this.beam = null;
      else if (b.t > 0.7) {
        b.a += b.rot * dt;
        // damage player if aligned
        const pa = angleTo(this.x, this.y, P.x, P.y);
        const pd = dist(this.x, this.y, P.x, P.y);
        let da = pa - b.a;
        while (da > Math.PI) da -= TAU;
        while (da < -Math.PI) da += TAU;
        if (Math.abs(da) < 0.12 && pd < b.len) P.hurt(G, b.dmg * dt * 3);
      }
    }

    // gravity well
    if (this.grav) {
      const g = this.grav;
      g.t += dt;
      if (g.t > g.dur) this.grav = null;
      else {
        const d = dist(g.x, g.y, P.x, P.y);
        if (d < 160 && d > 4) {
          const pull = g.pull * (1 - d / 160);
          P.x += ((g.x - P.x) / d) * pull * dt;
          P.y += ((g.y - P.y) / d) * pull * dt;
        }
      }
    }

    // spirals
    for (let i = this.spirals.length - 1; i >= 0; i--) {
      const s = this.spirals[i];
      s.life -= dt;
      s.moveTo(this.x + (s.ox || 0), this.y + (s.oy || 0));
      s.update(dt, { spawn: (o) => G.bullets.spawnEnemy(o) });
      if (s.life <= 0) this.spirals.splice(i, 1);
    }

    // attack flow
    if (this.atk) {
      const done = this.stepAttack(dt, G);
      if (done) { this.atk = null; this.thinkT = rand(0.7, 1.2); }
    } else if (this.invuln <= 0) {
      this.thinkT -= dt;
      if (this.thinkT <= 0) this.startAttack(G);
    }

    // contact
    if (P.alive && dist2(this.x, this.y, P.x, P.y) < (this.r + P.r) ** 2) {
      P.hurt(G, this.def.contact);
    }
  }

  atkStill() { return this.atk && ['spiralArms', 'mirrorSpiral', 'voidSpiral', 'gauntletSpiral', 'stoneBeam', 'laserSweep', 'tentacleSweep', 'coreMeltdown', 'deathBloom', 'nexusCollapse', 'devour', 'grandIllusion'].includes(this.atk.name); }

  startAttack(G) {
    const set = this.def.phases[this.phase].attacks;
    const name = set[(Math.random() * set.length) | 0];
    this.atk = { name, t: 0, sub: 0, acc: 0 };
    G.audio.sfx('warn');
    // pre-states
    switch (name) {
      case 'droneWave': G.summon('drone', 4); break;
      case 'necroWave': G.summon('spectre', 3); break;
      case 'spectreCall': G.summon('spectre', 2); break;
      case 'blink': {
        if (this.def.id === 'kang' && SPR.fx_tclock) (this.vfx = this.vfx || []).push({ spr: SPR.fx_tclock, x: this.x, y: this.y, t: 0 });
        G.particles.burst(this.x, this.y, '#4dff88', 16, 120, 0.5);
        this.x = rand(90, 550); this.y = rand(60, 160);
        G.particles.burst(this.x, this.y, '#4dff88', 16, 120, 0.5);
        if (this.def.id === 'kang' && SPR.fx_tclock) (this.vfx = this.vfx || []).push({ spr: SPR.fx_tclock, x: this.x, y: this.y, t: 0 });
        G.audio.sfx('port');
        break;
      }
      case 'gravityWell': this.grav = { x: G.player.x, y: G.player.y, t: 0, dur: 2.2, pull: 70 }; G.audio.sfx('warn'); break;
      case 'devour': this.grav = { x: this.x, y: this.y, t: 0, dur: 2.6, pull: 90 }; break;
      case 'laserSweep': this.beam = { a: angleTo(this.x, this.y, G.player.x, G.player.y) - 1.1, rot: 1.1, t: 0, dur: 2.6, len: 500, width: 6, dmg: 16 }; G.audio.sfx('laser'); break;
      case 'stoneBeam': this.beam = { a: angleTo(this.x, this.y, G.player.x, G.player.y) - 0.9, rot: 0.9, t: 0, dur: 2.2, len: 520, width: 8, dmg: 20 }; G.audio.sfx('laser'); break;
      case 'tentacleSweep': this.beam = { a: 0, rot: 1.6, t: 0, dur: 2.4, len: 520, width: 7, dmg: 18 }; G.audio.sfx('laser'); break;
      case 'spiralArms': this.spirals.push(new Spiral(this.x, this.y, { arms: 2, step: 0.1, speed: 85, rot: 2.8, b: { sprite: this.SH } }), new Spiral(this.x, this.y, { arms: 2, step: 0.1, speed: 70, rot: -2.2, b: { sprite: this.SH } })); this.spirals[0].life = 2.2; this.spirals[1].life = 2.2; break;
      case 'mirrorSpiral': { const s = new Spiral(this.x, this.y, { arms: 3, step: 0.11, speed: 80, rot: 3, b: { sprite: this.SH } }); s.life = 2.4; this.spirals.push(s); break; }
      case 'voidSpiral': { const s = new Spiral(this.x, this.y, { arms: 3, step: 0.09, speed: 90, rot: 3.4, b: { sprite: this.SH } }); s.life = 2.6; this.spirals.push(s); break; }
      case 'gauntletSpiral': { const s = new Spiral(this.x, this.y, { arms: 6, step: 0.14, speed: 75, rot: 2.2, b: { sprite: this.SH } }); s.life = 2.6; this.spirals.push(s); if (this.def.id === 'kang' && SPR.fx_gauntlet) (this.vfx = this.vfx || []).push({ spr: SPR.fx_gauntlet, x: this.x, y: this.y, t: 0 }); break; }
    }
  }

  stepAttack(dt, G) {
    const a = this.atk;
    const P = G.player;
    a.t += dt;
    const api = { spawn: (o) => G.bullets.spawnEnemy(o) };
    switch (a.name) {
      case 'ringBurst':
        if (a.sub === 0 && a.t > 0.4) { Patterns.ring(this.x, this.y, 18, 100, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.42 }); a.sub = 1; a.t = 0; G.audio.sfx('boom'); }
        else if (a.sub === 1 && a.t > 0.5) { Patterns.ring(this.x, this.y, 18, 120, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.42, offset: Math.PI / 18 }); return true; }
        return false;
      case 'powerRing':
        if (a.t > 0.4) { Patterns.ring(this.x, this.y, 24, 110, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.5 }); return true; }
        return false;
      case 'geoCross':
        if (a.sub < 3 && a.t > 0.35) { Patterns.cross8(this.x, this.y, 110 + a.sub * 15, api, { offset: a.sub * 0.4, b: { sprite: this.SH } }); a.sub++; a.t = 0; }
        return a.sub >= 3;
      case 'droneWave': return a.t > 0.4;
      case 'spiralArms': return a.t > 2.3;
      case 'mirrorSpiral':
      case 'voidSpiral':
      case 'gauntletSpiral': return a.t > 2.7;
      case 'laserSweep':
      case 'stoneBeam':
      case 'tentacleSweep': return a.t > 2.7;
      case 'coreMeltdown':
        if (a.sub === 0 && a.t > 0.3) { G.hazards.zone(this.x, this.y, 60, { telegraph: 0.7, duration: 1.2, color: '#ff3b3b', damage: 22 }); a.sub = 1; a.t = 0; }
        else if (a.sub === 1 && a.t > 0.6) { Patterns.ring(this.x, this.y, 20, 120, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.6 }); a.sub = 2; a.t = 0; }
        else if (a.sub === 2 && a.t > 0.6) { Patterns.ring(this.x, this.y, 20, 95, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.6, offset: 0.16 }); return true; }
        return false;
      case 'illusionFan':
        if (a.sub < 3 && a.t > 0.4) { Patterns.aimed(this.x, this.y, P.x, P.y, 7, 0.9, 130, api, { b: { sprite: this.SH, fade: 0.9 + a.sub * 0.3 } }); a.sub++; a.t = 0; }
        return a.sub >= 3;
      case 'daggerRain':
        if (a.sub < 4 && a.t > 0.3) { Patterns.rain(G.arena, P.x, 5, 150, api, { b: { sprite: this.SH } }); a.sub++; a.t = 0; }
        return a.sub >= 4;
      case 'weaponRain':
        if (a.sub < 5 && a.t > 0.32) {
          Patterns.rain(G.arena, P.x, 4, 140, api, { b: { sprite: this.SH } });
          if (a.sub === 2) G.hazards.zone(P.x, P.y, 34, { telegraph: 0.8, duration: 1, color: '#d8b64c', damage: 14 });
          a.sub++; a.t = 0;
        }
        return a.sub >= 5;
      case 'blink':
        if (a.t > 0.3) { Patterns.fan(this.x, this.y, angleTo(this.x, this.y, P.x, P.y), 1.2, 9, 140, api, { b: { sprite: this.SH } }); return true; }
        return false;
      case 'cloneRing':
        if (a.sub < 4 && a.t > 0.3) {
          const cx = rand(80, 560), cy = rand(60, 200);
          G.particles.burst(cx, cy, '#4dff88', 8, 60, 0.4);
          Patterns.ring(cx, cy, 10, 95, api, { gapAngle: angleTo(cx, cy, P.x, P.y), gapSize: 0.6, b: { sprite: this.SH } });
          a.sub++; a.t = 0;
        }
        return a.sub >= 4;
      case 'grandIllusion':
        if (a.sub === 0 && a.t > 0.4) { Patterns.ring(this.x, this.y, 16, 90, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.5, b: { sprite: this.SH } }); a.sub = 1; a.t = 0; }
        else if (a.sub === 1 && a.t > 0.5) { Patterns.rain(G.arena, P.x, 6, 150, api, { b: { sprite: this.SH } }); a.sub = 2; a.t = 0; }
        else if (a.sub === 2 && a.t > 0.5) { Patterns.ring(this.x, this.y, 16, 110, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.5, offset: 0.2, b: { sprite: this.SH } }); return true; }
        return false;
      case 'bladeFan':
        if (a.sub < 3 && a.t > 0.45) { Patterns.aimed(this.x, this.y, P.x, P.y, 5, 0.8, 150, api, { b: { sprite: this.SH } }); a.sub++; a.t = 0; }
        return a.sub >= 3;
      case 'bladeSpiral': { if (!a.sp) { a.sp = new Spiral(this.x, this.y, { arms: 2, step: 0.08, speed: 95, rot: 4, b: { sprite: this.SH } }); a.sp.life = 2; } a.sp.moveTo(this.x, this.y); a.sp.update(dt, api); return a.t > 2.1; }
      case 'necroWave':
      case 'spectreCall': return a.t > 0.5;
      case 'deathBloom':
        if (a.sub === 0 && a.t > 0.4) { Patterns.ring(this.x, this.y, 26, 90, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.5, b: { sprite: this.SH } }); a.sub = 1; a.t = 0; }
        else if (a.sub === 1 && a.t > 0.5) { Patterns.ring(this.x, this.y, 26, 120, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.5, offset: 0.12, b: { sprite: this.SH } }); G.hazards.zone(P.x, P.y, 40, { telegraph: 0.7, duration: 1, color: '#0aa86a', damage: 16 }); return true; }
        return false;
      case 'gravityWell': return a.t > 2.3;
      case 'devour':
        if (a.sub === 0 && a.t > 0.8) { const s = new Spiral(this.x, this.y, { arms: 4, step: 0.1, speed: 70, rot: -3, b: { sprite: this.SH } }); s.life = 1.6; this.spirals.push(s); a.sub = 1; }
        return a.t > 2.7;
      case 'cosmicWave':
        if (a.sub < 3 && a.t > 0.5) { Patterns.wave(G.arena, G.arena.bounds.y + 8 + a.sub * 4, 90, api, { b: { sprite: this.SH, wobble: 1.5 } }); a.sub++; a.t = 0; }
        return a.sub >= 3;
      case 'realityWave':
        if (a.sub < 2 && a.t > 0.6) { Patterns.wave(G.arena, G.arena.bounds.y + 8, 100, api, { b: { sprite: this.SH, wobble: 2 } }); Patterns.wave(G.arena, G.arena.bounds.y + 40, 80, api, { b: { sprite: this.SH } }); a.sub++; a.t = 0; }
        return a.sub >= 2;
      case 'meteorRain':
        if (a.sub < 5 && a.t > 0.28) {
          const mx = rand(40, 600), my = rand(40, 320);
          G.hazards.zone(mx, my, 26, { telegraph: 0.75, duration: 0.4, color: '#ff8c3b', damage: 16 });
          a.sub++; a.t = 0;
          G.audio.sfx('warn');
        }
        return a.sub >= 5;
      case 'shockwave':
        if (a.sub < 3 && a.t > 0.4) { Patterns.ring(this.x, this.y, 20, 80 + a.sub * 35, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.55, b: { sprite: this.SH } }); a.sub++; a.t = 0; G.audio.sfx('boom'); }
        return a.sub >= 3;
      case 'nexusCollapse':
        if (a.sub === 0 && a.t > 0.4) { Patterns.ring(this.x, this.y, 28, 100, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.5 }); a.sub = 1; a.t = 0; }
        else if (a.sub === 1 && a.t > 0.5) { const mx = P.x + rand(-30, 30), my = P.y + rand(-30, 30); G.hazards.zone(mx, my, 34, { telegraph: 0.7, duration: 0.5, color: '#ff8c3b', damage: 18 }); a.sub = 2; a.t = 0; }
        else if (a.sub === 2 && a.t > 0.5) { Patterns.ring(this.x, this.y, 28, 120, api, { gapAngle: angleTo(this.x, this.y, P.x, P.y), gapSize: 0.5, offset: 0.11 }); return true; }
        return false;
    }
    return true;
  }

  hurt(G, dmg, x, y) {
    if (this.invuln > 0 || this.introT > 0 || this.dead) return 0;
    this.hp -= dmg;
    this.flash = 0.08;
    if (this.hp <= 0) { this.hp = 0; this.dead = true; }
    return dmg;
  }

  draw(ctx) {
    const spr = SPR[this.def.sprite];
    const bob = 0; // static sprite
    // presence aura: ground glow + pulsing ring (color per villain)
    const aura = { ultron: '#ff4d4d', loki: '#4dff88', hela: '#4dff88', devourer: '#4dd8ff', thanos: '#b06bff', kang: '#4dff88' }[this.def.id] || '#ff4d4d';
    ctx.save();
    ctx.globalAlpha = 0.22 + Math.sin(this.walk * 2) * 0.06;
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.ellipse(this.x, this.y + 24, 34, 12, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = aura;
    ctx.beginPath(); ctx.ellipse(this.x, this.y + 24, 38 + Math.sin(this.walk * 2) * 4, 14, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    // silhouette rim glow behind sprite
    if (spr) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      drawSprite(ctx, spr, this.x, this.y + bob - 1, { tint: aura });
      ctx.restore();
    }
    if (this.introT > 0 && Math.floor(this.introT * 10) % 2 === 0) ctx.globalAlpha = 0.5;
    if (spr) drawSprite(ctx, spr, this.x, this.y + bob, { tint: this.flash > 0 ? '#ffffff' : this.frozen > 0 ? '#7fd4ff' : undefined });
    ctx.globalAlpha = 1;
    // beam draw
    if (this.beam) {
      const b = this.beam;
      if (b.t < 0.7) {
        ctx.globalAlpha = 0.3 + Math.sin(b.t * 24) * 0.3;
        ctx.strokeStyle = '#ff3b3b';
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(b.a) * b.len, this.y + Math.sin(b.a) * b.len);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(b.a) * b.len, this.y + Math.sin(b.a) * b.len);
        ctx.stroke();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#ff3b3b';
        ctx.lineWidth = b.width;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(b.a) * b.len, this.y + Math.sin(b.a) * b.len);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
      }
    }
    // gravity well draw
    if (this.grav) {
      const g = this.grav;
      if (SPR.fx_gravwell) { ctx.globalAlpha = 0.8; drawSprite(ctx, SPR.fx_gravwell, g.x, g.y, { scaleX: 96 / SPR.fx_gravwell.width, scaleY: 96 / SPR.fx_gravwell.height, rot: this.walk }); ctx.globalAlpha = 1; }
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = '#b06bff';
      for (let i = 0; i < 3; i++) {
        const rr = 160 - ((this.t * 80 + i * 53) % 160);
        ctx.beginPath();
        ctx.arc(g.x, g.y, rr, 0, TAU);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // transient boss vfx decals (kang time effects)
    if (this.vfx && this.vfx.length) {
      for (const v of this.vfx) {
        v.t += 1 / 60;
        const a = 1 - v.t / 0.6;
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        drawSprite(ctx, v.spr, v.x, v.y, { scaleX: (40 + v.t * 60) / v.spr.width, scaleY: (40 + v.t * 60) / v.spr.height });
        ctx.globalAlpha = 1;
      }
      this.vfx = this.vfx.filter((v) => v.t < 0.6);
    }
  }
}
