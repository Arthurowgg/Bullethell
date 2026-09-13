// ---------------------------------------------------------------------------
// MARVEL NEXUS — core/util.js
// Small math / helper layer used by every system. No DOM, no state: this file
// is safe to import from Node (used by tools/build_sprites.mjs and tests).
// ---------------------------------------------------------------------------

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
export const sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
export const approach = (v, target, step) =>
  v < target ? Math.min(v + step, target) : Math.max(v - step, target);

export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
export const dist2 = (x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1;
  return dx * dx + dy * dy;
};
export const angleTo = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);

export const rand = (min = 0, max = 1) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const chance = (p) => Math.random() < p;
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

export function pickMany(arr, n) {
  return shuffle(arr.slice()).slice(0, n);
}

/** Angle delta wrapped to [-PI, PI] */
export function angleDelta(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

export function rotateToward(current, target, maxStep) {
  const d = angleDelta(current, target);
  return current + clamp(d, -maxStep, maxStep);
}

export const easeOut = (t) => 1 - (1 - t) * (1 - t);
export const easeIn = (t) => t * t;
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

/** Deterministic PRNG (mulberry32) — used for arena dressing & tests. */
export class RNG {
  constructor(seed = 1337) { this.s = seed >>> 0; }
  next() {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + this.next() * (b - a); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  pick(arr) { return arr[(this.next() * arr.length) | 0]; }
}

export function fmtTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtNum(n) {
  n = Math.floor(n);
  if (n >= 1000000) return (n / 1000000).toFixed(n >= 10000000 ? 0 : 1).replace('.', ',') + 'M';
  if (n >= 10000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

/** Simple object pool — keeps the bullet system allocation-free. */
export class Pool {
  constructor(factory, reset, initial = 0) {
    this.factory = factory;
    this.reset = reset;
    this.free = [];
    this.live = [];
    for (let i = 0; i < initial; i++) this.free.push(factory());
  }
  spawn() {
    const o = this.free.length ? this.free.pop() : this.factory();
    o.dead = false;
    this.live.push(o);
    return o;
  }
  sweep() {
    const live = this.live;
    let w = 0;
    for (let i = 0; i < live.length; i++) {
      const o = live[i];
      if (o.dead) { this.reset(o); this.free.push(o); }
      else live[w++] = o;
    }
    live.length = w;
  }
  clear() {
    for (const o of this.live) { this.reset(o); this.free.push(o); }
    this.live.length = 0;
  }
  get count() { return this.live.length; }
}

export const uid = (() => { let n = 0; return () => ++n; })();
