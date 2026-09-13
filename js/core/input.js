// ---------------------------------------------------------------------------
// MARVEL NEXUS — core/input.js
// Keyboard + mouse + gamepad. Normalized actions consumed by the game scene.
// ---------------------------------------------------------------------------
import { clamp } from './util.js';

const KEYMAP_MOVE = {
  KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
};

export const Input = {
  keys: new Set(),
  pressedKeys: new Set(),
  releasedKeys: new Set(),
  mouse: { x: 320, y: 180, dx: 0, dy: 0, down: false, rdown: false, moved: false, lastMove: 0 },
  pad: { axes: [0, 0], aim: [0, 0], fire: false, ability: false, special: false, dash: false, pause: false },
  view: { scale: 1, ox: 0, oy: 0 }, // set by renderer to map client->internal
  locked: false,

  init(canvas) {
    if (this._init) return;
    this._init = true;
    this.canvas = canvas;

    addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (!e.repeat) this.pressedKeys.add(e.code);
      this.keys.add(e.code);
      this.resumeAudio();
    });
    addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.releasedKeys.add(e.code);
    });
    addEventListener('blur', () => { this.keys.clear(); this.mouse.down = false; this.mouse.rdown = false; });

    const map = (e) => {
      const r = canvas.getBoundingClientRect();
      const sx = (e.clientX - r.left) * (canvas.width / r.width);
      const sy = (e.clientY - r.top) * (canvas.height / r.height);
      return [sx, sy];
    };
    canvas.addEventListener('mousemove', (e) => {
      const [x, y] = map(e);
      this.mouse.dx += x - this.mouse.x;
      this.mouse.dy += y - this.mouse.y;
      this.mouse.x = x; this.mouse.y = y;
      this.mouse.moved = true;
      this.mouse.lastMove = performance.now();
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.down = true;
      if (e.button === 2) this.mouse.rdown = true;
      this.resumeAudio();
      canvas.focus({ preventScroll: true });
    });
    addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
      if (e.button === 2) this.mouse.rdown = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => { this.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    this.wheel = 0;

    // touch: left half = move stick, right half = aim/fire
    let tMove = null, tAim = null;
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); this.resumeAudio();
      for (const t of e.changedTouches) {
        const r = canvas.getBoundingClientRect();
        const x = (t.clientX - r.left) * (canvas.width / r.width);
        if (t.clientX - r.left < r.width / 2 && tMove == null) tMove = { id: t.identifier, x0: x, y0: t.clientY, x: 0, y: 0 };
        else if (tAim == null) { tAim = { id: t.identifier }; this.mouse.down = true; this.mouse.x = x; this.mouse.y = (t.clientY - r.top) * (canvas.height / r.height); }
      }
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const r = canvas.getBoundingClientRect();
        if (tMove && t.identifier === tMove.id) {
          tMove.x = clamp((t.clientX - tMove.x0) / 40, -1, 1);
          tMove.y = clamp((t.clientY - tMove.y0) / 40, -1, 1);
        } else if (tAim && t.identifier === tAim.id) {
          this.mouse.x = (t.clientX - r.left) * (canvas.width / r.width);
          this.mouse.y = (t.clientY - r.top) * (canvas.height / r.height);
          this.mouse.moved = true;
        }
      }
    }, { passive: false });
    const tEnd = (e) => {
      for (const t of e.changedTouches) {
        if (tMove && t.identifier === tMove.id) tMove = null;
        if (tAim && t.identifier === tAim.id) { tAim = null; this.mouse.down = false; }
      }
    };
    canvas.addEventListener('touchend', tEnd);
    canvas.addEventListener('touchcancel', tEnd);
    this._touch = () => tMove ? [tMove.x, tMove.y] : null;
  },

  resumeAudio() {
    if (globalThis.__nx_audio) globalThis.__nx_audio.unlock();
  },

  pressed(code) { return this.pressedKeys.has(code); },

  /** movement vector from keys / touch / pad */
  moveAxis() {
    let x = 0, y = 0;
    for (const k of this.keys) {
      const m = KEYMAP_MOVE[k];
      if (m) { x += m[0]; y += m[1]; }
    }
    const t = this._touch && this._touch();
    if (t) { x += t[0]; y += t[1]; }
    if (this.pad.axes && (Math.abs(this.pad.axes[0]) > 0.2 || Math.abs(this.pad.axes[1]) > 0.2)) {
      x += this.pad.axes[0]; y += this.pad.axes[1];
    }
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return [x, y];
  },

  pollGamepad() {
    if (!('getGamepads' in (navigator || {}))) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && pads[0];
    if (!p) return;
    const dz = (v) => (Math.abs(v) < 0.18 ? 0 : v);
    this.pad.axes = [dz(p.axes[0] || 0), dz(p.axes[1] || 0)];
    this.pad.aim = [dz(p.axes[2] || 0), dz(p.axes[3] || 0)];
    const btn = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
    this.pad.fire = btn(7) || btn(6);
    this.pad.ability = btn(2);      // X / square
    this.pad.special = btn(3);      // Y / triangle
    this.pad.dash = btn(1) || btn(5) || btn(4);
    if (btn(9) && !this._padPauseHeld) { this.pressedKeys.add('Escape'); this._padPauseHeld = true; }
    if (!btn(9)) this._padPauseHeld = false;
  },

  endFrame() {
    this.pressedKeys.clear();
    this.releasedKeys.clear();
    this.mouse.moved = false;
    this.mouse.dx = 0; this.mouse.dy = 0;
    this.wheel = 0;
  },
};
