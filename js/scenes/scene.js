// ---------------------------------------------------------------------------
// MARVEL NEXUS — scenes/scene.js
// Scene base + immediate-mode pixel UI kit (Nexus identity, universal from
// title screen to in-game pause): framed buttons with hover/pressed states,
// nine-slice panels, icons, toggles and sliders. Generated art is preferred;
// every component silently falls back to procedural drawing.
// ---------------------------------------------------------------------------
import { drawText, textWidth } from '../core/font.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { clamp } from '../core/util.js';
import { SPR, drawSprite } from '../core/pixel.js';
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
function ctxStroke(x, y, w, h, col) { GCTX.strokeStyle = col; GCTX.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }

/** nine-slice a square frame sprite; center untouched (transparent). */
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

  icon(key, x, y, s = 1) {
    const spr = SPR[key];
    if (spr) drawSprite(GCTX, spr, x, y, { scale: s });
  },

  /** Framed button with normal/hover/pressed states + optional icon.
   *  o: { color, primary, icon, disabled, silent, scale, textColor } */
  button(id, x, y, w, h, label, o = {}) {
    const hov = !o.disabled && this.hit(x, y, w, h);
    if (hov) this.hoverId = id;
    const pressed = hov && Input.mouse.down;
    const clicked = hov && this.anyClick;
    if (clicked) this.clickedId = id;
    const oy = pressed ? 1 : 0;
    const frame = o.primary ? SPR.ui_btn_gold : SPR.ui_btn;
    if (frame) {
      ctxFill(x, y + oy, w, h, '#0d0a1e');
      slice9(GCTX, frame, x, y + oy, w, h, 8);
      if (hov) { ctxFill(x + 2, y + oy + 2, w - 4, h - 4, pressed ? '#00000066' : '#ffffff14'); }
      if (o.color) { ctxFill(x + 2, y + oy + 2, w - 4, h - 4, o.color + '2e'); ctxFill(x, y + oy, 3, h, o.color); }
      if (o.disabled) ctxFill(x + 1, y + oy + 1, w - 2, h - 2, '#05040acc');
    } else {
      const col = o.color || '#7b5cff';
      ctxFill(x, y + oy, w, h, hov ? '#241b52' : '#171233');
      ctxStroke(x, y + oy, w, h, hov ? col : '#3a3350');
      if (o.accent) ctxFill(x, y + oy, 3, h, col);
    }
    const iw = o.icon ? 12 : 0;
    if (o.icon) this.icon(o.icon, x + 8 + iw / 2, y + oy + h / 2, 1);
    drawText(GCTX, label, x + (iw ? 16 + iw / 2 + 2 : w / 2) + (o.icon ? 0 : 0), y + oy + h / 2 - 3, {
      align: o.icon ? 'left' : 'center', scale: o.scale || 1,
      color: o.disabled ? '#5a5470' : hov ? '#ffffff' : o.textColor || '#cfc8f2',
      shadow: true,
    });
    if (clicked && !o.silent) Audio.sfx('ui');
    return clicked;
  },

  /** small square icon-only button */
  iconButton(id, x, y, s, iconKey, o = {}) {
    const hov = !o.disabled && this.hit(x, y, s, s);
    if (hov) this.hoverId = id;
    const pressed = hov && Input.mouse.down;
    const clicked = hov && this.anyClick;
    if (clicked) this.clickedId = id;
    const oy = pressed ? 1 : 0;
    const frame = SPR.ui_btn;
    if (frame) {
      ctxFill(x, y + oy, s, s, '#0d0a1e');
      slice9(GCTX, frame, x, y + oy, s, s, 8);
      if (hov) ctxFill(x + 2, y + oy + 2, s - 4, s - 4, pressed ? '#00000066' : '#ffffff14');
    } else {
      ctxFill(x, y + oy, s, s, hov ? '#241b52' : '#171233');
      ctxStroke(x, y + oy, s, s, hov ? (o.color || '#7b5cff') : '#3a3350');
    }
    this.icon(iconKey, x + s / 2, y + oy + s / 2, 1);
    if (clicked && !o.silent) Audio.sfx('ui');
    return clicked;
  },

  panel(x, y, w, h, o = {}) {
    ctxFill(x, y, w, h, o.fill || '#120e2add');
    if (SPR.ui_panel) slice9(GCTX, SPR.ui_panel, x, y, w, h, o.corner || 12);
    else {
      ctxStroke(x, y, w, h, o.border || '#3a3350');
      ctxStroke(x + 1, y + 1, w - 2, h - 2, '#1d1740');
    }
    if (o.title) {
      const hw = Math.min(w - 8, Math.max(120, textWidth(o.title, 2) + 40));
      if (SPR.ui_header) drawSprite(GCTX, SPR.ui_header, x + w / 2, y + 12, { scaleX: hw / SPR.ui_header.width, scaleY: 24 / SPR.ui_header.height });
      if (o.icon) this.icon(o.icon, x + w / 2 - hw / 2 + 12, y + 12, 1);
      drawText(GCTX, o.title, x + w / 2 + (o.icon ? 6 : 0), y + 6, { align: 'center', scale: o.titleScale || 2, color: o.titleColor || '#ffd94a', shadow: true, style: 'hero' });
      ctxFill(x + 6, y + 26, w - 12, 1, '#3a3350');
    }
  },

  /** toggle row: icon + label + switch; returns true when flipped */
  toggle(id, x, y, w, label, iconKey, value, o = {}) {
    const hov = this.hit(x, y, w, 16);
    if (hov) this.hoverId = id;
    const clicked = hov && this.anyClick;
    if (clicked) this.clickedId = id;
    if (hov) ctxFill(x, y, w, 16, '#ffffff0d');
    if (iconKey) this.icon(iconKey, x + 8, y + 8, 1);
    drawText(GCTX, label, x + (iconKey ? 20 : 4), y + 4, { scale: 1, color: hov ? '#ffffff' : '#cfc8f2', shadow: true });
    const sw = SPR[value ? 'ui_toggle_on' : 'ui_toggle_off'];
    if (sw) drawSprite(GCTX, sw, x + w - 16, y + 8, { scaleX: 26 / sw.width, scaleY: 13 / sw.height });
    else {
      ctxFill(x + w - 26, y + 3, 24, 10, '#100818');
      ctxStroke(x + w - 26, y + 3, 24, 10, value ? '#4dff88' : '#3a3350');
      ctxFill(x + w - 26 + (value ? 13 : 2), y + 5, 9, 6, value ? '#4dff88' : '#5a5470');
    }
    drawText(GCTX, value ? 'ON' : 'OFF', x + w - 30, y + 4, { align: 'right', scale: 1, color: value ? '#4dff88' : '#8a84a8' });
    if (clicked) Audio.sfx('ui');
    return clicked;
  },

  /** slider row: icon + label + draggable track; calls set(0..1) while moving */
  slider(id, x, y, w, label, iconKey, value, set, o = {}) {
    if (iconKey) this.icon(iconKey, x + 8, y + 7, 1);
    drawText(GCTX, label, x + (iconKey ? 20 : 4), y + 3, { scale: 1, color: '#cfc8f2', shadow: true });
    const tx = x + w - 110, tw = 84, ty = y + 6;
    const tr = SPR.ui_slider_track;
    if (tr) drawSprite(GCTX, tr, tx + tw / 2, ty + 4, { scaleX: tw / tr.width, scaleY: 8 / tr.height });
    else { ctxFill(tx, ty + 2, tw, 5, '#1d1740'); ctxStroke(tx, ty + 2, tw, 5, '#3a3350'); }
    ctxFill(tx + 1, ty + 3, Math.round((tw - 2) * clamp(value, 0, 1)), 3, o.color || '#7b5cff');
    const kx = tx + 2 + (tw - 6) * clamp(value, 0, 1);
    const kn = SPR.ui_slider_knob;
    if (kn) drawSprite(GCTX, kn, kx, ty + 4, { scale: 1 });
    else { ctxFill(kx - 2, ty, 5, 9, '#9feaff'); }
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

  tab(id, x, y, w, h, label, active) {
    const hov = this.hit(x, y, w, h);
    if (hov) this.hoverId = id;
    const clicked = hov && this.anyClick;
    if (clicked) this.clickedId = id;
    const frame = SPR.ui_btn;
    if (frame) {
      ctxFill(x, y, w, h, active ? '#2b2160' : hov ? '#1d1740' : '#120e2a');
      slice9(GCTX, frame, x, y, w, h, 8);
      if (active) ctxFill(x + 2, y + h - 4, w - 4, 2, '#7b5cff');
      if (hov && !active) ctxFill(x + 2, y + 2, w - 4, h - 4, '#ffffff10');
    } else {
      ctxFill(x, y, w, h, active ? '#2b2160' : hov ? '#1d1740' : '#120e2a');
      if (active) ctxFill(x, y + h - 2, w, 2, '#7b5cff');
      ctxStroke(x, y, w, h, active ? '#7b5cff' : '#2a2450');
    }
    drawText(GCTX, label, x + w / 2, y + h / 2 - 3, { align: 'center', scale: 1, color: active ? '#ffffff' : '#8a84a8', shadow: true });
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
