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
import { UI, setCtx, toggleFullscreen } from './scenes/scene.js';
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
    UI.beginFrame(); // swallow clicks held across the scene change
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
    const s = Save.data ? Save.data.settings : {};
    const scale = Math.min(innerWidth / VIEW_W, innerHeight / VIEW_H);
    let sc = scale;
    if (s.integerScale && scale >= 1) sc = Math.floor(scale);
    canvas.style.width = Math.round(VIEW_W * sc) + 'px';
    canvas.style.height = Math.round(VIEW_H * sc) + 'px';
  }
  addEventListener('resize', resize);
  document.addEventListener('fullscreenchange', resize);
  G.resize = resize;
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
    if (Input.pressed('KeyF')) toggleFullscreen();
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
  const err = document.getElementById('boot-err');
  const setP = (p, msg) => {
    if (fill) fill.style.width = Math.round(p) + '%';
    if (msg && hint) hint.textContent = msg;
  };
  try {
    setP(8, 'CARREGANDO PERFIL...');
    Save.load();
    setP(20, 'COMPILANDO SPRITES...');
    await new Promise((r) => setTimeout(r, 30)); // let the bar paint
    buildAllSprites();
    setP(38, 'INVOCANDO HERÓIS 0/6...');
    await loadHeroArt((n, total) => setP(38 + (n / total) * 52, `INVOCANDO HERÓIS ${n}/${total}...`));
    setP(94, 'SINCRONIZANDO O NEXUS...');
    Audio.setVolumes({ ...Save.data.settings });
    createGame(canvas);
    setP(100, 'PRONTO!');
    const bootEl = document.getElementById('boot');
    if (bootEl) {
      setTimeout(() => {
        bootEl.classList.add('gone');
        setTimeout(() => bootEl.remove(), 500);
      }, 180);
    }
    canvas.focus({ preventScroll: true });
  } catch (e) {
    console.error(e);
    if (err) err.textContent = 'ERRO AO CARREGAR: ' + (e && e.message ? e.message : e) + '\nRecarregue a página (F5).';
    if (hint) hint.textContent = '';
  }
}

if (typeof document !== 'undefined' && !g.__NX_NO_AUTOBOOT) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}
