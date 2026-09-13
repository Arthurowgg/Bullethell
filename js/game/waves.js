// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/waves.js
// The standard-run wave director: escalating enemy mixes, mini-events and
// the final boss call-in. Raids bypass this (boss from t=0).
// ---------------------------------------------------------------------------
import { rand, pick, chance } from '../core/util.js';
import { ENEMIES } from '../data/enemies.js';

export const RUN_LENGTH = 240; // seconds until the final boss appears

export class WaveDirector {
  constructor() {
    this.t = 0;
    this.spawnT = 1.2;
    this.eventT = 40;
    this.event = null;
    this.bossCalled = false;
    this.kills = 0;
  }

  /** weight table over time (seconds) */
  pool(t) {
    const p = [];
    const add = (id, w, after = 0) => { if (t >= after) for (let i = 0; i < w; i++) p.push(id); };
    add('drone', 5);
    add('chitauri', 4, 20);
    add('chaos', 4, 35);
    add('symbiote', 3, 55);
    add('sorcerer', 3, 80);
    add('jotun', 3, 100);
    add('spectre', 3, 130);
    add('sentinel', 1, 140);
    return p;
  }

  update(dt, G) {
    this.t += dt;
    const t = this.t;
    // difficulty ramp
    const interval = Math.max(0.5, 1.6 - t * 0.004);
    this.spawnT -= dt;
    const cap = Math.min(34, 10 + Math.floor(t / 12));
    if (this.spawnT <= 0 && G.enemies.length < cap) {
      this.spawnT = interval;
      const pool = this.pool(t);
      const n = 1 + (chance(0.35) ? 1 : 0) + (t > 90 && chance(0.3) ? 1 : 0);
      for (let i = 0; i < n; i++) G.summon(pick(pool), 1, true);
    }

    // periodic mini-events
    this.eventT -= dt;
    if (this.eventT <= 0 && !this.bossCalled) {
      this.eventT = 45;
      this.triggerEvent(G);
    }
    if (this.event) {
      this.event.t -= dt;
      if (this.event.t <= 0) this.event = null;
    }

    // final boss
    if (t >= RUN_LENGTH && !this.bossCalled) {
      this.bossCalled = true;
      G.callFinalBoss();
    }
  }

  triggerEvent(G) {
    const roll = Math.random();
    if (roll < 0.34) {
      this.event = { name: 'ENXAME DO CAOS', t: 4 };
      G.summon('chaos', 8, true);
      G.audio.sfx('warn');
    } else if (roll < 0.67) {
      this.event = { name: 'CHUVA DE FRAGMENTOS', t: 4 };
      for (let i = 0; i < 6; i++) G.pickups.drop(rand(60, 580), rand(50, 300), 'fragment', 2);
      G.audio.sfx('gem');
    } else {
      this.event = { name: 'ELITE DETECTADO', t: 4 };
      G.summon(pick(['sentinel', 'sorcerer', 'jotun']), 1, true);
      G.audio.sfx('warn');
    }
  }
}
