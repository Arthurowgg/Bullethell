// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/hud.js
// Combat HUD: hp, xp, abilities, special meter, timer, kills, boss bar.
// ---------------------------------------------------------------------------
import { drawText } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { fmtTime, clamp } from '../core/util.js';
import { xpNeed } from './run.js';
import { VIEW_W } from './arena.js';

export function drawHud(ctx, G) {
  const st = G.runStats;
  const P = G.player;

  // -- top-left: hp + xp --
  drawSprite(ctx, SPR[P.base] || SPR['hero_' + P.hero.id], 16, 18, { scale: 0.6 });
  // hp bar
  const hbx = 28, hby = 10, hbw = 110, hbh = 7;
  ctx.fillStyle = '#100818';
  ctx.fillRect(hbx - 1, hby - 1, hbw + 2, hbh + 2);
  ctx.fillStyle = '#3d0d1c';
  ctx.fillRect(hbx, hby, hbw, hbh);
  const hpf = clamp(st.hp / st.maxHp, 0, 1);
  ctx.fillStyle = hpf > 0.35 ? '#ff4d6b' : '#ff2b2b';
  ctx.fillRect(hbx, hby, Math.round(hbw * hpf), hbh);
  ctx.fillStyle = '#ffffff55';
  ctx.fillRect(hbx, hby, Math.round(hbw * hpf), 2);
  drawText(ctx, `${Math.ceil(st.hp)}/${st.maxHp}`, hbx + hbw + 6, hby, { scale: 1, color: '#ffd0da' });
  if (st.shield > 0) drawText(ctx, `ESCUDO x${st.shield}`, hbx, hby + 9, { scale: 1, color: '#4dd8ff' });

  // xp bar
  const xby = hby + hbh + 3;
  ctx.fillStyle = '#081018';
  ctx.fillRect(hbx - 1, xby - 1, hbw + 2, 4);
  ctx.fillStyle = '#0d2b3c';
  ctx.fillRect(hbx, xby, hbw, 2);
  ctx.fillStyle = '#4dd8ff';
  ctx.fillRect(hbx, xby, Math.round(hbw * clamp(st.xp / xpNeed(st.level), 0, 1)), 2);
  drawText(ctx, `NV ${st.level}`, hbx + hbw + 6, xby - 3, { scale: 1, color: '#9feaff' });

  // -- top-center: timer / kills / fragments --
  drawText(ctx, fmtTime(G.time), VIEW_W / 2, 10, { scale: 2, align: 'center', color: '#e8e8ff', shadow: true });
  drawSprite(ctx, SPR.skull, VIEW_W / 2 - 46, 26, { scale: 0.8 });
  drawText(ctx, String(G.kills), VIEW_W / 2 - 38, 26, { color: '#c8c8d8' });
  drawSprite(ctx, SPR.fragment, VIEW_W / 2 + 26, 27, { scale: 0.8 });
  drawText(ctx, String(G.runFragments), VIEW_W / 2 + 36, 26, { color: '#9feaff' });

  // top-right: round ladder + current world icon
  if (G.waves) {
    const r = G.waves.cur ? G.waves.cur() : null;
    const tid = G.arena && G.arena.themeId;
    const ic = SPR['wicon_' + tid] || SPR.ui_burst;
    const bossish = r && r.t === 'boss';
    const label = `ROUND ${G.waves.round + 1}/${12}`;
    drawText(ctx, label, VIEW_W - 26, 8, { align: 'right', scale: 1, color: bossish ? '#ff8c8c' : '#dcd6f6', shadow: true });
    if (ic) drawSprite(ctx, ic, VIEW_W - 14, 14, { scale: 1.2 });
    const WLABEL = { wakanda: 'REINO DE VIBRANIUM', asgard: 'PONTE DO ARCO-ÍRIS', newyork: 'CRUZAMENTO DOS HERÓIS',
      boss_ultron: 'SOKOVIA SUSPENSA', boss_loki: 'SALÃO DAS ILUSÕES', boss_hela: 'REINO DOS MORTOS', boss_devourer: 'VAZIO CÓSMICO', boss_thanos: 'MUNDO EM CINZAS' };
    if (WLABEL[tid]) drawText(ctx, WLABEL[tid], VIEW_W - 8, 17, { align: 'right', scale: 1, color: '#9a93c8', shadow: true });
  }
  if (G.banner) {
    ctx.globalAlpha = Math.min(1, G.banner.t);
    drawText(ctx, G.banner.text, VIEW_W / 2, 120, { scale: 2, align: 'center', color: G.banner.color || '#e8e8ff', shadow: true });
    ctx.globalAlpha = 1;
  }

  // -- bottom-left: abilities with hero icons + custom borders --
  drawAbility(ctx, 14, 320, 'Q', P.hero.special.name, 100 - P.charge, 100, '#ffd94a', P.charge >= 100, P.charge >= 100 ? 'PRONTO!' : null, SPR['abil_' + P.hero.id + '_e'], P.hero.id);
  drawAbility(ctx, 52, 320, 'E', P.hero.ability.name, P.abilityCd, P.hero.ability.cd * st.cdr, P.hero.color, P.abilityCd <= 0, null, SPR['abil_' + P.hero.id + '_q'], P.hero.id);
  drawAbility(ctx, 90, 320, 'ESP', 'ESQUIVA', P.dashCd, st.dashCd, '#ffffff', P.dashCd <= 0, null, SPR.ui_bolt, P.hero.id);

  // -- boss bar: custom AI frame sprite + code fill --
  if (G.boss && !G.boss.dead) {
    const b = G.boss;
    const bw = 380, bh = 18, bx = (VIEW_W - bw) / 2, by = 324;
    const BCOLOR = { ultron: '#ff4d4d', loki: '#4dff88', hela: '#4dff88', devourer: '#4dd8ff', thanos: '#b06bff' };
    const bc = BCOLOR[b.def.id] || '#ff2b5c';
    // portrait
    const por = SPR['portrait_' + b.def.id] || SPR['boss_' + b.def.id];
    if (por) drawSprite(ctx, por, bx - 18, by + 6, { scale: Math.min(26 / por.height, 26 / por.width) });
    drawText(ctx, b.def.name, VIEW_W / 2, by - 9, { align: 'center', scale: 1, color: bc, shadow: true });
    const frame = SPR['bar_' + b.def.id];
    const f = clamp(b.hp / b.maxHp, 0, 1);
    if (frame) {
      // code fill clipped inside the custom frame sprite
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx + 4, by + 4, bw - 8, bh - 8);
      ctx.clip();
      ctx.fillStyle = '#14060c';
      ctx.fillRect(bx + 4, by + 4, bw - 8, bh - 8);
      const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      grad.addColorStop(0, bc);
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.fillRect(bx + 4, by + 4, Math.round((bw - 8) * f), bh - 8);
      ctx.fillStyle = '#00000055'; // damage shade line
      ctx.fillRect(bx + 4, by + bh - 6, Math.round((bw - 8) * f), 2);
      ctx.fillStyle = '#ffffff44'; // top shine
      ctx.fillRect(bx + 4, by + 4, Math.round((bw - 8) * f), 1);
      for (let i = 1; i < b.def.phases.length; i++) {
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(bx + 4 + (bw - 8) * b.def.phases[i].until, by + 4, 1, bh - 8);
      }
      ctx.restore();
      drawSprite(ctx, frame, bx + bw / 2, by + bh / 2, { scaleX: bw / frame.width, scaleY: bh / frame.height });
    } else {
      ctx.fillStyle = '#100818';
      ctx.fillRect(bx - 1, by - 1, bw + 2, 10);
      ctx.fillStyle = '#3d0d1c';
      ctx.fillRect(bx, by, bw, 8);
      ctx.fillStyle = bc;
      ctx.fillRect(bx, by, Math.round(bw * f), 8);
    }
  }

  // control hint (first run)
  if (G.hintT > 0) {
    ctx.globalAlpha = Math.min(1, G.hintT);
    drawText(ctx, 'WASD MOVER  ·  MOUSE MIRAR  ·  ESPAÇO ESQUIVA  ·  Q ESPECIAL  ·  E HABILIDADE', VIEW_W / 2, 300, { align: 'center', scale: 1, color: '#9a93c8', shadow: true });
    ctx.globalAlpha = 1;
  }
}

function drawAbility(ctx, x, y, key, name, cd, cdMax, color, ready, readyLabel, icon, heroId) {
  const s = 26;
  ctx.fillStyle = '#100818cc';
  ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = ready ? color : '#7a74a0';
  ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  // cooldown sweep
  if (!ready && cdMax > 0) {
    const f = clamp(cd / cdMax, 0, 1);
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(x, y, s, Math.round(s * f));
  }
  // custom per-hero border (same usable size, border changes)
  const HB = { arachnid: '#ff4d4d', stormgod: '#9feaff', ironknight: '#ffd94a', merc: '#ff8c8c', claws: '#ff8c3b', mystic: '#b06bff' };
  ctx.strokeStyle = HB[heroId] || color;
  ctx.strokeRect(x - 1.5, y - 1.5, s + 3, s + 3);
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(x - 2.5, y - 2.5, s + 5, s + 5);
  if (icon) drawSprite(ctx, icon, x + s / 2, y + s / 2 - 2, { scale: 16 / Math.max(icon.width, icon.height) });
  drawText(ctx, key, x + 2, y + s - 8, { scale: 1, color: ready ? '#ffffff' : '#8a84a8' });
  if (ready && readyLabel) drawText(ctx, readyLabel, x + s / 2, y + 12, { scale: 1, align: 'center', color });
  // ready pulse
  if (ready) {
    ctx.globalAlpha = 0.25 + Math.sin(performance.now() / 150) * 0.15;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + s - 3, s - 2, 2);
    ctx.globalAlpha = 1;
  }
}
