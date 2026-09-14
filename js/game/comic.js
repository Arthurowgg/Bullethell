// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/comic.js
// In-game announcements v2: comic-book event cards (slanted frame, exclusive
// icon, title + intel line, scanline sweep) and a big WAVE banner. Slide/fade
// in-out with per-type SFX handled by the pusher.
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

  dur(it) {
    if (it.type === 'boss') return 3.4;
    if (it.type === 'wave') return 2.0;
    if (it.type === 'round') return 1.8;
    return 2.8;
  }

  update(dt) {
    if (this.cur) {
      this.cur.t += dt;
      if (this.cur.t > this.dur(this.cur)) this.cur = this.q.shift() || null;
    } else if (this.q.length) this.cur = this.q.shift();
  }

  _anim(it) {
    const d = this.dur(it);
    const inT = clamp(it.t / 0.16, 0, 1);
    const outT = clamp((d - it.t) / 0.3, 0, 1);
    return { a: Math.min(inT, outT), inT, outT };
  }

  // pixel plaque: shadow on top+bottom edges, dark body, 2px color frame
  _plaque(ctx, x, y, w, h, color) {
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(x + 2, y + 3, w, h);
    ctx.fillRect(x + 2, y - 2, w, 2);
    ctx.fillStyle = '#100c20';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff26';
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 3, 1); ctx.fillRect(x + w - 3, y, 3, 1);
    ctx.fillRect(x, y + h - 1, 3, 1); ctx.fillRect(x + w - 3, y + h - 1, 3, 1);
  }

  draw(ctx) {
    const it = this.cur;
    if (!it) return;
    const { a } = this._anim(it);
    ctx.save();
    ctx.globalAlpha = a;
    if (it.type === 'wave') this._wave(ctx, it);
    else if (it.type === 'round') this._round(ctx, it);
    else if (it.type === 'boss') this._boss(ctx, it);
    else if (it.type === 'clear') this._clear(ctx, it);
    else this._event(ctx, it);
    ctx.restore();
  }

  // big WAVE banner: scales in with overshoot, then settles
  _wave(ctx, it) {
    const { inT, outT } = this._anim(it);
    const sc = inT < 1 ? 0.6 + inT * 0.4 + Math.sin(inT * Math.PI) * 0.12 : 1;
    const dy = Math.round((1 - outT) * -10);
    ctx.save();
    ctx.translate(VIEW_W / 2, 74 + dy);
    ctx.scale(sc, sc);
    ctx.translate(-VIEW_W / 2, -74);
    const w = 190, h = 34, x = VIEW_W / 2 - w / 2, y = 57;
    this._plaque(ctx, x, y, w, h, '#ffd94a');
    const ic = SPR.ev_wave || SPR.ui_burst;
    if (ic) drawSprite(ctx, ic, x + 18, y + h / 2, { scale: 1.2 });
    drawText(ctx, it.title, x + 34, y + 4, { scale: 2, color: '#ffd94a', shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 34, y + 20, { scale: 1, color: '#dcd6f6', shadow: true });
    ctx.restore();
  }

  // comic event card: slanted frame + icon plate + title + intel + scanline
  _event(ctx, it) {
    const w = 280, h = 44, x = VIEW_W / 2 - w / 2, y = 56;
    const { inT, outT } = this._anim(it);
    const slide = Math.round((1 - inT) * -40 + (1 - outT) * 30);
    ctx.save();
    ctx.translate(slide, 0);
    // slanted comic shadow
    ctx.fillStyle = '#000000aa';
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 4); ctx.lineTo(x + w + 2, y + 4); ctx.lineTo(x + w - 4, y + h + 4); ctx.lineTo(x, y + h + 4);
    ctx.closePath(); ctx.fill();
    // body
    ctx.fillStyle = '#100c20';
    ctx.beginPath();
    ctx.moveTo(x + 4, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - 4, y + h); ctx.lineTo(x, y + h);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    ctx.strokeStyle = it.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 1); ctx.lineTo(x + w - 1, y + 1); ctx.lineTo(x + w - 5, y + h - 1); ctx.lineTo(x + 1, y + h - 1);
    ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 1;
    // icon plate
    ctx.fillStyle = '#00000088';
    ctx.fillRect(x + 8, y + 6, 32, 32);
    ctx.strokeStyle = it.color;
    ctx.strokeRect(x + 8.5, y + 6.5, 31, 31);
    const ic = SPR['ev_' + it.icon] || SPR['ui_' + it.icon] || SPR.ui_alarm;
    if (ic) drawSprite(ctx, ic, x + 24, y + 22, { scale: Math.min(26 / ic.width, 26 / ic.height) });
    // header strip + title + intel
    drawText(ctx, 'ALERTA DO NEXUS', x + 46, y + 5, { scale: 1, color: it.color, shadow: true });
    drawText(ctx, it.title, x + 46, y + 14, { scale: 2, color: '#ffffff', shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 46, y + 30, { scale: 1, color: '#9a93c8', shadow: true });
    // scanline sweep
    const sx = x + ((it.t * 160) % (w + 40)) - 20;
    ctx.globalAlpha *= 0.25;
    ctx.fillStyle = it.color;
    ctx.fillRect(sx, y + 2, 6, h - 4);
    ctx.globalAlpha /= 0.25;
    ctx.restore();
  }

  _round(ctx, it) {
    const w = 160, h = 26, x = VIEW_W / 2 - w / 2, y = 34;
    this._plaque(ctx, x, y, w, h, it.color);
    const ic = SPR['wicon_' + (it.world || '')] || SPR.ui_burst;
    if (ic) drawSprite(ctx, ic, x + 14, y + h / 2, { scale: 1.1 });
    drawText(ctx, it.title, x + 28, y + 5, { scale: 2, color: it.color, shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 28, y + 17, { scale: 1, color: '#dcd6f6', shadow: true });
  }

  _boss(ctx, it) {
    const w = 330, h = 44, x = VIEW_W / 2 - w / 2, y = 56;
    this._plaque(ctx, x, y, w, h, '#ff4d4d');
    const por = SPR['portrait_' + (it.bossId || '')] || SPR['boss_' + (it.bossId || '')];
    if (por) {
      const s = Math.min(38 / por.height, 38 / por.width);
      drawSprite(ctx, por, x + 24, y + h / 2 + 2, { scale: s });
    }
    drawText(ctx, 'INCURSÃO', x + 48, y + 5, { scale: 1, color: '#ffd94a', shadow: true });
    drawText(ctx, it.title, x + 48, y + 14, { scale: 2, color: '#ff4d4d', shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 48, y + 30, { scale: 1, color: '#dcd6f6', shadow: true });
  }

  _clear(ctx, it) {
    const w = 290, h = 34, x = VIEW_W / 2 - w / 2, y = 64;
    this._plaque(ctx, x, y, w, h, '#4dff88');
    const ic = SPR['ev_' + it.icon] || SPR['ui_' + it.icon] || SPR.ui_shield;
    if (ic) drawSprite(ctx, ic, x + 16, y + h / 2, { scale: 1.2 });
    drawText(ctx, it.title, x + 32, y + 6, { scale: 2, color: '#4dff88', shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 32, y + 21, { scale: 1, color: '#dcd6f6', shadow: true });
  }
}
