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
  drawSprite(ctx, SPR['hero_' + P.hero.id], 16, 18, { scale: 0.6 });
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

  // wave / event banner
  if (G.waves && G.waves.event) {
    const e = G.waves.event;
    ctx.globalAlpha = Math.min(1, e.t);
    drawText(ctx, '! ' + e.name + ' !', VIEW_W / 2, 46, { scale: 1, align: 'center', color: '#ffd94a', shadow: true });
    ctx.globalAlpha = 1;
  }
  if (G.banner) {
    ctx.globalAlpha = Math.min(1, G.banner.t);
    drawText(ctx, G.banner.text, VIEW_W / 2, 120, { scale: 2, align: 'center', color: G.banner.color || '#e8e8ff', shadow: true });
    ctx.globalAlpha = 1;
  }

  // -- bottom-left: abilities --
  drawAbility(ctx, 14, 322, 'Q', P.hero.ability.name, P.abilityCd, P.hero.ability.cd * st.cdr, P.hero.color, P.abilityCd <= 0);
  drawAbility(ctx, 52, 322, 'E', P.hero.special.name, 100 - P.charge, 100, '#ffd94a', P.charge >= 100, P.charge >= 100 ? 'PRONTO!' : null);
  // dash pip
  drawAbility(ctx, 90, 322, 'ESP', 'ESQUIVA', P.dashCd, st.dashCd, '#ffffff', P.dashCd <= 0);

  // -- boss bar --
  if (G.boss && !G.boss.dead) {
    const b = G.boss;
    const bw = 380, bx = (VIEW_W - bw) / 2, by = 330;
    drawText(ctx, b.def.name, VIEW_W / 2, by - 10, { align: 'center', scale: 1, color: '#ff8c8c', shadow: true });
    ctx.fillStyle = '#100818';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 8);
    ctx.fillStyle = '#3d0d1c';
    ctx.fillRect(bx, by, bw, 6);
    const f = clamp(b.hp / b.maxHp, 0, 1);
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#ff2b5c');
    grad.addColorStop(1, '#b06bff');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, Math.round(bw * f), 6);
    // phase pips
    for (let i = 1; i < b.def.phases.length; i++) {
      const px = bx + bw * b.def.phases[i].until;
      ctx.fillStyle = '#00000088';
      ctx.fillRect(px, by, 1, 6);
    }
  }

  // control hint (first run)
  if (G.hintT > 0) {
    ctx.globalAlpha = Math.min(1, G.hintT);
    drawText(ctx, 'WASD MOVER  ·  MOUSE MIRAR  ·  ESPAÇO ESQUIVA  ·  Q HABILIDADE  ·  E ESPECIAL', VIEW_W / 2, 300, { align: 'center', scale: 1, color: '#9a93c8', shadow: true });
    ctx.globalAlpha = 1;
  }
}

function drawAbility(ctx, x, y, key, name, cd, cdMax, color, ready, readyLabel) {
  const s = 26;
  ctx.fillStyle = '#100818cc';
  ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = ready ? color : '#3a3350';
  ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  // cooldown sweep
  if (!ready && cdMax > 0) {
    const f = clamp(cd / cdMax, 0, 1);
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(x, y, s, Math.round(s * f));
  }
  drawText(ctx, key, x + 2, y + 2, { scale: 1, color: ready ? '#ffffff' : '#8a84a8' });
  if (ready && readyLabel) drawText(ctx, readyLabel, x + s / 2, y + 12, { scale: 1, align: 'center', color });
  // ready pulse
  if (ready) {
    ctx.globalAlpha = 0.25 + Math.sin(performance.now() / 150) * 0.15;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + s - 3, s - 2, 2);
    ctx.globalAlpha = 1;
  }
}
