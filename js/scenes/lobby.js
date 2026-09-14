// ---------------------------------------------------------------------------
// MARVEL NEXUS — scenes/lobby.js
// Lobby enxuto e premium: abas JOGAR e LOJA (NEXUS / COSMÉTICA) + configurações
// como ícone discreto. Pixel art moderna, inspirado em lojas de jogos atuais.
// ---------------------------------------------------------------------------
import { Scene, UI, toggleFullscreen } from './scene.js';
import { drawText, textWidth } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { Save, xpForLevel } from '../core/save.js';
import { VIEW_W, VIEW_H } from '../game/arena.js';
import { THEMES } from '../data/sprites.js';
import { HEROES, heroById } from '../data/heroes.js';
import { BOSSES } from '../data/bosses.js';
import { RAIDS, raidUnlocked } from '../data/raids.js';
import { HERO_NODES, nodeCost } from '../data/nexuscore.js';
import { SKINS, skinById, RARITY_SHOP } from '../data/shop.js';
import { MISSIONS, HERO_UNLOCK_COST } from '../data/missions.js';
import { clamp, fmtTime } from '../core/util.js';

const TABS = ['JOGAR', 'LOJA'];

export class LobbyScene extends Scene {
  enter(G, params) {
    this.t = 0;
    this.tab = 0;
    this.shopSec = 'cos';      // 'nexus' | 'cos'
    this.cfgOpen = false;
    this.raidsOpen = false;
    this.skinSel = SKINS[0].id;
    Audio.playTrack('lobby');
  }

  update(dt, G) { this.t += dt; }

  // ------------------------------------------------------------- helpers ---
  wrap(ctx, txt, x, y, w, color, lh = 9) {
    let line = '', ly = y;
    for (const wd of String(txt).split(' ')) {
      if (textWidth(line + wd) > w) { drawText(ctx, line, x, ly, { color }); ly += lh; line = ''; }
      line += (line ? ' ' : '') + wd;
    }
    if (line) { drawText(ctx, line, x, ly, { color }); ly += lh; }
    return ly;
  }

  emblem(ctx, base, fallbackHeroId, x, y, scale = 1, frame = 0) {
    const s = SPR[base + '_f' + frame] || SPR[base] || SPR['hero_' + fallbackHeroId];
    if (s) drawSprite(ctx, s, x, y, { scale });
  }

  drawGear(ctx, x, y, active) {
    ctx.fillStyle = active ? '#ffd94a' : '#8a84a8';
    ctx.fillRect(x + 2, y, 4, 8); ctx.fillRect(x, y + 2, 8, 4);
    ctx.fillStyle = '#0d0a1e';
    ctx.fillRect(x + 3, y + 3, 2, 2);
  }

  // ---------------------------------------------------------------- draw ---
  draw(ctx, G) {
    const s = Save.data;
    this.drawRoom(ctx);

    // header
    ctx.fillStyle = '#0d0a1ecc';
    ctx.fillRect(0, 0, VIEW_W, 22);
    drawText(ctx, 'MARVEL', 6, 4, { color: '#e8e0ff' });
    drawText(ctx, 'NEXUS', 40, 4, { color: '#ff4d4d' });
    drawText(ctx, `NV ${s.accountLevel}`, 92, 7, { color: '#b06bff' });
    ctx.fillStyle = '#1d1740'; ctx.fillRect(118, 8, 60, 4);
    ctx.fillStyle = '#b06bff';
    ctx.fillRect(118, 8, Math.round(60 * clamp(s.accountXp / xpForLevel(s.accountLevel + 1), 0, 1)), 4);
    drawSprite(ctx, SPR.fragment, 480, 12, { scale: 0.9 });
    drawText(ctx, String(s.fragments), 490, 7, { color: '#9feaff' });
    drawSprite(ctx, SPR.credit, 552, 12, { scale: 0.9 });
    drawText(ctx, String(s.credits), 562, 7, { color: '#ffe9a0' });
    // gear icon (discreet settings)
    const gHov = UI.hit(616, 6, 16, 14);
    this.drawGear(ctx, 620, 8, gHov);
    if (gHov) { UI.hoverId = 'gear'; if (UI.anyClick) { this.cfgOpen = true; Audio.sfx('ui'); } }

    // tabs
    const tw = 110;
    TABS.forEach((t, i) => {
      if (UI.tab('tab' + i, 8 + i * (tw + 6), 24, tw, 16, t, this.tab === i)) { this.tab = i; this.raidsOpen = false; }
    });

    ctx.fillStyle = '#0d0a1e99';
    ctx.fillRect(0, 40, VIEW_W, VIEW_H - 40);

    if (this.tab === 0) this.drawPlay(ctx, G);
    else this.drawShop(ctx, G);

    if (this.raidsOpen) this.drawRaidsOverlay(ctx, G);
    if (this.cfgOpen) this.drawConfigOverlay(ctx, G);
  }

  drawRoom(ctx) {
    const theme = THEMES.nexus;
    const f0 = SPR.floor_nexus_0, f1 = SPR.floor_nexus_1;
    for (let y = 60; y < VIEW_H; y += 16)
      for (let x = 0; x < VIEW_W; x += 16)
        ctx.drawImage(((x / 16 + y / 16) % 2 === 0) ? f0 : f1, x, y);
    ctx.fillStyle = theme.wall; ctx.fillRect(0, 40, VIEW_W, 24);
    ctx.fillStyle = theme.wallTop; ctx.fillRect(0, 62, VIEW_W, 2);
    ctx.drawImage(SPR.portal_nexus, 30, 44);
    ctx.drawImage(SPR.console_nexus, 566, 46);
    ctx.drawImage(SPR.banner_nexus, 300, 42);
    ctx.globalAlpha = 0.3 + Math.sin(this.t * 3) * 0.15;
    ctx.fillStyle = theme.accent; ctx.fillRect(36, 50, 12, 16);
    ctx.globalAlpha = 1;
  }

  // ============================================================ JOGAR ======
  drawPlay(ctx, G) {
    const s = Save.data;
    const hero = heroById(s.heroSelected);

    // squad selector
    UI.panel(8, 48, 150, 304, { title: 'ESQUADRÃO' });
    HEROES.forEach((h, i) => {
      const x = 16 + (i % 2) * 72, y = 70 + ((i / 2) | 0) * 78;
      const unlocked = s.heroesUnlocked[h.id];
      const sel = s.heroSelected === h.id;
      const hov = UI.hit(x, y, 66, 70);
      if (hov) UI.hoverId = 'h' + i;
      ctx.fillStyle = hov ? '#241b52' : '#171233';
      ctx.fillRect(x, y, 66, 70);
      ctx.strokeStyle = sel ? h.color : hov ? '#7b5cff' : '#2a2450';
      ctx.strokeRect(x + 0.5, y + 0.5, 65, 69);
      const frame = Math.floor(this.t * 2) % 2;
      this.emblem(ctx, 'hero_' + h.id, h.id, x + 33, y + 26, 1, unlocked ? frame : 0);
      if (!unlocked) {
        ctx.fillStyle = '#000000aa'; ctx.fillRect(x, y, 66, 70);
        drawSprite(ctx, SPR.lock, x + 33, y + 22, { scale: 0.9 });
        drawText(ctx, String(HERO_UNLOCK_COST[h.id]), x + 33, y + 40, { align: 'center', color: '#4dd8ff' });
      }
      drawText(ctx, h.name.split(' ')[0], x + 33, y + 56, { align: 'center', color: unlocked ? (sel ? '#ffffff' : '#8a84a8') : '#5a5470' });
      if (hov && UI.anyClick) {
        if (unlocked) { s.heroSelected = h.id; Save.save(); Audio.sfx('ui'); }
        else if (s.fragments >= HERO_UNLOCK_COST[h.id]) {
          s.fragments -= HERO_UNLOCK_COST[h.id];
          s.heroesUnlocked[h.id] = true; s.heroSelected = h.id;
          Save.save(); Audio.sfx('buy');
        } else Audio.sfx('deny');
      }
    });

    // hero showcase
    UI.panel(166, 48, 292, 304, { title: 'HERÓI' });
    const eqSkin = skinById(s.cosmeticsEquipped[hero.id]);
    const base = eqSkin && eqSkin.hero === hero.id ? 'skin_' + eqSkin.id : 'hero_' + hero.id;
    const frame = Math.floor(this.t * 3) % 2;
    // glow pedestal
    ctx.globalAlpha = 0.25 + Math.sin(this.t * 2) * 0.08;
    ctx.fillStyle = hero.color;
    ctx.beginPath(); ctx.ellipse(312, 216, 46, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    this.emblem(ctx, base, hero.id, 312, 150, 3, frame);
    drawText(ctx, eqSkin ? eqSkin.name : hero.name, 312, 200, { align: 'center', scale: 2, color: eqSkin ? RARITY_SHOP[eqSkin.rarity].color : hero.color, shadow: true });
    drawText(ctx, hero.role, 312, 220, { align: 'center', color: '#9a93c8' });
    const bar = (label, val, max, yy, col) => {
      drawText(ctx, label, 186, yy, { color: '#9a93c8' });
      ctx.fillStyle = '#1d1740'; ctx.fillRect(266, yy + 1, 120, 5);
      ctx.fillStyle = col; ctx.fillRect(266, yy + 1, Math.round(120 * clamp(val / max, 0, 1)), 5);
    };
    bar('VIDA', hero.hp, 140, 238, '#ff4d6b');
    bar('VELOCIDADE', hero.speed, 140, 250, '#4dd8ff');
    bar('DANO', hero.attack.dmg, 16, 262, '#ffd94a');
    let y = this.wrap(ctx, 'HABILIDADE: ' + hero.ability.desc, 186, 282, 252, '#8a84a8', 8);
    y = this.wrap(ctx, 'ESPECIAL: ' + hero.special.desc, 186, y + 2, 252, '#8a84a8', 8);
    this.wrap(ctx, 'PASSIVA: ' + hero.passive.desc, 186, y + 2, 252, '#8a84a8', 8);

    // actions
    UI.panel(466, 48, 166, 304, { title: 'OPERAÇÕES' });
    if (UI.button('start', 478, 74, 142, 42, 'INICIAR PARTIDA', { color: '#4dff88', accent: true, scale: 1 })) {
      G.startGame({ mode: 'run', heroId: hero.id });
    }
    if (UI.button('raids', 478, 124, 142, 26, 'INCURSÕES', { color: '#b06bff' })) this.raidsOpen = true;
    ctx.fillStyle = '#3a3350'; ctx.fillRect(478, 162, 142, 1);
    drawText(ctx, 'CONTROLES', 478, 172, { color: '#9a93c8' });
    this.wrap(ctx, 'WASD MOVER · MOUSE MIRAR', 478, 184, 142, '#5a5470', 8);
    this.wrap(ctx, 'ESPAÇO ESQUIVA · Q HABILIDADE', 478, 208, 142, '#5a5470', 8);
    this.wrap(ctx, 'E ESPECIAL · P PAUSA · F TELA CHEIA', 478, 232, 142, '#5a5470', 8);
    const next = MISSIONS.find((m) => { const [c, mx] = m.check(s); return c < mx && !s.missionsClaimed[m.id]; });
    if (next) {
      ctx.fillStyle = '#3a3350'; ctx.fillRect(478, 268, 142, 1);
      drawText(ctx, 'MISSÃO ATIVA', 478, 278, { color: '#ffd94a' });
      this.wrap(ctx, next.name + ': ' + next.desc, 478, 290, 142, '#8a84a8', 8);
    }
  }

  // ============================================================ LOJA =======
  drawShop(ctx, G) {
    const s = Save.data;
    // section switch
    if (UI.tab('secN', 8, 48, 120, 18, 'NEXUS', this.shopSec === 'nexus')) this.shopSec = 'nexus';
    if (UI.tab('secC', 134, 48, 120, 18, 'COSMÉTICA', this.shopSec === 'cos')) this.shopSec = 'cos';
    drawText(ctx, this.shopSec === 'nexus' ? 'UPGRADES PERMANENTES POR HERÓI' : 'VISUAIS EXCLUSIVOS DOS HERÓIS', 268, 53, { color: '#5a5470' });

    if (this.shopSec === 'nexus') this.drawNexus(ctx, G);
    else this.drawCosmetics(ctx, G);
  }

  // ---- NEXUS: permanent hero evolution ----
  drawNexus(ctx, G) {
    const s = Save.data;
    HEROES.forEach((h, hi) => {
      const nodes = HERO_NODES.filter((n) => n.hero === h.id);
      const x = 8 + (hi % 3) * 210, y = 74 + ((hi / 3) | 0) * 140;
      UI.panel(x, y, 202, 132, {});
      this.emblem(ctx, 'hero_' + h.id, h.id, x + 22, y + 20, 0.8, 0);
      drawText(ctx, h.name, x + 42, y + 8, { color: h.color, shadow: true });
      nodes.forEach((n, ni) => {
        const ny = y + 36 + ni * 48;
        const rank = s.nexusNodes[n.id] || 0;
        const maxed = rank >= n.max;
        const cost = maxed ? 0 : nodeCost(n, rank);
        const hov = UI.hit(x + 8, ny, 186, 44);
        if (hov) UI.hoverId = 'n' + n.id;
        ctx.fillStyle = hov ? '#241b52' : '#120e2a';
        ctx.fillRect(x + 8, ny, 186, 44);
        ctx.strokeStyle = maxed ? '#ffd94a' : rank > 0 ? '#b06bff' : '#2a2450';
        ctx.strokeRect(x + 8.5, ny + 0.5, 185, 43);
        drawText(ctx, n.name, x + 14, ny + 4, { color: '#ffffff' });
        for (let i = 0; i < n.max; i++) {
          ctx.fillStyle = i < rank ? '#b06bff' : '#2a2450';
          ctx.fillRect(x + 14 + i * 8, ny + 15, 6, 6);
        }
        drawText(ctx, maxed ? 'MÁXIMO' : cost + ' FR', x + 188, ny + 4, { align: 'right', color: maxed ? '#ffd94a' : s.fragments >= cost ? '#9feaff' : '#5a5470' });
        this.wrap(ctx, n.desc, x + 14, ny + 27, 174, '#8a84a8', 8);
        if (hov && UI.anyClick && !maxed) {
          if (Save.spendFragments(cost)) { s.nexusNodes[n.id] = rank + 1; Audio.sfx('buy'); }
          else Audio.sfx('deny');
        }
      });
    });
  }

  // ---- COSMÉTICA: 3 premium skins ----
  drawCosmetics(ctx, G) {
    const s = Save.data;
    // list
    SKINS.forEach((sk, i) => {
      const y = 74 + i * 94;
      const sel = this.skinSel === sk.id;
      const owned = s.cosmeticsOwned[sk.id];
      const equipped = s.cosmeticsEquipped[sk.hero] === sk.id;
      const hov = UI.hit(8, y, 200, 86);
      if (hov) UI.hoverId = 'sk' + sk.id;
      ctx.fillStyle = hov || sel ? '#241b52' : '#171233';
      ctx.fillRect(8, y, 200, 86);
      ctx.strokeStyle = sel ? RARITY_SHOP[sk.rarity].color : '#2a2450';
      ctx.strokeRect(8.5, y + 0.5, 199, 85);
      ctx.fillStyle = RARITY_SHOP[sk.rarity].color;
      ctx.fillRect(8, y, 200, 2);
      this.emblem(ctx, 'skin_' + sk.id, sk.hero, 44, y + 40, 1.4, Math.floor(this.t * 3) % 2);
      drawText(ctx, sk.name, 78, y + 12, { color: '#ffffff', shadow: true });
      drawText(ctx, RARITY_SHOP[sk.rarity].name, 78, y + 26, { color: RARITY_SHOP[sk.rarity].color });
      drawText(ctx, heroById(sk.hero).name, 78, y + 40, { color: '#8a84a8' });
      drawText(ctx, owned ? (equipped ? 'EQUIPADO' : 'ADQUIRIDO') : sk.price + ' FR', 78, y + 62, { color: owned ? (equipped ? '#4dff88' : '#9feaff') : '#ffd94a' });
      if (hov && UI.anyClick) { this.skinSel = sk.id; Audio.sfx('ui'); }
    });

    // preview stage
    const sk = skinById(this.skinSel);
    const hero = heroById(sk.hero);
    UI.panel(216, 74, 416, 278, { title: 'PRÉ-VISUALIZAÇÃO' });
    // stage backdrop
    ctx.fillStyle = '#0b0817';
    ctx.fillRect(228, 96, 392, 176);
    ctx.strokeStyle = RARITY_SHOP[sk.rarity].color + '66';
    ctx.strokeRect(228.5, 96.5, 391, 175);
    const f0 = SPR['floor_' + 'nexus_0'], f1 = SPR['floor_nexus_1'];
    for (let x = 228; x < 620; x += 16) ctx.drawImage((x / 16) % 2 ? f0 : f1, x, 256);
    // animated emblem (cycles idle frames, attack flash)
    const cyc = this.t % 2.4;
    const frame = cyc < 1.6 ? (Math.floor(this.t * 3) % 2) : 2;
    ctx.globalAlpha = 0.3 + Math.sin(this.t * 2) * 0.1;
    ctx.fillStyle = sk.fx.aura;
    ctx.beginPath(); ctx.ellipse(424, 250, 54, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    this.emblem(ctx, 'skin_' + sk.id, sk.hero, 424, 180, 4, frame);
    // fx showcase: trail dots + shot orb
    for (let i = 0; i < 5; i++) {
      const tx = 424 - 70 + ((this.t * 90 + i * 30) % 140);
      ctx.globalAlpha = 0.5 - i * 0.08;
      ctx.fillStyle = sk.fx.trail;
      ctx.fillRect(tx, 236, 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = sk.fx.shotTint;
    ctx.fillRect(560 + Math.round(Math.sin(this.t * 4) * 6), 120, 4, 4);
    drawText(ctx, 'EFEITO DE TIRO', 560, 132, { align: 'center', color: '#5a5470' });

    // info + actions
    drawText(ctx, sk.name, 228, 282, { scale: 2, color: RARITY_SHOP[sk.rarity].color, shadow: true });
    drawText(ctx, RARITY_SHOP[sk.rarity].name + ' · ' + hero.name, 228, 302, { color: '#9a93c8' });
    this.wrap(ctx, sk.desc, 228, 316, 392, '#cfc8f2', 9);

    const owned = s.cosmeticsOwned[sk.id];
    const equipped = s.cosmeticsEquipped[sk.hero] === sk.id;
    if (!owned) {
      if (UI.button('buy', 228, 336, 180, 22, `COMPRAR · ${sk.price} FR`, { color: '#4dff88', accent: true })) {
        if (Save.spendFragments(sk.price)) { s.cosmeticsOwned[sk.id] = true; s.cosmeticsEquipped[sk.hero] = sk.id; Audio.sfx('buy'); }
        else Audio.sfx('deny');
      }
    } else {
      if (UI.button('equip', 228, 336, 120, 22, equipped ? 'EQUIPADO' : 'EQUIPAR', { color: equipped ? '#5a5470' : '#7b5cff' })) {
        if (!equipped) { s.cosmeticsEquipped[sk.hero] = sk.id; Audio.sfx('buy'); }
      }
      if (equipped && UI.button('std', 354, 336, 110, 22, 'PADRÃO')) {
        delete s.cosmeticsEquipped[sk.hero];
        Save.save(); Audio.sfx('uiBack');
      }
    }
    drawText(ctx, 'COSMÉTICO — SEM VANTAGEM DE COMBATE', 620, 344, { align: 'right', color: '#3a3350' });
  }

  // ---- overlays ----
  drawRaidsOverlay(ctx, G) {
    const s = Save.data;
    ctx.fillStyle = 'rgba(5,4,10,0.85)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    UI.panel(90, 44, 460, 280, { title: 'INCURSÕES', titleColor: '#ff4d4d' });
    RAIDS.forEach((r, i) => {
      const y = 68 + i * 48;
      const unlocked = raidUnlocked(r, s);
      const cleared = s.raidsCleared[r.id];
      ctx.fillStyle = '#171233';
      ctx.fillRect(102, y, 436, 42);
      ctx.strokeStyle = unlocked ? '#3a3350' : '#221c3d';
      ctx.strokeRect(102.5, y + 0.5, 435, 41);
      const bs = SPR[BOSSES[r.boss].sprite];
      if (bs) drawSprite(ctx, bs, 128, y + 21, { scale: 0.55, alpha: unlocked ? 1 : 0.3 });
      drawText(ctx, r.name, 158, y + 6, { color: unlocked ? '#ffffff' : '#5a5470' });
      for (let st = 0; st < 5; st++) drawSprite(ctx, SPR.star, 158 + st * 9, y + 28, { scale: 0.6, alpha: st < r.stars ? 1 : 0.2 });
      if (cleared) drawText(ctx, 'x' + cleared.wins + ' · ' + fmtTime(cleared.bestTime), 380, y + 14, { align: 'right', color: '#4dff88' });
      if (!unlocked) {
        drawSprite(ctx, SPR.lock, 516, y + 20, { scale: 0.9 });
        drawText(ctx, 'NV ' + r.unlockLevel, 500, y + 16, { align: 'right', color: '#5a5470' });
      } else if (UI.button('go' + i, 448, y + 8, 80, 26, 'INICIAR', { color: '#ff4d4d' })) {
        G.startGame({ mode: 'raid', raidId: r.id, heroId: s.heroSelected });
      }
    });
    if (UI.button('closeR', 280, 330, 80, 18, 'FECHAR')) this.raidsOpen = false;
  }

  drawConfigOverlay(ctx, G) {
    const s = Save.data;
    ctx.fillStyle = 'rgba(5,4,10,0.85)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    UI.panel(190, 52, 260, 264, { title: 'CONFIGURAÇÕES' });
    const row = (label, y) => drawText(ctx, label, 204, y, { color: '#9a93c8' });
    row('MÚSICA', 82);
    if (UI.button('cm-', 300, 78, 18, 14, '-')) s.music = clamp(s.music - 0.1, 0, 1);
    ctx.fillStyle = '#1d1740'; ctx.fillRect(324, 81, 60, 6);
    ctx.fillStyle = '#b06bff'; ctx.fillRect(324, 81, Math.round(60 * s.music), 6);
    if (UI.button('cm+', 392, 78, 18, 14, '+')) s.music = clamp(s.music + 0.1, 0, 1);
    row('SFX', 102);
    if (UI.button('cs-', 300, 98, 18, 14, '-')) s.sfx = clamp(s.sfx - 0.1, 0, 1);
    ctx.fillStyle = '#1d1740'; ctx.fillRect(324, 101, 60, 6);
    ctx.fillStyle = '#4dd8ff'; ctx.fillRect(324, 101, Math.round(60 * s.sfx), 6);
    if (UI.button('cs+', 392, 98, 18, 14, '+')) s.sfx = clamp(s.sfx + 0.1, 0, 1);
    if (UI.button('t1', 204, 122, 232, 16, 'VIBRAÇÃO DE TELA: ' + (s.screenshake ? 'ON' : 'OFF'))) s.screenshake = !s.screenshake;
    if (UI.button('t2', 204, 142, 232, 16, 'NÚMEROS DE DANO: ' + (s.dmgNumbers ? 'ON' : 'OFF'))) s.dmgNumbers = !s.dmgNumbers;
    if (UI.button('t3', 204, 162, 232, 16, 'MIRA AUTOMÁTICA: ' + (s.autofire ? 'ON' : 'OFF'))) s.autofire = !s.autofire;
    if (UI.button('t4', 204, 182, 232, 16, 'ESCALA INTEIRA DE PIXEL: ' + (s.integerScale ? 'ON' : 'OFF'))) { s.integerScale = !s.integerScale; G.resize && G.resize(); }
    if (UI.button('fs', 204, 202, 232, 16, 'TELA CHEIA [F]')) toggleFullscreen();
    if (UI.button('tut', 204, 222, 232, 16, 'REEXIBIR TUTORIAL')) s.tutorialDone = false;
    if (UI.button('reset', 204, 250, 232, 18, 'APAGAR SAVE (CLIQUE 2x)', { color: '#ff4d4d' })) {
      if (this._resetArm) { Save.reset(); Audio.sfx('defeat'); this._resetArm = false; }
      else this._resetArm = true;
    }
    if (this._resetArm) drawText(ctx, 'CLIQUE NOVAMENTE PARA CONFIRMAR', 320, 274, { align: 'center', color: '#ff4d4d' });
    if (UI.button('closeC', 280, 292, 80, 18, 'FECHAR')) this.cfgOpen = false;
    Audio.setVolumes({ music: s.music, sfx: s.sfx, master: s.master });
    Save.save();
  }
}
