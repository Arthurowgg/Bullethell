// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/enemy.js
// The 8 enemy archetypes' behaviors. Status effects (root/freeze/burn/chill)
// are applied uniformly; each behavior shapes movement + attacks.
// ---------------------------------------------------------------------------
import { TAU, rand, angleTo, dist, dist2, clamp, uid } from '../core/util.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { Patterns, Spiral } from './patterns.js';

export function makeEnemy(def, x, y, slot = 0) {
  return {
    uid: uid(), def, type: def.id,
    x, y, hp: def.hp, maxHp: def.hp, r: def.radius,
    speed: def.speed,
    vx: 0, vy: 0,
    spawnT: 0.6,
    attackT: rand(0.8, def.attack ? def.attack.cd : 99),
    rooted: 0, frozen: 0, burn: 0, burnT: 0, chill: 0, flash: 0,
    orbCd: 0, hamCd: 0, auraSlowed: false,
    dead: false,
    slot,
    // behavior state
    t: rand(0, 10), state: 'stalk', stateT: 0,
    wob: rand(0, TAU), strafe: Math.random() < 0.5 ? 1 : -1,
    spiral: null, phaseT: 0, visible: true,
    chargeDir: 0,
  };
}

export function updateEnemy(e, dt, G) {
  e.t += dt;
  e.flash = Math.max(0, e.flash - dt);
  e.orbCd -= dt; e.hamCd -= dt;
  if (e.spawnT > 0) { e.spawnT -= dt; return; }

  // status
  if (e.rooted > 0) e.rooted -= dt;
  if (e.frozen > 0) e.frozen -= dt;
  if (e.chill > 0) e.chill -= dt;
  if (e.burnT > 0) {
    e.burnT -= dt;
    e.hp -= e.burn * dt;
    if (Math.random() < dt * 8) G.particles.spark(e.x, e.y - 4, '#ff8c3b', 1);
    if (e.hp <= 0) { G.killEnemy(e); return; }
  }
  const slowed = (e.chill > 0 ? 0.5 : 1) * (e.auraSlowed ? 0.8 : 1) * (e.state === 'telegraph' ? 0 : 1);
  e.auraSlowed = false;
  const canMove = e.rooted <= 0 && e.frozen <= 0;
  const canAct = e.frozen <= 0;

  const P = G.player;
  const arena = G.arena;
  const spawn = (o) => G.bullets.spawnEnemy(o);
  const api = { spawn };

  let mvx = 0, mvy = 0;

  switch (e.def.behavior) {
    case 'formation': {
      const fx = G.formation.x + ((e.slot % 4) - 1.5) * 34;
      const fy = G.formation.y + (Math.floor(e.slot / 4) - 1) * 30;
      const d = dist(e.x, e.y, fx, fy);
      if (d > 4) { mvx = (fx - e.x) / d; mvy = (fy - e.y) / d; }
      if (canAct) e.attackT -= dt;
      if (canAct && e.attackT <= 0) {
        e.attackT = e.def.attack.cd * rand(0.9, 1.2);
        Patterns.diamond(e.x, e.y, 4, 90, api, { b: { sprite: 'b_orange' } });
        G.audio.sfx('clank');
      }
      break;
    }
    case 'swarm': {
      const ringA = e.slot * 0.9 + e.t * 0.25;
      const tx = P.x + Math.cos(ringA) * 46;
      const ty = P.y + Math.sin(ringA) * 46;
      const d = dist(e.x, e.y, tx, ty);
      if (d > 3) { mvx = (tx - e.x) / d; mvy = (ty - e.y) / d; }
      if (canAct && e.def.attack) {
        e.attackT -= dt;
        if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd * rand(0.85, 1.2);
          Patterns.aimed(e.x, e.y, P.x, P.y, 1, 0, 120, api, { b: { sprite: 'b_green' } });
        }
      }
      break;
    }
    case 'erratic': {
      e.wob += rand(-6, 6) * dt;
      const a = angleTo(e.x, e.y, P.x, P.y) + Math.sin(e.wob) * 1.2;
      mvx = Math.cos(a); mvy = Math.sin(a);
      if (canAct && e.def.attack) {
        e.attackT -= dt;
        if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd;
          G.hazards.zone(e.x, e.y, 26, { telegraph: 0.8, duration: 1.4, color: '#7b5cff', damage: 10 });
        }
      }
      break;
    }
    case 'kite': {
      const d = dist(e.x, e.y, P.x, P.y);
      const a = angleTo(e.x, e.y, P.x, P.y);
      const want = 130;
      const toward = d > want + 16 ? 1 : d < want - 16 ? -1 : 0;
      mvx = Math.cos(a) * toward + Math.cos(a + Math.PI / 2) * e.strafe * 0.7;
      mvy = Math.sin(a) * toward + Math.sin(a + Math.PI / 2) * e.strafe * 0.7;
      if (Math.random() < dt * 0.2) e.strafe *= -1;
      if (canAct) {
        if (e.spiral) {
          e.spiral.life -= dt;
          e.spiral.moveTo(e.x, e.y);
          e.spiral.update(dt, api);
          if (e.spiral.life <= 0) e.spiral = null;
        } else {
          e.attackT -= dt;
          if (e.attackT <= 0) {
            e.attackT = e.def.attack.cd;
            e.spiral = new Spiral(e.x, e.y, { arms: 1, step: 0.09, speed: 80, rot: 5, b: { sprite: 'b_pink' } });
            e.spiral.life = 1.4;
          }
        }
      }
      break;
    }
    case 'slowTank': {
      const a = angleTo(e.x, e.y, P.x, P.y);
      mvx = Math.cos(a); mvy = Math.sin(a);
      if (canAct) {
        e.attackT -= dt;
        if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd;
          // laser line through the player, extended to arena edges
          const la = angleTo(e.x, e.y, P.x, P.y);
          const dx = Math.cos(la), dy = Math.sin(la);
          G.hazards.laser(e.x, e.y, e.x + dx * 900, e.y + dy * 900, { telegraph: 0.9, duration: 0.55, width: 7, color: '#c95df2', damage: 20 });
          G.audio.sfx('warn');
        }
      }
      break;
    }
    case 'phase': {
      e.phaseT += dt;
      const cycle = e.phaseT % 4;
      if (cycle > 3.2 && e.visible) { e.visible = false; G.particles.burst(e.x, e.y, '#9fd8bb', 8, 60, 0.4); }
      if (cycle <= 0.2 && !e.visiblePrev) {
        // reappear near player
        const a = rand(0, TAU);
        e.x = clamp(P.x + Math.cos(a) * 70, 20, 620);
        e.y = clamp(P.y + Math.sin(a) * 70, 20, 340);
        e.visible = true;
        G.particles.burst(e.x, e.y, '#9fd8bb', 10, 70, 0.4);
        G.audio.sfx('port');
      }
      e.visiblePrev = cycle <= 0.2;
      if (e.visible) {
        const a = angleTo(e.x, e.y, P.x, P.y);
        mvx = Math.cos(a); mvy = Math.sin(a);
        if (canAct) {
          e.attackT -= dt;
          if (e.attackT <= 0) {
            e.attackT = e.def.attack.cd;
            Patterns.aimed(e.x, e.y, P.x, P.y, 3, 0.5, 140, api, { b: { sprite: 'b_blade' } });
          }
        }
      } else { mvx = 0; mvy = 0; }
      break;
    }
    case 'charger': {
      e.stateT -= dt;
      if (e.state === 'stalk') {
        const a = angleTo(e.x, e.y, P.x, P.y);
        mvx = Math.cos(a); mvy = Math.sin(a);
        if (canAct) {
          e.attackT -= dt;
          if (e.attackT <= 0 || (dist(e.x, e.y, P.x, P.y) < 120 && Math.random() < dt)) {
            e.attackT = e.def.attack.cd;
            e.state = 'telegraph'; e.stateT = 0.6;
            e.chargeDir = angleTo(e.x, e.y, P.x, P.y);
          }
        }
      } else if (e.state === 'telegraph') {
        mvx = 0; mvy = 0;
        if (e.stateT <= 0) { e.state = 'charge'; e.stateT = 0.45; G.audio.sfx('dash'); }
      } else if (e.state === 'charge') {
        mvx = Math.cos(e.chargeDir) * 2.6; mvy = Math.sin(e.chargeDir) * 2.6;
        if (Math.random() < dt * 20) G.particles.spark(e.x, e.y, '#7fd4ff', 1);
        if (e.stateT <= 0) {
          e.state = 'stalk';
          // ice spikes ring where it stopped
          Patterns.ring(e.x, e.y, 8, 110, api, { b: { sprite: 'b_ice' } });
          G.hazards.zone(e.x, e.y, 30, { telegraph: 0.5, duration: 1.2, color: '#7fd4ff', damage: 10 });
          G.audio.sfx('freeze');
        }
      }
      break;
    }
    case 'wander': {
      e.wob += rand(-4, 4) * dt;
      mvx = Math.cos(e.wob); mvy = Math.sin(e.wob);
      break;
    }
  }

  if (!canMove) { mvx = 0; mvy = 0; }
  const sp = e.speed * slowed * (e.state === 'charge' ? 1 : 1);
  e.vx = mvx * sp; e.vy = mvy * sp;
  e.x += e.vx * dt;
  e.y += e.vy * dt;
  [e.x, e.y] = arena.clamp(e.x, e.y, e.r);
  if (e.def.behavior !== 'wander') [e.x, e.y] = [e.x, e.y];
  else {
    // bounce
    const b = arena.bounds;
    if (e.x <= b.x + e.r || e.x >= b.x + b.w - e.r) e.wob = Math.PI - e.wob;
    if (e.y <= b.y + e.r || e.y >= b.y + b.h - e.r) e.wob = -e.wob;
  }

  // contact damage
  e.lungeCd = (e.lungeCd || 0) - dt;
  if (e.visible !== false && P.alive && e.spawnT <= 0) {
    if (dist2(e.x, e.y, P.x, P.y) < (e.r + P.r) ** 2) {
      if (P.dashT > 0 && P.lungeDmg && e.lungeCd <= 0) {
        e.lungeCd = 0.3;
        G.damageEnemy(e, P.lungeDmg, e.x, e.y);
      } else if (G.player.hurt(G, e.def.contact)) {
        // knockback enemy a bit
        e.x -= (P.x - e.x) * -0.2; e.y -= (P.y - e.y) * -0.2;
      }
      if (G.runStats.thorns > 0) G.damageEnemy(e, G.runStats.thorns, e.x, e.y, true);
    }
  }
}

export function drawEnemy(ctx, e) {
  const spr = SPR[e.flash > 0 ? e.def.spriteB : e.def.sprite] || SPR[e.def.sprite];
  if (!spr) return;
  const alpha = e.spawnT > 0 ? 1 - e.spawnT / 0.6 : e.visible === false ? 0.25 : 1;
  drawSprite(ctx, spr, e.x, e.y + (e.def.behavior === 'wander' ? Math.round(Math.sin(e.t * 8)) : 0), {
    alpha,
    tint: e.frozen > 0 ? '#7fd4ff' : e.rooted > 0 ? '#ffffff' : undefined,
  });
  if (e.spawnT > 0) {
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(e.x - 6, e.y - 6, 12, 12);
    ctx.globalAlpha = 1;
  }
  // elite hp bar
  if (e.maxHp >= 100 && e.hp < e.maxHp) {
    const w = 18;
    ctx.fillStyle = '#000';
    ctx.fillRect(e.x - w / 2, e.y - e.r - 6, w, 2);
    ctx.fillStyle = '#c95df2';
    ctx.fillRect(e.x - w / 2, e.y - e.r - 6, w * clamp(e.hp / e.maxHp, 0, 1), 2);
  }
}
