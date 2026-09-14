// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/comic.js
// Comic-book styled in-game announcements: rounds, events, incursions.
// Skewed panels, halftone dots, kirby crackle, starbursts, pop-in/out anims.
// ---------------------------------------------------------------------------
import { drawText, textWidth } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { VIEW_W } from './arena.js';
import { clamp, easeBack } from '../core/util.js';

export class ComicUI {
  constructor() { this.q = []; this.cur = null; }

  push(type, title, sub, icon, color) {
    this.q.push({ type, title, sub, icon, color: color || '#ffd94a', t: 0 });
    if (!this.cur) this.cur = this.q.shift();
  }

  dur(it) { return it.type === 'boss' ? 3.4 : it.type === 'round' ? 1.7 : 2.4; }

  update(dt) {
    if (this.cur) {
      this.cur.t += dt;
      if (this.cur.t > this.dur(this.cur)) this.cur = this.q.shift() || null;
    } else if (this.q.length) this.cur = this.q.shift();
  }

  // -- helpers --------------------------------------------------------------
  _halftone(ctx, x, y, w, h, color, step = 4) {
    ctx.fillStyle = color;
    for (let j = 0; j < h; j += step)
      for (let i = ((j / step) % 2) * (step / 2); i < w; i += step)
        ctx.fillRect(x + i, y + j, 1, 1);
  }

  _crackle(ctx, cx, cy, r, color, n = 10, tt = 0) {
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + tt;
      const rr = r + Math.sin(tt * 6 + i * 2) * 3;
      ctx.fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr), 2, 2);
    }
  }

  _anim(it) {
    const d = this.dur(it);
    const inT = clamp(it.t / 0.22, 0, 1);
    const outT = clamp((d - it.t) / 0.3, 0, 1);
    return { s: easeBack(inT), a: outT, slide: (1 - outT) * -14 };
  }

  // -- draw -----------------------------------------------------------------
  draw(ctx) {
    const it = this.cur;
    if (!it) return;
    const { s, a, slide } = this._anim(it);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(VIEW_W / 2, 84 + slide);
    ctx.scale(s, s);
    ctx.translate(-VIEW_W / 2, -84);
    if (it.type === 'round') this._round(ctx, it);
    else if (it.type === 'boss') this._boss(ctx, it);
    else if (it.type === 'clear') this._clear(ctx, it);
    else this._event(ctx, it);
    ctx.restore();
  }

  _round(ctx, it) {
    const cx = VIEW_W / 2, cy = 84;
    // starburst
    ctx.fillStyle = it.color;
    ctx.beginPath();
    const spikes = 12;
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 46 : 32;
      const x = cx + Math.cos(a) * r * 1.7, y = cy + Math.sin(a) * r * 0.8;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0b0a14';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;
    this._halftone(ctx, cx - 70, cy - 20, 140, 40, '#00000022', 4);
    drawText(ctx, it.title, cx, cy - 5, { align: 'center', scale: 2, color: '#0b0a14' });
    if (it.sub) drawText(ctx, it.sub, cx, cy + 12, { align: 'center', scale: 1, color: '#0b0a14' });
  }

  _panelBase(ctx, x, y, w, h, color, skew = -0.035) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(skew);
    ctx.translate(-w / 2, -h / 2);
    // drop shadow
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(3, 4, w, h);
    ctx.fillStyle = '#12081f';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(3.5, 3.5, w - 7, h - 7);
    this._halftone(ctx, 4, 4, w - 8, h - 8, color + '22', 4);
    return () => ctx.restore();
  }

  _event(ctx, it) {
    const w = 260, h = 46, x = VIEW_W / 2 - w / 2, y = 60;
    const pop = this._panelBase(ctx, x, y, w, h, it.color);
    const ic = SPR['ui_' + it.icon];
    if (ic) drawSprite(ctx, ic, x + 26, y + h / 2, { scale: 1.4 });
    this._crackle(ctx, x + 26, y + h / 2, 16, it.color, 8, it.t * 2);
    drawText(ctx, it.title, x + 48, y + 8, { scale: 2, color: it.color, shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 48, y + 28, { scale: 1, color: '#e8e0ff', shadow: true });
    // speed lines right
    ctx.fillStyle = it.color;
    for (let i = 0; i < 4; i++) ctx.fillRect(x + w - 26 + i * 4, y + 8 + i * 8, 10 - i * 2, 2);
    pop();
  }

  _boss(ctx, it) {
    const w = 340, h = 62, x = VIEW_W / 2 - w / 2, y = 52;
    const pop = this._panelBase(ctx, x, y, w, h, '#ff4d4d', 0.02);
    // diagonal danger stripes on the left cap
    ctx.save();
    ctx.beginPath(); ctx.rect(4, 4, 40, h - 8); ctx.clip();
    ctx.strokeStyle = '#ffd94a';
    ctx.lineWidth = 4;
    for (let i = -h; i < 60; i += 10) {
      ctx.beginPath(); ctx.moveTo(4 + i, h); ctx.lineTo(4 + i + h, 0); ctx.stroke();
    }
    ctx.restore();
    const ic = SPR['ui_' + it.icon] || SPR.ui_alarm;
    if (ic) drawSprite(ctx, ic, x + 24, y + h / 2, { scale: 1.3 });
    drawText(ctx, 'INCURSÃO', x + 52, y + 8, { scale: 1, color: '#ffd94a', shadow: true });
    drawText(ctx, it.title, x + 52, y + 20, { scale: 2, color: '#ff4d4d', shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 52, y + 42, { scale: 1, color: '#e8e0ff', shadow: true });
    this._crackle(ctx, x + w - 20, y + h / 2, 14, '#ff4d4d', 8, it.t * 3);
    pop();
  }

  _clear(ctx, it) {
    const w = 300, h = 46, x = VIEW_W / 2 - w / 2, y = 60;
    const pop = this._panelBase(ctx, x, y, w, h, '#4dff88', -0.02);
    const ic = SPR['ui_' + it.icon] || SPR.ui_shield;
    if (ic) drawSprite(ctx, ic, x + 26, y + h / 2, { scale: 1.3 });
    drawText(ctx, it.title, x + 50, y + 8, { scale: 2, color: '#4dff88', shadow: true });
    if (it.sub) drawText(ctx, it.sub, x + 50, y + 28, { scale: 1, color: '#e8e0ff', shadow: true });
    pop();
  }
}
