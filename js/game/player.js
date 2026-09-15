// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/player.js
// Hero controller: movement, dash with i-frames, and the six distinct kits
// (basic / ability / special / passive) driven by data/heroes.js.
// ---------------------------------------------------------------------------
import { TAU, clamp, rand, angleTo, dist2 } from '../core/util.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { Save } from '../core/save.js';
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
    // kit identity state
    this.shotCount = 0;                    // counts shots (thor hammer / merc knife cadence)
    this.comboStep = 0;                    // wolverine 3-hit combo
    this.burst = 0; this.burstT = 0;       // iron repulsor burst queue
    this.webbed = [];                      // recently webbed enemies (visual connections)
    this.webStormT = 0; this.webStormTick = 0;
    this.volleyT = 0; this.volleyTick = 0; this.volleyN = 0;
    this.frenzyT = 0; this.frenzyTick = 0; this.frenzyHits = 0;
    this.rushT = 0; this.rushHitIds = null;
    this.portalQ = null;                   // mystic nexus portal {x,y,t,tick,pulse}
    this.slashMarks = [];                  // lingering claw marks {x,y,a,t}
    this.decals = [];                      // impact decals {s,x,y,t,max,rot}
    this.trailColor = skin && skin.fx.trail ? skin.fx.trail : null;
    this.auraColor = skin && skin.fx.aura ? skin.fx.aura : null;
  }

  get speed() {
    let s = this.stats.speed;
    if (this.berserkT > 0) s *= 1.25;
    if (Save.data.dev && Save.data.dev.speed2) s *= 1.6;
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

    // special — Q (the signature epic move; charge-gated)
    if ((inp.pressed('KeyQ') || pad.special) && this.charge >= 100) this.doSpecial(G);

    // utility ability — E (short cooldown)
    if ((inp.pressed('KeyE') || pad.ability) && this.abilityCd <= 0) this.doAbility(G);

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
    // decay slash marks
    for (let i = this.slashMarks.length - 1; i >= 0; i--) {
      this.slashMarks[i].t -= dt;
      if (this.slashMarks[i].t <= 0) this.slashMarks.splice(i, 1);
    }
    // decay impact decals
    for (let i = this.decals.length - 1; i >= 0; i--) {
      this.decals[i].t -= dt;
      if (this.decals[i].t <= 0) this.decals.splice(i, 1);
    }
    // decay webbed connections
    for (let i = this.webbed.length - 1; i >= 0; i--) {
      this.webbed[i].t -= dt;
      if (this.webbed[i].t <= 0 || this.webbed[i].e.dead) this.webbed.splice(i, 1);
    }
    // SILK LINK: webbed enemies near each other get bound — shared damage + slow
    if (this.hero.id === 'arachnid') {
      this.webLinkTick = (this.webLinkTick || 0) - dt;
      const rooted = G.enemies.filter((e) => !e.dead && e.spawnT <= 0 && (e.rooted || 0) > 0);
      const links = [];
      for (let i = 0; i < rooted.length && links.length < 6; i++)
        for (let j = i + 1; j < rooted.length && links.length < 6; j++)
          if (dist2(rooted[i].x, rooted[i].y, rooted[j].x, rooted[j].y) < 110 * 110) links.push([rooted[i], rooted[j]]);
      const had = (this.webLinks || []).length;
      this.webLinks = links;
      if (links.length > had) G.audio.sfx('web');
      if (this.webLinkTick <= 0) {
        this.webLinkTick = 0.3;
        for (const [A, B] of links) {
          G.damageEnemy(A, 3 * st.dmg, A.x, A.y, true);
          G.damageEnemy(B, 3 * st.dmg, B.x, B.y, true);
          A.chill = Math.max(A.chill || 0, 0.35);
          B.chill = Math.max(B.chill || 0, 0.35);
        }
      }
    } else this.webLinks = null;

    // iron repulsor burst queue
    if (this.burst > 0) {
      this.burstT -= dt;
      if (this.burstT <= 0) {
        this.burstT = 0.07;
        this.burst--;
        const off = rand(-0.05, 0.05);
        const b = G.bullets.spawnPlayer({
          x: this.x + Math.cos(this.aim) * 9, y: this.y + Math.sin(this.aim) * 9,
          vx: Math.cos(this.aim + off) * 400 * st.projSpeed,
          vy: Math.sin(this.aim + off) * 400 * st.projSpeed,
          dmg: this.hero.attack.dmg * st.dmg, r: 3, sprite: 'b_repulsor', fx: 'ironknight',
        });
        if (b) { if (this.shotSprite) b.sprite = this.shotSprite; else if (SPR[this.shotKey]) b.sprite = this.shotKey; if (this.shotTint) b.tint = this.shotTint; }
        G.particles.spark(this.x + Math.cos(this.aim) * 11, this.y + Math.sin(this.aim) * 11, '#4dd8ff', 2);
      }
    }

    // merc frenzy: dash through nearest enemies
    if (this.frenzyT > 0) {
      this.frenzyT -= dt;
      this.frenzyTick -= dt;
      if (this.frenzyTick <= 0) {
        this.frenzyTick = 0.09;
        if (this.frenzyHits < 12) {
          const tgt = G.randomEnemyOrPoint();
          if (tgt) {
            const ang = angleTo(this.x, this.y, tgt.x, tgt.y);
            this.x += Math.cos(ang) * 26; this.y += Math.sin(ang) * 26;
            [this.x, this.y] = G.arena.clamp(this.x, this.y, this.r);
            for (const e of G.enemies) {
              if (e.dead || e.spawnT > 0) continue;
              if (dist2(this.x, this.y, e.x, e.y) < 26 * 26) {
                G.damageEnemy(e, 14 * st.dmg, e.x, e.y);
                this.slashMarks.push({ x: e.x, y: e.y, a: ang + rand(-0.5, 0.5), t: 0.3 });
              }
            }
            G.particles.burst(this.x, this.y, '#ff6b6b', 5, 70, 0.25);
            this.decal('fx_slashx', this.x, this.y, 0.22, ang);
            G.audio.sfx('slashq');
            this.frenzyHits++;
          }
        } else {
          // final spin
          for (let i = 0; i < 14; i++) {
            const a2 = (i / 14) * TAU;
            const b = G.bullets.spawnPlayer({ x: this.x, y: this.y, vx: Math.cos(a2) * 240, vy: Math.sin(a2) * 240, dmg: 12 * st.dmg, r: 4, pierce: 1, sprite: 'b_knife', fx: 'merc' });
            if (b && SPR.fx_knife) b.sprite = 'fx_knife';
          }
          G.particles.ring(this.x, this.y, '#ffd94a', 20, 160);
          G.particles.addShake(5);
          this.heal(20);
          this.frenzyT = 0;
        }
      }
    }

    // claws brutal rush
    if (this.rushT > 0) {
      this.rushT -= dt;
      const sp = 420;
      this.x += this.dashX * sp * dt; this.y += this.dashY * sp * dt;
      [this.x, this.y] = G.arena.clamp(this.x, this.y, this.r);
      [this.x, this.y] = G.arena.collideObstacles(this.x, this.y, this.r);
      this.trailColor = '#ff4d4d';
      for (const e of G.enemies) {
        if (e.dead || e.spawnT > 0 || (this.rushHitIds && this.rushHitIds.has(e.uid))) continue;
        if (dist2(this.x, this.y, e.x, e.y) < 24 * 24) {
          if (this.rushHitIds) this.rushHitIds.add(e.uid);
          G.damageEnemy(e, 22 * st.dmg, e.x, e.y);
          this.slashMarks.push({ x: e.x, y: e.y, a: Math.atan2(this.dashY, this.dashX), t: 0.35 });
          if (st.hitHeal) this.heal(st.hitHeal);
        }
      }
      G.particles.burst(this.x, this.y, '#ff4d4d', 2, 40, 0.2);
      if (this.rushT <= 0) {
        // final impact
        G.particles.explosion(this.x, this.y, ['#ffe14a', '#ff4d4d', '#ffffff'], 18, 130);
        G.particles.ring(this.x, this.y, '#ffe14a', 22, 170);
        G.particles.addShake(7);
        G.audio.sfx('rushend');
        for (const e of G.enemies) {
          if (!e.dead && dist2(this.x, this.y, e.x, e.y) < 60 * 60) {
            e.rooted = Math.max(e.rooted || 0, 1.2);
            G.damageEnemy(e, 18 * st.dmg, e.x, e.y);
          }
        }
        this.rushHitIds = null;
      }
    }

    // iron missile volley (special) + final blast
    if (this.volleyT > 0) {
      const wasV = this.volleyT;
      this.volleyT -= dt;
      this.volleyTick -= dt;
      if (this.volleyTick <= 0 && this.volleyN < 14) {
        this.volleyTick = 0.11;
        this.volleyN++;
        G.fireMissile(this.x, this.y, this.aim + rand(-0.9, 0.9), 16 * st.dmg);
        G.particles.burst(this.x, this.y - 6, '#ff8c3b', 4, 60, 0.3);
      }
      if (wasV > 0 && this.volleyT <= 0) {
        const fx = this.x + Math.cos(this.aim) * 110, fy = this.y + Math.sin(this.aim) * 110;
        G.particles.explosion(fx, fy, ['#ff8c3b', '#ffd94a', '#ffffff'], 26, 170);
        G.particles.ring(fx, fy, '#ff8c3b', 30, 220);
        G.particles.addFlash('#ff8c3b', 0.4);
        G.particles.addShake(8);
        this.decal('fx_boom', fx, fy, 0.45);
        G.audio.sfx('rushend');
        for (const e of G.enemies) if (!e.dead && dist2(fx, fy, e.x, e.y) < 130 * 130) G.damageEnemy(e, 12 * st.dmg, e.x, e.y, true);
      }
    }

    // arachnid web storm (special): expanding web rings + persistent root aura
    if (this.webStormT > 0) {
      this.webStormT -= dt;
      this.webStormTick -= dt;
      for (const e of G.enemies) {
        if (!e.dead && dist2(this.x, this.y, e.x, e.y) < 150 * 150) e.rooted = Math.max(e.rooted || 0, 0.3);
      }
      if (this.webStormTick <= 0) {
        this.webStormTick = 0.4;
        const rr = 130 + (2.2 - this.webStormT) * 90;
        for (let i = 0; i < 14; i++) {
          const a2 = (i / 14) * TAU + this.webStormT * 2.5;
          const b = G.bullets.spawnPlayer({
            x: this.x, y: this.y, vx: Math.cos(a2) * rr, vy: Math.sin(a2) * rr,
            dmg: 9 * st.dmg, pierce: 2, r: 3, sprite: 'b_web', life: 1.2, scale: 0.7,
          });
          if (b) { b.fx = 'arachnid'; b.root = 0.8; if (SPR.fx_web_dart) b.sprite = 'fx_web_dart'; }
        }
        G.audio.sfx('webshot');
        G.particles.ring(this.x, this.y, '#ffffff', 12, rr * 0.8);
      }
    }

    // mystic portal special
    if (this.portalQ) {
      const p = this.portalQ;
      p.t -= dt; p.tick -= dt; p.pulse -= dt;
      p.rot += dt * 2.5;
      if (p.tick <= 0) {
        p.tick = 0.16;
        const tgt = G.randomEnemyOrPoint();
        const ang = tgt ? angleTo(p.x, p.y, tgt.x, tgt.y) : rand(0, TAU);
        const b = G.bullets.spawnPlayer({ x: p.x, y: p.y, vx: Math.cos(ang) * 300, vy: Math.sin(ang) * 300, dmg: 13 * st.dmg, r: 5, pierce: 2, homing: 1.5, sprite: 'b_mandala', fx: 'mystic' });
        if (b) { b.sigil = true; if (SPR.fx_sigil) b.sprite = 'fx_sigil'; }
        G.particles.spark(p.x, p.y, '#ff9d4d', 3);
      }
      if (p.pulse <= 0) {
        p.pulse = 0.5;
        G.particles.ring(p.x, p.y, '#ff9d4d', 12, 90);
        for (const e of G.enemies) if (!e.dead && dist2(p.x, p.y, e.x, e.y) < 70 * 70) e.frozen = Math.max(e.frozen || 0, 0.6);
      }
      if (p.t <= 0) {
        G.particles.explosion(p.x, p.y, ['#ff9d4d', '#b06bff', '#ffffff'], 16, 120);
        this.portalQ = null;
      }
    }
  }

  heal(n) {
    const st = this.stats;
    if (st.hp < st.maxHp) st.hp = Math.min(st.maxHp, st.hp + n);
  }

  hurt(G, dmg) {
    if (Save.data.dev && Save.data.dev.god) return false;
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
        vx: Math.cos(angle) * (o.speed || atk.speed || 260) * st.projSpeed,
        vy: Math.sin(angle) * (o.speed || atk.speed || 260) * st.projSpeed,
        dmg: dmg(atk.dmg),
        bounce: st.bounce,
      });
      Object.assign(b || {}, o);
      if (b) {
        if (this.shotSprite) b.sprite = this.shotSprite;
        else if (SPR[this.shotKey]) b.sprite = this.shotKey;
        b.fx = this.hero.id;
        if (bcol) b.tint = bcol;
      }
      return b;
    };
    G.particles.spark(this.x + Math.cos(a) * 10, this.y + Math.sin(a) * 10, this.hero.color, 2);
    this.fireAnim = 0.14;
    this.shotCount++;
    switch (atk.kind) {
      // ---- HOMEM-ARANHA: teias rápidas que grudam e conectam alvos ----
      case 'webshot': {
        const n = 1 + st.extraProj;
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) / 2) * 0.14;
          const b = mk(a + off, { pierce: 1, r: 3, sprite: 'b_web' });
          if (b) {
            b.root = Math.max(st.webRoot || 0, 0.45);   // gruda no impacto
            b.scale = 0.6;                               // teias menores e legíveis
            if (st.webSplit) b.split = true;
          }
        }
        G.audio.sfx('webshot');
        break;
      }
      // ---- THOR: raio pesado + martelo ocasional ----
      case 'bolt': {
        const heavy = this.shotCount % 4 === 0;
        if (heavy) {
          // Mjölnir strike: linha de energia + trovão
          const b = mk(a, { pierce: 3, r: 5, sprite: 'b_hammer' });
          if (b) { b.heavy = true; b.tint = '#ffd94a'; if (SPR.fx_hammer) b.sprite = 'fx_hammer'; }
          G.audio.sfx('hamthrow');
          G.particles.burst(this.x + Math.cos(a) * 12, this.y + Math.sin(a) * 12, '#9feaff', 6, 70, 0.3);
          G.particles.addShake(2);
        } else {
          const b = mk(a, { pierce: 1, r: 4, sprite: 'b_zapbolt' });
          if (b) b.zap = true;
          G.audio.sfx('boltheavy');
        }
        break;
      }
      // ---- IRON MAN: rajada de 3 repulsores ----
      case 'burst': {
        this.burst = 3; this.burstT = 0;
        G.audio.sfx('repul');
        G.particles.ring(this.x + Math.cos(a) * 8, this.y + Math.sin(a) * 8, '#4dd8ff', 4, 40);
        break;
      }
      // ---- DEADPOOL: tiros caóticos + faca a cada 3 ----
      case 'chaos': {
        this.alt = !this.alt;
        const knife = this.shotCount % 3 === 0;
        const perp = a + Math.PI / 2;
        const sx = this.x + Math.cos(perp) * (this.alt ? 6 : -6);
        const sy = this.y + Math.sin(perp) * (this.alt ? 6 : -6);
        const spread = knife ? 0 : rand(-0.16, 0.16);
        const b = G.bullets.spawnPlayer({
          x: sx, y: sy,
          vx: Math.cos(a + spread) * atk.speed * st.projSpeed * (knife ? 0.85 : 1),
          vy: Math.sin(a + spread) * atk.speed * st.projSpeed * (knife ? 0.85 : 1),
          dmg: dmg(atk.dmg * (knife ? 1.6 : 1)), r: knife ? 4 : 3,
          pierce: knife ? 2 : 0, bounce: knife ? 1 : st.bounce,
          wobble: knife ? 0 : rand(0.4, 1.1), sprite: knife ? 'b_knife' : 'b_tracer',
        });
        if (b) {
          if (knife && SPR.fx_knife) b.sprite = 'fx_knife';
          else if (this.shotSprite) b.sprite = this.shotSprite;
          else if (SPR[this.shotKey]) b.sprite = this.shotKey;
          b.fx = this.hero.id;
          if (bcol && !knife) b.tint = bcol;
        }
        G.audio.sfx(knife ? 'knife' : 'pistol');
        break;
      }
      // ---- WOLVERINE: combo de garras em 3 tempos ----
      case 'claws': {
        this.comboStep = (this.comboStep + 1) % 3;
        const finisher = this.comboStep === 2;
        this.slashT = finisher ? 0.24 : 0.16;
        this.slashMax = this.slashT;
        this.slashA = a;
        this.slashCombo = this.comboStep;
        const range = (atk.range || 52) * st.range * (finisher ? 1.25 : 1);
        G.audio.sfx(finisher ? 'claw3' : this.comboStep === 1 ? 'claw2' : 'claw1');
        for (const e of G.enemies) {
          if (e.dead || e.spawnT > 0) continue;
          const d2 = dist2(this.x, this.y, e.x, e.y);
          if (d2 < (range + e.r) ** 2) {
            const ea = angleTo(this.x, this.y, e.x, e.y);
            let da = ea - a;
            while (da > Math.PI) da -= TAU;
            while (da < -Math.PI) da += TAU;
            if (Math.abs(da) < (finisher ? 1.5 : 1.1)) {
              G.damageEnemy(e, dmg(atk.dmg * (finisher ? 1.8 : 1)), e.x, e.y);
              this.slashMarks.push({ x: e.x + rand(-4, 4), y: e.y + rand(-4, 4), a: a + rand(-0.4, 0.4), t: 0.35 });
              if (st.hitHeal) this.heal(st.hitHeal);
            }
          }
        }
        for (const b of G.bullets.enemy.live) {
          if (dist2(this.x, this.y, b.x, b.y) < range ** 2) {
            const ba = angleTo(this.x, this.y, b.x, b.y);
            let da = ba - a;
            while (da > Math.PI) da -= TAU;
            while (da < -Math.PI) da += TAU;
            if (Math.abs(da) < 1.4) { b.dead = true; G.particles.spark(b.x, b.y, '#ffe14a', 2); }
          }
        }
        if (finisher) {
          G.particles.addShake(3);
          G.particles.burst(this.x + Math.cos(a) * 20, this.y + Math.sin(a) * 20, '#ffe14a', 8, 90, 0.3);
          this.decal('fx_clawarc', this.x + Math.cos(a) * 22, this.y + Math.sin(a) * 22, 0.3, a);
        }
        break;
      }
      // ---- DOUTOR ESTRANHO: sigilos místicos teleguiados ----
      case 'sigil': {
        // feitiços em ciclo: mandala rastreadora -> leque de estilhas -> orbe explosivo
        const n = 1 + st.extraProj;
        const spell = this.shotCount % 3;
        if (spell === 0) {
          for (let i = 0; i < n; i++) {
            const off = (i - (n - 1) / 2) * 0.22;
            const b = mk(a + off, { r: 4, pierce: 1, homing: 2.2, wobble: 0, sprite: 'b_mandala' });
            if (b) { b.sigil = true; if (SPR.fx_sigil) b.sprite = 'fx_sigil'; }
          }
          G.audio.sfx('sigil');
          G.particles.ring(this.x, this.y, '#ff9d4d', 6, 40);
        } else if (spell === 1) {
          for (let i = 0; i < n + 2; i++) {
            const off = (i - (n + 1) / 2) * 0.16;
            const b = mk(a + off, { r: 3, pierce: 2, speed: (atk.speed || 210) * 1.35, sprite: 'b_purple' });
            if (b) b.spin = true;
          }
          G.audio.sfx('zap');
          G.particles.spark(this.x + Math.cos(a) * 10, this.y + Math.sin(a) * 10, '#b06bff', 3);
        } else {
          const b = mk(a, { r: 5, pierce: 0, homing: 1.2, speed: (atk.speed || 210) * 0.8, sprite: 'b_mandala' });
          if (b) { b.arcaneBurst = true; b.sigil = true; }
          G.audio.sfx('illus');
          G.particles.ring(this.x, this.y, '#b06bff', 8, 50);
        }
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
        G.particles.ring(this.x, this.y, '#ff2b2b', 12, 90);
        for (const e of G.enemies) {
          if (!e.dead && dist2(this.x, this.y, e.x, e.y) < 130 * 130) {
            e.rooted = Math.max(e.rooted || 0, 2.5);
            this.zaps.push({ x1: this.x, y1: this.y, x2: e.x, y2: e.y, t: 0.25 }); // silk line
            G.particles.burst(e.x, e.y, '#ffffff', 6, 40, 0.5, 1);
          }
        }
        break;
      }
      case 'stormgod': {
        this.hammerT = 3;
        G.particles.burst(this.x, this.y - 14, '#9feaff', 14, 90, 0.5);
        this.zaps.push({ x1: this.x + rand(-8, 8), y1: this.y - 90, x2: this.x, y2: this.y - 6, t: 0.25 });
        break;
      }
      case 'ironknight': {
        for (let i = 0; i < 4; i++) G.fireMissile(this.x, this.y, this.aim + (i - 1.5) * 0.5, 18 * st.dmg);
        G.particles.burst(this.x, this.y, '#ff8c3b', 10, 70, 0.4);
        G.particles.ring(this.x, this.y, '#4dd8ff', 8, 60);
        break;
      }
      case 'merc': {
        for (let i = 0; i < 6; i++) {
          const a = this.aim + (i - 2.5) * 0.22;
          const b = G.bullets.spawnPlayer({
            x: this.x, y: this.y,
            vx: Math.cos(a) * 240, vy: Math.sin(a) * 240,
            dmg: 16 * st.dmg, bounce: 3, r: 3, sprite: 'b_blade', fx: 'merc',
          });
        }
        G.particles.burst(this.x + Math.cos(this.aim) * 8, this.y + Math.sin(this.aim) * 8, '#ffd94a', 8, 60, 0.3);
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
        this.trailColor = '#ff4d4d';
        G.particles.burst(this.x, this.y, '#ffe14a', 10, 80, 0.4);
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
        G.particles.ring(this.x, this.y, '#ffd94a', 10, 70);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          G.particles.spark(this.x + Math.cos(a) * 20, this.y + Math.sin(a) * 20, '#ff8c3b', 2);
        }
        break;
      }
    }
    G.particles.ring(this.x, this.y, aura, 10, 90);
  }

  doSpecial(G) {
    const st = this.stats;
    this.charge = 0;
    G.particles.addFlash(this.hero.color, 0.4);
    G.particles.addShake(7);
    switch (this.hero.id) {
      // grande sequência de teias prendendo e atingindo vários inimigos
      case 'arachnid': {
        G.audio.sfx('q_web');
        this.webStormT = 2.2; this.webStormTick = 0;
        for (const e of G.enemies) if (!e.dead) {
          e.rooted = Math.max(e.rooted || 0, 2.4);
          this.zaps.push({ x1: this.x, y1: this.y, x2: e.x, y2: e.y, t: 0.35 });
          this.webbed.push({ e, t: 1.4 });
          G.particles.burst(e.x, e.y, '#ffffff', 6, 40, 0.5, 1);
        }
        G.particles.ring(this.x, this.y, '#ffffff', 26, 180);
        G.particles.ring(this.x, this.y, '#ff2b2b', 14, 100);
        break;
      }
      // tempestade: raios em múltiplos pontos + impacto central
      case 'stormgod': {
        G.audio.sfx('q_storm');
        this.stormT = 4;
        for (let i = 0; i < 5; i++) this.zaps.push({ x1: this.x + rand(-80, 80), y1: this.y - 140, x2: this.x + rand(-50, 50), y2: this.y, t: 0.4 });
        G.lightningStrike(this.x, this.y, 40 * st.dmg, 90);   // impacto central devastador
        this.decal('fx_strike', this.x, this.y - 8, 0.5);
        G.particles.ring(this.x, this.y, '#9feaff', 26, 190);
        G.particles.addFlash('#ffffff', 0.5);
        break;
      }
      // salva de mísseis em grande escala + explosão final
      case 'ironknight': {
        G.audio.sfx('q_missile');
        this.volleyT = 1.8; this.volleyTick = 0; this.volleyN = 0;
        this.overT = 3;
        G.particles.ring(this.x, this.y, '#ff8c3b', 22, 160);
        G.particles.ring(this.x, this.y, '#4dd8ff', 12, 90);
        break;
      }
      // sequência frenética atravessando inimigos + giro final
      case 'merc': {
        G.audio.sfx('q_frenzy');
        this.frenzyT = 1.5; this.frenzyTick = 0; this.frenzyHits = 0;
        this.iframes = Math.max(this.iframes, 1.6);
        G.particles.ring(this.x, this.y, '#ff6b6b', 20, 150);
        break;
      }
      // investida brutal atravessando a arena + impacto atordoante
      case 'claws': {
        G.audio.sfx('q_rush');
        const [mx, my] = G.input.moveAxis();
        let dx = mx, dy = my;
        if (!dx && !dy) { dx = Math.cos(this.aim); dy = Math.sin(this.aim); }
        const len = Math.hypot(dx, dy) || 1;
        this.dashX = dx / len; this.dashY = dy / len;
        this.rushT = 0.55; this.rushHitIds = new Set();
        this.iframes = Math.max(this.iframes, 0.7);
        G.particles.burst(this.x, this.y, '#ffe14a', 14, 110, 0.4);
        break;
      }
      // portal místico bombardeando a arena com dardos teleguiados
      case 'mystic': {
        G.audio.sfx('q_portal');
        const px = this.x + Math.cos(this.aim) * 70;
        const py = this.y + Math.sin(this.aim) * 70;
        this.portalQ = { x: px, y: py, t: 3.5, tick: 0, pulse: 0, rot: 0 };
        for (const e of G.enemies) if (!e.dead) e.frozen = Math.max(e.frozen || 0, 1.2);
        G.particles.ring(px, py, '#ff9d4d', 24, 170);
        G.particles.ring(px, py, '#b06bff', 14, 100);
        break;
      }
    }
    G.particles.ring(this.x, this.y, this.auraColor || this.hero.color, 10, 90);
  }

  decal(s, x, y, life = 0.3, rot = 0) {
    if (!SPR[s]) return;
    this.decals.push({ s, x, y, t: life, max: life, rot });
    if (this.decals.length > 40) this.decals.shift();
  }

  draw(ctx) {
    const st = this.stats;
    // impact decals (expanding, fading VFX sprites)
    for (const d of this.decals) {
      const s = SPR[d.s];
      if (!s) continue;
      const k = d.t / d.max;
      drawSprite(ctx, s, d.x, d.y, { rot: d.rot || 0, alpha: k, scale: 0.8 + (1 - k) * 0.5 });
    }
    // slash arc (wolverine combo)
    if (this.slashT > 0) {
      const mx = this.slashMax || 0.18;
      const t = clamp(1 - this.slashT / mx, 0, 1);
      const fin = this.slashCombo === 2;
      const rad = 26 * st.range * 0.6 + 12 + (fin ? 10 : 0);
      ctx.globalAlpha = 0.85 * (1 - t);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, rad + 2, this.slashA - 1.15 + t * 1.7, this.slashA - 0.25 + t * 1.7);
      ctx.stroke();
      ctx.strokeStyle = '#ffe14a';
      ctx.lineWidth = fin ? 4 : 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, rad, this.slashA - 1.05 + t * 1.7, this.slashA - 0.35 + t * 1.7);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // zaps (lightning) & silk lines (arachnid)
    for (const z of this.zaps) {
      ctx.globalAlpha = Math.min(1, z.t * 6);
      ctx.strokeStyle = this.hero.id === 'arachnid' ? '#ffffffcc' : '#9feaff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(z.x1, z.y1);
      const segs = 4;
      for (let i = 1; i <= segs; i++) {
        const t = i / segs;
        const jx = this.hero.id === 'arachnid' ? 0 : (i < segs ? rand(-3, 3) : 0);
        const jy = this.hero.id === 'arachnid' ? (i < segs ? 5 : 0) : (i < segs ? rand(-3, 3) : 0); // silk sags
        const nx = z.x1 + (z.x2 - z.x1) * t + jx;
        const ny = z.y1 + (z.y2 - z.y1) * t + jy;
        ctx.lineTo(nx, ny);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // lingering claw marks (sprite if available, else lines)
    for (const m of this.slashMarks) {
      const cm = SPR.fx_claw3;
      if (cm) {
        drawSprite(ctx, cm, m.x, m.y, { rot: m.a + 0.6, alpha: Math.min(1, m.t * 2.6) });
      } else {
        ctx.globalAlpha = Math.min(1, m.t * 3);
        ctx.strokeStyle = '#ffe14a';
        ctx.lineWidth = 1;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(m.x + Math.cos(m.a + 1.57) * i * 3 - Math.cos(m.a) * 5, m.y + Math.sin(m.a + 1.57) * i * 3 - Math.sin(m.a) * 5);
          ctx.lineTo(m.x + Math.cos(m.a + 1.57) * i * 3 + Math.cos(m.a) * 5, m.y + Math.sin(m.a + 1.57) * i * 3 + Math.sin(m.a) * 5);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
    // SILK LINK draw: sagging web lines + anchor nodes between bound enemies
    if (this.webLinks && this.webLinks.length) {
      for (const [A, B] of this.webLinks) {
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 + 6;
        ctx.strokeStyle = '#ffffffaa';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
        ctx.strokeStyle = '#ffffff55';
        ctx.beginPath(); ctx.moveTo(A.x, A.y - 3); ctx.quadraticCurveTo(mx, my - 5, B.x, B.y - 3); ctx.stroke();
        for (let k = 1; k <= 3; k++) {
          const t = k / 4;
          const qx = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * mx + t * t * B.x;
          const qy = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * my + t * t * B.y;
          ctx.fillStyle = '#ffffff'; ctx.fillRect(qx - 1, qy - 1, 2, 2);
        }
        if (SPR.web_spider) { ctx.globalAlpha = 0.7; drawSprite(ctx, SPR.web_spider, mx, my, { rot: (performance.now() / 500) % 6.28, scale: 0.8 }); ctx.globalAlpha = 1; }
      }
      ctx.lineWidth = 1;
    }
    if (false && this.webbed.length > 1) {
      ctx.strokeStyle = '#ffffff99';
      ctx.lineWidth = 1;
      for (let i = 0; i < this.webbed.length - 1; i++) {
        const a = this.webbed[i].e, b = this.webbed[i + 1].e;
        ctx.globalAlpha = Math.min(1, Math.min(this.webbed[i].t, this.webbed[i + 1].t) * 1.5);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + 6, b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // mystic nexus portal
    if (this.portalQ) {
      const p = this.portalQ;
      const fade = Math.min(1, p.t * 2);
      const spr = SPR.fx_portal;
      if (spr) {
        drawSprite(ctx, spr, p.x, p.y, { rot: p.rot, alpha: fade });
      } else {
        ctx.globalAlpha = fade;
        ctx.strokeStyle = '#ff9d4d';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#ffd94a';
        ctx.beginPath(); ctx.arc(p.x, p.y, 13, p.rot, p.rot + 4.5); ctx.stroke();
        ctx.strokeStyle = '#b06bff';
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, -p.rot, -p.rot + 4.5); ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const a = p.rot * 1.5 + (i / 6) * TAU;
          ctx.fillStyle = '#ffd94a';
          ctx.fillRect(p.x + Math.cos(a) * 26 - 1, p.y + Math.sin(a) * 26 - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
      }
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
    // hero sprite: STATIC emblem (no frame animation)
    const spr = SPR[this.base] || SPR['hero_' + this.hero.id];
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
