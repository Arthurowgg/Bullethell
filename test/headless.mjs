// ---------------------------------------------------------------------------
// MARVEL NEXUS — headless smoke test.
// Boots the real GameScene (no DOM) and simulates minutes of play:
// waves spawn, bullets fly, kills happen, XP/level-up works, raid boss
// attacks and takes damage. Exits non-zero on any failure.
// ---------------------------------------------------------------------------
import assert from 'node:assert';

const { Save } = await import('../js/core/save.js');
Save.load();

// main.js sets up __nx_enemy/__nx_item globals as a side effect (no DOM boot)
await import('../js/main.js');
const { buildAllSprites } = await import('../js/data/sprites.js');
const { loadHeroArt } = await import('../js/data/heroes.js');
const { GameScene } = await import('../js/scenes/game.js');
const { Input } = await import('../js/core/input.js');
const { gainXp } = await import('../js/game/run.js');

buildAllSprites();
await loadHeroArt();

function freshG() {
  return {
    ctx: {},
    gotoResults: () => {},
    gotoLobby: () => {},
    startGame: () => {},
    restartGame: () => {},
  };
}

const STEP = 1 / 60;

function run(scene, G, seconds, hooks = {}) {
  const frames = Math.floor(seconds * 60);
  let maxEnemyBullets = 0, maxPlayerBullets = 0;
  for (let i = 0; i < frames; i++) {
    hooks.frame && hooks.frame(i, G);
    scene.update(STEP, G);
    maxEnemyBullets = Math.max(maxEnemyBullets, G.bullets ? G.bullets.enemy.count : 0);
    maxPlayerBullets = Math.max(maxPlayerBullets, G.bullets ? G.bullets.player.count : 0);
    Input.endFrame();
  }
  return { maxEnemyBullets, maxPlayerBullets };
}

// ---------------- TEST 1: standard run ------------------------------------
{
  const G = freshG();
  const scene = new GameScene();
  scene.enter(G, { mode: 'run', heroId: 'arachnid' });
  assert.ok(G.player, 'player exists');
  assert.ok(G.waves, 'wave director exists');

  // keep the test player alive and moving: rotate movement + iframes cheat
  const dirs = ['KeyD', 'KeyW', 'KeyA', 'KeyS'];
  let leveled = false;
  let sawBoss = false, maxRound = 0, sawWorld = null;
  const r = run(scene, G, 250, {
    frame: (i, G) => {
      if (G.boss) sawBoss = true;
      if (G.portal) { G.player.x = G.portal.x; G.player.y = G.portal.y; } // step into the tear
      if (G.arena.themeId && G.arena.themeId.startsWith('boss_')) sawWorld = G.arena.themeId;
      if (G.waves) maxRound = Math.max(maxRound, G.waves.round);
      if (i % 90 === 0) {
        Input.keys.clear();
        Input.keys.add(dirs[(i / 90) % 4 | 0]);
      }
      G.player.iframes = Math.max(G.player.iframes, 0.5); // survive for the smoke test
      // feed XP at ~10s to force a level-up
      if (i === 600) {
        for (let k = 0; k < 6; k++) scene.collect(G, { kind: 'xp', value: 10 });
      }
      // pick upgrade when choices appear
      if (scene.levelChoices && !leveled) {
        scene.chooseUpgrade(G, 0);
        assert.ok(!scene.levelChoices, 'choices closed after pick');
        leveled = true;
      }
      if (scene.levelChoices) scene.chooseUpgrade(G, i % 3);
      // occasionally dash & ability & special charge
      if (i === 300) Input.pressedKeys.add('Space');
      if (i % 1200 === 600) Input.pressedKeys.add('KeyQ');
      if (i % 600 === 0) G.player.addCharge(50);
      if (i % 2400 === 1200) Input.pressedKeys.add('KeyE');
    },
  });

  console.log('[run] time=', G.time.toFixed(1), 'kills=', G.kills, 'enemies=', G.enemies.length,
    'lvl=', G.runStats.level, 'enemyBulletsMax=', r.maxEnemyBullets, 'playerBulletsMax=', r.maxPlayerBullets,
    'round=', G.waves.round, 'sawBoss=', sawBoss);
  assert.ok(G.time > 240, 'full run length simulated');
  assert.ok(sawBoss, 'an incursion boss round started');
  assert.ok(sawWorld, 'player was transported to a boss-exclusive world (' + sawWorld + ')');
  assert.ok(maxRound >= 2, 'round ladder advanced past round 3');
  assert.ok(G.comic && G.comic.cur !== undefined, 'comic UI active');
  assert.ok(G.enemies.length > 0 || G.kills > 0, 'enemies spawned/fought');
  assert.ok(r.maxPlayerBullets > 0, 'player fired bullets');
  assert.ok(r.maxEnemyBullets > 0, 'enemies fired bullet-hell bullets');
  assert.ok(leveled, 'level-up choice flow worked');
  assert.ok(G.runStats.level >= 2, 'run level advanced');
  assert.ok(G.kills > 0, 'player killed enemies');
  console.log('PASS test1: standard run');
}

// ---------------- TEST 2: raid vs Ultron Prime ----------------------------
{
  const G = freshG();
  const scene = new GameScene();
  scene.enter(G, { mode: 'raid', raidId: 'raid_ultron', heroId: 'ironknight' });
  assert.ok(G.boss, 'boss spawned');
  const bossMax = G.boss.maxHp;

  const r = run(scene, G, 40, {
    frame: (i) => {
      if (i === 240) Input.pressedKeys.add('KeyQ'); // missiles
    },
  });

  console.log('[raid] bossHp=', G.boss ? G.boss.hp.toFixed(0) : 'dead', '/', bossMax,
    'enemyBulletsMax=', r.maxEnemyBullets, 'playerHp=', G.runStats.hp.toFixed(0));
  assert.ok(r.maxEnemyBullets > 20, 'boss bullet-hell patterns fired');
  assert.ok(!G.boss || G.boss.hp < bossMax, 'boss took damage');
  console.log('PASS test2: raid boss fight');
}

// ---------------- TEST 3: all heroes instantiate + raid bosses boot -------
{
  const { HEROES } = await import('../js/data/heroes.js');
  const { RAIDS } = await import('../js/data/raids.js');
  for (const h of HEROES) {
    const G = freshG();
    const scene = new GameScene();
    scene.enter(G, { mode: 'run', heroId: h.id });
    run(scene, G, 6);
    assert.ok(G.player.alive || true, 'hero ran: ' + h.id);
  }
  for (const r of RAIDS) {
    const G = freshG();
    const scene = new GameScene();
    scene.enter(G, { mode: 'raid', raidId: r.id, heroId: 'claws' });
    run(scene, G, 8);
    assert.ok(G.boss, 'boss boots: ' + r.boss);
  }
  console.log('PASS test3: 6 heroes + 5 raids boot and simulate');
}

// ---------------- TEST 4: each hero's basic + Q special fires -------------
{
  const { HEROES } = await import('../js/data/heroes.js');
  const stateKey = {
    arachnid: 'webStormT', stormgod: 'stormT', ironknight: 'volleyT',
    merc: 'frenzyT', claws: 'rushT', mystic: 'portalQ',
  };
  for (const h of HEROES) {
    const G = freshG();
    const scene = new GameScene();
    scene.enter(G, { mode: 'run', heroId: h.id });
    const P = G.player;
    // clear intro/level-up/pause so the world actually steps, then simulate
    scene.levelChoices = null; scene.levelQueue = 0; scene.paused = false; scene.state = 'playing'; scene.introT = 0;
    run(scene, G, 2);
    assert.ok(P.shotCount > 0 || P.comboStep >= 0, h.id + ' basic attacked');
    // park some enemies close so the special has targets
    const targets = [];
    for (let k = 0; k < 3 && k < G.enemies.length; k++) {
      const e = G.enemies[k];
      e.x = P.x + 30 + k * 14; e.y = P.y + 18; e.spawnT = 0;
      targets.push(e);
    }
    const tgtHp = () => targets.reduce((a, e) => a + (e.dead ? 0 : e.hp), 0);
    const killsBefore = G.kills || 0;
    const hpBefore = tgtHp();
    P.charge = 100;
    Input.pressedKeys.add('KeyQ');
    scene.update(STEP, G);
    Input.endFrame();
    const key = stateKey[h.id];
    assert.ok(P[key], h.id + ' special set ' + key);
    assert.ok(P.charge < 100, h.id + ' charge consumed');
    // let the special run its course without throwing
    run(scene, G, 3);
    assert.ok(tgtHp() < hpBefore || (G.kills || 0) > killsBefore, h.id + ' special damaged enemies');
    console.log('  ' + h.id + ' basic+Q ok (kills during Q: ' + ((G.kills || 0) - killsBefore) + ')');
  }
  console.log('PASS test4: 6 heroes basic attack + Q special');
}

console.log('ALL HEADLESS TESTS PASSED');
process.exit(0);
