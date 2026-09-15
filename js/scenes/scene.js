// ---------------------------------------------------------------------------
// MARVEL NEXUS — scenes/scene.js
// Scene base + immediate-mode pixel UI kit. Crisp chamfered widgets that work
// at ANY size: buttons (flat/frame/ghost), panels, tabs, toggles, sliders,
// close button. Procedural icons from core/icons.js (no backgrounds).
// ---------------------------------------------------------------------------
import { drawText, textWidth } from '../core/font.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { clamp } from '../core/util.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { drawIcon } from '../core/icons.js';
import { VIEW_W, VIEW_H } from '../game/arena.js';

export class Scene {
  enter(G, params) {}
  exit(G) {}
  update(dt, G) {}
  draw(ctx, G) {}
}

let GCTX = null;
export function setCtx(ctx) { GCTX = ctx; }
function ctxFill(x, y, w, h, col) { GCTX.fillStyle = col; GCTX.fillRect(x, y, w, h); }

/** crisp chamfered rect: fill + 1px border + 2px corner cuts */
export function chamfer(ctx, x, y, w, h, o = {}) {
  const c = o.cut == null ? 2 : o.cut;
  const fill = o.fill, border = o.border;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x + c, y, w - c * 2, h);
    ctx.fillRect(x, y + c, w, h - c * 2);
    if (c > 1) { ctx.fillRect(x + 1, y + 1, w - 2, h - 2); }
  }
  if (border) {
    ctx.strokeStyle = border;
    ctx.beginPath();
    ctx.moveTo(x + c + 0.5, y + 0.5);
    ctx.lineTo(x + w - c - 0.5, y + 0.5);
    ctx.lineTo(x + w - 0.5, y + c + 0.5);
    ctx.lineTo(x + w - 0.5, y + h - c - 0.5);
    ctx.lineTo(x + w - c - 0.5, y + h - 0.5);
    ctx.lineTo(x + c + 0.5, y + h - 0.5);
    ctx.lineTo(x + 0.5, y + h - c - 0.5);
    ctx.lineTo(x + 0.5, y + c + 0.5);
    ctx.closePath();
    ctx.stroke();
  }
}

export function slice9(ctx, spr, x, y, w, h, c = 12) {
  if (!spr) return;
  const sw = spr.width, sh = spr.height;
  const cw = Math.min(c, sw >> 1), ch = Math.min(c, sh >> 1);
  const d = (sx, sy, sww, shh, dx, dy, dw, dh) => {
    if (dw <= 0 || dh <= 0) return;
    ctx.drawImage(spr, sx, sy, sww, shh, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
  };
  d(0, 0, cw, ch, x, y, cw, ch);
  d(sw - cw, 0, cw, ch, x + w - cw, y, cw, ch);
  d(0, sh - ch, cw, ch, x, y + h - ch, cw, ch);
  d(sw - cw, sh - ch, cw, ch, x + w - cw, y + h - ch, cw, ch);
  d(cw, 0, sw - 2 * cw, ch, x + cw, y, w - 2 * cw, ch);
  d(cw, sh - ch, sw - 2 * cw, ch, x + cw, y + h - ch, w - 2 * cw, ch);
  d(0, ch, cw, sh - 2 * ch, x, y + ch, cw, h - 2 * ch);
  d(sw - cw, ch, cw, sh - 2 * ch, x + w - cw, y + ch, cw, h - 2 * ch);
}

// immediate UI -------------------------------------------------------------
export const UI = {
  hoverId: null,
  clickedId: null,
  anyClick: false,

  beginFrame() {
    this.hoverId = null;
    this.clickedId = null;
    this.anyClick = Input.mouse.down && !this._wasDown;
    this._wasDown = Input.mouse.down;
  },

  hit(x, y, w, h) {
    const m = Input.mouse;
    return m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h;
  },

  icon(key, x, y, s = 1, color) {
    // procedural icons first, generated sprites as fallback
    if (color !== undefined || !SPR[key]) { drawIcon(GCTX, key, x, y, { scale: s, color }); return; }
    drawSprite(GCTX, SPR[key], x, y, { scale: s });
  },

  /** Crisp button. o: { style:'flat'|'frame'|'ghost', color, primary, icon, disabled, silent, scale, textColor }
   *  'flat'  = solid inside + colored chamfered border (default; any size)
   *  'frame' = generated nine-slice frame (auto-falls back to flat when small)
   *  'ghost' = border only, transparent inside */
  button(id, x, y, w, h, label, o = {}) {
    const hov = !o.disabled && this.hit(x, y, w, h);
    if (hov) this.hoverId = id;
    const pressed = hov && Input.mouse.down;
    const clicked = hov && this.anyClick;
    if (clicked) this.clickedId = id;
    const oy = pressed ? 1 : 0;
    const col = o.color || (o.primary ? '#ffd94a' : '#7b5cff');
    const useFrame = o.style === 'frame' && h >= 20 && w >= 64 && (o.primary ? SPR.ui_btn_gold : SPR.ui_btn);
    if (useFrame) {
      ctxFill(x, y + oy, w, h, '#0d0a1e');
      slice9(GCTX, o.primary ? SPR.ui_btn_gold : SPR.ui_btn, x, y + oy, w, h, 6);
      if (hov) ctxFill(x + 2, y + oy + 2, w - 4, h - 4, pressed ? '#00000066' : '#ffffff14');
    } else {
      const inside = o.style === 'ghost' ? null : (hov ? (pressed ? '#0a0818' : '#1d1740') : '#120e2a');
      chamfer(GCTX, x, y + oy, w, h, {
        fill: inside,
        border: o.disabled ? '#3a3350' : hov ? '#ffffff' : col,
        cut: Math.min(3, Math.floor(h / 4)),
      });
      if (inside) {
        ctxFill(x + 2, y + oy + 1, w - 4, 1, '#ffffff22'); // top highlight
        if (pressed) ctxFill(x + 1, y + oy + 1, w - 2, h - 2, '#00000055');
      }
    }
    if (o.disabled) ctxFill(x + 1, y + oy + 1, w - 2, h - 2, '#05040acc');
    const iw = o.icon ? 10 : 0;
    if (o.icon) drawIcon(GCTX, o.icon, x + 8 + iw / 2, y + oy + h / 2, { color: o.disabled ? '#5a5470' : hov ? '#ffffff' : col });
    drawText(GCTX, label, o.icon ? x + 16 + iw : x + w / 2, y + oy + h / 2 - 3, {
      align: o.icon ? 'left' : 'center', scale: o.scale || 1,
      color: o.disabled ? '#5a5470' : hov ? '#ffffff' : o.textColor || '#cfc8f2',
      shadow: true,
    });
    if (clicked && !o.silent) Audio.sfx('ui');
    return clicked;
  },

  /** square icon-only button */
  iconButton(id, x, y, s, iconKey, o = {}) {
    const hov = !o.disabled && this.hit(x, y, s, s);
    if (hov) this.hoverId = id;
    const pressed = hov && Input.mouse.down;
    const clicked = hov && this.anyClick;
    if (clicked) this.clickedId = id;
    const oy = pressed ? 1 : 0;
    const col = o.color || '#7b5cff';
    chamfer(GCTX, x, y + oy, s, s, {
      fill: hov ? (pressed ? '#0a0818' : '#1d1740') : '#120e2a',
      border: hov ? '#ffffff' : col,
      cut: Math.min(3, Math.floor(s / 5)),
    });
    drawIcon(GCTX, iconKey, x + s / 2, y + oy + s / 2, { color: hov ? '#ffffff' : o.iconColor || '#cfc8f2' });
    if (clicked && !o.silent) Audio.sfx('ui');
    return clicked;
  },

  /** dedicated close (X) button */
  close(id, x, y, s = 18) {
    const hov = this.hit(x, y, s, s);
    if (hov) this.hoverId = id;
    const pressed = hov && Input.mouse.down;
    const clicked = hov && this.anyClick;
    if (clicked) this.clickedId = id;
    const oy = pressed ? 1 : 0;
    chamfer(GCTX, x, y + oy, s, s, {
      fill: hov ? (pressed ? '#2a0a12' : '#3d0d1c') : '#1c0a14',
      border: hov ? '#ffffff' : '#ff4d4d',
      cut: 3,
    });
    drawIcon(GCTX, 'x', x + s / 2, y + oy + s / 2, { color: hov ? '#ffffff' : '#ff8c8c', accent: '#ff4d4d' });
    if (clicked) Audio.sfx('uiBack');
    return clicked;
  },

  panel(x, y, w, h, o = {}) {
    ctxFill(x + 3, y + 4, w, h, '#00000088');
    chamfer(GCTX, x, y, w, h, { fill: o.fill || '#0e0b20f2', border: o.border || '#3a3350', cut: o.cut || 4 });
    ctxFill(x + 3, y + 2, w - 6, 1, '#ffffff14');
    if (o.title) {
      if (SPR.ui_header) drawSprite(GCTX, SPR.ui_header, x + w / 2, y + 13, { scaleX: Math.min(w - 12, Math.max(130, textWidth(o.title, 2) + 46)) / SPR.ui_header.width, scaleY: 22 / SPR.ui_header.height });
      if (o.icon) drawIcon(GCTX, o.icon, x + w / 2 - textWidth(o.title, 2) / 2 - 12, y + 12, { color: o.titleColor || '#ffd94a' });
      drawText(GCTX, o.title, x + w / 2 + (o.icon ? 5 : 0), y + 7, { align: 'center', scale: o.titleScale || 2, color: o.titleColor || '#ffd94a', shadow: true, style: 'hero' });
      ctxFill(x + 6, y + 26, w - 12, 1, '#3a3350');
    }
  },

  /** toggle row; iconKey = procedural icon id */
  toggle(id, x, y, w, label, iconKey, value, o = {}) {
    const hov = this.hit(x, y, w, 16);
    if (hov) this.hoverId = id;
    const clicked = hov && this.anyClick;
    if (clicked) this.clickedId = id;
    if (hov) ctxFill(x, y, w, 16, '#ffffff0d');
    if (iconKey) drawIcon(GCTX, iconKey, x + 8, y + 8, { color: value ? '#4dff88' : '#8a84a8' });
    drawText(GCTX, label, x + (iconKey ? 18 : 4), y + 4, { scale: 1, color: hov ? '#ffffff' : '#cfc8f2', shadow: true });
    // switch
    const sx = x + w - 26, sy = y + 3;
    chamfer(GCTX, sx, sy, 24, 10, { fill: '#100818', border: value ? '#4dff88' : '#3a3350', cut: 2 });
    ctxFill(sx + (value ? 14 : 3), sy + 2, 8, 6, value ? '#4dff88' : '#5a5470');
    ctxFill(sx + (value ? 14 : 3), sy + 2, 8, 1, '#ffffff66');
    if (clicked) Audio.sfx('ui');
    return clicked;
  },

  /** slider row; calls set(0..1) while dragging */
  slider(id, x, y, w, label, iconKey, value, set, o = {}) {
    if (iconKey) drawIcon(GCTX, iconKey, x + 8, y + 7, { color: o.color || '#7b5cff' });
    drawText(GCTX, label, x + (iconKey ? 18 : 4), y + 3, { scale: 1, color: '#cfc8f2', shadow: true });
    const tx = x + w - 110, tw = 84, ty = y + 6;
    chamfer(GCTX, tx, ty + 1, tw, 7, { fill: '#100818', border: '#3a3350', cut: 2 });
    ctxFill(tx + 2, ty + 3, Math.round((tw - 4) * clamp(value, 0, 1)), 3, o.color || '#7b5cff');
    const kx = tx + 2 + (tw - 8) * clamp(value, 0, 1);
    chamfer(GCTX, kx - 2, ty - 1, 7, 11, { fill: '#9feaff', border: '#ffffff', cut: 1 });
    drawText(GCTX, Math.round(value * 100) + '%', x + w - 18, y + 3, { align: 'right', scale: 1, color: '#9feaff' });
    const m = Input.mouse;
    const hov = this.hit(tx - 4, ty - 4, tw + 8, 16);
    if (hov) this.hoverId = id;
    if (m.down && (hov || this._drag === id)) {
      this._drag = id;
      set(clamp((m.x - tx - 2) / (tw - 6), 0, 1));
      return true;
    }
    if (!m.down && this._drag === id) this._drag = null;
    return false;
  },

  tab(id, x, y, w, h, label, active, o = {}) {
    const hov = this.hit(x, y, w, h);
    if (hov) this.hoverId = id;
    const clicked = hov && this.anyClick;
    if (clicked) this.clickedId = id;
    const col = o.color || '#7b5cff';
    chamfer(GCTX, x, y, w, h, {
      fill: active ? '#241b52' : hov ? '#181236' : '#100c22',
      border: active ? '#ffffff' : hov ? col : '#2a2450',
      cut: 2,
    });
    if (active) ctxFill(x + 2, y + h - 2, w - 4, 2, col);
    if (o.icon) drawIcon(GCTX, o.icon, x + 10, y + h / 2, { color: active ? '#ffffff' : '#8a84a8' });
    drawText(GCTX, label, x + (o.icon ? 18 : w / 2), y + h / 2 - 3, { align: o.icon ? 'left' : 'center', scale: 1, color: active ? '#ffffff' : '#8a84a8', shadow: true });
    if (clicked) Audio.sfx('ui');
    return clicked;
  },

  scrollbar(x, y, h, view, total, offset, setOffset) {
    if (total <= view) return offset;
    const sh = Math.max(20, (view / total) * h);
    const sy = y + ((total - view) ? (offset / (total - view)) * (h - sh) : 0);
    ctxFill(x, y, 4, h, '#1d1740');
    ctxFill(x, sy, 4, sh, '#7b5cff');
    const m = Input.mouse;
    if (m.down && this.hit(x - 3, y, 10, h)) {
      const f = clamp((m.y - y - sh / 2) / (h - sh), 0, 1);
      setOffset(f * (total - view));
    }
    let off = offset;
    if (Input.wheel && this._wheelZone && this._wheelZone(m)) {
      off = clamp(off + Input.wheel * 24, 0, Math.max(0, total - view));
      setOffset(off);
    }
    return off;
  },
  setWheelZone(fn) { this._wheelZone = fn; },
};

/** Browser fullscreen toggle (no-op headless). */
export function toggleFullscreen() {
  if (typeof document === 'undefined' || !document.documentElement || !document.documentElement.requestFullscreen) return;
  if (document.fullscreenElement) {
    document.exitFullscreen && document.exitFullscreen().catch(() => {});
  } else {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

/** keyboard navigation helper: returns true once when key pressed */
export function pressed(code) { return Input.pressed(code); }

export const back = () => Audio.sfx('uiBack');
