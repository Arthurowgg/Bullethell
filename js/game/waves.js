// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/waves.js
// Round-based WaveDirector: the run is a ladder of 12 rounds — waves rounds
// and boss "incursion" rounds — with dynamic events inside wave rounds.
// ---------------------------------------------------------------------------
import { rand, pick, chance } from '../core/util.js';

export const ROUNDS = [
  { t: 'waves', dur: 30 },
  { t: 'waves', dur: 30 },
  { t: 'boss', boss: 'ultron' },
  { t: 'waves', dur: 32 },
  { t: 'waves', dur: 32 },
  { t: 'boss', boss: 'loki' },
  { t: 'waves', dur: 36 },
  { t: 'boss', boss: 'hela' },
  { t: 'waves', dur: 36 },
  { t: 'boss', boss: 'devourer' },
  { t: 'waves', dur: 40 },
  { t: 'boss', boss: 'thanos', final: true },
];

export class WaveDirector {
  constructor() {
    this.round = 0;            // index into ROUNDS
    this.t = 0;                // elapsed time inside the current round
    this.spawnT = 0.5;         // first wave comes fast
    this.opened = false;
    this.eventT = 30;
    this.event = null;
    this.bossSpawned = false;
    this.done = false;
  }

  cur() { return ROUNDS[this.round]; }

  update(dt, G) {
    this.t += dt;
    const r = this.cur();
    if (!r) { this.done = true; return; }

    if (r.t === 'boss') {
      // the incursion opens a reality tear; the player must step into it
      if (!this.bossSpawned && !G.boss && !G.portal && !G.transition) {
        G.openPortal(r.boss, !!r.final);
      }
      if (!this.bossSpawned && G.boss) this.bossSpawned = true;
      else if (this.bossSpawned && !G.boss && !G.transition) {
        this._advance(G);
      }
      return;
    }

    // ---- wave round ----
    if (!this.opened) {
      // opening burst as soon as the round starts
      this.opened = true;
      for (let i = 0; i < 3; i++) this._spawnOne(G);
    }
    if (G.enemies.length === 0 && this.t > 6) this.spawnT = 0; // nunca deixa o campo vazio
    this.spawnT -= dt;
    if (this.spawnT <= 0 && G.enemies.length < 26) {
      this.spawnT = rand(0.5, 1.0);
      const n = 1 + (chance(0.35) ? 1 : 0) + (this.round >= 3 && chance(0.3) ? 1 : 0);
      for (let i = 0; i < n; i++) this._spawnOne(G);
    }

    this.eventT -= dt;
    if (this.eventT <= 0) {
      this.eventT = rand(26, 40);
      this._triggerEvent(G);
    }
    if (this.event && (this.event.t -= dt) <= 0) this.event = null;

    if (!this.durT) this.durT = r.dur;
    this.durT -= dt;
    if (this.durT <= 0) this._advance(G);
  }

  _advance(G) {
    this.round++;
    this.t = 0;
    this.durT = null;
    this.opened = false;
    this.spawnT = 0.5;
    this.bossSpawned = false;
    this.eventT = rand(22, 34);
    this.spawnT = Math.max(0.6, this.spawnT);
    if (this.cur()) {
      G.comicRound(this.round + 1);
      G.setWorldForRound(this.round + 1);
    }
  }

  _spawnOne(G) {
    const t = this.round * 6 + this.t;
    const pool = [];
    const add = (id, w) => { for (let i = 0; i < w; i++) pool.push(id); };
    add('drone', 5); add('chitauri', 4); add('symbiote', 3);
    if (t > 100) add('sorcerer', 3);
    if (t > 150) add('sentinel', 2);
    if (t > 200) add('spectre', 3);
    if (t > 260) add('jotun', 3);
    if (t > 330) add('chaos', 3);

    let id = pick(pool);
    if (this.event && this.event.type === 'elite' && chance(0.5)) id = 'spectre';
    if (this.event && this.event.type === 'swarm' && chance(0.5)) id = pick(['drone', 'chitauri']);
    // variant chance grows with the round ladder
    const vp = Math.min(0.5, 0.1 + this.round * 0.05);
    if (chance(vp)) {
      const tier = this.round >= 8 ? 1 + ((Math.random() * 4) | 0) : this.round >= 4 ? 1 + ((Math.random() * 3) | 0) : 1 + ((Math.random() * 2) | 0);
      const vid = id + '_v' + tier;
      if ((typeof window !== 'undefined' ? window : globalThis).__nx_enemy(vid)) id = vid;
    }
    G.summon(id, 1, this.event && this.event.type === 'elite');
  }

  _triggerEvent(G) {
    const pool = ['swarm', 'frags', 'elite', 'swarm', 'frags'];
    const type = pick(pool);
    const mult = this.round >= 6 ? 2 : 1;
    if (type === 'swarm') {
      this.event = { type: 'swarm', name: 'ENXAME DO CAOS', t: 12, color: '#ff9a3c' };
      for (let i = 0; i < 8 + this.round; i++) G.summon(pick(['drone', 'chitauri']));
      G.comic && G.comic.push('event', 'ENXAME DO CAOS', 'INIMIGOS EM FÚRIA', 'swarm', '#ff9a3c');
      G.audio && G.audio.sfx('warn');
    } else if (type === 'frags') {
      this.event = { type: 'frags', name: 'CHUVA DE FRAGMENTOS', t: 10, color: '#4dd8ff' };
      const b = G.arena.bounds;
      for (let i = 0; i < 8 * mult; i++) {
        G.pickups.drop(rand(b.x + 20, b.x + b.w - 20), rand(b.y + 20, b.y + b.h - 20), 'fragment', 3);
      }
      G.comic && G.comic.push('event', 'CHUVA DE FRAGMENTOS', 'RECOLHA RÁPIDO!', 'frags', '#4dd8ff');
      G.audio && G.audio.sfx('gem');
    } else {
      this.event = { type: 'elite', name: 'ELITES À SOLTA', t: 12, color: '#b06bff' };
      for (let i = 0; i < 3; i++) G.summon(pick(['spectre', 'sentinel']), 1, true);
      G.comic && G.comic.push('event', 'ELITES À SOLTA', 'INIMIGOS APRIMORADOS', 'elite', '#b06bff');
      G.audio && G.audio.sfx('warn');
    }
  }
}
