// ---------------------------------------------------------------------------
// MARVEL NEXUS — ability smoke test: every hero's E ability must fire and
// produce its effect through the real input path.
// ---------------------------------------------------------------------------
import assert from 'node:assert';

const { Save } = await import('../js/core/save.js');
Save.load();
await import('../js/main.js');
const { buildAllSprites } = await import('../js/data/sprites.js');
const { loadHeroArt } = await import('../js/data/heroes.js');
const { GameScene } = await import('../js/scenes/game.js');
const { Input } = await import('../js/core/input.js');
buildAllSprites();
await loadHeroArt();

const STEP = 1 / 60;
const HEROES = ['arachnid', 'stormgod', 'ironknight', 'merc', 'claws', 'mystic'];

for (const hid of HEROES) {
  const G = { ctx: {}, gotoResults() {}, gotoLobby() {}, startGame() {}, restartGame() {} };
  const scene = new GameScene();
  scene.enter(G, { mode: 'run', heroId: hid });
  scene.levelChoices = null; scene.levelQueue = 0; scene.paused = false; scene.state = 'playing'; scene.introT = 0;
  // park 3 enemies around the player
  for (let i = 0; i < 3; i++) {
    scene.summon(G, 'drone', 1);
    const e = G.enemies[G.enemies.length - 1];
    e.x = G.player.x + (i - 1) * 30; e.y = G.player.y - 30; e.spawnT = 0;
  }
  const P = G.player;
  const bulletsBefore = G.bullets.player.count;
  Input.pressedKeys.add('KeyE');
  scene.update(STEP, G);
  Input.endFrame();
  assert.ok(P.abilityCd > 0, hid + ' E went on cooldown');
  switch (hid) {
    case 'arachnid': assert.ok(G.enemies.some((e) => (e.rooted || 0) > 0), 'arachnid web root'); break;
    case 'stormgod': assert.ok(P.hammerT > 0, 'stormgod hammer up'); break;
    case 'ironknight': assert.ok(G.bullets.player.count > bulletsBefore || P.burst > 0, 'ironknight missiles'); break;
    case 'merc': assert.ok(G.bullets.player.count > bulletsBefore, 'merc blades'); break;
    case 'claws': assert.ok(P.dashT > 0, 'claws lunge'); break;
    case 'mystic': assert.ok(G.bullets.player.count > bulletsBefore, 'mystic nova'); break;
  }
  // ability must come back off cooldown and be usable again
  for (let i = 0; i < 60 * 12; i++) { scene.update(STEP, G); Input.endFrame(); }
  assert.ok(P.abilityCd <= 0.01, hid + ' E cooldown recovers');
  console.log(hid + ' E ability ok');
}
console.log('ALL ABILITY TESTS PASSED');
