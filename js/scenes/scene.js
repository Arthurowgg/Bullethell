// ---------------------------------------------------------------------------
// MARVEL NEXUS — scenes/scene.js
// Scene base + immediate-mode pixel UI kit (buttons, panels, tabs, scroll).
// ---------------------------------------------------------------------------
import { drawText, textWidth } from '../core/font.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { clamp } from '../core/util.js';
import { VIEW_W, VIEW_H } from '../game/arena.js';

export class Scene {
  enter(G, params) {}
  exit(G) {}
  update(dt, G) {}
  draw(ctx, G) {}
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

  button(id, x, y, w, h, label, o = {}) {
    const hov = this.hit(x, y, w, h);
    if (hov) this.hoverId = id;
    const clicked = hov && this.anyClick;
    if (clicked) this.clickedId = id;
    const col = o.color || '#7b5cff';
    const base = hov ? '#241b52' : '#171233';
    ctxFill(x, y, w, h, base);
    // pixel frame
    ctxStroke(x, y, w, h, hov ? col : '#3a3350');
    if (o.accent) { ctxFill(x, y, 3, h, col); }
    drawText(GCTX, label, x + w / 2, y + h / 2 - 3, {
      align: 'center', scale: o.scale || 1,
      color: o.disabled ? '#5a5470' : hov ? '#ffffff' : o.textColor || '#cfc8f2',
      shadow: true,
    });
    if (clicked && !o.silent) Audio.sfx('ui');
    return clicked && !o.disabled;
  },

  panel(x, y, w, h, o = {}) {
    ctxFill(x, y, w, h, o.fill || '#120e2add');
    ctxStroke(x, y, w, h, o.border || '#3a3350');
    ctxStroke(x + 1, y + 1, w - 2, h - 2, '#1d1740');
    if (o.title) {
      drawText(GCTX, o.title, x + 8, y + 6, { scale: o.titleScale || 1, color: o.titleColor || '#e8e0ff', shadow: true });
      ctxFill(x + 6, y + 16, w - 12, 1, '#3a3350');
    }
  },

  tab(id, x, y, w, h, label, active) {
    const hov = this.hit(x, y, w, h);
    if (hov) this.hoverId = id;
    const clicked = hov && this.anyClick;
    if (clicked) this.clickedId = id;
    ctxFill(x, y, w, h, active ? '#2b2160' : hov ? '#1d1740' : '#120e2a');
    if (active) { ctxFill(x, y + h - 2, w, 2, '#7b5cff'); }
    ctxStroke(x, y, w, h, active ? '#7b5cff' : '#2a2450');
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

let GCTX = null;
export function setCtx(ctx) { GCTX = ctx; }
function ctxFill(x, y, w, h, col) { GCTX.fillStyle = col; GCTX.fillRect(x, y, w, h); }
function ctxStroke(x, y, w, h, col) { GCTX.strokeStyle = col; GCTX.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }

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
