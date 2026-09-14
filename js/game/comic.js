// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/comic.js
// In-game announcements: pixel plaques/banners (drop shadow on top edge,
// double border, exclusive icons, portraits) with slide/fade in-out.
// ---------------------------------------------------------------------------
import { drawText, textWidth } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { VIEW_W } from './arena.js';
import { clamp } from '../core/util.js';

export class ComicUI {
  constructor() { this.q = []; this.cur = null; }

  push(type, title, sub, icon, color, extra) {
    this.q.push({ type, title, sub, icon, color: color || '#ffd94a', t: 0, ...(extra || {}) });
    if (!this.cur) this.cur = this.q.shift();
  }

  dur(it) { return it.type === 'boss' ? 3.4 : it.type === 'round' ? 1.8 : 2.4; }

  update(dt) {
    if (this.cur) {
      this.cur.t += dt;
      if (this.cur.t > this.dur(this.cur)) this.cur = this.q.shift() || null;
    } else if (this.q.length) this.cur = this.q.shift();
  }

  _anim(it) {
    const d = this.dur(it);
    const inT = clamp(it.t / 0.18, 0, 1);
    const outT = clamp((d - it.t) / 0.3, 0, 1);
    return { a: Math.min(inT, outT), dy: Math.round((1 - inT) * -14 + (1 - outT) * -8) };
  }

  // pixel plaque: shadow on top+bottom edges, dark body, 2px color frame
  _plaque(ctx, x, y, w, h, color) {
    // drop shadow (offset down) + top over-shadow lip
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(x + 2, y + 3, w, h);
    ctx.fillRect(x + 2, y - 2, w, 2);
    // body
    ctx.fillStyle = '#100c20';
    ctx.fillRect(x, y, w, h);
    // outer 1px black, 2px color, inner 1px light
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff26';
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    // corner notches
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 3, 1); ctx.fillRect(x + w - 3, y, 3, 1);
    ctx.fillRect(x, y + h - 1, 3, 1); ctx.fillRect(x + w - 3, y + h - 1, 3, 1);
  }

  draw(ctx) {
    const it = this.cur;
    if (!it) return;
    const { a, dy } = this._anim(it);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(0, dy);
    if (it.type === 'round') this._round(ctx, it);
    else if (it.type === 'boss') this._boss(ctx, it);
    else if (it.type === 'clear') this._clear(ctx, it);
    else this._event(ctx, it);
    ctx.restore();
  }

  _round(ctx, it) {
    const w = 160, h = 26, x = VIEW_W / 2 - w / 2, y = 8;
    this._plaque(ctx, x, y, w, h, it.color);
    const ic = SPR['wicon_' + (it.world || '')] || SPR.ui_burst;
    if (ic) drawSprite(ctx, ic, x + 14, y + h / 2, { scale: 1.1 });
    drawText(ctx, it.title, x + 28, y + 5, { scale: 2, color: it.color, shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 28, y + 17, { scale: 1, color: '#c8c2e8', shadow: true });
  }

  _event(ctx, it) {
    const w = 250, h = 34, x = VIEW_W / 2 - w / 2, y = 64;
    this._plaque(ctx, x, y, w, h, it.color);
    const ic = SPR['ui_' + it.icon];
    if (ic) drawSprite(ctx, ic, x + 16, y + h / 2, { scale: 1.2 });
    drawText(ctx, it.title, x + 32, y + 6, { scale: 2, color: it.color, shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 32, y + 21, { scale: 1, color: '#c8c2e8', shadow: true });
  }

  _boss(ctx, it) {
    const w = 330, h = 44, x = VIEW_W / 2 - w / 2, y = 56;
    this._plaque(ctx, x, y, w, h, '#ff4d4d');
    // hi-res portrait (falls back to arena sprite)
    const por = SPR['portrait_' + (it.bossId || '')] || SPR['boss_' + (it.bossId || '')];
    if (por) {
      const s = Math.min(38 / por.height, 38 / por.width);
      drawSprite(ctx, por, x + 24, y + h / 2 + 2, { scale: s });
    }
    drawText(ctx, 'INCURSÃO', x + 48, y + 5, { scale: 1, color: '#ffd94a', shadow: true });
    drawText(ctx, it.title, x + 48, y + 14, { scale: 2, color: '#ff4d4d', shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 48, y + 30, { scale: 1, color: '#c8c2e8', shadow: true });
  }

  _clear(ctx, it) {
    const w = 290, h = 34, x = VIEW_W / 2 - w / 2, y = 64;
    this._plaque(ctx, x, y, w, h, '#4dff88');
    const ic = SPR['ui_' + it.icon] || SPR.ui_shield;
    if (ic) drawSprite(ctx, ic, x + 16, y + h / 2, { scale: 1.2 });
    drawText(ctx, it.title, x + 32, y + 6, { scale: 2, color: '#4dff88', shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 32, y + 21, { scale: 1, color: '#c8c2e8', shadow: true });
  }
}
