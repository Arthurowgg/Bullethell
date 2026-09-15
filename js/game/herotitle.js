// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/herotitle.js
// Comic-pixel hero name plates (Marvel-Snap energy, but TEXT): hero-styled
// pixel type with per-hero iconic pixel flourishes around it.
// ---------------------------------------------------------------------------
import { drawText, textWidth } from '../core/font.js';

const HC = { arachnid: '#ff4d4d', stormgod: '#9feaff', ironknight: '#ffd94a', merc: '#ff8c8c', claws: '#ff8c3b', mystic: '#b06bff' };

function flourish(ctx, id, x, y, w, h) {
  ctx.save();
  const c = HC[id];
  ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
  if (id === 'arachnid') {
    for (const [cx, cy, s] of [[x - 8, y - 2, 1], [x + w + 8, y - 2, -1]]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx + 7 * s, cy + 6);
      ctx.moveTo(cx, cy); ctx.lineTo(cx + 8 * s, cy);
      ctx.moveTo(cx, cy); ctx.lineTo(cx + 7 * s, cy - 6);
      ctx.stroke();
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
    }
  } else if (id === 'stormgod') {
    for (const [bx, s] of [[x - 12, 1], [x + w + 4, -1]]) {
      ctx.beginPath();
      ctx.moveTo(bx + 4 * s, y - 4); ctx.lineTo(bx + 1 * s, y + 2); ctx.lineTo(bx + 4 * s, y + 2); ctx.lineTo(bx + 1 * s, y + 8);
      ctx.stroke();
    }
  } else if (id === 'ironknight') {
    ctx.fillRect(x - 6, y + h + 2, w + 12, 2);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#fff2b8'; ctx.fillRect(x - 4 + i * ((w + 8) / 3), y + h + 2, 2, 2); }
  } else if (id === 'merc') {
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 4); ctx.lineTo(x - 2, y + h + 4);
    ctx.moveTo(x + w + 2, y - 4); ctx.lineTo(x + w + 10, y + h + 4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (id === 'claws') {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w + 4 + i * 4, y - 5);
      ctx.lineTo(x + w - 2 + i * 4, y + h + 5);
      ctx.stroke();
    }
  } else if (id === 'mystic') {
    ctx.beginPath(); ctx.arc(x - 10, y + h / 2, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + w + 10, y + h / 2, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillRect(x - 11, y + h / 2 - 1, 2, 2);
    ctx.fillRect(x + w + 9, y + h / 2 - 1, 2, 2);
  }
  ctx.restore();
}

/** comic-pixel hero name. x,y = text anchor (align honored). */
export function drawHeroTitle(ctx, heroId, name, x, y, scale = 2, align = 'center') {
  const c = HC[heroId] || '#ffffff';
  const w = textWidth(name, scale);
  let sx = x;
  if (align === 'center') sx = x - w / 2;
  else if (align === 'right') sx = x - w;
  flourish(ctx, heroId, sx, y, w, 7 * scale);
  drawText(ctx, name, x, y, { align, scale, color: c, shadow: true, style: 'hero', outline: '#05040a' });
}

// ---------------------------------------------------------------------------
// Generic comic-pixel SECTION titles (configs / overlays / pause panels).
// Hero-styled type with colored core, black shell, drop, and a notched bar.
// ---------------------------------------------------------------------------
export function drawSectionTitle(ctx, text, x, y, color, scale = 2, align = 'left') {
  const w = textWidth(text, scale);
  const sx = align === 'center' ? x - w / 2 : x;
  // soft colored backplate
  ctx.fillStyle = color + '18';
  ctx.fillRect(sx - 6, y - 2, w + 12, scale * 8 + 4);
  // drop + core
  drawText(ctx, text, x + 2, y + 2, { scale, color: '#000000', style: 'hero', align });
  drawText(ctx, text, x, y, { scale, color, style: 'hero', outline: '#0a0816', align });
  // notched underline bar with end diamonds
  const by = y + scale * 8 + 1;
  ctx.fillStyle = '#000000';
  ctx.fillRect(sx - 5, by, w + 10, 3);
  ctx.fillStyle = color;
  ctx.fillRect(sx - 4, by + 1, w + 8, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx - 4, by + 1, w + 8, 1);
  for (const ex of [sx - 8, sx + w + 5]) {
    ctx.fillStyle = color;
    ctx.fillRect(ex, by - 1, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ex + 1, by, 1, 1);
  }
}
