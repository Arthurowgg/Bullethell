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
    shot: def.shot,
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
        Patterns.diamond(e.x, e.y, 4, 90, api, { b: { sprite: e.shot } });
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
          Patterns.aimed(e.x, e.y, P.x, P.y, 1, 0, 120, api, { b: { sprite: e.shot } });
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
            e.spiral = new Spiral(e.x, e.y, { arms: 1, step: 0.09, speed: 80, rot: 5, b: { sprite: e.shot } });
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
            Patterns.aimed(e.x, e.y, P.x, P.y, 3, 0.5, 140, api, { b: { sprite: e.shot } });
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
          Patterns.ring(e.x, e.y, 8, 110, api, { b: { sprite: e.shot } });
          G.hazards.zone(e.x, e.y, 30, { telegraph: 0.5, duration: 1.2, color: '#7fd4ff', damage: 10 });
          G.audio.sfx('freeze');
        }
      }
      break;
    }
    case 'seq': { // Ultron drone: sequential precise red bolts
      const a = angleTo(e.x, e.y, P.x, P.y);
      mvx = Math.cos(a) * 0.7; mvy = Math.sin(a) * 0.7;
      if (canAct) {
        e.attackT -= dt;
        if (e.attackT <= 0) { e.attackT = e.def.attack.cd; e.seqN = 3; e.seqT = 0; }
        if (e.seqN > 0) {
          e.seqT -= dt;
          if (e.seqT <= 0) {
            e.seqT = 0.13; e.seqN--;
            const aa = angleTo(e.x, e.y, P.x, P.y);
            api.spawn({ x: e.x, y: e.y, vx: Math.cos(aa) * 165, vy: Math.sin(aa) * 165, sprite: e.shot, r: 3, fx: 'drone' });
            G.audio.sfx('seq');
          }
        }
      }
      break;
    }
    case 'burst': { // Chitauri: pressure groups, sequential blue bursts
      const a = angleTo(e.x, e.y, P.x, P.y);
      mvx = Math.cos(a) + Math.cos(a + Math.PI / 2) * e.strafe * 0.5;
      mvy = Math.sin(a) + Math.sin(a + Math.PI / 2) * e.strafe * 0.5;
      if (canAct) {
        e.attackT -= dt;
        if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd;
          Patterns.aimed(e.x, e.y, P.x, P.y, 3, 0.28, 130, api, { b: { sprite: e.shot, fx: 'chit' } });
          G.audio.sfx('burst');
        }
      }
      break;
    }
    case 'outrider': { // chaser: stalk -> crouch telegraph -> lunge, speed fx
      e.stateT -= dt;
      if (e.state === 'charge') {
        mvx = Math.cos(e.chargeDir) * 3.1; mvy = Math.sin(e.chargeDir) * 3.1;
        if (Math.random() < dt * 40) G.particles.spark(e.x - Math.cos(e.chargeDir) * 8, e.y - Math.sin(e.chargeDir) * 8, '#9fb8ff', 1);
        if (e.stateT <= 0) { e.state = 'stalk'; e.stateT = 0.4; G.particles.ring(e.x, e.y, '#cfe0ff', 10, 60); }
      } else if (e.state === 'telegraph') {
        mvx = 0; mvy = 0;
        if (e.stateT <= 0) { e.state = 'charge'; e.stateT = 0.4; e.chargeDir = angleTo(e.x, e.y, P.x, P.y); G.audio.sfx('dash'); }
      } else {
        const a = angleTo(e.x, e.y, P.x, P.y);
        // circle around before striking
        mvx = Math.cos(a) * 1.1 + Math.cos(a + Math.PI / 2) * e.strafe * 0.7;
        mvy = Math.sin(a) * 1.1 + Math.sin(a + Math.PI / 2) * e.strafe * 0.7;
        if (e.stateT <= 0 && dist(e.x, e.y, P.x, P.y) < 150) { e.state = 'telegraph'; e.stateT = 0.32; }
        if (e.stateT <= -2) e.stateT = 0.4;
      }
      break;
    }
    case 'sniper': { // Kree: keeps range, slow heavy plasma with trail
      const d = dist(e.x, e.y, P.x, P.y);
      const a = angleTo(e.x, e.y, P.x, P.y);
      if (d < 130) { mvx = -Math.cos(a); mvy = -Math.sin(a); }
      else if (d > 230) { mvx = Math.cos(a) * 0.7; mvy = Math.sin(a) * 0.7; }
      else { mvx = Math.cos(a + Math.PI / 2) * e.strafe * 0.6; mvy = Math.sin(a + Math.PI / 2) * e.strafe * 0.6; }
      if (canAct) {
        e.attackT -= dt;
        if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd;
          api.spawn({ x: e.x, y: e.y, vx: Math.cos(a) * 75, vy: Math.sin(a) * 75, sprite: e.shot, r: 5, dmg: 1.5, fx: 'kree' });
          G.audio.sfx('plasma');
        }
      }
      break;
    }
    case 'strafe': { // Sakaaran: side-to-side pressure, alternating tech bursts
      const b = arena.bounds;
      mvx = e.strafe; if (e.x < b.x + 40 || e.x > b.x + b.w - 40) e.strafe *= -1;
      const a = angleTo(e.x, e.y, P.x, P.y);
      mvy = Math.sin(a) * 0.5;
      if (canAct) {
        e.attackT -= dt;
        if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd;
          e.altK = !e.altK;
          const off = e.altK ? 0.35 : -0.35;
          Patterns.fan(e.x, e.y, a + off, 0.22, 2, 120, api, { b: { sprite: e.shot, fx: 'sak' } });
          G.audio.sfx('zap');
        }
      }
      break;
    }
    case 'gunner': { // AIM: directed bursts + predictable area bomb
      const a = angleTo(e.x, e.y, P.x, P.y);
      mvx = Math.cos(a) * 0.6; mvy = Math.sin(a) * 0.6;
      if (canAct) {
        e.attackT -= dt;
        if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd;
          e.altK = !e.altK;
          if (e.altK) {
            Patterns.aimed(e.x, e.y, P.x, P.y, 3, 0.4, 110, api, { b: { sprite: e.shot, fx: 'aim' } });
            G.audio.sfx('zap');
          } else {
            Patterns.rain(arena, P.x, 5, 95, api, { b: { sprite: e.shot, fx: 'aim' } });
            G.audio.sfx('warn');
          }
        }
      }
      break;
    }
    case 'guns': { // Hydra: fast small ballistic bursts
      const a = angleTo(e.x, e.y, P.x, P.y);
      mvx = Math.cos(a) * 0.8 + Math.cos(a + Math.PI / 2) * e.strafe * 0.4;
      mvy = Math.sin(a) * 0.8 + Math.sin(a + Math.PI / 2) * e.strafe * 0.4;
      if (canAct) {
        e.attackT -= dt;
        if (e.attackT <= 0) { e.attackT = e.def.attack.cd; e.seqN = 5; e.seqT = 0; }
        if (e.seqN > 0) {
          e.seqT -= dt;
          if (e.seqT <= 0) {
            e.seqT = 0.09; e.seqN--;
            const aa = angleTo(e.x, e.y, P.x, P.y) + rand(-0.09, 0.09);
            api.spawn({ x: e.x, y: e.y, vx: Math.cos(aa) * 230, vy: Math.sin(aa) * 230, sprite: e.shot, r: 2, fx: 'hydra' });
            G.audio.sfx('gun');
          }
        }
      }
      break;
    }
    case 'illusion': { // Mysterio: curving illusory orbs + false-direction rings
      const a = angleTo(e.x, e.y, P.x, P.y);
      mvx = -Math.cos(a) * 0.5 + Math.cos(a + Math.PI / 2) * Math.sin(e.t * 1.7) * 0.9;
      mvy = -Math.sin(a) * 0.5 + Math.sin(a + Math.PI / 2) * Math.sin(e.t * 1.7) * 0.9;
      if (canAct) {
        e.attackT -= dt;
        if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd;
          e.altK = !e.altK;
          if (e.altK) {
            for (let i = 0; i < 4; i++)
              api.spawn({ x: e.x, y: e.y, vx: Math.cos(a + i * 1.57) * 70, vy: Math.sin(a + i * 1.57) * 70, sprite: e.shot, r: 4, homing: 1.4, wobble: 2.5, fx: 'myst' });
          } else {
            // feint: orbs that seem to come from another direction
            const b = arena.bounds;
            const sx = b.x + rand(20, b.w - 20), sy = b.y + 8;
            Patterns.aimed(sx, sy, P.x, P.y, 3, 0.5, 100, api, { b: { sprite: e.shot, r: 4, wobble: 2, fx: 'myst' } });
            G.particles.burst(sx, sy, '#4dff88', 6, 50, 0.3);
          }
          G.audio.sfx('illus');
        }
      }
      break;
    }
    case 'frost': { // Frost Giant: slow dangerous ice fans
      const a = angleTo(e.x, e.y, P.x, P.y);
      mvx = Math.cos(a) * 0.8; mvy = Math.sin(a) * 0.8;
      if (canAct) {
        e.attackT -= dt;
        if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd;
          e.altK = !e.altK;
          Patterns.fan(e.x, e.y, a, e.altK ? 1.5 : 0.8, e.altK ? 7 : 4, 62, api, { b: { sprite: e.shot, r: 5, fx: 'frost' } });
          G.audio.sfx('ice');
        }
      }
      break;
    }
    case 'beam': { // Destroyer: telegraph then blinding orb
      const a = angleTo(e.x, e.y, P.x, P.y);
      mvx = Math.cos(a) * 0.6; mvy = Math.sin(a) * 0.6;
      if (canAct) {
        e.attackT -= dt;
        if (e.state === 'telegraph') {
          mvx = 0; mvy = 0;
          e.stateT -= dt;
          if (Math.random() < dt * 30) G.particles.spark(e.x + rand(-8, 8), e.y + rand(-8, 8), '#ffd94a', 1);
          if (e.stateT <= 0) {
            e.state = 'stalk';
            api.spawn({ x: e.x, y: e.y, vx: Math.cos(e.chargeDir) * 140, vy: Math.sin(e.chargeDir) * 140, sprite: e.shot, r: 6, dmg: 2, fx: 'destroyer' });
            G.particles.ring(e.x, e.y, '#fff8d0', 16, 120);
            G.particles.addShake(4);
            G.audio.sfx('beam');
          }
        } else if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd;
          e.state = 'telegraph'; e.stateT = 0.8; e.chargeDir = a;
          G.audio.sfx('warn');
        }
      }
      break;
    }
    case 'alt': { // Super-Skrull: alternating energy fan / flame ring
      e.wob += rand(-3, 3) * dt;
      const a = angleTo(e.x, e.y, P.x, P.y);
      mvx = Math.cos(a) * 0.9 + Math.cos(e.wob) * 0.4;
      mvy = Math.sin(a) * 0.9 + Math.sin(e.wob) * 0.4;
      if (canAct) {
        e.attackT -= dt;
        if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd;
          e.altK = !e.altK;
          if (e.altK) { Patterns.aimed(e.x, e.y, P.x, P.y, 4, 0.7, 120, api, { b: { sprite: e.shot, fx: 'skrull' } }); G.audio.sfx('skrull'); }
          else { Patterns.ring(e.x, e.y, 8, 90, api, { b: { sprite: e.shot, fx: 'skrull' } }); G.audio.sfx('boom'); }
        }
      }
      break;
    }
    case 'senti': { // Sentinela: big visible-trajectory shots + focused bursts
      const a = angleTo(e.x, e.y, P.x, P.y);
      mvx = Math.cos(a) * 0.7; mvy = Math.sin(a) * 0.7;
      if (canAct) {
        e.attackT -= dt;
        if (e.attackT <= 0) {
          e.attackT = e.def.attack.cd;
          e.altK = !e.altK;
          if (e.altK) {
            api.spawn({ x: e.x, y: e.y, vx: Math.cos(a) * 85, vy: Math.sin(a) * 85, sprite: e.shot, r: 6, fx: 'senti' });
            G.audio.sfx('laser');
          } else {
            Patterns.aimed(e.x, e.y, P.x, P.y, 3, 0.3, 120, api, { b: { sprite: e.shot, r: 4, fx: 'senti' } });
            G.audio.sfx('laser');
          }
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
  if (e.sky && arena.skyZone) {
    // flying actors hover in the sky strip — outside the player's reach
    [e.x, e.y] = arena.clamp(e.x, e.y, e.r, arena.skyZone);
  } else {
    [e.x, e.y] = arena.clamp(e.x, e.y, e.r, arena.bounds);
    [e.x, e.y] = arena.resolveCircle(e.x, e.y, e.r);
  }
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
  // static sprite (effects like flash/freeze still apply)
  let spr = SPR[e.def.sprite];
  if (!spr && e.def.variantOf) spr = SPR['en_' + e.def.variantOf];
  if (!spr) {
    // procedural fallback: never invisible
    ctx.fillStyle = e.flash > 0 ? '#ffffff' : '#c95df2';
    ctx.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(e.x - 2, e.y - 2, 2, 2);
    return;
  }
  const alpha = e.spawnT > 0 ? 1 - e.spawnT / 0.6 : e.visible === false ? 0.25 : 1;
  drawSprite(ctx, spr, e.x, e.y + (e.def.behavior === 'wander' ? Math.round(Math.sin(e.t * 8)) : 0), {
    alpha,
    tint: e.flash > 0 ? '#ffffff' : e.frozen > 0 ? '#7fd4ff' : e.rooted > 0 ? '#ffffff' : undefined,
  });
  if (e.spawnT > 0) {
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(e.x - 6, e.y - 6, 12, 12);
    ctx.globalAlpha = 1;
  }
  // variant identification pip
  if (e.def.variantColor) {
    ctx.fillStyle = e.def.variantColor;
    ctx.fillRect(e.x - 1, e.y - e.r - 5, 3, 3);
  }
  // elite / miniboss markers
  if (e.isElite || e.isMiniboss) {
    ctx.strokeStyle = e.isMiniboss ? '#ff9a3c' : '#ffd94a';
    ctx.globalAlpha = 0.6 + Math.sin(e.t * 6) * 0.3;
    ctx.strokeRect(e.x - e.r - 2, e.y - e.r - 2, e.r * 2 + 4, e.r * 2 + 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = e.isMiniboss ? '#ff9a3c' : '#ffd94a';
    ctx.fillRect(e.x - 1, e.y - e.r - (e.def.variantColor ? 9 : 5), 3, 3);
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
