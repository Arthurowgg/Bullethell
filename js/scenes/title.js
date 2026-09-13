// ---------------------------------------------------------------------------
// MARVEL NEXUS — scenes/title.js
// ---------------------------------------------------------------------------
import { Scene } from './scene.js';
import { drawText } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { VIEW_W, VIEW_H } from '../game/arena.js';
import { HEROES } from '../data/heroes.js';
import { Save } from '../core/save.js';

export class TitleScene extends Scene {
  enter() { this.t = 0; Audio.playTrack('title'); }
  update(dt) {
    this.t += dt;
    if (Input.pressed('Enter') || Input.pressed('Space') || Input.mouse.down) {
      Audio.sfx('ui');
      this.go = true;
    }
  }
  draw(ctx, G) {
    ctx.fillStyle = '#06050b';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // parallax stars
    for (let i = 0; i < 90; i++) {
      const sp = 1 + (i % 3);
      const x = (i * 71 + this.t * sp * 6) % VIEW_W;
      const y = (i * 39) % VIEW_H;
      ctx.fillStyle = ['#221c48', '#3a3380', '#7b6cff'][i % 3];
      ctx.fillRect(VIEW_W - x, y, i % 7 === 0 ? 2 : 1, 1);
    }
    // nexus rift
    const cx = VIEW_W / 2, cy = 150;
    for (let r = 90; r > 10; r -= 6) {
      ctx.globalAlpha = 0.05 + (90 - r) / 900;
      ctx.strokeStyle = r % 12 ? '#7b5cff' : '#ff4d4d';
      ctx.beginPath();
      ctx.arc(cx, cy, r + Math.sin(this.t * 2 + r) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawText(ctx, 'MARVEL', cx - 4, 96, { align: 'right', scale: 4, color: '#e8e0ff', shadow: '#2a1b6b' });
    drawText(ctx, 'NEXUS', cx + 4, 96, { align: 'left', scale: 4, color: '#ff4d4d', shadow: '#3d0d1c' });
    drawText(ctx, 'BULLET HELL DIMENSIONAL', cx, 130, { align: 'center', scale: 1, color: '#9a93c8', shadow: true });

    // hero lineup
    HEROES.forEach((h, i) => {
      const spr = SPR['hero_' + h.id];
      if (!spr) return;
      const x = cx + (i - 2.5) * 46;
      const y = 210 + Math.round(Math.sin(this.t * 3 + i) * 2);
      const unlocked = Save.data.heroesUnlocked[h.id];
      drawSprite(ctx, spr, x, y, { alpha: unlocked ? 1 : 0.3 });
    });

    if (Math.floor(this.t * 2) % 2 === 0)
      drawText(ctx, 'PRESSIONE ENTER OU CLIQUE', cx, 262, { align: 'center', scale: 1, color: '#ffd94a', shadow: true });
    drawText(ctx, 'WASD MOVER · MOUSE MIRAR · ESPAÇO ESQUIVA · Q HABILIDADE · E ESPECIAL · P PAUSA', cx, 300, { align: 'center', scale: 1, color: '#5a5470' });
    drawText(ctx, 'FAN GAME SEM FINS LUCRATIVOS · v1.0', cx, 344, { align: 'center', scale: 1, color: '#3a3350' });
  }
}
