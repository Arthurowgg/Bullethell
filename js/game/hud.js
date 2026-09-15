// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/hud.js
// Combat HUD v4: crisp chamfered panels (same kit as menus). Hero vitals
// top-left; world intel (full name) top-right with the WAVE tracker UNDER it;
// ability plates bottom-left (Q + E only); boss bar bottom-center.
// ---------------------------------------------------------------------------
import { drawText } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { chamfer } from '../scenes/scene.js';
import { drawIcon } from '../core/icons.js';
import { fmtTime, clamp } from '../core/util.js';
import { xpNeed } from './run.js';
import { VIEW_W } from './arena.js';
import { TOTAL_WAVES, WORLD_LABEL } from '../data/campaign.js';

const HERO_COLOR = { arachnid: '#ff4d4d', stormgod: '#9feaff', ironknight: '#ffd94a', merc: '#ff8c8c', claws: '#ff8c3b', mystic: '#b06bff' };

export function drawHud(ctx, G) {
  const st = G.runStats;
  const P = G.player;
  const hud = G._hud || (G._hud = { ghost: st.hp });

  // ================= top-left: hero vitals =================
  const hc = HERO_COLOR[P.hero.id] || '#ffffff';
  chamfer(ctx, 4, 4, 186, 40, { fill: '#0d0a1ecc', border: hc, cut: 3 });
  // avatar
  ctx.fillStyle = '#100818';
  ctx.fillRect(9, 9, 28, 28);
  const av = SPR[P.base] || SPR['hero_' + P.hero.id];
  if (av) drawSprite(ctx, av, 23, 23, { scale: 1 });
  ctx.strokeStyle = hc; ctx.lineWidth = 1; ctx.strokeRect(9.5, 9.5, 27, 27);
  // name + shield
  drawText(ctx, P.hero.name, 43, 7, { scale: 1, color: hc, shadow: true });
  if (st.shield > 0) {
    drawText(ctx, 'ESC', 138, 7, { scale: 1, color: '#4dd8ff' });
    ctx.fillStyle = '#4dd8ff';
    for (let i = 0; i < Math.min(4, st.shield); i++) ctx.fillRect(158 + i * 6, 8, 4, 4);
  }
  // hp bar: frame + ghost trail + segments + value
  const hbx = 43, hby = 17, hbw = 138, hbh = 10;
  const hpf = clamp(st.hp / st.maxHp, 0, 1);
  hud.ghost = Math.max(hpf, hud.ghost - 0.35 * (1 / 60) * 3);
  if (hud.ghost < hpf) hud.ghost = hpf;
  const crit = hpf <= 0.3;
  chamfer(ctx, hbx - 2, hby - 2, hbw + 4, hbh + 4, { fill: '#100818', border: crit ? '#ff2b2b' : '#000000', cut: 2 });
  ctx.fillStyle = '#3d0d1c';
  ctx.fillRect(hbx, hby, hbw, hbh);
  ctx.fillStyle = '#8a2038';
  ctx.fillRect(hbx, hby, Math.round(hbw * hud.ghost), hbh);
  ctx.fillStyle = crit && Math.floor(performance.now() / 160) % 2 === 0 ? '#ff2b2b' : '#ff4d6b';
  ctx.fillRect(hbx, hby, Math.round(hbw * hpf), hbh);
  ctx.fillStyle = '#ffffff55';
  ctx.fillRect(hbx, hby, Math.round(hbw * hpf), 2);
  for (let i = 1; i < 4; i++) { ctx.fillStyle = '#00000066'; ctx.fillRect(hbx + (hbw / 4) * i, hby, 1, hbh); }
  drawText(ctx, `${Math.ceil(st.hp)}/${st.maxHp}`, hbx + hbw - 2, hby + 1, { align: 'right', scale: 1, color: crit ? '#ffb4b4' : '#ffd0da', shadow: true });
  // xp strip + level
  const xby = hby + hbh + 5;
  ctx.fillStyle = '#081018';
  ctx.fillRect(hbx, xby, hbw, 3);
  ctx.fillStyle = '#4dd8ff';
  ctx.fillRect(hbx, xby, Math.round(hbw * clamp(st.xp / xpNeed(st.level), 0, 1)), 2);
  drawText(ctx, `NV ${st.level}`, hbx + hbw, xby - 2, { align: 'right', scale: 1, color: '#9feaff', shadow: true });

  // ================= top-right: world intel + wave under it =============
  {
    const tid = G.arena && G.arena.themeId;
    const wname = WORLD_LABEL[tid] || tid || '';
    const pw = Math.max(124, 34 + Math.ceil(drawTextW(wname)) + 52);
    const px = VIEW_W - pw - 4;
    chamfer(ctx, px, 4, pw, 22, { fill: '#0d0a1ecc', border: '#3a3350', cut: 3 });
    const ic = SPR['wicon_' + tid] || null;
    if (ic) drawSprite(ctx, ic, px + 12, 15, { scale: 1.2 });
    drawText(ctx, wname, px + (ic ? 24 : 8), 8, { scale: 1, color: '#dcd6f6', shadow: true });
    drawSprite(ctx, SPR.fragment, px + pw - 42, 17, { scale: 0.8 });
    drawText(ctx, String(G.runFragments), px + pw - 34, 15, { scale: 1, color: '#9feaff', shadow: true });

    if (G.waves) {
      const wv = G.waves;
      const inc = wv.phase === 'incursion' || G.portal || G.boss;
      const wy = 30;
      chamfer(ctx, px, wy, pw, 26, { fill: '#0d0a1ecc', border: inc ? '#ff4d4d' : '#7b5cff', cut: 3 });
      if (inc) {
        const pul = 0.6 + Math.sin(performance.now() / 140) * 0.4;
        ctx.globalAlpha = pul;
        drawText(ctx, 'INCURSÃO', px + 8, wy + 4, { scale: 2, color: '#ff4d4d', shadow: true });
        ctx.globalAlpha = 1;
        drawText(ctx, G.boss ? G.boss.def.name : 'ENTRE NO PORTAL', px + 8, wy + 17, { scale: 1, color: '#ffd0da', shadow: true });
      } else {
        drawText(ctx, `WAVE ${String(wv.wave || 1).padStart(2, '0')}/${TOTAL_WAVES}`, px + 8, wy + 4, { scale: 2, color: '#ffd94a', shadow: true });
        drawText(ctx, wv.phase === 'breather' ? 'RESPIRO' : wv.phase === 'announce' ? 'PREPARAR' : String(wv.kind || '').toUpperCase(), px + 8, wy + 17, { scale: 1, color: '#9a93c8', shadow: true });
        const rem = wv.remaining(G);
        const bar = 40;
        ctx.fillStyle = '#1d1740';
        ctx.fillRect(px + pw - bar - 8, wy + 9, bar, 5);
        ctx.fillStyle = '#ff5d8f';
        ctx.fillRect(px + pw - bar - 8, wy + 9, Math.round(bar * clamp(rem / 26, 0, 1)), 5);
        drawText(ctx, String(rem), px + pw - bar - 12, wy + 8, { align: 'right', scale: 1, color: '#c8c8d8', shadow: true });
      }
      // kills + timer on the left of the wave chip
      drawIcon(ctx, 'dmg', px - 22, wy + 9, { color: '#c8c8d8' });
      drawText(ctx, String(G.kills), px - 14, wy + 5, { scale: 1, color: '#c8c8d8', shadow: true });
      drawText(ctx, fmtTime(G.time), px - 26, wy + 5, { align: 'right', scale: 1, color: inc ? '#ff8c8c' : '#9a93c8', shadow: true });
    }
  }

  // ================= bottom-left: Q + E plates =================
  drawAbility(ctx, 10, 310, 'Q', 100 - P.charge, 100, '#ffd94a', P.charge >= 100, P.charge >= 100 ? 'PRONTO!' : null, 'q_' + P.hero.id, P.hero.id, true);
  drawAbility(ctx, 52, 313, 'E', P.abilityCd, P.hero.ability.cd * st.cdr, P.hero.color, P.abilityCd <= 0, null, 'e_' + P.hero.id, P.hero.id, false);
  // basic attack tag
  drawSprite(ctx, SPR['shot_hero_' + P.hero.id] || SPR.b_player, 96, 326, { scale: 1 });
  drawText(ctx, 'ATAQUE', 90, 338, { scale: 1, color: '#7a74a0' });

  // ================= boss bar =================
  if (G.boss && !G.boss.dead) {
    const b = G.boss;
    const bw = 380, bh = 18, bx = (VIEW_W - bw) / 2, by = 324;
    const BCOLOR = { ultron: '#ff4d4d', loki: '#4dff88', hela: '#4dff88', devourer: '#4dd8ff', thanos: '#b06bff', kang: '#4dff88' };
    const bc = BCOLOR[b.def.id] || '#ff2b5c';
    const por = SPR['portrait_' + b.def.id] || SPR['boss_' + b.def.id];
    if (por) drawSprite(ctx, por, bx - 18, by + 6, { scale: Math.min(26 / por.height, 26 / por.width) });
    drawText(ctx, b.def.name, VIEW_W / 2, by - 9, { align: 'center', scale: 1, color: bc, shadow: true });
    const frame = SPR['bar_' + b.def.id];
    const f = clamp(b.hp / b.maxHp, 0, 1);
    if (frame) {
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
      ctx.fillStyle = '#00000055';
      ctx.fillRect(bx + 4, by + bh - 6, Math.round((bw - 8) * f), 2);
      ctx.fillStyle = '#ffffff44';
      ctx.fillRect(bx + 4, by + 4, Math.round((bw - 8) * f), 1);
      for (let i = 1; i < b.def.phases.length; i++) {
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(bx + 4 + (bw - 8) * b.def.phases[i].until, by + 4, 1, bh - 8);
      }
      ctx.restore();
      drawSprite(ctx, frame, bx + bw / 2, by + bh / 2, { scaleX: bw / frame.width, scaleY: bh / frame.height });
    } else {
      chamfer(ctx, bx - 2, by - 2, bw + 4, bh + 4, { fill: '#100818', border: bc, cut: 3 });
      ctx.fillStyle = '#3d0d1c';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = bc;
      ctx.fillRect(bx, by, Math.round(bw * f), bh);
      ctx.fillStyle = '#ffffff44';
      ctx.fillRect(bx, by, Math.round(bw * f), 2);
    }
  }

  // low-hp danger vignette
  if (hpf <= 0.3 && P.alive) {
    const a = 0.12 + Math.sin(performance.now() / 200) * 0.08;
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#ff2b2b';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, VIEW_W - 6, 354);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
  }

  if (G.banner) {
    ctx.globalAlpha = Math.min(1, G.banner.t);
    drawText(ctx, G.banner.text, VIEW_W / 2, 120, { scale: 2, align: 'center', color: G.banner.color || '#e8e8ff', shadow: true });
    ctx.globalAlpha = 1;
  }
}

function drawTextW(s) { return s.length * 6; }

function drawAbility(ctx, x, y, key, cd, cdMax, color, ready, readyLabel, iconId, heroId, primary) {
  const s = primary ? 34 : 30;
  chamfer(ctx, x, y, s, s, { fill: '#100818dd', border: ready ? (primary ? '#ffd94a' : color) : '#3a3350', cut: 3 });
  // cooldown sweep
  if (!ready && cdMax > 0) {
    const f = clamp(cd / cdMax, 0, 1);
    ctx.fillStyle = '#000000bb';
    ctx.fillRect(x + 2, y + 2, s - 4, Math.round((s - 4) * f));
  }
  drawIcon(ctx, iconId, x + s / 2, y + s / 2, { scale: primary ? 2.5 : 2, color: ready ? '#ffffff' : color, accent: color });
  if (ready && primary) {
    const pul = 0.5 + Math.sin(performance.now() / 150) * 0.5;
    ctx.strokeStyle = '#ffd94a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, s + 2, s + 2);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35 + pul * 0.4;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(x - 3, y - 3, s + 6, s + 6);
    ctx.globalAlpha = 1;
  }
  // keycap tag
  chamfer(ctx, x + s / 2 - 8, y + s + 2, 16, 10, { fill: '#0d0a1e', border: ready ? '#ffd94a' : '#3a3350', cut: 2 });
  drawText(ctx, key, x + s / 2, y + s + 3, { align: 'center', scale: 1, color: ready ? '#ffffff' : '#9a93c8', shadow: true });
  if (readyLabel && ready) drawText(ctx, readyLabel, x + s / 2, y - 9, { align: 'center', scale: 1, color: '#ffd94a', shadow: true });
}
