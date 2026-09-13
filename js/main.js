// ---------------------------------------------------------------------------
// MARVEL NEXUS — main.js
// Boot, fixed-timestep loop, integer-scaling renderer, scene manager.
// Headless-safe: createGame is only invoked when a DOM exists.
// ---------------------------------------------------------------------------
import { Input } from './core/input.js';
import { Audio } from './core/audio.js';
import { Save } from './core/save.js';
import { buildAllSprites } from './data/sprites.js';
import { loadHeroArt, HEROES } from './data/heroes.js';
import { ENEMIES, enemyById } from './data/enemies.js';
import { itemById } from './data/shop.js';
import { UI, setCtx } from './scenes/scene.js';
import { TitleScene } from './scenes/title.js';
import { LobbyScene } from './scenes/lobby.js';
import { GameScene } from './scenes/game.js';
import { ResultsScene } from './scenes/results.js';
import { VIEW_W, VIEW_H } from './game/arena.js';

// global lookups used by scenes (kept off window when headless)
const g = typeof window !== 'undefined' ? window : globalThis;
g.__nx_enemy = (id) => ENEMIES[id];
g.__nx_item = (id) => itemById(id);

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const G = {
    ctx,
    canvas,
    scene: null,
    sceneName: '',
    lastParams: null,
    runStartDodged: 0,
  };

  const scenes = {
    title: () => new TitleScene(),
    lobby: () => new LobbyScene(),
    game: () => new GameScene(),
    results: () => new ResultsScene(),
  };

  function setScene(name, params) {
    if (G.scene) G.scene.exit && G.scene.exit(G);
    G.sceneName = name;
    G.scene = scenes[name]();
    G.scene.enter(G, params || {});
  }

  G.gotoLobby = () => setScene('lobby');
  G.gotoTitle = () => setScene('title');
  G.startGame = (params) => {
    G.lastParams = params;
    G.runStartDodged = Save.data.stats.bulletsDodged;
    setScene('game', params);
  };
  G.restartGame = () => { setScene('game', G.lastParams); G.runStartDodged = Save.data.stats.bulletsDodged; };
  G.gotoResults = (end) => {
    const s = Save.data;
    setScene('results', {
      win: end.win,
      mode: G.scene && G.scene.mode,
      raid: G.scene && G.scene.raid,
      heroId: G.scene && G.scene.hero && G.scene.hero.id,
      time: G.time || 0,
      kills: G.kills || 0,
      level: G.runStats ? G.runStats.level : 1,
      dodged: s.stats.bulletsDodged - G.runStartDodged,
      runFragments: G.runFragments || 0,
      fragGain: G.runStats ? G.runStats.fragGain : 1,
    });
  };

  // ---- sizing ----
  function resize() {
    const pad = 24;
    const aw = innerWidth - pad, ah = innerHeight - pad;
    let scale = Math.min(aw / VIEW_W, ah / VIEW_H);
    if (scale >= 1) scale = Math.floor(scale);
    canvas.style.width = VIEW_W * scale + 'px';
    canvas.style.height = VIEW_H * scale + 'px';
  }
  addEventListener('resize', resize);
  resize();

  Input.init(canvas);

  // ---- loop ----
  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;
  let running = true;

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    Input.pollGamepad();
    UI.beginFrame();
    let steps = 0;
    while (acc >= STEP && steps < 4) {
      G.scene.update(STEP, G);
      acc -= STEP;
      steps++;
    }
    if (steps === 4) acc = 0;
    // draw
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    setCtx(ctx);
    G.scene.draw(ctx, G);
    document.title = 'MARVEL NEXUS — ' + G.sceneName.toUpperCase();
    Input.endFrame();
  }

  setScene('title');
  requestAnimationFrame(frame);

  return { G, setScene };
}

// ---- boot (browser only) ----
async function boot() {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById('game');
  const fill = document.getElementById('boot-fill');
  const hint = document.getElementById('boot-hint');
  Save.load();
  if (fill) fill.style.width = '30%';
  buildAllSprites();
  if (fill) fill.style.width = '60%';
  if (hint) hint.textContent = 'INVOCANDO HERÓIS...';
  await loadHeroArt();
  if (fill) fill.style.width = '90%';
  Audio.setVolumes({ ...Save.data.settings });
  createGame(canvas);
  if (fill) fill.style.width = '100%';
  const bootEl = document.getElementById('boot');
  if (bootEl) {
    bootEl.classList.add('gone');
    setTimeout(() => bootEl.remove(), 500);
  }
  canvas.focus({ preventScroll: true });
}

if (typeof document !== 'undefined' && !g.__NX_NO_AUTOBOOT) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}
