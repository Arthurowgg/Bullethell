// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/hud.js
// Combat HUD v2: hero panel with animated vitals, wave tracker + timer,
// world/intel chip, ability plates with Q-ready glow, boss bar.
// Marvel-comic + Nexus-tech pixel identity.
// ---------------------------------------------------------------------------
import { drawText } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { fmtTime, clamp } from '../core/util.js';
import { xpNeed } from './run.js';
import { VIEW_W } from './arena.js';
import { TOTAL_WAVES, WORLD_LABEL } from '../data/campaign.js';

const HERO_COLOR = { arachnid: '#ff4d4d', stormgod: '#9feaff', ironknight: '#ffd94a', merc: '#ff8c8c', claws: '#ff8c3b', mystic: '#b06bff' };

export function drawHud(ctx, G) {
  const st = G.runStats;
  const P = G.player;
  const hud = G._hud || (G._hud = { ghost: st.hp, flash: 0 });

  // ================= top-left: hero vitals =================
  const hc = HERO_COLOR[P.hero.id] || '#ffffff';
  // panel
  ctx.fillStyle = '#0d0a1ecc';
  ctx.fillRect(4, 4, 178, 34);
  ctx.strokeStyle = '#000000'; ctx.strokeRect(3.5, 3.5, 179, 35);
  ctx.strokeStyle = hc; ctx.lineWidth = 1; ctx.strokeRect(4.5, 4.5, 177, 33);
  // avatar plate
  ctx.fillStyle = '#100818';
  ctx.fillRect(7, 7, 28, 28);
  ctx.strokeStyle = hc; ctx.strokeRect(7.5, 7.5, 27, 27);
  const av = SPR[P.base] || SPR['hero_' + P.hero.id];
  if (av) drawSprite(ctx, av, 21, 21, { scale: 1 });
  if (SPR.hud_avatar) drawSprite(ctx, SPR.hud_avatar, 21, 21, { scaleX: 30 / SPR.hud_avatar.width, scaleY: 30 / SPR.hud_avatar.height });
  // hp with ghost damage bar
  const hbx = 40, hby = 9, hbw = 132, hbh = 8;
  const hpf = clamp(st.hp / st.maxHp, 0, 1);
  hud.ghost = Math.max(hpf, hud.ghost - 0.35 * (1 / 60) * 3);
  if (hud.ghost < hpf) hud.ghost = hpf;
  ctx.fillStyle = '#100818';
  ctx.fillRect(hbx - 1, hby - 1, hbw + 2, hbh + 2);
  if (SPR.hud_hp) drawSprite(ctx, SPR.hud_hp, hbx + hbw / 2, hby + hbh / 2, { scaleX: (hbw + 8) / SPR.hud_hp.width, scaleY: (hbh + 8) / SPR.hud_hp.height });
  ctx.fillStyle = '#3d0d1c';
  ctx.fillRect(hbx, hby, hbw, hbh);
  ctx.fillStyle = '#8a2038';
  ctx.fillRect(hbx, hby, Math.round(hbw * hud.ghost), hbh);       // ghost (recent loss)
  const crit = hpf <= 0.3;
  ctx.fillStyle = crit && Math.floor(performance.now() / 160) % 2 === 0 ? '#ff2b2b' : '#ff4d6b';
  ctx.fillRect(hbx, hby, Math.round(hbw * hpf), hbh);
  ctx.fillStyle = '#ffffff55';
  ctx.fillRect(hbx, hby, Math.round(hbw * hpf), 2);
  for (let i = 1; i < 4; i++) { ctx.fillStyle = '#00000066'; ctx.fillRect(hbx + (hbw / 4) * i, hby, 1, hbh); } // segments
  if (crit) { ctx.strokeStyle = '#ff2b2b'; ctx.strokeRect(hbx - 1.5, hby - 1.5, hbw + 3, hbh + 3); }
  drawText(ctx, `${Math.ceil(st.hp)}/${st.maxHp}`, hbx + hbw + 4 - 8, hby + 10, { scale: 1, color: crit ? '#ff8c8c' : '#ffd0da' });
  // shield + name
  drawText(ctx, P.hero.name, hbx, hby + 10, { scale: 1, color: hc, shadow: true });
  if (st.shield > 0) {
    ctx.fillStyle = '#4dd8ff';
    for (let i = 0; i < Math.min(4, st.shield); i++) ctx.fillRect(hbx + 96 + i * 6, hby + 11, 4, 4);
    drawText(ctx, 'ESC', hbx + 88, hby + 10, { scale: 1, color: '#4dd8ff' });
  }
  // xp
  const xby = hby + hbh + 4;
  ctx.fillStyle = '#081018';
  ctx.fillRect(hbx - 1, xby - 1, hbw + 2, 4);
  ctx.fillStyle = '#4dd8ff';
  ctx.fillRect(hbx, xby, Math.round(hbw * clamp(st.xp / xpNeed(st.level), 0, 1)), 2);
  drawText(ctx, `NV ${st.level}`, hbx + hbw - 24, xby - 2, { scale: 1, color: '#9feaff' });

  // ================= top-center: wave tracker + timer =================
  if (G.waves) {
    const wv = G.waves;
    const inc = wv.phase === 'incursion' || G.portal || G.boss;
    const cw = 168, cx = VIEW_W / 2 - cw / 2, cy = 4;
    ctx.fillStyle = '#0d0a1ecc';
    ctx.fillRect(cx, cy, cw, 26);
    if (SPR.hud_wave) drawSprite(ctx, SPR.hud_wave, VIEW_W / 2, cy + 13, { scaleX: (cw + 10) / SPR.hud_wave.width, scaleY: 30 / SPR.hud_wave.height });
    ctx.strokeStyle = inc ? '#ff4d4d' : '#7b5cff';
    ctx.strokeRect(cx + 0.5, cy + 0.5, cw - 1, 25);
    if (inc) {
      const pul = 0.6 + Math.sin(performance.now() / 140) * 0.4;
      ctx.globalAlpha = pul;
      drawText(ctx, 'INCURSÃO', VIEW_W / 2, cy + 4, { align: 'center', scale: 2, color: '#ff4d4d', shadow: true });
      ctx.globalAlpha = 1;
      drawText(ctx, G.boss ? G.boss.def.name : 'ENTRE NO PORTAL', VIEW_W / 2, cy + 18, { align: 'center', scale: 1, color: '#ffd0da', shadow: true });
    } else {
      drawText(ctx, `WAVE ${String(wv.wave || 1).padStart(2, '0')}/${TOTAL_WAVES}`, cx + 6, cy + 4, { scale: 2, color: '#ffd94a', shadow: true });
      const k = wv.kind ? (typeof wv.kind === 'string' ? wv.kind : wv.kind) : '';
      drawText(ctx, wv.phase === 'breather' ? 'RESPIRO' : wv.phase === 'announce' ? 'PREPARAR' : String(k).toUpperCase(), cx + 6, cy + 17, { scale: 1, color: '#9a93c8', shadow: true });
      // hostiles remaining
      const rem = wv.remaining(G);
      const bar = 44;
      ctx.fillStyle = '#1d1740';
      ctx.fillRect(cx + cw - bar - 8, cy + 7, bar, 5);
      ctx.fillStyle = '#ff5d8f';
      ctx.fillRect(cx + cw - bar - 8, cy + 7, Math.round(bar * clamp(rem / 26, 0, 1)), 5);
      drawText(ctx, String(rem), cx + cw - bar - 12, cy + 6, { align: 'right', scale: 1, color: '#c8c8d8' });
      drawText(ctx, 'HOSTIS', cx + cw - bar - 12, cy + 14, { align: 'right', scale: 1, color: '#7a74a0' });
    }
    // timer chip (discreet)
    const t = fmtTime(G.time);
    const dramatic = inc;
    if (SPR.hud_timer) drawSprite(ctx, SPR.hud_timer, cx + cw + 16, cy + 10, { scaleX: 30 / SPR.hud_timer.width, scaleY: 16 / SPR.hud_timer.height });
    drawText(ctx, t, cx + cw + 8, cy + 6, { scale: 1, color: dramatic ? '#ff8c8c' : '#9a93c8', shadow: true });
    drawSprite(ctx, SPR.skull, cx - 16, cy + 8, { scale: 0.8 });
    drawText(ctx, String(G.kills), cx - 8, cy + 8, { scale: 1, color: '#c8c8d8' });
  }

  // ================= top-right: world intel =================
  {
    const tid = G.arena && G.arena.themeId;
    const ic = SPR['wicon_' + tid] || SPR.ui_burst;
    if (ic) drawSprite(ctx, ic, VIEW_W - 14, 14, { scale: 1.2 });
    drawText(ctx, WORLD_LABEL[tid] || tid, VIEW_W - 26, 8, { align: 'right', scale: 1, color: '#dcd6f6', shadow: true });
    drawSprite(ctx, SPR.fragment, VIEW_W - 78, 22, { scale: 0.8 });
    drawText(ctx, String(G.runFragments), VIEW_W - 68, 21, { scale: 1, color: '#9feaff' });
  }

  // ================= bottom-left: combat plates =================
  drawAbility(ctx, 10, 316, 'Q', P.hero.special.name, 100 - P.charge, 100, '#ffd94a', P.charge >= 100, P.charge >= 100 ? 'PRONTO!' : null, SPR['abil_' + P.hero.id + '_e'], P.hero.id, true);
  drawAbility(ctx, 48, 316, 'E', P.hero.ability.name, P.abilityCd, P.hero.ability.cd * st.cdr, P.hero.color, P.abilityCd <= 0, null, SPR['abil_' + P.hero.id + '_q'], P.hero.id, false);
  drawAbility(ctx, 86, 316, 'ESP', 'ESQUIVA', P.dashCd, st.dashCd, '#ffffff', P.dashCd <= 0, null, SPR.ui_bolt, P.hero.id, false);
  // basic attack tag
  drawSprite(ctx, SPR['shot_hero_' + P.hero.id] || SPR.b_player, 124, 329, { scale: 1 });
  drawText(ctx, 'ATAQUE', 118, 340, { scale: 1, color: '#7a74a0' });

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
      ctx.fillStyle = '#100818';
      ctx.fillRect(bx - 1, by - 1, bw + 2, 10);
      ctx.fillStyle = '#3d0d1c';
      ctx.fillRect(bx, by, bw, 8);
      ctx.fillStyle = bc;
      ctx.fillRect(bx, by, Math.round(bw * f), 8);
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

  // control hint (first run)
  if (G.hintT > 0) {
    ctx.globalAlpha = Math.min(1, G.hintT);
    drawText(ctx, 'WASD MOVER  ·  MOUSE MIRAR  ·  ESPAÇO ESQUIVA  ·  Q ESPECIAL  ·  E HABILIDADE', VIEW_W / 2, 300, { align: 'center', scale: 1, color: '#9a93c8', shadow: true });
    ctx.globalAlpha = 1;
  }
}

function drawAbility(ctx, x, y, key, name, cd, cdMax, color, ready, readyLabel, icon, heroId, primary) {
  const s = primary ? 30 : 26;
  // plate
  ctx.fillStyle = '#100818dd';
  ctx.fillRect(x, y, s, s);
  // cooldown sweep
  if (!ready && cdMax > 0) {
    const f = clamp(cd / cdMax, 0, 1);
    ctx.fillStyle = '#000000bb';
    ctx.fillRect(x, y, s, Math.round(s * f));
  }
  // icon
  if (icon) drawSprite(ctx, icon, x + s / 2, y + s / 2, { scale: Math.min(22 / icon.width, 22 / icon.height) });
  // ready glow (Q charged): elegant pulsing double frame
  const HB = HERO_COLOR;
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
  } else {
    ctx.strokeStyle = ready ? color : '#7a74a0';
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  }
  ctx.strokeStyle = HB[heroId] || color;
  ctx.strokeRect(x - 1.5, y - 1.5, s + 3, s + 3);
  if (SPR.hud_abil) drawSprite(ctx, SPR.hud_abil, x + s / 2, y + s / 2, { scaleX: (s + 6) / SPR.hud_abil.width, scaleY: (s + 6) / SPR.hud_abil.height });
  // key tag
  ctx.fillStyle = '#0d0a1e';
  ctx.fillRect(x, y + s, 12, 8);
  drawText(ctx, key, x + 1, y + s + 1, { scale: 1, color: ready ? '#ffd94a' : '#9a93c8' });
  if (readyLabel && ready) drawText(ctx, readyLabel, x + s / 2, y - 9, { align: 'center', scale: 1, color: '#ffd94a', shadow: true });
}
