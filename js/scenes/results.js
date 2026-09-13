// ---------------------------------------------------------------------------
// MARVEL NEXUS — scenes/results.js
// Post-run breakdown: rewards, stats, mission progress. Writes to Save.
// ---------------------------------------------------------------------------
import { Scene, UI } from './scene.js';
import { drawText } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { Save } from '../core/save.js';
import { fmtTime } from '../core/util.js';
import { Audio } from '../core/audio.js';
import { VIEW_W, VIEW_H } from '../game/arena.js';
import { MISSIONS } from '../data/missions.js';

export class ResultsScene extends Scene {
  enter(G, p) {
    this.p = p;
    this.t = 0;
    this.claimed = false;
    Audio.playTrack('lobby');
    if (!p.dryRun) this.computeRewards();
  }

  computeRewards() {
    const p = this.p;
    const s = Save.data;
    const win = p.win;
    const raidBonus = win && p.raid ? p.raid.rewardFragments : 0;
    const baseFrag = p.runFragments + (win ? 60 + raidBonus : 15);
    this.frag = Math.round(baseFrag * (p.fragGain || 1));
    this.cred = win && p.raid ? p.raid.rewardCredits : 0;
    this.xp = Math.round(p.kills * 0.5 + p.level * 6 + (win ? 60 : 12));
    s.fragments += this.frag;
    s.credits += this.cred;
    s.accountXp += this.xp;
    while (s.accountXp >= 100 + (s.accountLevel) * 75) { s.accountLevel++; }
    Save.save();
    this.newMissions = MISSIONS.filter((m) => {
      const [cur, max] = m.check(s);
      return cur >= max && !s.missionsClaimed[m.id];
    });
  }

  update(dt, G) {
    this.t += dt;
  }

  draw(ctx, G) {
    ctx.fillStyle = '#08070f';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // starfield
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % VIEW_W;
      const y = (i * 57 + Math.floor(this.t * 8)) % VIEW_H;
      ctx.fillStyle = i % 3 ? '#2a2450' : '#4a3f9e';
      ctx.fillRect(x, y, 1, 1);
    }
    const p = this.p;
    const win = p.win;
    drawText(ctx, win ? 'VITÓRIA' : 'DERROTA', VIEW_W / 2, 34, { align: 'center', scale: 3, color: win ? '#ffd94a' : '#ff4d4d', shadow: true });
    drawText(ctx, p.raid ? p.raid.name : 'NEXO DE COMBATE', VIEW_W / 2, 62, { align: 'center', scale: 1, color: '#9a93c8', shadow: true });

    // hero
    const spr = SPR['hero_' + p.heroId + '_big'] || SPR['hero_' + p.heroId];
    if (spr) drawSprite(ctx, spr, 130, 150, { scale: 0.5 });

    // stats panel
    UI.panel(220, 90, 300, 150, { title: 'RELATÓRIO DA OPERAÇÃO' });
    const line = (label, val, y, color = '#e8e0ff') => {
      drawText(ctx, label, 234, y, { color: '#9a93c8' });
      drawText(ctx, val, 506, y, { align: 'right', color });
    };
    line('TEMPO', fmtTime(p.time), 112);
    line('INIMIGOS ABATIDOS', String(p.kills), 126);
    line('NÍVEL ALCANÇADO', String(p.level), 140);
    line('PROJÉTEIS DESVIADOS', String(p.dodged || 0), 154);
    ctx.fillStyle = '#3a3350';
    ctx.fillRect(234, 168, 272, 1);
    line('FRAGMENTOS', '+' + this.frag, 176, '#4dd8ff');
    if (this.cred) line('CRÉDITOS', '+' + this.cred, 190, '#ffd94a');
    line('XP DE CONTA', '+' + this.xp, this.cred ? 204 : 190, '#b06bff');
    if (this.newMissions && this.newMissions.length) {
      drawText(ctx, 'MISSÕES CONCLUÍDAS: ' + this.newMissions.map((m) => m.name).join(', '), 234, 222, { color: '#4dff88' });
    }

    if (UI.button('retry', 220, 260, 145, 26, 'JOGAR NOVAMENTE')) G.startGame({ mode: p.mode, raidId: p.raid && p.raid.id, heroId: p.heroId });
    if (UI.button('lobby', 375, 260, 145, 26, 'VOLTAR AO LOBBY')) G.gotoLobby();
    drawText(ctx, 'AS RECOMPENSAS FORAM ADICIONADAS AO SEU PERFIL', VIEW_W / 2, 320, { align: 'center', color: '#5a5470' });
  }
}
