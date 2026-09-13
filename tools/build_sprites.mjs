// ---------------------------------------------------------------------------
// MARVEL NEXUS — tools/build_sprites.mjs
// Exports every authored pixel sprite (enemies, bosses, bullets, icons,
// tiles, props) to PNG through ImageMagick. Run: npm run sprites
// ---------------------------------------------------------------------------
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const { buildAllSprites } = await import('../js/data/sprites.js');
const { SPR } = await import('../js/core/pixel.js');

buildAllSprites();

const OUT = 'assets/sprites/gen';
fs.mkdirSync(OUT, { recursive: true });
const TMP = '/tmp/nx_rgba.bin';

let n = 0;
for (const [name, pix] of Object.entries(SPR)) {
  if (!pix || !pix.data) continue; // canvas-only entries (heroes) skipped
  const w = pix.w, h = pix.h;
  fs.writeFileSync(TMP, Buffer.from(pix.data.buffer, pix.data.byteOffset, pix.data.byteLength));
  execSync(`convert -size ${w}x${h} -depth 8 rgba:${TMP} "${path.join(OUT, name + '.png')}"`);
  n++;
}
console.log(`exported ${n} sprites to ${OUT}/`);

// contact sheet for review
try {
  const groups = {
    enemies: ['en_drone', 'en_chitauri', 'en_symbiote', 'en_sorcerer', 'en_sentinel', 'en_spectre', 'en_jotun', 'en_chaos'],
    bosses: ['boss_ultron', 'boss_loki', 'boss_hela', 'boss_devourer', 'boss_thanos'],
    props: ['heart', 'gem', 'fragment', 'credit', 'skull', 'star', 'lock', 'check', 'b_player', 'b_enemy', 'b_pink', 'b_ice', 'b_blade', 'crate'],
  };
  for (const [g, names] of Object.entries(groups)) {
    const files = names.map((x) => `${OUT}/${x}.png`).filter((f) => fs.existsSync(f));
    execSync(`montage ${files.join(' ')} -filter point -tile x1 -geometry +6+6 -background '#202028' /tmp/sheet_${g}.png`);
  }
  execSync(`montage /tmp/sheet_enemies.png /tmp/sheet_bosses.png /tmp/sheet_props.png -tile x1 -geometry +0+4 -background '#101014' /tmp/sheet_all.png`);
  console.log('contact sheet: /tmp/sheet_all.png');
} catch (e) {
  console.warn('contact sheet skipped:', e.message);
}
