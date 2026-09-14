// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/player.js
// Hero controller: movement, dash with i-frames, and the six distinct kits
// (basic / ability / special / passive) driven by data/heroes.js.
// ---------------------------------------------------------------------------
import { TAU, clamp, rand, angleTo, dist2 } from '../core/util.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { drawText } from '../core/font.js';

export class Player {
  constructor(hero, stats, skin = null) {
    this.hero = hero;
    this.stats = stats;
    this.skin = skin;
    this.base = skin ? 'skin_' + skin.id : 'hero_' + hero.id;
    this.shotSprite = skin && skin.fx.shot ? skin.fx.shot : null;
    this.shotKey = 'shot_hero_' + hero.id;
    this.shotTint = skin && skin.fx.shotTint ? skin.fx.shotTint : null;
    this.x = 320; this.y = 220;
    this.vx = 0; this.vy = 0;
    this.r = 7;
    this.aim = -Math.PI / 2;
    this.fireT = 0;
    this.abilityCd = 0;
    this.dashCd = 0;
    this.dashT = 0;
    this.dashX = 0; this.dashY = 0;
    this.iframes = 0;
    this.hurtFlash = 0;
    this.charge = 0; // special meter 0..100
    this.alive = true;
    // kit timers
    this.hammerT = 0; this.hammerA = 0;
    this.overT = 0;
    this.berserkT = 0;
    this.stormT = 0; this.stormTick = 0;
    this.freezeT = 0;
    this.runeA = 0;
    this.orbitA = 0;
    this.zaps = [];       // lightning lines to draw: {x1,y1,x2,y2,t}
    this.slashT = 0; this.slashA = 0;
    this.regenT = 0;
    this.missileT = 0;
    this.unibeamT = 0; this.unibeamA = 0;
    this.trailT = 0;
    this.walk = 0;
    this.alt = false; // dual weapons alternation
    this.fireAnim = 0;
    this.trailColor = skin && skin.fx.trail ? skin.fx.trail : null;
    this.auraColor = skin && skin.fx.aura ? skin.fx.aura : null;
  }

  get speed() {
    let s = this.stats.speed;
    if (this.berserkT > 0) s *= 1.25;
    return s;
  }

  addCharge(n) { this.charge = clamp(this.charge + n, 0, 100); }

  update(dt, G) {
    const st = this.stats;
    const inp = G.input;
    this.iframes = Math.max(0, this.iframes - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    this.abilityCd = Math.max(0, this.abilityCd - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.hammerT = Math.max(0, this.hammerT - dt);
    this.overT = Math.max(0, this.overT - dt);
    this.berserkT = Math.max(0, this.berserkT - dt);
    this.stormT = Math.max(0, this.stormT - dt);
    this.slashT = Math.max(0, this.slashT - dt);
    this.fireAnim = Math.max(0, this.fireAnim - dt);
    if (st.permHammer) this.hammerT = Math.max(this.hammerT, 0.01);

    // movement
    const [mx, my] = inp.moveAxis();
    let sp = this.speed;
    if (this.dashT > 0) {
      this.dashT -= dt;
      this.vx = this.dashX * 340;
      this.vy = this.dashY * 340;
    } else {
      this.vx = mx * sp;
      this.vy = my * sp;
      this.lungeDmg = 0;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    [this.x, this.y] = G.arena.clamp(this.x, this.y, this.r);
    [this.x, this.y] = G.arena.resolveCircle(this.x, this.y, this.r);
    [this.x, this.y] = G.arena.collideObstacles(this.x, this.y, this.r);
    this.walk += (Math.abs(this.vx) + Math.abs(this.vy)) * dt * 0.15;

    // cosmetic trail
    if (this.trailColor && (Math.abs(this.vx) + Math.abs(this.vy)) > 40) {
      this.trailT -= dt;
      if (this.trailT <= 0) {
        this.trailT = 0.05;
        G.particles.burst(this.x, this.y + 4, this.trailColor, 1, 10, 0.4, 1);
      }
    }

    // aim
    const pad = inp.pad;
    if (pad.aim && (pad.aim[0] || pad.aim[1])) this.aim = Math.atan2(pad.aim[1], pad.aim[0]);
    else {
      const nearest = G.nearestEnemy(this.x, this.y, 240);
      const useMouse = G.settings.autofire ? (inp.mouse.moved || !nearest) : true;
      if (nearest && !useMouse) this.aim = angleTo(this.x, this.y, nearest.x, nearest.y);
      else if (nearest && G.settings.autofire && !inp.mouse.moved) this.aim = angleTo(this.x, this.y, nearest.x, nearest.y);
      else this.aim = angleTo(this.x, this.y, inp.mouse.x, inp.mouse.y);
    }

    // dash
    const wantDash = inp.pressed('Space') || pad.dash;
    if (wantDash && this.dashCd <= 0 && this.dashT <= 0) {
      let dx = mx, dy = my;
      if (!dx && !dy) { dx = Math.cos(this.aim); dy = Math.sin(this.aim); }
      this.dashX = dx; this.dashY = dy;
      this.dashT = 0.16;
      this.iframes = Math.max(this.iframes, 0.3);
      this.dashCd = st.dashCd * (this.hero.id === 'arachnid' ? 0.8 : 1);
      G.audio.sfx('dash');
      G.particles.ring(this.x, this.y, '#ffffff', 8, 60);
    }

    // auto attack
    this.fireT -= dt;
    const atk = this.hero.attack;
    let rate = atk.rate * st.rate * (this.overT > 0 ? 2 : 1) * (this.berserkT > 0 ? 1.6 : 1);
    if (this.fireT <= 0) {
      this.fireT = 1 / rate;
      this.doAttack(G);
    }

    // ability (Q / mouse left hold? -> Q or pad)
    if ((inp.pressed('KeyQ') || pad.ability) && this.abilityCd <= 0) this.doAbility(G);

    // special (E)
    if ((inp.pressed('KeyE') || pad.special) && this.charge >= 100) this.doSpecial(G);

    // passives
    this.regenT += dt;
    const regenPer = this.hero.id === 'merc' ? 0.5 : 0;
    const berserkRegen = this.berserkT > 0 ? 4 : 0;
    if (regenPer + berserkRegen > 0 && this.regenT >= 1) {
      this.regenT = 0;
      this.heal(regenPer + berserkRegen);
    }
    // claws: destroy nearby enemy bullets
    if (this.hero.id === 'claws') {
      this.clawT = (this.clawT || 0) - dt;
      if (this.clawT <= 0) {
        this.clawT = 0.4;
        for (const b of G.bullets.enemy.live) {
          if (dist2(this.x, this.y, b.x, b.y) < 30 * 30) {
            b.dead = true;
            G.particles.spark(b.x, b.y, '#ffe14a', 3);
          }
        }
      }
    }
    // mystic runes orbit + block
    if (st.runes > 0) {
      this.runeA += dt * 3;
      const pts = this.runePoints();
      for (const b of G.bullets.enemy.live) {
        for (const p of pts) {
          if (dist2(p.x, p.y, b.x, b.y) < 8 * 8) {
            b.dead = true;
            G.particles.spark(b.x, b.y, '#ff9d4d', 4);
            break;
          }
        }
      }
    }
    // orbitals from upgrades
    if (st.orbit > 0) {
      this.orbitA += dt * 4;
      const pts = this.orbitPoints();
      for (const e of G.enemies) {
        if (e.dead || e.spawnT > 0) continue;
        for (const p of pts) {
          if (dist2(p.x, p.y, e.x, e.y) < (e.r + 5) ** 2) {
            if ((e.orbCd || 0) <= 0) {
              e.orbCd = 0.4;
              G.damageEnemy(e, 10 * st.dmg, p.x, p.y);
            }
          }
        }
      }
    }
    // thor permanent hammer handled via hammerT
    if (this.hammerT > 0) {
      this.hammerA += dt * 9;
      const hx = this.x + Math.cos(this.hammerA) * 30;
      const hy = this.y + Math.sin(this.hammerA) * 30;
      for (const e of G.enemies) {
        if (e.dead || e.spawnT > 0) continue;
        if (dist2(hx, hy, e.x, e.y) < (e.r + 8) ** 2 && (e.hamCd || 0) <= 0) {
          e.hamCd = 0.5;
          G.damageEnemy(e, 16 * st.dmg, hx, hy);
        }
      }
      // hammer destroys enemy bullets
      for (const b of G.bullets.enemy.live) {
        if (dist2(hx, hy, b.x, b.y) < 12 * 12) { b.dead = true; G.particles.spark(b.x, b.y, '#4dd8ff', 3); }
      }
    }
    // asgard storm
    if (this.stormT > 0) {
      this.stormTick -= dt;
      if (this.stormTick <= 0) {
        this.stormTick = 0.22;
        const tgt = G.randomEnemyOrPoint();
        G.lightningStrike(tgt.x, tgt.y, 26 * st.dmg, 46);
      }
    }
    // iron unibeam (upgrade)
    if (st.unibeam) {
      this.unibeamT -= dt;
      if (this.unibeamT <= 0) {
        this.unibeamT = 6 * st.cdr;
        this.unibeamA = this.aim;
        G.beamSweep(this, 2.2, 20 * st.dmg);
      }
    }
    // iron auto missile (upgrade)
    if (st.autoMissile) {
      this.missileT -= dt;
      if (this.missileT <= 0) {
        this.missileT = 1.6;
        G.fireMissile(this.x, this.y, this.aim, 14 * st.dmg);
      }
    }
    // mystic aura slow
    if (st.auraSlow) {
      for (const e of G.enemies) {
        if (!e.dead && dist2(this.x, this.y, e.x, e.y) < 90 * 90) e.auraSlowed = true;
      }
    }

    // decay zap visuals
    for (let i = this.zaps.length - 1; i >= 0; i--) {
      this.zaps[i].t -= dt;
      if (this.zaps[i].t <= 0) this.zaps.splice(i, 1);
    }
  }

  heal(n) {
    const st = this.stats;
    if (st.hp < st.maxHp) st.hp = Math.min(st.maxHp, st.hp + n);
  }

  hurt(G, dmg) {
    if (this.iframes > 0 || !this.alive) return false;
    const st = this.stats;
    if (st.shield > 0) {
      st.shield--;
      this.iframes = 0.8;
      G.particles.ring(this.x, this.y, '#4dd8ff', 14, 110);
      G.audio.sfx('clank');
      return true;
    }
    st.hp -= dmg;
    this.iframes = 1.0;
    this.hurtFlash = 0.25;
    G.particles.explosion(this.x, this.y, ['#ff4d4d', '#ffffff'], 12, 90);
    G.particles.addShake(5);
    G.audio.sfx('hurt');
    if (st.hp <= 0) {
      if (st.revives > 0) {
        st.revives--;
        st.hp = Math.floor(st.maxHp * 0.5);
        this.iframes = 2.5;
        G.particles.ring(this.x, this.y, '#ffd94a', 24, 160);
        G.audio.sfx('special');
      } else {
        st.hp = 0;
        this.alive = false;
      }
    }
    return true;
  }

  runePoints() {
    const pts = [];
    for (let i = 0; i < this.stats.runes; i++) {
      const a = this.runeA + (i / this.stats.runes) * TAU;
      pts.push({ x: this.x + Math.cos(a) * 16, y: this.y + Math.sin(a) * 16 });
    }
    return pts;
  }
  orbitPoints() {
    const pts = [];
    for (let i = 0; i < this.stats.orbit; i++) {
      const a = this.orbitA + (i / this.stats.orbit) * TAU;
      pts.push({ x: this.x + Math.cos(a) * 24, y: this.y + Math.sin(a) * 24 });
    }
    return pts;
  }

  doAttack(G) {
    const st = this.stats;
    const atk = this.hero.attack;
    const a = this.aim;
    const dmg = (n) => {
      let d = n * st.dmg;
      if (Math.random() < st.crit) return d * 2;
      return d;
    };
    const bcol = this.shotTint;
    const mk = (angle, o = {}) => {
      const b = G.bullets.spawnPlayer({
        x: this.x + Math.cos(angle) * 8,
        y: this.y + Math.sin(angle) * 8,
        vx: Math.cos(angle) * (atk.speed || 260) * st.projSpeed,
        vy: Math.sin(angle) * (atk.speed || 260) * st.projSpeed,
        dmg: dmg(atk.dmg),
        bounce: st.bounce,
      });
      Object.assign(b || {}, o);
      if (b) {
        if (this.shotSprite) b.sprite = this.shotSprite;
        else if (SPR[this.shotKey]) b.sprite = this.shotKey;
        if (bcol) b.tint = bcol;
      }
      return b;
    };
    G.particles.spark(this.x + Math.cos(a) * 10, this.y + Math.sin(a) * 10, this.hero.color, 2);
    this.fireAnim = 0.14;
    switch (atk.kind) {
      case 'pierce': {
        const n = 1 + st.extraProj;
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) / 2) * 0.16;
          const b = mk(a + off, { pierce: 2, r: 3, sprite: 'b_web' });
          if (b) { b.pierce = 2; if (st.webRoot) b.root = st.webRoot; if (st.webSplit) b.split = true; }
        }
        G.audio.sfx('web');
        break;
      }
      case 'chain': {
        const hits = G.chainLightning(this.x, this.y, st.chains + (st.chains > 3 ? 0 : 0), dmg(atk.dmg), 150);
        if (hits.length) G.audio.sfx('zap');
        break;
      }
      case 'repulsor': {
        const n = 1 + st.extraProj;
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) / 2) * 0.12;
          mk(a + off, { r: 3, sprite: 'b_repulsor' });
        }
        G.audio.sfx('shoot');
        break;
      }
      case 'dual': {
        this.alt = !this.alt;
        const off = this.alt ? 0.1 : -0.1;
        const perp = a + Math.PI / 2;
        const sx = this.x + Math.cos(perp) * (this.alt ? 5 : -5);
        const sy = this.y + Math.sin(perp) * (this.alt ? 5 : -5);
        const n = 1 + st.extraProj;
        for (let i = 0; i < n; i++) {
          const b = G.bullets.spawnPlayer({
            x: sx, y: sy,
            vx: Math.cos(a + off) * atk.speed * st.projSpeed,
            vy: Math.sin(a + off) * atk.speed * st.projSpeed,
            dmg: dmg(atk.dmg), bounce: st.bounce, r: 3, sprite: 'b_tracer',
          });
          if (b) {
            if (this.shotSprite) b.sprite = this.shotSprite;
            else if (SPR[this.shotKey]) b.sprite = this.shotKey;
            if (bcol) b.tint = bcol;
          }
        }
        G.audio.sfx('shoot');
        break;
      }
      case 'slash': {
        this.slashT = 0.18;
        this.slashA = a;
        const range = (atk.range || 52) * st.range;
        G.audio.sfx('hit');
        let hitAny = false;
        for (const e of G.enemies) {
          if (e.dead || e.spawnT > 0) continue;
          const d2 = dist2(this.x, this.y, e.x, e.y);
          if (d2 < (range + e.r) ** 2) {
            const ea = angleTo(this.x, this.y, e.x, e.y);
            let da = ea - a;
            while (da > Math.PI) da -= TAU;
            while (da < -Math.PI) da += TAU;
            if (Math.abs(da) < 1.2) {
              hitAny = true;
              G.damageEnemy(e, dmg(atk.dmg), e.x, e.y);
              if (st.hitHeal) this.heal(st.hitHeal);
            }
          }
        }
        // destroy enemy bullets in the arc
        for (const b of G.bullets.enemy.live) {
          if (dist2(this.x, this.y, b.x, b.y) < range ** 2) {
            const ba = angleTo(this.x, this.y, b.x, b.y);
            let da = ba - a;
            while (da > Math.PI) da -= TAU;
            while (da < -Math.PI) da += TAU;
            if (Math.abs(da) < 1.2) { b.dead = true; G.particles.spark(b.x, b.y, '#ffe14a', 2); }
          }
        }
        break;
      }
      case 'disc': {
        const n = 1 + st.extraProj;
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) / 2) * 0.2;
          const b = mk(a + off, { r: 4, pierce: 1, wobble: 0, sprite: 'b_mandala' });
        }
        G.audio.sfx('port');
        break;
      }
    }
  }

  doAbility(G) {
    const st = this.stats;
    this.abilityCd = this.hero.ability.cd * st.cdr;
    G.audio.sfx('ability');
    const aura = this.auraColor || this.hero.color;
    switch (this.hero.id) {
      case 'arachnid': {
        G.particles.ring(this.x, this.y, '#ffffff', 20, 140);
        for (const e of G.enemies) {
          if (!e.dead && dist2(this.x, this.y, e.x, e.y) < 130 * 130) {
            e.rooted = Math.max(e.rooted || 0, 2.5);
            G.particles.burst(e.x, e.y, '#ffffff', 6, 40, 0.5, 1);
          }
        }
        break;
      }
      case 'stormgod': this.hammerT = 3; break;
      case 'ironknight': {
        for (let i = 0; i < 4; i++) G.fireMissile(this.x, this.y, this.aim + (i - 1.5) * 0.5, 18 * st.dmg);
        break;
      }
      case 'merc': {
        for (let i = 0; i < 6; i++) {
          const a = this.aim + (i - 2.5) * 0.22;
          const b = G.bullets.spawnPlayer({
            x: this.x, y: this.y,
            vx: Math.cos(a) * 240, vy: Math.sin(a) * 240,
            dmg: 16 * st.dmg, bounce: 3, r: 3, sprite: 'b_blade',
          });
        }
        break;
      }
      case 'claws': {
        const [mx, my] = G.input.moveAxis();
        let dx = mx, dy = my;
        if (!dx && !dy) { dx = Math.cos(this.aim); dy = Math.sin(this.aim); }
        this.dashX = dx; this.dashY = dy;
        this.dashT = 0.3;
        this.iframes = Math.max(this.iframes, 0.45);
        this.lungeDmg = 20 * st.dmg;
        break;
      }
      case 'mystic': {
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * TAU;
          const b = G.bullets.spawnPlayer({
            x: this.x, y: this.y,
            vx: Math.cos(a) * 190, vy: Math.sin(a) * 190,
            dmg: 10 * st.dmg, r: 3, sprite: 'b_purple', pierce: 1,
          });
        }
        G.particles.ring(this.x, this.y, aura, 18, 120);
        break;
      }
    }
    G.particles.ring(this.x, this.y, aura, 10, 90);
  }

  doSpecial(G) {
    const st = this.stats;
    this.charge = 0;
    G.audio.sfx('special');
    G.particles.addFlash(this.hero.color, 0.35);
    G.particles.addShake(6);
    switch (this.hero.id) {
      case 'arachnid': {
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * TAU;
          const b = G.bullets.spawnPlayer({
            x: this.x, y: this.y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220,
            dmg: 14 * st.dmg, pierce: 3, r: 3,
          });
          if (b) b.root = 1;
        }
        for (const e of G.enemies) if (!e.dead) { e.rooted = Math.max(e.rooted || 0, 2); }
        break;
      }
      case 'stormgod': this.stormT = 4; break;
      case 'ironknight': this.overT = 5; break;
      case 'merc': {
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * TAU;
          G.bullets.spawnPlayer({
            x: this.x, y: this.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260,
            dmg: 10 * st.dmg, bounce: 2, r: 3,
          });
        }
        this.heal(25);
        break;
      }
      case 'claws': this.berserkT = 5; break;
      case 'mystic': {
        for (const e of G.enemies) if (!e.dead) e.frozen = Math.max(e.frozen || 0, 2.5);
        let cleared = 0;
        for (const b of G.bullets.enemy.live) {
          if (dist2(this.x, this.y, b.x, b.y) < 170 * 170) {
            b.dead = true; cleared++;
            if (cleared < 40) G.particles.spark(b.x, b.y, '#ff9d4d', 2);
          }
        }
        this.iframes = Math.max(this.iframes, 1.5);
        G.particles.ring(this.x, this.y, '#ff9d4d', 30, 200);
        break;
      }
    }
  }

  draw(ctx) {
    const st = this.stats;
    // slash arc
    if (this.slashT > 0) {
      const t = 1 - this.slashT / 0.18;
      ctx.globalAlpha = 0.7 * (1 - t);
      ctx.strokeStyle = '#ffe14a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 26 * st.range * 0.6 + 12, this.slashA - 1.1 + t * 1.4, this.slashA - 0.3 + t * 1.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // zaps
    for (const z of this.zaps) {
      ctx.globalAlpha = Math.min(1, z.t * 6);
      ctx.strokeStyle = '#9feaff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(z.x1, z.y1);
      const segs = 4;
      for (let i = 1; i <= segs; i++) {
        const t = i / segs;
        const nx = z.x1 + (z.x2 - z.x1) * t + (i < segs ? rand(-3, 3) : 0);
        const ny = z.y1 + (z.y2 - z.y1) * t + (i < segs ? rand(-3, 3) : 0);
        ctx.lineTo(nx, ny);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // hammer
    if (this.hammerT > 0) {
      const hx = this.x + Math.cos(this.hammerA) * 30;
      const hy = this.y + Math.sin(this.hammerA) * 30;
      ctx.fillStyle = '#8d93a8';
      ctx.fillRect(hx - 4, hy - 3, 8, 6);
      ctx.fillStyle = '#4dd8ff';
      ctx.fillRect(hx - 2, hy - 1, 4, 2);
    }
    // orbitals & runes
    for (const p of this.orbitPoints()) {
      ctx.fillStyle = '#4dd8ff';
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    for (const p of this.runePoints()) {
      ctx.fillStyle = '#ffd94a';
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(this.runeA);
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();
    }
    // hero sprite: looping walk animation from per-hero sheet (0,1,2,1)
    const moving = Math.abs(this.vx) + Math.abs(this.vy) > 4;
    const seq = [0, 1, 2, 1];
    const wf = moving ? seq[Math.floor(this.walk * 7) % 4] : 0;
    const spr = SPR[this.base + '_w' + wf] || SPR[this.base] || SPR['hero_' + this.hero.id];
    const bob = 0;
    const blink = this.iframes > 0 && Math.floor(this.iframes * 14) % 2 === 0;
    if (spr) {
      drawSprite(ctx, spr, this.x, this.y + bob, {
        alpha: blink ? 0.35 : 1,
        scale: 1,
      });
    }
    if (this.hurtFlash > 0) {
      drawSprite(ctx, spr, this.x, this.y + bob, { tint: '#ff4d4d', alpha: 0.7 });
    }
    // special-ready glow
    if (this.charge >= 100) {
      ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 120) * 0.15;
      ctx.strokeStyle = this.hero.color;
      ctx.strokeRect(this.x - 9, this.y - 9 + bob, 18, 18);
      ctx.globalAlpha = 1;
    }
  }
}
