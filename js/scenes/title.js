// ---------------------------------------------------------------------------
// MARVEL NEXUS — scenes/title.js
// Title screen: pixel skyline, rift, logo plaque, hero emblem cards.
// ---------------------------------------------------------------------------
import { Scene, UI, toggleFullscreen } from './scene.js';
import { drawText } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { VIEW_W, VIEW_H } from '../game/arena.js';
import { HEROES } from '../data/heroes.js';
import { Save } from '../core/save.js';

export class TitleScene extends Scene {
  enter() { this.t = 0; this.hold = 0.5; Audio.playTrack('title'); }
  update(dt, G) {
    this.t += dt;
    this.hold = Math.max(0, this.hold - dt);
    const start = this.hold <= 0 && (Input.pressed('Enter') || Input.pressed('Space') || Input.mouse.down);
    if (start) {
      Audio.sfx('ui');
      Input.mouse.down = false; // don't leak the click into the lobby
      G.gotoLobby();
      return;
    }
    if (Input.pressed('KeyF')) toggleFullscreen();
  }

  _skyline(ctx) {
    // horizon glow + city silhouette with lit windows
    const g = ctx.createLinearGradient(0, VIEW_H - 90, 0, VIEW_H);
    g.addColorStop(0, 'rgba(123,92,255,0)');
    g.addColorStop(1, 'rgba(123,92,255,0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(0, VIEW_H - 90, VIEW_W, 90);
    const b = [40, 70, 55, 90, 65, 100, 50, 80, 60, 95, 70, 45, 85, 60, 75, 55];
    for (let i = 0; i < b.length; i++) {
      const h = b[i], x = i * 40, w = 40;
      ctx.fillStyle = i % 2 ? '#0b0918' : '#0e0b1e';
      ctx.fillRect(x, VIEW_H - h, w, h);
      ctx.fillStyle = '#171233';
      ctx.fillRect(x, VIEW_H - h, w, 2);
      for (let wy = VIEW_H - h + 6; wy < VIEW_H - 6; wy += 8) {
        for (let wx = x + 5; wx < x + w - 5; wx += 9) {
          if ((wx * 7 + wy * 13) % 17 < 3) {
            ctx.fillStyle = (wx + wy) % 3 ? '#ffd94a55' : '#4dd8ff55';
            ctx.fillRect(wx, wy, 2, 3);
          }
        }
      }
    }
  }

  _plaque(ctx, x, y, w, h, color) {
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(x + 2, y + 3, w, h);
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
  }

  draw(ctx, G) {
    const cx = VIEW_W / 2;
    ctx.fillStyle = '#06050b';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // parallax stars
    for (let i = 0; i < 90; i++) {
      const sp = 1 + (i % 3);
      const x = (i * 71 + this.t * sp * 6) % VIEW_W;
      const y = (i * 39) % (VIEW_H - 100);
      ctx.fillStyle = ['#221c48', '#3a3380', '#7b6cff'][i % 3];
      ctx.fillRect(VIEW_W - x, y, i % 7 === 0 ? 2 : 1, 1);
    }
    this._skyline(ctx);

    // nexus rift behind logo
    for (let r = 64; r > 8; r -= 6) {
      ctx.globalAlpha = 0.04 + (64 - r) / 900;
      ctx.strokeStyle = r % 12 ? '#7b5cff' : '#ff4d4d';
      ctx.beginPath();
      ctx.arc(cx, 92, r + Math.sin(this.t * 2 + r) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // logo plaque
    this._plaque(ctx, cx - 170, 52, 340, 66, '#7b5cff');
    drawText(ctx, 'MARVEL', cx - 6, 62, { align: 'right', scale: 4, color: '#e8e0ff', shadow: '#2a1b6b' });
    drawText(ctx, 'NEXUS', cx + 6, 62, { align: 'left', scale: 4, color: '#ff4d4d', shadow: '#3d0d1c' });
    ctx.fillStyle = '#7b5cff';
    ctx.fillRect(cx - 120, 98, 240, 2);
    drawText(ctx, 'BULLET HELL DIMENSIONAL', cx, 104, { align: 'center', scale: 1, color: '#9a93c8', shadow: true });

    // hero emblem cards
    HEROES.forEach((h, i) => {
      const big = SPR['hero_' + h.id + '_big'] || SPR['hero_' + h.id];
      const x = cx + (i - 2.5) * 58;
      const y = 178;
      const unlocked = Save.data.heroesUnlocked[h.id];
      ctx.fillStyle = '#00000088';
      ctx.fillRect(x - 22 + 2, y - 24 + 2, 44, 52);
      ctx.fillStyle = unlocked ? '#141031' : '#0c0a18';
      ctx.fillRect(x - 22, y - 24, 44, 52);
      ctx.strokeStyle = unlocked ? h.color : '#2a2545';
      ctx.strokeRect(x - 21.5, y - 23.5, 43, 51);
      ctx.fillStyle = unlocked ? h.color : '#2a2545';
      ctx.fillRect(x - 22, y - 24, 44, 2);
      if (big) drawSprite(ctx, big, x, y, { scale: 40 / big.height, alpha: unlocked ? 1 : 0.35 });
      drawText(ctx, unlocked ? h.name.split(' ')[0] : '???', x, y + 18, { align: 'center', scale: 1, color: unlocked ? '#c8c2e8' : '#4a4468' });
    });

    // start prompt plaque (blink)
    if (Math.floor(this.t * 2) % 2 === 0) {
      this._plaque(ctx, cx - 130, 250, 260, 22, '#ffd94a');
      drawText(ctx, 'PRESSIONE ENTER OU CLIQUE PARA COMEÇAR', cx, 257, { align: 'center', scale: 1, color: '#ffd94a', shadow: true });
    }

    if (UI.button('fs', cx - 70, 284, 140, 18, 'TELA CHEIA [F]', { color: '#4dd8ff' })) toggleFullscreen();

    drawText(ctx, 'WASD MOVER · MOUSE MIRAR · ESPAÇO ESQUIVA · Q HABILIDADE · E ESPECIAL · P PAUSA', cx, 318, { align: 'center', scale: 1, color: '#5a5470' });
    drawText(ctx, 'FAN GAME SEM FINS LUCRATIVOS · v1.2', cx, 344, { align: 'center', scale: 1, color: '#3a3350' });
  }
}
