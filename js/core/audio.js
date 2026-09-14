// ---------------------------------------------------------------------------
// MARVEL NEXUS — core/audio.js
// Pure WebAudio chiptune engine: synthesized SFX + a 4-channel step sequencer
// (pulse lead, triangle bass, noise drums) with per-scene tracks.
// No audio assets, no DOM. Headless-safe (no-op without AudioContext).
// ---------------------------------------------------------------------------
import { rand, pick } from './util.js';

const HAS_AC = typeof globalThis.AudioContext !== 'undefined' || typeof globalThis.webkitAudioContext !== 'undefined';

class AudioSys {
  constructor() {
    this.vol = { master: 0.8, sfx: 0.9, music: 0.7 };
    this.unlocked = false;
    this.track = null;
    this.step = 0;
    this.nextStepT = 0;
  }

  unlock() {
    if (!HAS_AC) return;
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.vol.master;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.vol.sfx;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.vol.music;
      this.musicBus.connect(this.master);
      this.noiseBuf = this._noise();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.unlocked = true;
    if (this.track && !this._playing) this._startScheduler();
  }

  setVolumes(v) {
    Object.assign(this.vol, v);
    if (this.ctx) {
      this.master.gain.value = this.vol.master;
      this.sfxBus.gain.value = this.vol.sfx;
      this.musicBus.gain.value = this.vol.music;
    }
  }

  _noise() {
    const len = this.ctx.sampleRate * 1;
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // ---- SFX ----------------------------------------------------------------
  tone({ f = 440, f2 = null, t = 0.1, type = 'square', v = 0.3, at = 0 }) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + at;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, now);
    if (f2 != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), now + t);
    g.gain.setValueAtTime(v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + t);
    o.connect(g); g.connect(this.sfxBus);
    o.start(now); o.stop(now + t + 0.02);
  }

  noise({ t = 0.1, v = 0.3, hp = 0, lp = 20000, at = 0 }) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + at;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + t);
    let node = s;
    if (hp) { const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; node.connect(f); node = f; }
    if (lp < 20000) { const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; node.connect(f); node = f; }
    node.connect(g); g.connect(this.sfxBus);
    s.start(now); s.stop(now + t + 0.02);
  }

  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'shoot': this.tone({ f: 620, f2: 240, t: 0.07, type: 'square', v: 0.12 }); break;
      case 'web': this.tone({ f: 300, f2: 900, t: 0.08, type: 'triangle', v: 0.16 }); break;
      case 'zap': this.tone({ f: 1200, f2: 100, t: 0.12, type: 'sawtooth', v: 0.2 }); this.noise({ t: 0.08, v: 0.12, hp: 3000 }); break;
      case 'hit': this.noise({ t: 0.06, v: 0.2, lp: 3000 }); this.tone({ f: 200, f2: 90, t: 0.06, type: 'square', v: 0.15 }); break;
      case 'boom': this.noise({ t: 0.35, v: 0.4, lp: 1400 }); this.tone({ f: 140, f2: 40, t: 0.3, type: 'triangle', v: 0.4 }); break;
      case 'bigboom': this.noise({ t: 0.6, v: 0.5, lp: 900 }); this.tone({ f: 90, f2: 30, t: 0.55, type: 'sine', v: 0.5 }); break;
      case 'hurt': this.tone({ f: 160, f2: 60, t: 0.2, type: 'sawtooth', v: 0.35 }); this.noise({ t: 0.12, v: 0.25, lp: 2500 }); break;
      case 'dash': this.noise({ t: 0.12, v: 0.2, hp: 1200 }); this.tone({ f: 500, f2: 900, t: 0.1, type: 'sine', v: 0.15 }); break;
      case 'pick': this.tone({ f: 700, f2: 1100, t: 0.08, type: 'square', v: 0.15 }); break;
      case 'gem': this.tone({ f: 900, t: 0.05, type: 'square', v: 0.1 }); this.tone({ f: 1350, t: 0.08, type: 'square', v: 0.1, at: 0.05 }); break;
      case 'level': [523, 659, 784, 1046].forEach((f, i) => this.tone({ f, t: 0.12, type: 'square', v: 0.18, at: i * 0.07 })); break;
      case 'ui': this.tone({ f: 500, f2: 700, t: 0.05, type: 'square', v: 0.12 }); break;
      case 'uiBack': this.tone({ f: 400, f2: 250, t: 0.07, type: 'square', v: 0.12 }); break;
      case 'buy': [660, 880, 1320].forEach((f, i) => this.tone({ f, t: 0.09, type: 'triangle', v: 0.2, at: i * 0.06 })); break;
      case 'deny': this.tone({ f: 180, f2: 120, t: 0.12, type: 'square', v: 0.2 }); break;
      case 'ability': this.tone({ f: 300, f2: 1200, t: 0.18, type: 'sawtooth', v: 0.22 }); break;
      case 'special': [220, 330, 440, 660, 880].forEach((f, i) => this.tone({ f, t: 0.14, type: 'sawtooth', v: 0.2, at: i * 0.04 })); this.noise({ t: 0.4, v: 0.2, lp: 4000 }); break;
      case 'laser': this.tone({ f: 1800, f2: 200, t: 0.3, type: 'sawtooth', v: 0.22 }); break;
      case 'warn': this.tone({ f: 950, t: 0.09, type: 'square', v: 0.14 }); this.tone({ f: 950, t: 0.09, type: 'square', v: 0.14, at: 0.14 }); break;
      case 'wave': [392, 523, 659, 784].forEach((f, i) => this.tone({ f, t: 0.09, type: 'square', v: 0.16, at: i * 0.06 })); this.noise({ t: 0.15, v: 0.08, hp: 4000 }); break;
      case 'clear': [523, 659, 784].forEach((f, i) => this.tone({ f, t: 0.12, type: 'triangle', v: 0.18, at: i * 0.07 })); break;
      case 'phase': this.tone({ f: 80, f2: 400, t: 0.5, type: 'sawtooth', v: 0.3 }); this.noise({ t: 0.5, v: 0.2, lp: 3000 }); break;
      case 'victory': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone({ f, t: 0.16, type: 'square', v: 0.2, at: i * 0.11 })); break;
      case 'defeat': [400, 350, 300, 200].forEach((f, i) => this.tone({ f, f2: f * 0.8, t: 0.25, type: 'triangle', v: 0.25, at: i * 0.2 })); break;
      case 'freeze': this.tone({ f: 1400, f2: 2200, t: 0.15, type: 'sine', v: 0.15 }); break;
      case 'port': this.tone({ f: 250, f2: 1500, t: 0.2, type: 'sine', v: 0.2 }); break;
      case 'clank': this.tone({ f: 320, f2: 180, t: 0.05, type: 'square', v: 0.12 }); this.noise({ t: 0.04, v: 0.1, hp: 2000 }); break;
      // ---- hero basic attacks (identity sounds) ----
      case 'webshot': this.tone({ f: 1100, f2: 350, t: 0.06, type: 'sine', v: 0.14 }); this.noise({ t: 0.04, v: 0.07, hp: 3500 }); break;
      case 'boltheavy': this.tone({ f: 900, f2: 180, t: 0.1, type: 'sawtooth', v: 0.18 }); this.noise({ t: 0.06, v: 0.12, hp: 2500 }); break;
      case 'hamthrow': this.noise({ t: 0.12, v: 0.16, hp: 800 }); this.tone({ f: 220, f2: 70, t: 0.14, type: 'square', v: 0.2 }); this.tone({ f: 90, t: 0.1, type: 'sine', v: 0.22, at: 0.04 }); break;
      case 'repul': this.tone({ f: 850, f2: 280, t: 0.05, type: 'square', v: 0.12 }); this.tone({ f: 1700, f2: 600, t: 0.03, type: 'sine', v: 0.06 }); break;
      case 'pistol': this.noise({ t: 0.04, v: 0.14, hp: 2500 }); this.tone({ f: 520, f2: 140, t: 0.05, type: 'square', v: 0.12 }); break;
      case 'knife': this.tone({ f: 1500, f2: 700, t: 0.09, type: 'triangle', v: 0.14 }); this.noise({ t: 0.05, v: 0.08, hp: 4500 }); break;
      case 'claw1': this.noise({ t: 0.05, v: 0.14, hp: 1800 }); this.tone({ f: 300, f2: 520, t: 0.05, type: 'sawtooth', v: 0.09 }); break;
      case 'claw2': this.noise({ t: 0.05, v: 0.14, hp: 2200 }); this.tone({ f: 380, f2: 650, t: 0.05, type: 'sawtooth', v: 0.1 }); break;
      case 'claw3': this.noise({ t: 0.1, v: 0.2, hp: 1200 }); this.tone({ f: 200, f2: 600, t: 0.09, type: 'sawtooth', v: 0.15 }); this.tone({ f: 90, t: 0.12, type: 'sine', v: 0.2, at: 0.02 }); break;
      case 'sigil': this.tone({ f: 700, f2: 1300, t: 0.12, type: 'triangle', v: 0.12 }); this.tone({ f: 1400, t: 0.08, type: 'sine', v: 0.06, at: 0.03 }); break;
      // ---- hero specials (Q — big moments) ----
      case 'q_web': this.tone({ f: 220, f2: 1600, t: 0.3, type: 'sine', v: 0.2 }); this.noise({ t: 0.35, v: 0.14, hp: 2000 }); this.tone({ f: 1200, f2: 300, t: 0.2, type: 'triangle', v: 0.12, at: 0.1 }); break;
      case 'q_storm': this.noise({ t: 0.8, v: 0.45, lp: 700 }); this.tone({ f: 70, f2: 35, t: 0.7, type: 'sine', v: 0.4 }); this.tone({ f: 1400, f2: 100, t: 0.25, type: 'sawtooth', v: 0.15 }); break;
      case 'q_missile': this.noise({ t: 0.5, v: 0.25, hp: 600 }); this.tone({ f: 150, f2: 900, t: 0.45, type: 'sawtooth', v: 0.18 }); break;
      case 'q_frenzy': [330, 440, 550, 660, 880, 1100].forEach((f, i) => this.tone({ f, t: 0.06, type: 'square', v: 0.14, at: i * 0.045 })); this.noise({ t: 0.3, v: 0.15, hp: 2500 }); break;
      case 'q_rush': this.tone({ f: 110, f2: 480, t: 0.4, type: 'sawtooth', v: 0.25 }); this.noise({ t: 0.45, v: 0.22, hp: 900 }); break;
      case 'q_portal': this.tone({ f: 180, f2: 1500, t: 0.45, type: 'sine', v: 0.22 }); [880, 1320, 1760].forEach((f, i) => this.tone({ f, t: 0.2, type: 'triangle', v: 0.08, at: 0.1 + i * 0.08 })); break;
      case 'slashq': this.noise({ t: 0.05, v: 0.12, hp: 2000 }); this.tone({ f: 420, f2: 700, t: 0.05, type: 'sawtooth', v: 0.09 }); break;
      case 'rushend': this.noise({ t: 0.4, v: 0.4, lp: 1200 }); this.tone({ f: 120, f2: 35, t: 0.35, type: 'triangle', v: 0.35 }); break;
      default: this.tone({ f: 440, t: 0.06, type: 'square', v: 0.12 });
    }
  }

  // ---- MUSIC ---------------------------------------------------------------
  // tracks: { bpm, steps:16, lead:[...], bass:[...], drums:[...] } note = midi or 0
  playTrack(name) {
    if (this.track === name) return;
    this.track = name;
    this.step = 0;
    if (this.ctx && this.unlocked) this._startScheduler();
  }
  stopMusic() { this.track = null; this._playing = false; }

  _startScheduler() {
    this._playing = true;
    this.nextStepT = this.ctx.currentTime + 0.06;
    if (!this._timer) this._timer = setInterval(() => this._sched(), 40);
  }

  _sched() {
    if (!this._playing || !this.track) return;
    const tr = TRACKS[this.track];
    if (!tr) return;
    const spb = 60 / tr.bpm / 4; // 16th note
    while (this.nextStepT < this.ctx.currentTime + 0.12) {
      const s = this.step % tr.len;
      this._playStep(tr, s, this.nextStepT);
      this.nextStepT += spb;
      this.step++;
    }
  }

  _playStep(tr, s, t) {
    const at = t - this.ctx.currentTime;
    const lead = tr.lead[s % tr.lead.length];
    const bass = tr.bass[s % tr.bass.length];
    const drum = tr.drums[s % tr.drums.length];
    if (lead) this._note(lead, t, 0.22, 'square', 0.11);
    if (bass) this._note(bass, t, 0.3, 'triangle', 0.22);
    if (drum === 1) this._kick(t);
    if (drum === 2) this._hat(t);
    if (drum === 3) { this._kick(t); this._hat(t); }
  }

  _note(midi, t, dur, type, v) {
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.musicBus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  _kick(t) {
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.11);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + 0.14);
  }
  _hat(t) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const g = this.ctx.createGain(); const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(0.09, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    s.connect(f); f.connect(g); g.connect(this.musicBus); s.start(t); s.stop(t + 0.05);
  }
}

// midi helpers
const N = { C2: 36, D2: 38, E2: 40, F2: 41, G2: 43, A2: 45, B2: 47, C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59, C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76, G5: 79, A5: 81 };

const _ = 0;
export const TRACKS = {
  lobby: {
    bpm: 96, len: 64,
    lead: [N.C5, _, N.G4, _, N.A4, _, N.E4, _, N.F4, _, N.C5, _, N.D5, _, N.B4, _, N.C5, _, N.G4, _, N.A4, _, N.E4, _, N.D5, _, N.C5, _, N.B4, _, N.G4, _,
      N.A4, _, N.E4, _, N.F4, _, N.A4, _, N.G5, _, N.E5, _, N.D5, _, N.C5, _, N.B4, _, N.G4, _, N.A4, _, N.B4, _, N.C5, _, _, _],
    bass: [N.C3, _, N.C3, _, N.G2, _, N.G2, _, N.A2, _, N.A2, _, N.F2, _, N.F2, _, N.C3, _, N.C3, _, N.G2, _, N.G2, _, N.A2, _, N.A2, _, N.F2, _, N.G2, _,
      N.A2, _, N.A2, _, N.F2, _, N.F2, _, N.C3, _, N.C3, _, N.G2, _, N.G2, _, N.A2, _, N.B2, _, N.C3, _, _, _],
    drums: [1, _, 2, _, 2, _, 2, _, 1, _, 2, _, 2, _, 3, _, 1, _, 2, _, 2, _, 2, _, 1, _, 2, _, 2, _, 2, _,
      1, _, 2, _, 2, _, 2, _, 1, _, 2, _, 2, _, 3, _, 1, _, 2, _, 2, _, 2, 2],
  },
  combat: {
    bpm: 138, len: 32,
    lead: [N.E4, _, N.E4, N.G4, _, N.E4, _, N.A4, N.B4, _, N.A4, _, N.G4, _, N.E4, _, N.D4, _, N.D4, N.F4, _, N.D4, _, N.G4, N.A4, _, N.G4, _, N.F4, _, N.D4, _],
    bass: [N.E2, N.E2, _, N.E2, N.E2, _, N.E2, _, N.A2, N.A2, _, N.A2, N.G2, _, N.G2, _, N.D2, N.D2, _, N.D2, N.D2, _, N.D2, _, N.G2, N.G2, _, N.G2, N.B2, _, N.B2, _],
    drums: [1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 3, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 3, 2],
  },
  boss: {
    bpm: 152, len: 32,
    lead: [N.C4, _, N.C4, _, N.D4, N.C4, _, N.A3, N.C4, _, N.C4, _, N.E4, _, N.D4, _, N.C4, _, N.C4, _, N.D4, N.C4, _, N.A3, N.G3, _, N.A3, _, N.B3, _, N.B3, _],
    bass: [N.A2, N.A2, N.A2, _, N.A2, N.A2, _, N.A2, N.F2, N.F2, N.F2, _, N.F2, N.F2, _, N.F2, N.G2, N.G2, N.G2, _, N.G2, N.G2, _, N.G2, N.E2, N.E2, N.E2, _, N.E2, N.E2, N.E2, _],
    drums: [1, 2, 1, 2, 1, 2, 1, 3, 1, 2, 1, 2, 1, 2, 3, 2, 1, 2, 1, 2, 1, 2, 1, 3, 1, 2, 1, 2, 1, 3, 2, 2],
  },
  title: {
    bpm: 72, len: 32,
    lead: [N.C5, _, _, N.G4, _, _, N.A4, _, _, N.E4, _, _, N.F4, _, N.G4, _, N.A4, _, _, N.E4, _, _, N.D4, _, _, N.B4, _, N.C5, _, _, _],
    bass: [N.C3, _, _, _, N.A2, _, _, _, N.F2, _, _, _, N.G2, _, _, _, N.C3, _, _, _, N.A2, _, _, _, N.G2, _, _, _, N.G2, _, _, _],
    drums: [1, _, _, _, 2, _, _, _, 1, _, _, _, 2, _, _, 2, 1, _, _, _, 2, _, _, _, 1, _, _, _, 2, _, 3, _],
  },
};

export const Audio = new AudioSys();
if (typeof globalThis !== 'undefined') globalThis.__nx_audio = Audio;
