// ---------------------------------------------------------------------------
// MARVEL NEXUS — draw smoke test: executes every scene's draw() path against
// a stub 2D context to catch property/method typos the logic test can't see.
// ---------------------------------------------------------------------------
const g = globalThis;
g.__NX_NO_AUTOBOOT = true;

function makeCtx() {
  const grad = { addColorStop() {} };
  const t = {
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    putImageData() {}, drawImage() {},
  };
  return new Proxy(t, {
    get(tg, k) {
      if (k in tg) return tg[k];
      tg[k] = () => {};
      return tg[k];
    },
    set(tg, k, v) { tg[k] = v; return true; },
  });
}
function makeCanvas() {
  const c = {
    width: 0, height: 0, style: {},
    getContext: () => makeCtx(),
    addEventListener() {}, focus() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 360 }),
  };
  return c;
}
g.document = {
  createElement: () => makeCanvas(),
  addEventListener() {},
  readyState: 'complete',
  getElementById: () => null,
  title: '',
};

const { Save } = await import('../js/core/save.js');
Save.load();
Save.data.fragments = 100000; // let shop/nexus paths execute purchases visually
Save.data.credits = 1000;
await import('../js/main.js'); // side-effect globals
const { buildAllSprites } = await import('../js/data/sprites.js');
const { loadHeroArt } = await import('../js/data/heroes.js');
const { TitleScene } = await import('../js/scenes/title.js');
const { LobbyScene } = await import('../js/scenes/lobby.js');
const { GameScene } = await import('../js/scenes/game.js');
const { ResultsScene } = await import('../js/scenes/results.js');
const { setCtx, UI } = await import('../js/scenes/scene.js');
const { Input } = await import('../js/core/input.js');

buildAllSprites();
await loadHeroArt();

const ctx = makeCtx();
function freshG() {
  return { ctx, gotoResults: () => {}, gotoLobby: () => {}, startGame: () => {}, restartGame: () => {} };
}
const STEP = 1 / 60;

// ---- title ----
{
  const s = new TitleScene(); const G = freshG();
  s.enter(G, {});
  for (let i = 0; i < 30; i++) { s.update(STEP, G); UI.beginFrame(); setCtx(ctx); s.draw(ctx, G); Input.endFrame(); }
  console.log('draw ok: title');
}

// ---- lobby: tabs + shop sections + overlays ----
{
  const s = new LobbyScene(); const G = freshG();
  s.enter(G, {});
  s.tab = 0;
  for (let i = 0; i < 10; i++) { s.update(STEP, G); UI.beginFrame(); setCtx(ctx); s.draw(ctx, G); Input.endFrame(); }
  s.tab = 1; s.shopSec = 'nexus';
  for (let i = 0; i < 5; i++) { s.update(STEP, G); UI.beginFrame(); setCtx(ctx); s.draw(ctx, G); Input.endFrame(); }
  s.shopSec = 'cos'; s.skinSel = 'venom';
  for (let i = 0; i < 5; i++) { s.update(STEP, G); UI.beginFrame(); setCtx(ctx); s.draw(ctx, G); Input.endFrame(); }
  s.raidsOpen = true; UI.beginFrame(); setCtx(ctx); s.draw(ctx, G);
  s.raidsOpen = false; s.cfgOpen = true; UI.beginFrame(); setCtx(ctx); s.draw(ctx, G);
  console.log('draw ok: lobby (jogar + loja nexus/cosmetica + overlays)');
}

// ---- game: run + overlays ----
{
  const s = new GameScene(); const G = freshG();
  s.enter(G, { mode: 'run', heroId: 'stormgod' });
  for (let i = 0; i < 600; i++) {
    if (i === 100) for (let k = 0; k < 8; k++) s.collect(G, { kind: 'xp', value: 10 });
    s.update(STEP, G);
    UI.beginFrame();
    setCtx(ctx);
    s.draw(ctx, G);
    Input.endFrame();
    if (s.levelChoices && i > 110) { UI.beginFrame(); setCtx(ctx); s.draw(ctx, G); s.chooseUpgrade(G, 0); }
  }
  // pause overlay
  s.paused = true; UI.beginFrame(); setCtx(ctx); s.draw(ctx, G); s.paused = false;
  // comic-book announcements: each panel type
  G.comic.push('round', 'ROUND 4', '', 'burst', '#ffd94a');
  UI.beginFrame(); setCtx(ctx); s.draw(ctx, G);
  G.comic.update(5);
  G.comic.push('event', 'ENXAME DO CAOS', 'INIMIGOS EM FÚRIA', 'swarm', '#ff9a3c');
  UI.beginFrame(); setCtx(ctx); s.draw(ctx, G);
  G.comic.update(5);
  G.comic.push('boss', 'THANOS CORROMPIDO', 'O NEXUS CORROMPIDO EXIGE O FIM', 'alarm', '#ff4d4d');
  UI.beginFrame(); setCtx(ctx); s.draw(ctx, G);
  G.comic.update(5);
  G.comic.push('clear', 'INCURSÃO CONCLUÍDA', '+60 FRAGMENTOS', 'shield', '#4dff88');
  UI.beginFrame(); setCtx(ctx); s.draw(ctx, G);
  console.log('draw ok: game run + levelup + pause + comic panels');
}

// ---- game: raid (boss bar, beams) ----
{
  const s = new GameScene(); const G = freshG();
  s.enter(G, { mode: 'raid', raidId: 'raid_thanos', heroId: 'mystic' });
  for (let i = 0; i < 1200; i++) {
    s.update(STEP, G);
    UI.beginFrame();
    setCtx(ctx);
    s.draw(ctx, G);
    Input.endFrame();
  }
  console.log('draw ok: raid thanos (boss bar/beams/hazards)');
}

// ---- results ----
{
  const s = new ResultsScene(); const G = freshG();
  s.enter(G, { win: true, mode: 'raid', raid: { id: 'raid_ultron', name: 'X', rewardFragments: 100, rewardCredits: 10 }, heroId: 'claws', time: 123, kills: 88, level: 9, dodged: 42, runFragments: 55, fragGain: 1.2 });
  UI.beginFrame(); setCtx(ctx); s.draw(ctx, G);
  console.log('draw ok: results');
}

console.log('ALL DRAW SMOKE TESTS PASSED');
process.exit(0);
