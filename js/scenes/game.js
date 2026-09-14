// ---------------------------------------------------------------------------
// MARVEL NEXUS — scenes/game.js
// The run orchestrator: collision, XP/levels, rewards, pause, win/lose.
// ---------------------------------------------------------------------------
import { Scene, UI, setCtx } from './scene.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { Particles } from '../core/particles.js';
import { Arena, VIEW_W, VIEW_H } from '../game/arena.js';
import { BulletSystem, Hazards } from '../game/bullets.js';
import { Pickups } from '../game/pickups.js';
import { Player } from '../game/player.js';
import { makeEnemy, updateEnemy, drawEnemy } from '../game/enemy.js';
import { Boss } from '../game/boss.js';
import { WaveDirector, ROUNDS } from '../game/waves.js';
import { ComicUI } from '../game/comic.js';
import { newRunStats, gainXp, xpNeed } from '../game/run.js';
import { rollUpgradeChoices, RARITY } from '../data/upgrades.js';
import { skinById } from '../data/shop.js';
import { heroById } from '../data/heroes.js';
import { raidById } from '../data/raids.js';
import { bossById } from '../data/bosses.js';
import { drawHud } from '../game/hud.js';
import { drawText } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { Save } from '../core/save.js';
import { TAU, rand, chance, dist2, angleTo, clamp, pick } from '../core/util.js';

export class GameScene extends Scene {
  enter(G, params) {
    this.params = params;
    this.mode = params.mode || 'run';
    this.raid = params.raidId ? raidById(params.raidId) : null;
    this.hero = heroById(params.heroId || Save.data.heroSelected);
    this.save = Save.data;

    G.arena = new Arena(this.raid ? this.raid.theme : 'nexus', params.seed || 7);
    G.bullets = new BulletSystem();
    G.hazards = new Hazards();
    G.pickups = new Pickups();
    G.particles = new Particles();
    G.audio = Audio;
    G.runStats = newRunStats(this.hero, this.save);
    const skinId = this.save.cosmeticsEquipped[this.hero.id];
    const skin = skinById(skinId);
    G.player = new Player(this.hero, G.runStats, skin && skin.hero === this.hero.id ? skin : null);
    G.enemies = [];
    G.boss = null;
    G.time = 0;
    G.kills = 0;
    G.runFragments = 0;
    G.takenUpgrades = {};
    this.levelQueue = 0;
    this.levelChoices = null;
    this.paused = false;
    this.state = 'intro';
    this.introT = 2.2;
    G.banner = { text: this.raid ? this.raid.name : 'NEXO DE COMBATE', color: this.hero.color, t: 2.2 };
    G.hintT = this.save.tutorialDone ? 0 : 8;
    G.comic = new ComicUI();
    this.currentFinal = false;
    this.endT = 0;
    this.endState = null;
    this.slowmo = 1;
    G.formation = { x: 320, y: 90 };
    this.formationSlot = 0;
    this.raidAddT = 18;
    this.playerBeam = null;
    this.nearMiss = new Set();

    this.transition = null;
    G.portal = null;
    if (this.mode === 'raid') {
      G.boss = new Boss(bossById(this.raid.boss), 1);
      this.save.discovered.bosses[this.raid.boss] = true;
      this.curWorld = null;
    } else {
      G.waves = new WaveDirector();
      const sr = params.startRound || 1;
      if (sr > 1) {
        G.waves.round = sr - 1;
        G.waves.durT = null;
      }
      this.curWorld = this.worldForRound(sr);
      G.arena.setTheme(this.curWorld);
      G.comic.push('round', 'ROUND ' + sr, this.WORLD_LABEL[this.curWorld], 'burst', '#ffd94a', { world: this.curWorld });
    }

    Audio.playTrack(this.mode === 'raid' ? 'boss' : 'combat');
    this.save.stats.runs++;
    Save.save();
  }

  // ---- the G api passed around --------------------------------------------
  api(G) {
    const self = this;
    return {
      get input() { return Input; },
      get arena() { return G.arena; },
      get formation() { return G.formation; },
      get pickups() { return G.pickups; },
      get boss() { return G.boss; },
      get time() { return G.time; },
      get bullets() { return G.bullets; },
      get hazards() { return G.hazards; },
      get particles() { return G.particles; },
      get audio() { return Audio; },
      get enemies() { return G.enemies; },
      get player() { return G.player; },
      get runStats() { return G.runStats; },
      get settings() { return self.save.settings; },
      damageEnemy: (e, dmg, x, y, silent) => self.damageEnemy(G, e, dmg, x, y, silent),
      killEnemy: (e) => self.killEnemy(G, e),
      chainLightning: (x, y, n, dmg, range) => self.chainLightning(G, x, y, n, dmg, range),
      lightningStrike: (x, y, dmg, radius) => self.lightningStrike(G, x, y, dmg, radius),
      fireMissile: (x, y, a, dmg) => self.fireMissile(G, x, y, a, dmg),
      beamSweep: (p, dur, dmg) => { self.playerBeam = { a: p.aim - 0.7, rot: 0.8, t: 0, dur, dmg, len: 220 }; Audio.sfx('laser'); },
      summon: (type, n, edges) => self.summon(G, type, n, edges),
      nearestEnemy: (x, y, maxD) => self.nearestEnemy(x, y, maxD),
      randomEnemyOrPoint: () => self.randomEnemyOrPoint(G),
      collect: (p) => self.collect(G, p),
      startIncursion: (id, fin) => self.startIncursion(G, id, fin),
      openPortal: (id, fin) => self.openPortal(G, id, fin),
      setWorldForRound: (n) => self.setWorldForRound(G, n),
      comicRound: (n) => G.comic.push('round', 'ROUND ' + n, self.WORLD_LABEL[self.curWorld] || '', 'burst', '#ffd94a', { world: self.curWorld }),
      get comic() { return G.comic; },
      get transition() { return self.transition; },
    };
  }

  // ---- helpers ------------------------------------------------------------
  summon(G, type, n = 1, edges = false) {
    const def = (typeof window !== 'undefined' ? window : globalThis).__nx_enemy(type);
    if (!def) return;
    for (let i = 0; i < n; i++) {
      let x, y;
      if (edges) {
        const side = (Math.random() * 4) | 0;
        const b = G.arena.bounds;
        if (side === 0) { x = rand(b.x + 10, b.x + b.w - 10); y = b.y + 10; }
        else if (side === 1) { x = rand(b.x + 10, b.x + b.w - 10); y = b.y + b.h - 10; }
        else if (side === 2) { x = b.x + 10; y = rand(b.y + 10, b.y + b.h - 10); }
        else { x = b.x + b.w - 10; y = rand(b.y + 10, b.y + b.h - 10); }
      } else {
        [x, y] = G.arena.randomWalkable();
      }
      const e = makeEnemy(def, x, y, this.formationSlot++);
      G.enemies.push(e);
      this.save.discovered.enemies[type] = true;
      G.particles.burst(x, y, '#b06bff', 6, 50, 0.4);
    }
  }

  nearestEnemy(x, y, maxD) {
    let best = null, bd = maxD * maxD;
    for (const e of G_last.enemies) {
      if (e.dead || e.spawnT > 0 || e.visible === false) continue;
      const d = dist2(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (G_last.boss && !G_last.boss.dead) {
      const d = dist2(x, y, G_last.boss.x, G_last.boss.y);
      if (d < bd) best = G_last.boss;
    }
    return best;
  }

  randomEnemyOrPoint(G) {
    const alive = G.enemies.filter((e) => !e.dead);
    if (alive.length && chance(0.7)) return pick(alive);
    return { x: rand(60, 580), y: rand(50, 310) };
  }

  damageEnemy(G, e, dmg, x, y, silent) {
    if (e.dead) return;
    const st = G.runStats;
    e.flash = 0.07;
    e.hp -= dmg;
    if (st.burn) { e.burn = st.burn; e.burnT = 3; }
    if (st.chill) e.chill = Math.max(e.chill, st.chill);
    if (this.save.settings.dmgNumbers && !silent) {
      G.particles.text(x || e.x, (y || e.y) - 8, String(Math.round(dmg)), dmg > 20 ? '#ffd94a' : '#ffffff');
    }
    if (st.lifesteal > 0) G.player.heal(dmg * st.lifesteal);
    G.player.addCharge(0.6);
    if (!silent) Audio.sfx('hit');
    if (e.hp <= 0) this.killEnemy(G, e);
  }

  killEnemy(G, e) {
    if (e.dead) return;
    e.dead = true;
    G.kills++;
    this.save.stats.kills++;
    G.player.addCharge(2);
    G.particles.explosion(e.x, e.y, ['#ff8c3b', '#ff4d4d', '#ffffff'], 14, 110);
    Audio.sfx('boom');
    // drops
    G.pickups.drop(e.x, e.y, 'xp', e.def.xp);
    if (chance(0.35)) G.pickups.drop(e.x + 4, e.y, 'xp', e.def.xp);
    if (chance(0.3)) G.pickups.drop(e.x - 4, e.y + 2, 'fragment', e.def.fragments);
    if (chance(0.03)) G.pickups.drop(e.x, e.y - 4, 'heart', 20);
    // splits & death effects
    if (e.def.splits && !e.isSplit) {
      for (let i = 0; i < 2; i++) {
        const child = makeEnemy((typeof window !== 'undefined' ? window : globalThis).__nx_enemy(e.def.splits), e.x + rand(-8, 8), e.y + rand(-8, 8), this.formationSlot++);
        child.isSplit = true;
        child.spawnT = 0.2;
        G.enemies.push(child);
      }
    }
    if (e.def.explodeOnDeath) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        G.bullets.spawnEnemy({ x: e.x, y: e.y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, sprite: 'b_pink' });
      }
    }
  }

  chainLightning(G, x, y, n, dmg, range) {
    const hit = [];
    let cx = x, cy = y;
    let pool = G.enemies.filter((e) => !e.dead && e.spawnT <= 0);
    if (G.boss && !G.boss.dead) pool.push(G.boss);
    for (let i = 0; i < n && pool.length; i++) {
      let best = null, bd = (i === 0 ? range : 120) ** 2;
      for (const e of pool) {
        const d = dist2(cx, cy, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) break;
      G.player.zaps.push({ x1: cx, y1: cy, x2: best.x, y2: best.y, t: 0.18 });
      G.particles.spark(best.x, best.y, '#9feaff', 4);
      if (best === G.boss) G.boss.hurt(G, dmg, best.x, best.y);
      else this.damageEnemy(G, best, dmg, best.x, best.y, true);
      hit.push(best);
      pool = pool.filter((e) => e !== best);
      cx = best.x; cy = best.y;
    }
    return hit;
  }

  lightningStrike(G, x, y, dmg, radius) {
    G.particles.burst(x, y, '#9feaff', 12, 120, 0.4);
    G.particles.addShake(2);
    G.player.zaps.push({ x1: x + rand(-6, 6), y1: y - 120, x2: x, y2: y, t: 0.2 });
    Audio.sfx('zap');
    for (const e of G.enemies) {
      if (!e.dead && dist2(x, y, e.x, e.y) < radius * radius) this.damageEnemy(G, e, dmg, e.x, e.y, true);
    }
    if (G.boss && !G.boss.dead && dist2(x, y, G.boss.x, G.boss.y) < (radius + 16) ** 2) G.boss.hurt(G, dmg, G.boss.x, G.boss.y);
  }

  fireMissile(G, x, y, a, dmg) {
    G.bullets.spawnPlayer({
      x, y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160,
      dmg, homing: 5, r: 3, sprite: 'b_orange', life: 3,
    });
    Audio.sfx('ability');
  }

  collect(G, p) {
    if (p.kind === 'xp') {
      Audio.sfx('gem');
      gainXp(G.runStats, p.value, () => { this.levelQueue++; Audio.sfx('level'); });
    } else if (p.kind === 'heart') {
      G.player.heal(p.value);
      Audio.sfx('pick');
      G.particles.text(G.player.x, G.player.y - 10, '+' + p.value, '#ff4d6b');
    } else {
      G.runFragments += p.value;
      Audio.sfx('pick');
      G.particles.text(G.player.x, G.player.y - 10, '+' + p.value, '#4dd8ff');
    }
  }

  WORLD_LABEL = {
    wakanda: 'REINO DE VIBRANIUM', asgard: 'PONTE DO ARCO-ÍRIS', newyork: 'CRUZAMENTO DOS HERÓIS',
    boss_ultron: 'SOKOVIA SUSPENSA', boss_loki: 'SALÃO DAS ILUSÕES', boss_hela: 'REINO DOS MORTOS',
    boss_devourer: 'VAZIO CÓSMICO', boss_thanos: 'MUNDO EM CINZAS',
  };

  // ---- reality tear / portal to boss worlds -------------------------------
  openPortal(G, bossId, final) {
    const b = G.arena.bounds;
    G.portal = { x: rand(b.x + 80, b.x + b.w - 80), y: rand(b.y + 70, b.y + b.h - 60), r: 16, t: 0, bossId, final };
    G.comic.push('event', 'RASGO DE REALIDADE', 'ENTRE NO PORTAL PARA A INCURSÃO', 'portal', '#b06bff');
    Audio.sfx('port');
  }

  worldForRound(n) {
    if (n <= 3) return 'wakanda';
    if (n <= 7) return 'asgard';
    return 'newyork';
  }

  setWorldForRound(G, n) {
    const w = this.worldForRound(n);
    if (w && w !== this.curWorld) {
      this.curWorld = w;
      if (this.transition && this.transition.phase === 'out') this.transition.to = w;
      else { G.arena.setTheme(w); G.particles.addFlash('#ffffff', 0.35); }
    }
  }

  drawPortal(ctx, G) {
    const p = G.portal;
    const t = G.time;
    const pul = 1 + Math.sin(t * 5) * 0.08;
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    // outer glow
    ctx.globalAlpha = 0.25 + Math.sin(t * 5) * 0.08;
    ctx.fillStyle = '#b06bff';
    ctx.beginPath(); ctx.arc(0, 0, p.r + 10, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    // jagged tear: rotating shards
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + t * 1.6;
      const rr = (p.r + 4 + Math.sin(t * 7 + i * 3) * 3) * pul;
      ctx.fillStyle = i % 2 ? '#7b2fff' : '#ff5df2';
      ctx.fillRect(Math.round(Math.cos(a) * rr) - 1, Math.round(Math.sin(a) * rr * 1.15) - 2, 2, 4);
    }
    // void core
    ctx.fillStyle = '#05010a';
    ctx.beginPath(); ctx.ellipse(0, 0, p.r * 0.7 * pul, p.r * 0.9 * pul, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ff5df2';
    ctx.beginPath(); ctx.ellipse(0, 0, p.r * 0.7 * pul, p.r * 0.9 * pul, 0, 0, TAU); ctx.stroke();
    // inner swirl
    ctx.strokeStyle = '#b06bff';
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 0.4, t * 4, t * 4 + 2.2);
    ctx.stroke();
    ctx.restore();
    drawText(ctx, 'ENTRE NO RASGO', p.x, p.y + p.r + 14, { align: 'center', scale: 1, color: '#ff5df2', shadow: true });
  }

  drawTransition(ctx, tr) {
    const total = 1.1;
    const q = tr.phase === 'in' ? 1 - tr.t / total : tr.t / total;
    const e = Math.min(1, Math.max(0, q));
    ctx.save();
    // expanding/contracting reality-warp wash
    ctx.fillStyle = `rgba(123,47,255,${0.55 * e})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.strokeStyle = `rgba(255,93,242,${0.8 * e})`;
    const R = 40 + 600 * e;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(VIEW_W / 2, VIEW_H / 2, Math.max(1, R - i * 60), 0, TAU);
      ctx.stroke();
    }
    // streaks toward center
    ctx.fillStyle = `rgba(255,255,255,${0.5 * e})`;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      const rr = 340 * (1 - e) + 30;
      ctx.fillRect(VIEW_W / 2 + Math.cos(a) * rr - 1, VIEW_H / 2 + Math.sin(a) * rr * 0.6 - 1, 2, 2);
    }
    if (e > 0.85) {
      ctx.fillStyle = `rgba(255,255,255,${(e - 0.85) / 0.15})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    ctx.restore();
  }

  startIncursion(G, bossId, final) {
    const def = bossById(bossId);
    this.currentFinal = final;
    G.boss = new Boss(def, final ? 0.8 : 1);
    this.save.discovered.bosses[bossId] = true;
    G.comic.push('boss', def.name, def.intro || 'INCURSÃO EM CURSO', 'alarm', '#ff4d4d', { bossId });
    Audio.sfx('phase');
    Audio.playTrack('boss');
  }

  // ---- update ---------------------------------------------------------------
  update(dt, G) {
    setCtx(G.ctx);
    if (this.state === 'done') return;

    if (Input.pressed('Escape') || Input.pressed('KeyP')) {
      if (this.levelChoices == null) {
        this.paused = !this.paused;
        Audio.sfx(this.paused ? 'ui' : 'uiBack');
      }
    }
    if (this.paused) { this.updatePause(G); return; }

    // level-up overlay pauses the world
    if (this.levelQueue > 0 && this.levelChoices == null) {
      this.levelQueue = 0;
      this.levelChoices = rollUpgradeChoices(this.save, this.hero.id, G.runStats, G.takenUpgrades, G.runStats.upChoices);
    }
    if (this.levelChoices) { this.updateLevelUp(G); return; }

    const sdt = dt * this.slowmo;
    G.time += sdt;
    G.hintT = Math.max(0, G.hintT - dt);
    if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }

    if (this.state === 'intro') {
      this.introT -= dt;
      if (this.introT <= 0) this.state = 'playing';
    }

    G.formation.x = 320 + Math.sin(G.time * 0.3) * 150;
    G.formation.y = 90 + Math.sin(G.time * 0.17) * 26;

    const api = this.api(G);
    G_last = G; // for nearestEnemy convenience

    if (this.state === 'playing') {
      G.player.update(sdt, api);

      // raid periodic adds
      if (this.mode === 'raid') {
        this.raidAddT -= sdt;
        if (this.raidAddT <= 0 && G.enemies.length < 14) {
          this.raidAddT = 16;
          this.summon(G, pick(['drone', 'chitauri', 'chaos']), 2, true);
        }
      } else {
        G.waves.update(sdt, api);
      }

      // reality tear portal: enter to reach the boss world
      if (G.portal) {
        const p = G.portal;
        p.t += sdt;
        if (Math.random() < 0.5) G.particles.spark(p.x + rand(-16, 16), p.y + rand(-16, 16), '#b06bff', 1);
        if (dist2(G.player.x, G.player.y, p.x, p.y) < (p.r + G.player.r + 2) ** 2) {
          this.transition = { t: 1.1, phase: 'in', to: 'boss_' + p.bossId, bossId: p.bossId, final: p.final };
          G.portal = null;
          Audio.sfx('port');
        }
      }
      if (this.transition) {
        const tr = this.transition;
        tr.t -= sdt;
        if (tr.t <= 0) {
          if (tr.phase === 'in') {
            G.arena.setTheme(tr.to);
            this.startIncursion(G, tr.bossId, tr.final);
          } else {
            G.arena.setTheme(tr.to);
            G.particles.addFlash('#ffffff', 0.3);
          }
          this.transition = null;
        }
      }

      // enemies
      for (const e of G.enemies) if (!e.dead) updateEnemy(e, sdt, api);
      G.enemies = G.enemies.filter((e) => !e.dead);

      // boss
      if (G.boss) {
        G.boss.update(sdt, api);
        if (G.boss.dead && !this.endState) {
          if (this.currentFinal || this.mode === 'raid') {
            this.beginEnd(G, true);
          } else {
            // mid-run incursion cleared: reward, heal, bonus level, next round
            const b = G.boss;
            this.save.bossesDefeated[b.def.id] = (this.save.bossesDefeated[b.def.id] || 0) + 1;
            G.runFragments += 60;
            G.player.heal(30);
            this.levelQueue++;
            G.particles.explosion(b.x, b.y, ['#ffd94a', '#ff8c3b', '#b06bff', '#ffffff'], 50, 200);
            G.particles.addShake(8);
            Audio.sfx('victory');
            G.comic.push('clear', 'INCURSÃO CONCLUÍDA', '+60 FRAGMENTOS · +1 NÍVEL · +30 VIDA', 'shield', '#4dff88');
            for (const bl of G.bullets.enemy.live) { bl.dead = true; G.particles.spark(bl.x, bl.y, '#b06bff', 2); }
            G.boss = null;
            this.transition = { t: 1.1, phase: 'out', to: this.curWorld };
            Audio.playTrack('combat');
          }
        }
      }

      // bullets
      G.bullets.update(sdt, G.arena, G.enemies);
      this.collide(G);

      // player beam (iron unibeam)
      if (this.playerBeam) {
        const b = this.playerBeam;
        b.t += sdt;
        if (b.t > b.dur) this.playerBeam = null;
        else if (b.t > 0.5) {
          b.a += b.rot * sdt;
          for (const e of G.enemies) {
            if (e.dead) continue;
            const d = Math.hypot(e.x - G.player.x, e.y - G.player.y);
            if (d > b.len) continue;
            let da = angleTo(G.player.x, G.player.y, e.x, e.y) - b.a;
            while (da > Math.PI) da -= TAU;
            while (da < -Math.PI) da += TAU;
            if (Math.abs(da) < 0.16) this.damageEnemy(G, e, b.dmg * sdt * 4, e.x, e.y, true);
          }
        }
      }

      G.hazards.update(sdt);
      for (const dmg of G.hazards.playerHits(G.player.x, G.player.y, G.player.r)) G.player.hurt(G, dmg);

      G.pickups.update(sdt, api);
      G.particles.update(dt, this.save.settings.screenshake);
      if (G.comic) G.comic.update(dt);

      if (this.save.dev && this.save.dev.infSpecial) G.player.charge = 100;
      if (!G.player.alive && !this.endState) this.beginEnd(G, false);
    } else {
      G.particles.update(dt, this.save.settings.screenshake);
    }

    // slow-mo on end
    if (this.endState) {
      this.endT -= dt;
      this.slowmo = 0.3;
      if (this.endT <= 0) {
        this.state = 'done';
        G.gotoResults(this.endState);
      }
    }
  }

  beginEnd(G, win) {
    if (this.endState) return;
    this.endState = { win };
    this.endT = win ? 2.2 : 1.6;
    if (win) {
      Audio.sfx('victory');
      G.particles.addFlash('#ffffff', 0.6);
      const b = G.boss;
      if (b) {
        G.particles.explosion(b.x, b.y, ['#ffd94a', '#ff8c3b', '#b06bff', '#ffffff'], 60, 220);
        G.particles.addShake(9);
        Audio.sfx('bigboom');
        this.save.bossesDefeated[b.def.id] = (this.save.bossesDefeated[b.def.id] || 0) + 1;
        if (this.raid) {
          const rc = this.save.raidsCleared[this.raid.id] || { wins: 0, bestTime: 9999 };
          rc.wins++;
          rc.bestTime = Math.min(rc.bestTime, G.time);
          this.save.raidsCleared[this.raid.id] = rc;
        }
      }
    } else {
      Audio.sfx('defeat');
      G.particles.addFlash('#ff2b2b', 0.6);
      G.particles.explosion(G.player.x, G.player.y, ['#ff4d4d', '#ffffff'], 30, 160);
    }
    this.save.stats.wins += win ? 1 : 0;
    this.save.stats.deaths += win ? 0 : 1;
    this.save.stats.levelReached = Math.max(this.save.stats.levelReached, G.runStats.level);
    Save.save();
  }

  collide(G) {
    const P = G.player;
    // player bullets vs enemies/boss
    for (const b of G.bullets.player.live) {
      if (b.dead) continue;
      for (const e of G.enemies) {
        if (e.dead || e.spawnT > 0 || e.visible === false) continue;
        if (dist2(b.x, b.y, e.x, e.y) < (e.r + b.r) ** 2) {
          if (b.pierce > 0 && b.hitIds) {
            if (b.hitIds.has(e.uid)) continue;
            b.hitIds.add(e.uid);
          }
          if (b.root) e.rooted = Math.max(e.rooted || 0, b.root);
          if (b.split && !b.didSplit) {
            b.didSplit = true;
            for (const off of [-0.7, 0.7]) {
              const a = Math.atan2(b.vy, b.vx) + off;
              G.bullets.spawnPlayer({ x: b.x, y: b.y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, dmg: b.dmg * 0.6, pierce: 1 });
            }
          }
          G.particles.spark(b.x, b.y, '#ffffff', 2);
          this.damageEnemy(G, e, b.dmg, e.x, e.y);
          if (b.pierce > 0 && b.hitIds && b.hitIds.size > b.pierce) b.dead = true;
          else if (b.pierce <= 0) { b.dead = true; }
          if (b.dead) break;
        }
      }
      if (b.dead) continue;
      const bo = G.boss;
      if (bo && !bo.dead && bo.introT <= 0 && dist2(b.x, b.y, bo.x, bo.y) < (bo.r + b.r + 2) ** 2) {
        const dealt = bo.hurt(G, b.dmg, b.x, b.y);
        if (dealt) {
          G.particles.spark(b.x, b.y, '#ffffff', 3);
          if (G.runStats.lifesteal) P.heal(dealt * G.runStats.lifesteal);
          P.addCharge(0.4);
          if (this.save.settings.dmgNumbers) G.particles.text(b.x, b.y - 8, String(Math.round(dealt)), '#ffd94a');
        }
        b.dead = true;
      }
    }
    // enemy bullets vs player
    if (P.alive) {
      for (const b of G.bullets.enemy.live) {
        if (b.dead) continue;
        if (b.fade && b.life < 9 - b.fade) { b.dead = true; G.particles.spark(b.x, b.y, '#4dff88', 2); continue; }
        const d2 = dist2(b.x, b.y, P.x, P.y);
        if (d2 < (P.r + b.r - 1) ** 2) {
          b.dead = true;
          P.hurt(G, 10 + Math.floor(G.time / 45) * 2);
        } else if (d2 < 26 * 26 && !this.nearMiss.has(b)) {
          this.nearMiss.add(b);
          if (this.nearMiss.size > 800) this.nearMiss.clear();
          this.save.stats.bulletsDodged++;
        }
      }
    }
  }

  updateLevelUp(G) {
    setCtx(G.ctx);
    if (Input.pressed('Digit1')) this.chooseUpgrade(G, 0);
    if (Input.pressed('Digit2')) this.chooseUpgrade(G, 1);
    if (Input.pressed('Digit3')) this.chooseUpgrade(G, 2);
    if (Input.pressed('Digit4') && this.levelChoices[3]) this.chooseUpgrade(G, 3);
  }

  chooseUpgrade(G, i) {
    const u = this.levelChoices[i];
    if (!u) return;
    u.apply(G.runStats);
    G.takenUpgrades[u.id] = (G.takenUpgrades[u.id] || 0) + 1;
    this.levelChoices = null;
    Audio.sfx('level');
    G.particles.ring(G.player.x, G.player.y, '#ffd94a', 16, 120);
  }

  updatePause(G) {
    setCtx(G.ctx);
  }

  // ---- draw ---------------------------------------------------------------
  draw(ctx, G) {
    setCtx(ctx);
    ctx.save();
    if (G.particles.shake && this.save.settings.screenshake) ctx.translate(G.particles.shakeX, G.particles.shakeY);

    G.arena.draw(ctx);
    G.pickups.draw(ctx);
    for (const e of G.enemies) drawEnemy(ctx, e);
    if (G.boss) G.boss.draw(ctx);
    G.player.draw(ctx);
    // player beam
    if (this.playerBeam) {
      const b = this.playerBeam;
      if (b.t > 0.5) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(G.player.x, G.player.y);
        ctx.lineTo(G.player.x + Math.cos(b.a) * b.len, G.player.y + Math.sin(b.a) * b.len);
        ctx.stroke();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#4dd8ff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(G.player.x, G.player.y);
        ctx.lineTo(G.player.x + Math.cos(b.a) * b.len, G.player.y + Math.sin(b.a) * b.len);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
      }
    }
    G.bullets.draw(ctx);
    G.hazards.draw(ctx);
    G.particles.draw(ctx);
    ctx.restore();

    G.particles.drawFlash(ctx, VIEW_W, VIEW_H);
    if (G.portal) this.drawPortal(ctx, G);
    if (this.transition) this.drawTransition(ctx, this.transition);
    drawHud(ctx, G);
    if (G.comic) G.comic.draw(ctx);

    // mouse cursor reticle
    if (!this.paused && !this.levelChoices) {
      ctx.strokeStyle = G.player.hero.color;
      ctx.strokeRect(Input.mouse.x - 3, Input.mouse.y - 3, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Input.mouse.x - 0.5, Input.mouse.y - 0.5, 1, 1);
    }

    if (this.levelChoices) this.drawLevelUp(ctx, G);
    if (this.paused) this.drawPause(ctx, G);
    if (this.endState) {
      ctx.fillStyle = `rgba(5,4,10,${0.5 * (1 - this.endT / 2)})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      drawText(ctx, this.endState.win ? 'VITÓRIA!' : 'DERROTADO', VIEW_W / 2, 160, { align: 'center', scale: 3, color: this.endState.win ? '#ffd94a' : '#ff4d4d', shadow: true });
    }
  }

  drawLevelUp(ctx, G) {
    ctx.fillStyle = 'rgba(5,4,10,0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawText(ctx, 'NÍVEL ' + G.runStats.level + ' — ESCOLHA UM APRIMORAMENTO', VIEW_W / 2, 60, { align: 'center', scale: 2, color: '#ffd94a', shadow: true });
    const n = this.levelChoices.length;
    const w = 140, h = 150, gap = 14;
    const total = n * w + (n - 1) * gap;
    let x = (VIEW_W - total) / 2;
    this.levelChoices.forEach((u, i) => {
      const hov = UI.hit(x, 80, w, h);
      if (hov) UI.hoverId = 'up' + i;
      ctx.fillStyle = hov ? '#241b52' : '#171233';
      ctx.fillRect(x, 80, w, h);
      const rc = RARITY[u.rarity].color;
      ctx.strokeStyle = hov ? '#ffffff' : rc;
      ctx.strokeRect(x + 0.5, 80.5, w - 1, h - 1);
      ctx.fillStyle = rc;
      ctx.fillRect(x, 80, w, 3);
      drawText(ctx, '[' + (i + 1) + ']', x + 6, 90, { color: '#8a84a8' });
      drawText(ctx, RARITY[u.rarity].name, x + w - 6, 90, { align: 'right', color: rc });
      if (u.icon && SPR[u.icon]) drawSprite(ctx, SPR[u.icon], x + w / 2, 112, { scale: 1.5 });
      // name wrap
      const words = u.name.split(' ');
      let line = '', ly = 128;
      for (const wd of words) {
        if ((line + wd).length > 16) { drawText(ctx, line, x + 8, ly, { color: '#ffffff' }); ly += 9; line = ''; }
        line += (line ? ' ' : '') + wd;
      }
      if (line) drawText(ctx, line, x + 8, ly, { color: '#ffffff' });
      ly += 14;
      // desc wrap
      const dwords = u.desc.split(' ');
      line = '';
      for (const wd of dwords) {
        if ((line + wd).length > 20) { drawText(ctx, line, x + 8, ly, { color: '#9a93c8' }); ly += 8; line = ''; }
        line += (line ? ' ' : '') + wd;
      }
      if (line) drawText(ctx, line, x + 8, ly, { color: '#9a93c8' });
      const taken = G.takenUpgrades[u.id] || 0;
      if (taken) drawText(ctx, 'RANK ' + (taken + 1), x + 8, 80 + h - 12, { color: '#ffd94a' });
      if (hov && UI.anyClick) this.chooseUpgrade(G, i);
      x += w + gap;
    });
  }

  drawPause(ctx, G) {
    ctx.fillStyle = 'rgba(5,4,10,0.82)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawText(ctx, 'PAUSA', VIEW_W / 2, 70, { align: 'center', scale: 3, color: '#e8e0ff', shadow: true });
    const bw = 200, bx = VIEW_W / 2 - bw / 2;
    if (UI.button('resume', bx, 120, bw, 26, 'CONTINUAR')) { this.paused = false; }
    if (UI.button('restart', bx, 154, bw, 26, 'REINICIAR PARTIDA')) { G.restartGame(); return; }
    if (UI.button('quit', bx, 188, bw, 26, 'SAIR PARA O LOBBY')) { G.gotoLobby(); return; }
    // volumes
    const s = this.save.settings;
    drawText(ctx, 'MÚSICA', bx, 232, { color: '#9a93c8' });
    if (UI.button('m-', bx + 70, 228, 22, 14, '-')) s.music = clamp(s.music - 0.1, 0, 1);
    if (UI.button('m+', bx + 96, 228, 22, 14, '+')) s.music = clamp(s.music + 0.1, 0, 1);
    drawText(ctx, Math.round(s.music * 100) + '%', bx + 130, 232, { color: '#e8e0ff' });
    drawText(ctx, 'SFX', bx, 252, { color: '#9a93c8' });
    if (UI.button('s-', bx + 70, 248, 22, 14, '-')) s.sfx = clamp(s.sfx - 0.1, 0, 1);
    if (UI.button('s+', bx + 96, 248, 22, 14, '+')) s.sfx = clamp(s.sfx + 0.1, 0, 1);
    drawText(ctx, Math.round(s.sfx * 100) + '%', bx + 130, 252, { color: '#e8e0ff' });
    Audio.setVolumes({ music: s.music, sfx: s.sfx, master: s.master });
    if (UI.button('shake', bx, 272, bw, 18, 'VIBRAÇÃO DE TELA: ' + (s.screenshake ? 'ON' : 'OFF'))) s.screenshake = !s.screenshake;
    Save.save();
  }
}

let G_last = null;
