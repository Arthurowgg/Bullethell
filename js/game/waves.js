// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/waves.js
// WaveDirector v2: the run is a campaign of WAVE segments (announce -> combat
// -> breather) separated by incursions (reality tear -> portal -> boss world).
// Each wave kind has its own composition, cadence and tension curve.
// ---------------------------------------------------------------------------
import { rand, pick, chance } from '../core/util.js';
import { CAMPAIGN, WAVE_KINDS, TOTAL_WAVES, locateWave } from '../data/campaign.js';

export { CAMPAIGN, WAVE_KINDS, TOTAL_WAVES };

export class WaveDirector {
  constructor() {
    this.seg = 0;              // index into CAMPAIGN
    this.wi = 0;               // wave index inside the segment
    this.wave = 0;             // global wave number (1-based once combat starts)
    this.round = 0;            // legacy alias (segment position) for telemetry
    this.phase = 'announce';   // announce | combat | breather | incursion
    this.t = 0;                // time in phase
    this.spawnT = 0.6;
    this.toSpawn = 0;
    this.kind = null;
    this.eventT = 20;
    this.event = null;
    this.bossSpawned = false;
    this.miniboss = null;
    this.done = false;
  }

  curSeg() { return CAMPAIGN[this.seg]; }
  curKind() { return this.curSeg().waves ? this.curSeg().waves[this.wi] : null; }

  // remaining hostiles (alive + queued) for the HUD wave tracker
  remaining(G) {
    if (this.phase === 'incursion') return G.boss ? 1 : 0;
    return G.enemies.filter((e) => !e.dead).length + this.toSpawn;
  }

  update(dt, G) {
    this.t += dt;
    const seg = this.curSeg();
    if (!seg) { this.done = true; return; }

    if (seg.incursion) { this._incursion(dt, G, seg); return; }

    if (this.phase === 'announce') {
      if (this.t > 1.5) {
        this.phase = 'combat';
        this.t = 0;
        this._startWave(G);
      }
      return;
    }

    if (this.phase === 'breather') {
      if (this.t > 4) this._nextWave(G);
      return;
    }

    // ---- combat ----
    const k = WAVE_KINDS[this.kind];
    this._spawning(dt, G, k);

    // random tension events on long kinds
    if (k.event || this.kind === 'survival' || this.kind === 'intense') {
      this.eventT -= dt;
      if (this.eventT <= 0) { this.eventT = rand(18, 26); this._triggerEvent(G); }
    }
    if (this.event && (this.event.t -= dt) <= 0) this.event = null;

    // wave conclusion
    if (this.kind === 'survival') {
      if (this.t > k.dur) this._clearWave(G);
    } else if (this.toSpawn <= 0 && G.enemies.every((e) => e.dead) && this.t > 3) {
      this._clearWave(G);
    } else if (this.t > k.dur + 25) {
      this._clearWave(G); // failsafe: never stall the campaign
    }
  }

  _startWave(G) {
    this.kind = this.curKind();
    const k = WAVE_KINDS[this.kind];
    this.toSpawn = k.count;
    this.spawnT = 0.4;
    this.eventT = rand(10, 16);
    this.wave = this._globalWave();
    G.comic && G.comic.push('wave', 'WAVE ' + String(this.wave).padStart(2, '0'), k.label + ' — ' + k.desc, 'wave', '#ffd94a');
    G.audio && G.audio.sfx('wave');
    if (k.event) this._triggerEvent(G);
    if (k.miniboss) this._spawnMiniboss(G);
  }

  _globalWave() {
    let w = 0;
    for (let s = 0; s <= this.seg; s++) {
      const sg = CAMPAIGN[s];
      if (!sg.waves) continue;
      w += s < this.seg ? sg.waves.length : this.wi + 1;
    }
    return w;
  }

  _spawning(dt, G, k) {
    if (this.toSpawn <= 0) return;
    if (G.enemies.length > 30) return;
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    this.spawnT = k.trickle ? k.trickle : rand(k.gap[0], k.gap[1]);
    const n = Math.min(this.toSpawn, k.trickle ? 1 + (chance(0.4) ? 1 : 0) : rand(k.batch[0], k.batch[1] + 1) | 0 || 1);
    for (let i = 0; i < n; i++) this._spawnOne(G, k);
    this.toSpawn -= n;
  }

  _spawnOne(G, k) {
    let id = pick(k.pool);
    if (this.event && this.event.type === 'swarm' && chance(0.5)) id = pick(['drone', 'chitauri']);
    if (this.event && this.event.type === 'elite' && chance(0.5)) id = 'spectre';
    // variant chance climbs across the campaign
    const vp = Math.min(0.5, 0.08 + this.wave * 0.02);
    if (chance(vp)) {
      const tier = this.wave >= 18 ? 1 + ((Math.random() * 4) | 0) : this.wave >= 10 ? 1 + ((Math.random() * 3) | 0) : 1 + ((Math.random() * 2) | 0);
      const vid = id + '_v' + tier;
      if ((typeof window !== 'undefined' ? window : globalThis).__nx_enemy(vid)) id = vid;
    }
    const elite = k.elite && chance(k.elite);
    G.summon(id, 1, elite, k.sky && chance(0.7) ? 'sky' : null);
  }

  _spawnMiniboss(G) {
    const id = pick(['sentinel', 'jotun']);
    G.summon(id, 1, true);
    const e = G.enemies[G.enemies.length - 1];
    if (e) {
      e.maxHp *= 4; e.hp = e.maxHp; e.dmgMul = (e.dmgMul || 1) * 1.4;
      e.isMiniboss = true; e.r += 4;
      this.miniboss = e;
      G.comic && G.comic.push('event', 'ALVO COLOSSAL', (e.def.name || id).toUpperCase() + ' APRIMORADO', 'miniboss', '#ff9a3c');
      G.audio && G.audio.sfx('warn');
    }
  }

  _clearWave(G) {
    this.toSpawn = 0;
    this.phase = 'breather';
    this.t = 0;
    // reward shower: a breath moment to collect and prepare
    const b = G.arena.bounds;
    for (let i = 0; i < 5; i++) {
      G.pickups.drop(rand(b.x + 30, b.x + b.w - 30), rand(b.y + 30, b.y + b.h - 30), i < 3 ? 'xp' : 'fragment', i < 3 ? 8 : 4);
    }
    G.comic && G.comic.push('clear', 'ONDA ' + String(this.wave).padStart(2, '0') + ' LIMPA', 'PREPARE-SE PARA A PRÓXIMA', 'shield', '#4dff88');
    G.audio && G.audio.sfx('clear');
  }

  _nextWave(G) {
    const seg = this.curSeg();
    this.wi++;
    if (this.wi >= seg.waves.length) { this._advanceSeg(G); return; }
    this.phase = 'announce';
    this.t = 0;
  }

  _advanceSeg(G) {
    this.seg++;
    this.wi = 0;
    this.round = this.seg;
    this.phase = 'announce';
    this.t = 0;
    this.bossSpawned = false;
    const seg = this.curSeg();
    if (seg && seg.map) G.setMap && G.setMap(seg.map);
  }

  _incursion(dt, G, seg) {
    this.phase = 'incursion';
    if (!this.bossSpawned && !G.boss && !G.portal && !G.transition) {
      G.comic && G.comic.push('event', 'RASGO DE REALIDADE', 'UMA INCURSÃO SE ABRE SOBRE O CAMPO', 'tear', '#b06bff');
      G.openPortal(seg.incursion, !!seg.final);
    }
    if (!this.bossSpawned && G.boss) this.bossSpawned = true;
    else if (this.bossSpawned && !G.boss && !G.transition) {
      // boss down: collapse, reward and return to the main map
      this._advanceSeg(G);
      const nxt = this.curSeg();
      if (nxt && nxt.map) G.setMap && G.setMap(nxt.map);
      G.comic && G.comic.push('event', 'RETORNO AO CAMPO', 'O RASGO SE FECHA — A GUERRA CONTINUA', 'return', '#4dd8ff');
    }
  }

  _triggerEvent(G) {
    const pool = ['swarm', 'frags', 'elite', 'swarm', 'frags', 'storm'];
    const type = pick(pool);
    if (type === 'swarm') {
      this.event = { type: 'swarm', t: 12 };
      for (let i = 0; i < 8 + this.wave; i++) G.summon(pick(['drone', 'chitauri']), 1, false, null);
      G.comic && G.comic.push('event', 'ENXAME DO CAOS', 'UMA QUANTIDADE ANORMAL DE INIMIGOS CHEGA', 'swarm', '#ff9a3c');
      G.audio && G.audio.sfx('warn');
    } else if (type === 'frags') {
      this.event = { type: 'frags', t: 10 };
      const b = G.arena.bounds;
      for (let i = 0; i < 10; i++) G.pickups.drop(rand(b.x + 20, b.x + b.w - 20), rand(b.y + 20, b.y + b.h - 20), 'fragment', 3);
      G.comic && G.comic.push('event', 'CHUVA DE FRAGMENTOS', 'RECOLHA ANTES QUE DISSIPEM', 'reward', '#4dd8ff');
      G.audio && G.audio.sfx('gem');
    } else if (type === 'storm') {
      this.event = { type: 'storm', t: 8 };
      G.comic && G.comic.push('event', 'TEMPESTADE DIMENSIONAL', 'PROJÉTEIS ENTRAM DE FORA DA ARENA', 'diff', '#ff5df2');
      G.audio && G.audio.sfx('warn');
      for (let i = 0; i < 10; i++) {
        const a = rand(0, Math.PI * 2);
        G.bullets.spawnEnemy({ x: 320 + Math.cos(a) * 400, y: 180 + Math.sin(a) * 260, vx: -Math.cos(a) * 90, vy: -Math.sin(a) * 90, sprite: 'b_pink' });
      }
    } else {
      this.event = { type: 'elite', t: 12 };
      for (let i = 0; i < 3; i++) G.summon(pick(['spectre', 'sentinel']), 1, true);
      G.comic && G.comic.push('event', 'ELITES À SOLTA', 'INIMIGOS APRIMORADOS NO CAMPO', 'elite', '#b06bff');
      G.audio && G.audio.sfx('warn');
    }
  }

  // dev / continue support: jump straight to a global wave number
  jumpToWave(n, G) {
    const loc = locateWave(n);
    this.seg = loc.seg;
    this.wi = loc.wi;
    this.round = loc.seg;
    const seg = this.curSeg();
    if (seg && seg.map) G.setMap && G.setMap(seg.map);
    this.phase = 'announce';
    this.t = 0;
    this.bossSpawned = false;
  }
}
