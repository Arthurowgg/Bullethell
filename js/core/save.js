// ---------------------------------------------------------------------------
// MARVEL NEXUS — core/save.js
// Persistent profile (localStorage in browser, in-memory in headless tests).
// ---------------------------------------------------------------------------

const KEY = 'marvel_nexus_save_v1';

export const DEFAULT_SAVE = {
  version: 1,
  fragments: 350,        // Nexus Fragments (earned by playing)
  credits: 120,          // Nexus Credits (premium, cosmetic-only)
  accountXp: 0,
  accountLevel: 1,
  nexusNodes: {},        // nexus core purchased nodes: id -> rank
  heroesUnlocked: { arachnid: true },
  heroSelected: 'arachnid',
  raidsCleared: {},      // raidId -> { bestTime, wins }
  bossesDefeated: {},    // bossId -> count
  cosmeticsOwned: {},    // id -> true
  cosmeticsEquipped: {}, // slot -> id
  favorites: {},         // cosmetic id -> true
  missionsClaimed: {},   // mission id -> true
  stats: { runs: 0, wins: 0, kills: 0, deaths: 0, bulletsDodged: 0, playTime: 0, levelReached: 0 },
  discovered: { enemies: {}, bosses: {} },
  settings: { sfx: 0.9, music: 0.7, master: 0.8, screenshake: true, dmgNumbers: true, autofire: true, integerScale: false },
  tutorialDone: false,
  dev: { god: false, infSpecial: false, speed2: false, startRound: 1 },
};

const mem = {};
const hasLS = typeof globalThis.localStorage !== 'undefined';

export const Save = {
  data: null,

  load() {
    let raw = null;
    try { raw = hasLS ? localStorage.getItem(KEY) : null; } catch { raw = null; }
    let parsed = null;
    if (raw) { try { parsed = JSON.parse(raw); } catch { parsed = null; } }
    this.data = deepMerge(structuredClone(DEFAULT_SAVE), parsed || {});
    return this.data;
  },

  save() {
    try { if (hasLS) localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* full/blocked */ }
  },

  reset() {
    this.data = structuredClone(DEFAULT_SAVE);
    this.save();
  },

  addFragments(n) { this.data.fragments += n; this.save(); },
  spendFragments(n) { if (this.data.fragments < n) return false; this.data.fragments -= n; this.save(); return true; },
  addCredits(n) { this.data.credits += n; this.save(); },
  spendCredits(n) { if (this.data.credits < n) return false; this.data.credits -= n; this.save(); return true; },

  addAccountXp(n) {
    const d = this.data;
    d.accountXp += n;
    while (d.accountXp >= xpForLevel(d.accountLevel + 1)) d.accountLevel++;
    this.save();
  },
};

export function xpForLevel(lvl) { return 100 + (lvl - 1) * 75; }

function deepMerge(base, over) {
  for (const k in over) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object') deepMerge(base[k], over[k]);
    else base[k] = over[k];
  }
  return base;
}

if (!hasLS && typeof globalThis.localStorage === 'undefined') {
  // in-memory shim so the same code path works headless
  globalThis.localStorage = {
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
  };
}
