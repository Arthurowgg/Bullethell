// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/sprites.js
// Procedurally authored pixel art for enemies, bosses, arena tiles, props,
// icons and bullets. Single source of truth: the browser compiles these to
// canvases at boot; tools/build_sprites.mjs exports the same data to PNG via
// ImageMagick. Heroes come from AI-assisted pixel art processed by ImageMagick
// (assets/sprites/heroes/*) and are loaded by data/heroes.js.
// ---------------------------------------------------------------------------
import { Pix, reg, SPR, fromMap } from '../core/pixel.js';
import { RNG } from '../core/util.js';

const O = '#0b0a14'; // universal outline

// ===========================================================================
// ENEMIES (16x16 unless noted)
// ===========================================================================
function drone() { // Drones de Ultron — silver/red robot, single eye
  const p = new Pix(16, 16);
  p.rect(4, 4, 8, 8, '#8d93a8'); p.frame(4, 4, 8, 8, O);
  p.rect(5, 5, 6, 3, '#b9c0d4');
  p.rect(6, 7, 4, 2, '#3a0d12'); p.rect(7, 7, 2, 2, '#ff3b3b'); // eye
  p.rect(2, 6, 2, 4, '#5c6274'); p.rect(12, 6, 2, 4, '#5c6274'); // side pods
  p.px(2, 5, '#ff3b3b'); p.px(13, 5, '#ff3b3b');
  p.rect(6, 12, 1, 2, '#5c6274'); p.rect(9, 12, 1, 2, '#5c6274');
  p.rect(6, 2, 1, 2, '#5c6274'); p.rect(9, 2, 1, 2, '#5c6274');
  p.outline(O);
  return p;
}
function droneB() { const p = drone(); p.rect(7, 7, 2, 2, '#ffd94a'); return p; }

function chitauri() { // Soldados Chitauri — gaunt grey-green alien
  const p = new Pix(16, 16);
  p.rect(6, 2, 4, 4, '#7fae8f'); p.frame(6, 2, 4, 4, O);
  p.px(7, 4, '#ffe14a'); p.px(9, 4, '#ffe14a');
  p.rect(7, 1, 2, 1, '#4f7a5f');
  p.rect(5, 6, 6, 6, '#5e8a70'); p.frame(5, 6, 6, 6, O);
  p.rect(6, 7, 4, 2, '#46695a');
  p.rect(2, 7, 3, 2, '#9aa5b1'); p.px(1, 7, '#e8f2ff'); // blade arm
  p.rect(11, 7, 3, 2, '#9aa5b1'); p.px(14, 7, '#e8f2ff');
  p.rect(6, 12, 2, 3, '#46695a'); p.rect(9, 12, 2, 3, '#46695a');
  p.outline(O);
  return p;
}
function chitauriB() { const p = chitauri(); p.rect(2, 8, 3, 2, '#9aa5b1'); p.rect(11, 8, 3, 2, '#9aa5b1'); return p; }

function symbiote() { // Simbionte — black goo, white angry eyes
  const p = new Pix(16, 16);
  p.disc(8, 9, 5, '#14101f'); p.disc(8, 6, 4, '#1b1430');
  p.px(3, 8, '#14101f'); p.px(12, 7, '#14101f'); p.px(4, 12, '#14101f');
  p.rect(5, 6, 2, 2, '#e8f2ff'); p.rect(9, 6, 2, 2, '#e8f2ff');
  p.px(5, 7, '#14101f'); p.px(10, 7, '#14101f');
  p.px(7, 10, '#e8f2ff'); p.px(8, 10, '#e8f2ff'); // fangs
  p.px(6, 4, '#3d2f63'); p.px(9, 3, '#3d2f63');
  p.outline(O);
  return p;
}
function symbioteB() {
  const p = new Pix(16, 16);
  p.disc(8, 9, 5, '#14101f'); p.disc(7, 6, 3, '#1b1430'); p.disc(11, 7, 3, '#1b1430');
  p.rect(5, 6, 2, 2, '#e8f2ff'); p.rect(10, 7, 2, 2, '#e8f2ff');
  p.px(4, 11, '#14101f'); p.px(12, 11, '#14101f');
  p.outline(O);
  return p;
}

function sorcerer() { // Feiticeiro da Realidade — hooded, warp glow
  const p = new Pix(16, 16);
  p.rect(5, 2, 6, 5, '#5a2e8f'); p.frame(5, 2, 6, 5, O); // hood
  p.rect(6, 4, 4, 3, '#12081f');
  p.px(7, 5, '#ff5df2'); p.px(9, 5, '#ff5df2');
  p.rect(4, 7, 8, 7, '#472073'); p.frame(4, 7, 8, 7, O); // robe
  p.rect(6, 9, 4, 4, '#341457');
  p.rect(2, 8, 2, 3, '#472073'); p.rect(12, 8, 2, 3, '#472073');
  p.px(2, 8, '#ff5df2'); p.px(13, 8, '#ff5df2'); // hands
  p.outline(O);
  return p;
}
function sorcererB() { const p = sorcerer(); p.px(2, 8, '#fff'); p.px(13, 8, '#fff'); p.rect(6, 4, 4, 3, '#2a1040'); return p; }

function sentinel() { // Sentinela — big purple/grey elite robot 20x20
  const p = new Pix(20, 20);
  p.rect(5, 2, 10, 8, '#6b6f85'); p.frame(5, 2, 10, 8, O);
  p.rect(6, 4, 8, 3, '#241436');
  p.rect(7, 5, 2, 2, '#c95df2'); p.rect(11, 5, 2, 2, '#c95df2');
  p.rect(3, 10, 14, 8, '#565a70'); p.frame(3, 10, 14, 8, O);
  p.rect(5, 12, 10, 4, '#3f4358');
  p.rect(8, 12, 4, 3, '#c95df2'); // core
  p.rect(1, 10, 2, 6, '#43475c'); p.rect(17, 10, 2, 6, '#43475c');
  p.outline(O);
  return p;
}
function sentinelB() { const p = sentinel(); p.rect(8, 12, 4, 3, '#ff5df2'); p.rect(7, 5, 2, 2, '#ff5df2'); p.rect(11, 5, 2, 2, '#ff5df2'); return p; }

function spectre() { // Espectro de Hela — pale green wraith, no legs
  const p = new Pix(16, 18);
  p.rect(5, 2, 6, 5, '#bfe8d2'); p.frame(5, 2, 6, 5, '#123326');
  p.px(7, 4, '#0d2b1e'); p.px(9, 4, '#0d2b1e');
  p.rect(4, 7, 8, 6, '#9fd8bb'); p.frame(4, 7, 8, 6, '#123326');
  p.px(5, 13, '#9fd8bb'); p.px(8, 14, '#9fd8bb'); p.px(11, 13, '#9fd8bb'); // tattered tail
  p.px(10, 15, '#7cc4a1');
  p.rect(2, 8, 2, 4, '#9fd8bb'); p.rect(12, 8, 2, 4, '#9fd8bb');
  p.px(2, 8, '#eafff4'); p.px(13, 8, '#eafff4'); // blades
  p.outline('#123326');
  return p;
}
function spectreB() { const p = spectre(); p.px(2, 8, '#ffffff'); p.px(13, 8, '#ffffff'); return p; }

function jotun() { // Fera de Jotunheim — ice beast
  const p = new Pix(18, 16);
  p.rect(4, 4, 10, 7, '#7fd4ff'); p.frame(4, 4, 10, 7, '#0c2b45');
  p.rect(5, 5, 8, 3, '#bdeaff');
  p.px(6, 6, '#083a63'); p.px(11, 6, '#083a63');
  p.tri(4, 4, 6, 1, 8, 4, '#bdeaff'); p.tri(10, 4, 12, 1, 14, 4, '#bdeaff'); // ice spikes
  p.rect(3, 11, 3, 3, '#5cb8e8'); p.rect(12, 11, 3, 3, '#5cb8e8');
  p.rect(7, 11, 4, 2, '#5cb8e8');
  p.px(8, 8, '#eaffff'); p.px(9, 8, '#eaffff'); // fangs
  p.outline('#0c2b45');
  return p;
}
function jotunB() { const p = jotun(); p.rect(5, 5, 8, 3, '#e8fbff'); return p; }

function chaos() { // Fragmento do Caos — tiny magenta shard
  const p = new Pix(10, 10);
  p.diamond(5, 5, 3, '#ff5df2');
  p.diamond(5, 5, 1, '#ffd7fb');
  p.px(5, 1, '#ff5df2'); p.px(5, 9, '#ff5df2'); p.px(1, 5, '#ff5df2'); p.px(9, 5, '#ff5df2');
  return p;
}
function chaosB() { const p = chaos(); p.diamond(5, 5, 2, '#ffffff'); return p; }

// ===========================================================================
// BOSSES
// ===========================================================================
function ultronPrime() { // 40x40
  const p = new Pix(40, 40);
  // head
  p.rect(13, 3, 14, 10, '#a7adc2'); p.frame(13, 3, 14, 10, O);
  p.rect(15, 6, 10, 4, '#2a0d12');
  p.rect(16, 7, 3, 2, '#ff2b2b'); p.rect(21, 7, 3, 2, '#ff2b2b');
  p.tri(13, 3, 10, 0, 15, 4, '#7d8399'); p.tri(27, 3, 30, 0, 25, 4, '#7d8399');
  // torso
  p.rect(9, 13, 22, 16, '#6d7389'); p.frame(9, 13, 22, 16, O);
  p.rect(12, 16, 16, 10, '#4a4f66');
  p.rect(17, 18, 6, 6, '#12060a'); p.disc(20, 21, 2, '#ff2b2b'); // core
  // shoulders
  p.rect(3, 12, 6, 10, '#868ca3'); p.frame(3, 12, 6, 10, O);
  p.rect(31, 12, 6, 10, '#868ca3'); p.frame(31, 12, 6, 10, O);
  // arms
  p.rect(4, 22, 4, 10, '#565b73'); p.rect(32, 22, 4, 10, '#565b73');
  p.rect(3, 32, 6, 4, '#868ca3'); p.rect(31, 32, 6, 4, '#868ca3');
  // legs
  p.rect(13, 29, 5, 9, '#565b73'); p.rect(22, 29, 5, 9, '#565b73');
  p.rect(12, 37, 7, 2, '#3f4358'); p.rect(21, 37, 7, 2, '#3f4358');
  // red trim
  p.hline(9, 13, 22, '#c02434'); p.hline(9, 28, 22, '#c02434');
  p.outline(O);
  return p;
}

function loki() { // 32x40
  const p = new Pix(32, 40);
  // horned helmet
  p.rect(11, 4, 10, 9, '#20242c'); p.frame(11, 4, 10, 9, O);
  p.rect(13, 8, 6, 4, '#c9b48a'); // face
  p.px(14, 9, '#1d6b3a'); p.px(17, 9, '#1d6b3a');
  p.tri(11, 6, 4, 0, 12, 9, '#d8b64c'); p.tri(21, 6, 28, 0, 20, 9, '#d8b64c'); // big gold horns
  // torso green/gold
  p.rect(9, 13, 14, 14, '#1d5c36'); p.frame(9, 13, 14, 14, O);
  p.rect(11, 15, 10, 10, '#153f27');
  p.vline(16, 13, 14, '#d8b64c');
  p.rect(6, 13, 3, 8, '#d8b64c'); p.rect(23, 13, 3, 8, '#d8b64c'); // pauldrons
  p.rect(7, 21, 2, 8, '#1d5c36'); p.rect(23, 21, 2, 8, '#1d5c36');
  // lower
  p.rect(11, 27, 10, 10, '#122b1d'); p.frame(11, 27, 10, 10, O);
  p.vline(16, 27, 10, '#d8b64c');
  p.rect(11, 37, 4, 2, '#0c1d14'); p.rect(17, 37, 4, 2, '#0c1d14');
  // dagger glint
  p.px(25, 24, '#eafff4'); p.px(25, 25, '#bfe8d2');
  p.outline(O);
  return p;
}

function hela() { // 36x40
  const p = new Pix(36, 40);
  // crown of antlers
  p.rect(13, 5, 10, 8, '#0d0d12'); p.frame(13, 5, 10, 8, O);
  p.rect(15, 8, 6, 4, '#e6e0d4'); // pale face
  p.px(16, 9, '#0aa86a'); p.px(19, 9, '#0aa86a');
  for (let i = 0; i < 5; i++) {
    p.vline(11 - i, 5 - i, 5 + i, '#17171f');
    p.vline(24 + i, 5 - i, 5 + i, '#17171f');
  }
  p.px(7, 0, '#17171f'); p.px(28, 0, '#17171f');
  // body black armor
  p.rect(11, 13, 14, 14, '#17171f'); p.frame(11, 13, 14, 14, O);
  p.rect(13, 15, 10, 4, '#26262f');
  p.vline(18, 13, 14, '#0aa86a');
  p.rect(7, 13, 4, 9, '#17171f'); p.rect(25, 13, 4, 9, '#17171f');
  // tattered cape
  p.rect(11, 27, 14, 10, '#101017');
  for (let i = 0; i < 5; i++) p.vline(12 + i * 3, 30, 7 + (i % 2) * 2, '#101017');
  // green glow hands
  p.px(8, 22, '#0aa86a'); p.px(27, 22, '#0aa86a');
  p.outline(O);
  return p;
}

function devourer() { // 44x44 cosmic horror
  const p = new Pix(44, 44);
  p.disc(22, 22, 14, '#2a1440');
  p.disc(22, 20, 10, '#3b1d5c');
  p.disc(22, 20, 5, '#0d0618'); // maw
  p.disc(22, 20, 2, '#ff5df2'); // eye core
  // teeth ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    p.px(22 + Math.round(Math.cos(a) * 6), 20 + Math.round(Math.sin(a) * 6), '#e8d2ff');
  }
  // tentacles
  const t = [[6, 10], [38, 10], [4, 26], [40, 26], [10, 38], [34, 38]];
  t.forEach(([x, y], i) => {
    p.rect(x - 1, y - 1, 3, 3, '#4b2a73');
    p.px(x, y, i % 2 ? '#ff5df2' : '#8f5cff');
  });
  // cracks of energy
  p.px(14, 12, '#ff5df2'); p.px(30, 12, '#ff5df2'); p.px(12, 28, '#8f5cff'); p.px(32, 28, '#8f5cff');
  p.outline(O);
  return p;
}

function thanos() { // 44x48 corrupted titan
  const p = new Pix(44, 48);
  // head
  p.rect(17, 2, 10, 9, '#8e6bb0'); p.frame(17, 2, 10, 9, O);
  p.rect(18, 4, 8, 3, '#6e4b93');
  p.px(19, 5, '#ffd94a'); p.px(24, 5, '#ffd94a'); // glowing eyes
  p.hline(19, 8, 6, '#5a3a7d'); // chin ridges
  // shoulders + armor
  p.rect(8, 11, 28, 16, '#3c3547'); p.frame(8, 11, 28, 16, O);
  p.rect(10, 13, 24, 12, '#2b2436');
  p.rect(4, 10, 6, 10, '#d8b64c'); p.frame(4, 10, 6, 10, O); // gold pauldrons
  p.rect(34, 10, 6, 10, '#d8b64c'); p.frame(34, 10, 6, 10, O);
  // chest plate gold
  p.rect(18, 13, 8, 6, '#d8b64c'); p.frame(18, 13, 8, 6, O);
  // gauntlet arm with stones
  p.rect(34, 20, 5, 12, '#8e6bb0'); p.rect(33, 32, 7, 5, '#d8b64c'); p.frame(33, 32, 7, 5, O);
  const stones = ['#3bc4ff', '#ffd94a', '#ff4d4d', '#b06bff', '#4dff88', '#ff9d4d'];
  stones.forEach((c, i) => p.px(34 + (i % 3), 33 + ((i / 3) | 0) * 2, c));
  // other arm
  p.rect(5, 20, 5, 12, '#8e6bb0');
  // legs
  p.rect(14, 27, 7, 14, '#2b2436'); p.rect(23, 27, 7, 14, '#2b2436');
  p.rect(13, 41, 9, 3, '#1c1724'); p.rect(22, 41, 9, 3, '#1c1724');
  // corruption energy
  p.px(12, 16, '#b06bff'); p.px(31, 18, '#b06bff'); p.px(14, 24, '#ff5df2'); p.px(29, 24, '#ff5df2');
  p.outline(O);
  return p;
}

// ===========================================================================
// BULLETS / PICKUPS / ICONS
// ===========================================================================
function orb(size, rim, core) {
  const p = new Pix(size, size);
  const r = (size / 2) | 0;
  p.disc(r, r, r - 1, rim);
  p.disc(r, r, Math.max(1, r - 2), core);
  return p;
}
function shard(size, col, core) {
  const p = new Pix(size, size);
  const r = (size / 2) | 0;
  p.diamond(r, r, r - 1, col);
  p.diamond(r, r, Math.max(1, r - 2), core);
  return p;
}

function heart() {
  const p = new Pix(9, 8);
  p.rect(1, 1, 3, 3, '#ff4d6b'); p.rect(5, 1, 3, 3, '#ff4d6b');
  p.rect(1, 3, 7, 2, '#ff4d6b'); p.rect(2, 5, 5, 1, '#e03052'); p.rect(3, 6, 3, 1, '#e03052'); p.px(4, 7, '#c02040');
  p.px(2, 2, '#ffd0da');
  p.outline('#5c0d20');
  return p;
}
function gemXp() { return shard(8, '#4dd8ff', '#d8f8ff'); }
function fragment() {
  const p = new Pix(10, 12);
  p.diamond(5, 6, 4, '#4dd8ff');
  p.diamond(5, 5, 2, '#d8f8ff');
  p.vline(5, 1, 10, '#8feaff');
  return p;
}
function credit() {
  const p = new Pix(10, 10);
  p.disc(5, 5, 4, '#d8a53c');
  p.disc(5, 5, 3, '#ffd94a');
  p.vline(5, 3, 4, '#b07f1e'); p.hline(4, 4, 3, '#b07f1e');
  p.px(3, 3, '#fff2c0');
  return p;
}
function skull() {
  const p = new Pix(10, 10);
  p.rect(2, 1, 6, 5, '#e8e8f2'); p.frame(2, 1, 6, 5, O);
  p.rect(3, 6, 4, 2, '#c8c8d8');
  p.px(3, 3, O); p.px(6, 3, O); p.px(4, 5, '#8a8a9a');
  p.px(4, 7, O); p.px(5, 7, O);
  return p;
}
function star() {
  const p = new Pix(11, 11);
  p.px(5, 0, '#ffd94a'); p.rect(4, 1, 3, 2, '#ffd94a'); p.rect(1, 3, 9, 2, '#ffd94a');
  p.rect(2, 5, 7, 2, '#ffb43c'); p.rect(3, 7, 2, 2, '#ffb43c'); p.rect(6, 7, 2, 2, '#ffb43c');
  p.px(2, 9, '#ffb43c'); p.px(8, 9, '#ffb43c');
  return p;
}
function lockIc() {
  const p = new Pix(10, 11);
  p.rect(2, 5, 6, 5, '#c8a03c'); p.frame(2, 5, 6, 5, O);
  p.frame(3, 1, 4, 5, '#9a9ab0');
  p.px(5, 7, O); p.px(5, 8, O);
  return p;
}
function checkIc() {
  const p = new Pix(10, 10);
  p.px(1, 5, '#4dff88'); p.px(2, 6, '#4dff88'); p.px(3, 7, '#4dff88');
  p.px(4, 6, '#4dff88'); p.px(5, 5, '#4dff88'); p.px(6, 4, '#4dff88'); p.px(7, 3, '#4dff88'); p.px(8, 2, '#4dff88');
  return p;
}

// ===========================================================================
// ARENA TILES & PROPS
// ===========================================================================
export const THEMES = {
  nexus: { floor: '#141230', floorAlt: '#181642', line: '#2a2a6a', wall: '#2b2560', wallTop: '#4a3f9e', accent: '#7b5cff' },
  factory: { floor: '#23262e', floorAlt: '#282c36', line: '#3a3f4c', wall: '#3c414e', wallTop: '#6b7285', accent: '#ff8c3b' },
  palace: { floor: '#12332a', floorAlt: '#164034', line: '#1f5a48', wall: '#1d4a3c', wallTop: '#3fa07e', accent: '#d8b64c' },
  asgard: { floor: '#2b2b33', floorAlt: '#33333d', line: '#4a4a58', wall: '#4a4550', wallTop: '#8a8095', accent: '#d8b64c' },
  collapse: { floor: '#1c0f2e', floorAlt: '#241338', line: '#3d1f5c', wall: '#341a52', wallTop: '#6b3aa0', accent: '#ff5df2' },
  throne: { floor: '#200a12', floorAlt: '#2a0d18', line: '#451526', wall: '#3a1020', wallTop: '#7a2440', accent: '#ffd94a' },
  wakanda: { floor: '#12281a', floorAlt: '#163420', line: '#1f5a38', wall: '#1d4a2c', wallTop: '#3fa06e', accent: '#b06bff' },
  newyork: { floor: '#1d2027', floorAlt: '#242832', line: '#3a4050', wall: '#343a48', wallTop: '#6b7285', accent: '#4dd8ff' },
  skydeck: { floor: '#202a38', floorAlt: '#273344', line: '#3a4a60', wall: '#33405a', wallTop: '#6b7f9e', accent: '#4dd8ff' },
  ruins: { floor: '#241d18', floorAlt: '#2c241d', line: '#4a3a2a', wall: '#3a2d20', wallTop: '#7a5c3a', accent: '#ff8c3b' },
  nexuscore: { floor: '#1a1030', floorAlt: '#221540', line: '#3d2a6a', wall: '#2b1d52', wallTop: '#5a3fa0', accent: '#b06bff' },
  boss_kang: { floor: '#0d2020', floorAlt: '#102828', line: '#1f4a44', wall: '#16383a', wallTop: '#3fa08e', accent: '#4dff88' },
  boss_ultron: { floor: '#23262e', floorAlt: '#282c36', line: '#3a3f4c', wall: '#3c414e', wallTop: '#6b7285', accent: '#ff4d4d' },
  boss_loki: { floor: '#0d1a12', floorAlt: '#10241a', line: '#1f5a38', wall: '#1d4a2c', wallTop: '#d8b64c', accent: '#4dff88' },
  boss_hela: { floor: '#0a1410', floorAlt: '#0d1c14', line: '#1f4a30', wall: '#16301f', wallTop: '#3fa07e', accent: '#4dff88' },
  boss_devourer: { floor: '#0d0f2a', floorAlt: '#101436', line: '#2a2a6a', wall: '#2b2560', wallTop: '#4dd8ff', accent: '#4dd8ff' },
  boss_thanos: { floor: '#241005', floorAlt: '#2e1508', line: '#5a2a10', wall: '#4a2008', wallTop: '#ff8c3b', accent: '#ff8c3b' },
};

function makeFloor(theme, seed) {
  const rng = new RNG(seed);
  const p = new Pix(16, 16);
  p.rect(0, 0, 16, 16, theme.floor);
  for (let i = 0; i < 10; i++) p.px(rng.int(0, 15), rng.int(0, 15), theme.floorAlt);
  p.frame(0, 0, 16, 16, theme.line);
  if (seed % 2 === 0) { p.px(2, 2, theme.wallTop); p.px(13, 13, theme.wallTop); } // rivets
  return p;
}
function makeWall(theme) {
  const p = new Pix(16, 16);
  p.rect(0, 0, 16, 16, theme.wall);
  p.rect(0, 0, 16, 6, theme.wallTop);
  p.hline(0, 6, 16, O);
  for (let x = 0; x < 16; x += 4) p.px(x, 2, '#ffffff22');
  p.px(3, 10, '#00000055'); p.px(11, 12, '#00000055');
  return p;
}

function portal(theme) {
  const p = new Pix(24, 28);
  p.disc(12, 14, 10, theme.accent);
  p.disc(12, 14, 8, '#12081f');
  p.disc(12, 14, 5, theme.accent + '55');
  p.disc(12, 14, 2, '#ffffff');
  p.px(4, 8, theme.accent); p.px(20, 20, theme.accent); p.px(19, 7, theme.accent); p.px(5, 21, theme.accent);
  return p;
}
function consoleProp(theme) {
  const p = new Pix(16, 16);
  p.rect(2, 4, 12, 10, '#2a2f3c'); p.frame(2, 4, 12, 10, O);
  p.rect(4, 6, 8, 4, '#0d2b3c');
  p.px(5, 7, theme.accent); p.px(7, 8, '#4dd8ff'); p.px(9, 7, theme.accent);
  p.rect(4, 11, 8, 1, '#4a5060');
  return p;
}
function crate() {
  const p = new Pix(16, 16);
  p.rect(1, 2, 14, 13, '#5c4526'); p.frame(1, 2, 14, 13, O);
  p.frame(3, 4, 10, 9, '#7a5c33');
  p.hline(3, 8, 10, '#3d2d17'); p.vline(8, 4, 9, '#3d2d17');
  return p;
}
function banner(theme) {
  const p = new Pix(10, 20);
  p.hline(0, 0, 10, '#3a3f4c');
  p.rect(1, 1, 8, 15, theme.wall);
  p.tri(1, 16, 5, 20, 9, 16, theme.wall);
  p.diamond(5, 8, 2, theme.accent);
  return p;
}

// ===========================================================================
// BUILD ALL
// ===========================================================================
export function buildAllSprites() {
  // enemies: [idle, alt] frames
  reg('en_drone', drone()); reg('en_drone_b', droneB());
  reg('en_chitauri', chitauri()); reg('en_chitauri_b', chitauriB());
  reg('en_symbiote', symbiote()); reg('en_symbiote_b', symbioteB());
  reg('en_sorcerer', sorcerer()); reg('en_sorcerer_b', sorcererB());
  reg('en_sentinel', sentinel()); reg('en_sentinel_b', sentinelB());
  reg('en_spectre', spectre()); reg('en_spectre_b', spectreB());
  reg('en_jotun', jotun()); reg('en_jotun_b', jotunB());
  reg('en_chaos', chaos()); reg('en_chaos_b', chaosB());

  reg('boss_ultron', ultronPrime());
  reg('boss_loki', loki());
  reg('boss_hela', hela());
  reg('boss_devourer', devourer());
  reg('boss_thanos', thanos());

  // bullets — distinct hero shots
  reg('b_web', (() => { const p = new Pix(7, 7); p.disc(3, 3, 2, '#e8f2ff'); p.hline(0, 3, 7, '#9aa5b1'); p.vline(3, 0, 7, '#9aa5b1'); p.px(3, 3, '#ffffff'); return p; })());
  reg('b_bolt', (() => { const p = new Pix(7, 7); p.px(3, 0, '#eaffff'); p.px(2, 1, '#9feaff'); p.px(3, 2, '#4dd8ff'); p.px(4, 3, '#9feaff'); p.px(3, 4, '#4dd8ff'); p.px(2, 5, '#9feaff'); p.px(3, 6, '#eaffff'); return p; })());
  reg('b_repulsor', (() => { const p = new Pix(7, 7); p.circle(3, 3, 3, '#1e7fae', false); p.disc(3, 3, 2, '#4dd8ff'); p.px(3, 3, '#ffffff'); return p; })());
  reg('b_tracer', (() => { const p = new Pix(6, 6); p.rect(1, 2, 4, 2, '#ffd94a'); p.px(5, 2, '#ff6b6b'); p.px(5, 3, '#ff6b6b'); p.px(0, 2, '#fff2c0'); p.px(0, 3, '#fff2c0'); return p; })());
  reg('b_mandala', (() => { const p = new Pix(8, 8); p.circle(3, 3, 3, '#ff9d4d', false); p.diamond(3, 3, 1, '#ffd94a'); p.px(3, 0, '#ffd94a'); p.px(0, 3, '#ffd94a'); p.px(6, 3, '#ffd94a'); p.px(3, 6, '#ffd94a'); return p; })());
  reg('b_player', orb(6, '#4dd8ff', '#eaffff'));
  reg('b_player2', orb(6, '#ffd94a', '#fffbe0'));
  reg('b_enemy', orb(6, '#ff5d8f', '#ffe0ea'));
  reg('b_enemy2', orb(8, '#ff5d8f', '#ffd0de'));
  reg('b_pink', orb(6, '#ff5df2', '#ffd7fb'));
  reg('b_purple', orb(8, '#b06bff', '#e8d2ff'));
  reg('b_orange', orb(6, '#ff8c3b', '#ffe8d0'));
  reg('b_green', orb(6, '#4dff88', '#dcffe8'));
  reg('b_ice', shard(8, '#7fd4ff', '#eaffff'));
  reg('b_gold', shard(8, '#ffd94a', '#fffbe0'));
  reg('b_blade', shard(10, '#bfe8d2', '#ffffff'));
  reg('b_zapbolt', (() => { const p = new Pix(9, 11); p.tri(4, 0, 7, 5, 4, 5, '#9feaff'); p.tri(4, 0, 1, 5, 4, 5, '#4dd8ff'); p.tri(2, 5, 7, 5, 4, 10, '#eaffff'); p.tri(2, 5, 4, 10, 3, 6, '#4dd8ff'); p.px(4, 2, '#ffffff'); p.px(4, 4, '#ffffff'); p.px(4, 7, '#ffffff'); return p; })());
  reg('b_hammer', (() => { const p = new Pix(11, 9); p.rect(1, 2, 9, 5, '#6b7288'); p.rect(2, 3, 7, 3, '#8d93a8'); p.rect(0, 3, 2, 3, '#4dd8ff'); p.rect(9, 3, 2, 3, '#4dd8ff'); p.rect(4, 0, 3, 2, '#524a3a'); p.px(2, 4, '#9feaff'); p.px(8, 4, '#9feaff'); return p; })());
  reg('b_knife', (() => { const p = new Pix(10, 5); p.tri(5, 0, 9, 2, 5, 4, '#d8dde8'); p.rect(1, 1, 5, 3, '#8d93a8'); p.px(9, 2, '#ffffff'); p.rect(0, 2, 2, 1, '#ff4d4d'); p.px(7, 2, '#ffffff'); return p; })());

  // pickups & icons
  reg('heart', heart());
  reg('gem', gemXp());
  reg('fragment', fragment());
  reg('credit', credit());
  reg('skull', skull());
  reg('star', star());
  reg('lock', lockIc());
  reg('check', checkIc());

  // tiles per theme
  for (const [id, theme] of Object.entries(THEMES)) {
    reg('floor_' + id + '_0', makeFloor(theme, 1));
    reg('floor_' + id + '_1', makeFloor(theme, 2));
    reg('wall_' + id, makeWall(theme));
    reg('portal_' + id, portal(theme));
    reg('console_' + id, consoleProp(theme));
    reg('banner_' + id, banner(theme));
  }
  reg('crate', crate());

  // world chips for the new campaign maps (AI sheets override when loaded)
  reg('wicon_skydeck', (() => { const p = new Pix(20, 20); p.rect(2, 12, 16, 4, '#33405a'); p.rect(4, 10, 12, 2, '#6b7f9e'); p.rect(8, 4, 4, 6, '#4dd8ff'); p.px(9, 5, '#eaffff'); p.rect(2, 16, 16, 1, '#4dd8ff'); return p; })());
  reg('wicon_ruins', (() => { const p = new Pix(20, 20); p.rect(3, 8, 5, 9, '#3a2d20'); p.rect(9, 5, 5, 12, '#4a3a2a'); p.rect(15, 10, 3, 7, '#3a2d20'); p.px(10, 7, '#ff8c3b'); p.px(4, 10, '#ff8c3b'); p.rect(2, 17, 16, 1, '#7a5c3a'); return p; })());
  reg('wicon_nexuscore', (() => { const p = new Pix(20, 20); p.diamond(10, 10, 6, '#2b1d52'); p.diamond(10, 10, 4, '#5a3fa0'); p.diamond(10, 10, 2, '#b06bff'); p.px(10, 10, '#ffffff'); return p; })());
  reg('wicon_boss_kang', (() => { const p = new Pix(20, 20); p.rect(7, 3, 6, 3, '#3fa08e'); p.tri(6, 6, 14, 6, 10, 11, '#4dff88'); p.tri(6, 17, 14, 17, 10, 12, '#4dff88'); p.px(10, 10, '#ffffff'); return p; })());
  // procedural Kang fallbacks (overridden by AI sheets)
  reg('boss_kang', (() => { const p = new Pix(24, 26); p.rect(9, 2, 6, 5, '#3fa08e'); p.rect(8, 7, 8, 10, '#16383a'); p.rect(6, 8, 2, 7, '#16383a'); p.rect(16, 8, 2, 7, '#16383a'); p.rect(9, 17, 2, 7, '#102828'); p.rect(13, 17, 2, 7, '#102828'); p.px(10, 4, '#4dff88'); p.px(13, 4, '#4dff88'); p.rect(8, 9, 8, 1, '#4dff88'); return p; })());
  reg('shot_boss_kang', (() => { const p = new Pix(8, 8); p.diamond(3, 3, 2, '#4dff88'); p.px(3, 3, '#ffffff'); p.px(0, 3, '#3fa08e'); p.px(6, 3, '#3fa08e'); return p; })());
  return SPR;
}
