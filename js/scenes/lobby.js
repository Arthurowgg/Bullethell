// ---------------------------------------------------------------------------
// MARVEL NEXUS — scenes/lobby.js
// The Nexus hub: a living command deck, not a dashboard. Central holographic
// core, hero emblems in orbit, themed portals for shops/worlds, holo-chips
// for missions/collection/dev, discreet gear for settings.
// ---------------------------------------------------------------------------
import { Scene, UI, toggleFullscreen } from './scene.js';
import { drawText, textWidth } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { Audio } from '../core/audio.js';
import { Input } from '../core/input.js';
import { Save, xpForLevel } from '../core/save.js';
import { VIEW_W, VIEW_H } from '../game/arena.js';
import { HEROES, heroById } from '../data/heroes.js';
import { bossById } from '../data/bosses.js';
import { HERO_NODES, nodeCost } from '../data/nexuscore.js';
import { SKINS, skinById, RARITY_SHOP } from '../data/shop.js';
import { MISSIONS, HERO_UNLOCK_COST } from '../data/missions.js';
import { ENEMIES } from '../data/enemies.js';
import { clamp } from '../core/util.js';
import { ArchivesUI } from '../game/archives.js';

export class LobbyScene extends Scene {
  enter(G, params) {
    this.t = 0;
    this.overlay = null;      // null | nexus | cos | arch | missions | dev | cfg
    this.arch = new ArchivesUI();
    this.shopSec = 'cos';
    this.skinSel = SKINS[0].id;
    this.transT = 0;          // portal transition anim
    this._resetArm = false; this._resetArm2 = false;
    Audio.playTrack('lobby');
  }

  update(dt, G) {
    this.t += dt; this.transT = Math.max(0, this.transT - dt);
    if (this.overlay === 'arch') this.arch.update(dt);
    if (this.overlay && (Input.pressed('Escape') || Input.pressed('KeyP'))) { this.overlay = null; Audio.sfx('uiBack'); }
  }

  // ------------------------------------------------------------ helpers ----
  wrap(ctx, txt, x, y, w, color, lh = 9) {
    let line = '', ly = y;
    for (const wd of String(txt).split(' ')) {
      if (textWidth(line + wd) > w) { drawText(ctx, line, x, ly, { color }); ly += lh; line = ''; }
      line += (line ? ' ' : '') + wd;
    }
    if (line) { drawText(ctx, line, x, ly, { color }); ly += lh; }
    return ly;
  }

  // comic-tech panel frame
  frame(ctx, x, y, w, h, color) {
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(x + 2, y + 3, w, h);
    ctx.fillStyle = '#0d0a1ef2';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    ctx.strokeStyle = color || '#7b5cff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff22';
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    ctx.fillStyle = color || '#7b5cff';
    ctx.fillRect(x, y, 4, 1); ctx.fillRect(x + w - 4, y, 4, 1);
    ctx.fillRect(x, y + h - 1, 4, 1); ctx.fillRect(x + w - 4, y + h - 1, 4, 1);
  }

  // procedural currency glyphs (tiny pixel icons)
  glyphFrag(ctx, x, y) {
    ctx.fillStyle = '#4dd8ff';
    ctx.fillRect(x + 2, y - 4, 2, 8); ctx.fillRect(x, y - 2, 6, 4);
    ctx.fillStyle = '#9feaff';
    ctx.fillRect(x + 2, y - 2, 2, 2);
  }
  glyphCred(ctx, x, y) {
    ctx.fillStyle = '#ffd94a';
    ctx.fillRect(x, y - 3, 6, 6);
    ctx.fillStyle = '#fff2b8';
    ctx.fillRect(x + 1, y - 2, 2, 2);
    ctx.fillStyle = '#8a6a10';
    ctx.fillRect(x + 2, y, 3, 1);
  }

  open(id) { this.overlay = id; this.transT = 0.35; Audio.sfx('port'); }

  holo(ctx, id, x, y, icon, label, color) {
    const hov = UI.hit(x - 12, y - 12, 24, 30);
    if (hov) UI.hoverId = id;
    ctx.globalAlpha = hov ? 1 : 0.85;
    if (SPR[icon]) drawSprite(ctx, SPR[icon], x, y, { scale: 1.2 });
    ctx.globalAlpha = 1;
    drawText(ctx, label, x, y + 12, { align: 'center', scale: 1, color: hov ? '#ffffff' : color || '#9a93c8', shadow: true });
    if (hov && UI.anyClick) return true;
    return false;
  }

  // ---------------------------------------------------------------- draw ---
  draw(ctx, G) {
    const s = Save.data;
    const realClick = UI.anyClick;
    if (this.overlay) UI.anyClick = false;   // menus are modal layers: nothing behind reacts
    // living background
    const bg = SPR['lobby_bg'];
    if (bg) ctx.drawImage(bg, 0, 0, VIEW_W, VIEW_H);
    else { ctx.fillStyle = '#0b0918'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    // ambient particles
    for (let i = 0; i < 24; i++) {
      const px = (i * 97 + this.t * (6 + (i % 5) * 3)) % VIEW_W;
      const py = (i * 53) % VIEW_H;
      ctx.globalAlpha = 0.25 + (i % 3) * 0.12;
      ctx.fillStyle = i % 2 ? '#7b5cff' : '#4dd8ff';
      ctx.fillRect(VIEW_W - px, py, i % 5 === 0 ? 2 : 1, 1);
    }
    ctx.globalAlpha = 1;

    // header strip
    ctx.fillStyle = '#0d0a1ecc';
    ctx.fillRect(0, 0, VIEW_W, 22);
    drawText(ctx, 'MARVEL', 6, 4, { color: '#e8e0ff' });
    drawText(ctx, 'NEXUS', 40, 4, { color: '#ff4d4d' });
    drawText(ctx, `NV ${s.accountLevel}`, 92, 7, { color: '#b06bff' });
    ctx.fillStyle = '#1d1740'; ctx.fillRect(118, 8, 60, 4);
    ctx.fillStyle = '#b06bff';
    ctx.fillRect(118, 8, Math.round(60 * clamp(s.accountXp / xpForLevel(s.accountLevel + 1), 0, 1)), 4);
    this.glyphFrag(ctx, 472, 11);
    drawText(ctx, String(s.fragments), 482, 7, { color: '#9feaff' });
    this.glyphCred(ctx, 544, 11);
    drawText(ctx, String(s.credits), 554, 7, { color: '#ffe9a0' });
    if (this.holo(ctx, 'gear', 618, 11, 'lobby_nav_gear', '', '#8a84a8')) this.open('cfg');

    this.drawComputers(ctx, G);
    this.drawCore(ctx, G);
    this.drawHeroesOrbit(ctx, G);
    this.drawPortals(ctx, G);
    this.drawPlayPad(ctx, G);
    this.drawChips(ctx, G);

    UI.anyClick = realClick;
    if (this.overlay) this.drawOverlay(ctx, G);

    // portal transition
    if (this.transT > 0) {
      const q = this.transT / 0.35;
      ctx.globalAlpha = q * 0.6;
      ctx.strokeStyle = '#b06bff';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(VIEW_W / 2, VIEW_H / 2, 60 + (1 - q) * 400 + i * 40, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  // central holographic core + selected hero -------------------------------
  drawCore(ctx, G) {
    const s = Save.data;
    const hero = heroById(s.heroSelected);
    const cx = VIEW_W / 2, cy = 150;
    // rotating rings
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.t * (0.4 + i * 0.25) * (i % 2 ? -1 : 1));
      ctx.strokeStyle = i === 1 ? '#4dd8ff' : '#7b5cff';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 62 + i * 10, 20 + i * 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    const core = SPR['lobby_core'];
    if (core) drawSprite(ctx, core, cx, cy - 6, { scale: 0.9 + Math.sin(this.t * 2) * 0.04 });
    const eq = skinById(s.cosmeticsEquipped[hero.id]);
    const base = eq && eq.hero === hero.id ? 'skin_' + eq.id : 'hero_' + hero.id;
    const big = SPR[base + '_big'] || SPR[base];
    if (big) drawSprite(ctx, big, cx, cy - 6, { scale: 56 / big.height });
    drawText(ctx, eq ? eq.name : hero.name, cx, cy + 42, { align: 'center', scale: 2, color: eq ? RARITY_SHOP[eq.rarity].color : hero.color, shadow: true });
    drawText(ctx, hero.role, cx, cy + 60, { align: 'center', color: '#9a93c8', shadow: true });
  }

  // hero emblems in orbit ---------------------------------------------------
  drawHeroesOrbit(ctx, G) {
    const s = Save.data;
    const cx = VIEW_W / 2, cy = 150;
    HEROES.forEach((h, i) => {
      const a = -Math.PI / 2 + (i - 2.5) * 0.52;
      const x = cx + Math.cos(a) * 150;
      const y = cy + Math.sin(a) * 92 + 6;
      const unlocked = s.heroesUnlocked[h.id];
      const sel = s.heroSelected === h.id;
      const hov = UI.hit(x - 17, y - 17, 34, 34);
      if (hov) UI.hoverId = 'h' + h.id;
      // slot
      ctx.fillStyle = sel ? '#241b52' : '#120e2acc';
      ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = sel ? h.color : hov ? '#7b5cff' : '#2a2450';
      ctx.lineWidth = sel ? 2 : 1;
      ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
      const em = SPR['hero_' + h.id];
      if (em) drawSprite(ctx, em, x, y, { alpha: unlocked ? 1 : 0.3 });
      if (!unlocked) {
        ctx.fillStyle = '#8a84a8';
        ctx.fillRect(x - 3, y - 6, 6, 5);
        ctx.fillStyle = '#0d0a1e';
        ctx.fillRect(x - 1, y - 5, 2, 3);
        drawText(ctx, String(HERO_UNLOCK_COST[h.id]), x, y + 8, { align: 'center', color: '#4dd8ff' });
      }
      if (hov && UI.anyClick) {
        if (unlocked) { s.heroSelected = h.id; Save.save(); Audio.sfx('ui'); }
        else if (s.fragments >= HERO_UNLOCK_COST[h.id]) {
          s.fragments -= HERO_UNLOCK_COST[h.id];
          s.heroesUnlocked[h.id] = true; s.heroSelected = h.id;
          Save.save(); Audio.sfx('buy');
        } else Audio.sfx('deny');
      }
    });
  }

  // side portals + worlds ---------------------------------------------------
  drawPortals(ctx, G) {
    const p1 = SPR['lobby_portal_shop'], p2 = SPR['lobby_portal_cos'], p3 = SPR['lobby_portal_worlds'];
    const pulse = Math.sin(this.t * 3) * 2;
    const hovL = UI.hit(38, 120, 64, 84);
    if (p1) drawSprite(ctx, p1, 70, 158 + pulse * 0.4, { scale: 1 });
    drawText(ctx, 'LOJA NEXUS', 70, 196, { align: 'center', color: hovL ? '#ffffff' : '#d8b64c', shadow: true });
    if (hovL) { UI.hoverId = 'pshop'; if (UI.anyClick) this.open('nexus'); }
    const hovR = UI.hit(538, 120, 64, 84);
    if (p2) drawSprite(ctx, p2, 570, 158 - pulse * 0.4, { scale: 1 });
    drawText(ctx, 'COSMÉTICA', 570, 196, { align: 'center', color: hovR ? '#ffffff' : '#ff5df2', shadow: true });
    if (hovR) { UI.hoverId = 'pcos'; if (UI.anyClick) this.open('cos'); }
    const hovW = UI.hit(278, 30, 84, 54);
    if (p3) drawSprite(ctx, p3, 320, 54, { scale: 0.8 });
    drawText(ctx, 'MUNDOS E INCURSÕES', 320, 88, { align: 'center', color: hovW ? '#ffffff' : '#4dd8ff', shadow: true });
    if (hovW) { UI.hoverId = 'pworlds'; if (UI.anyClick) this.open('worlds'); }
  }

  // main play pad ------------------------------------------------------------
  drawPlayPad(ctx, G) {
    const s = Save.data;
    const x = VIEW_W / 2 - 90, y = 300, w = 180, h = 36;
    const hov = UI.hit(x, y, w, h);
    if (hov) UI.hoverId = 'play';
    const pul = 1 + Math.sin(this.t * 4) * 0.02;
    ctx.save();
    ctx.translate(VIEW_W / 2, y + h / 2);
    ctx.scale(pul, pul);
    ctx.translate(-VIEW_W / 2, -(y + h / 2));
    ctx.fillStyle = '#000000aa'; ctx.fillRect(x + 2, y + 3, w, h);
    ctx.fillStyle = hov ? '#1d3a24' : '#12281a';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#4dff88';
    ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff33'; ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    if (SPR.lobby_nav_play) drawSprite(ctx, SPR.lobby_nav_play, x + 18, y + h / 2, { scale: 1.3 });
    drawText(ctx, 'JOGAR', VIEW_W / 2 + 8, y + 10, { align: 'center', scale: 2, color: '#4dff88', shadow: true });
    ctx.restore();
    if (hov && UI.anyClick) {
      const sr = (s.dev && s.dev.startRound > 1) ? s.dev.startRound : undefined;
      Audio.sfx('ui');
      G.startGame({ mode: 'run', heroId: s.heroSelected, startRound: sr });
    }
  }

  // bottom holo chips ---------------------------------------------------------
  drawChips(ctx, G) {
    if (this.holo(ctx, 'mis', 26, 336, 'lobby_nav_mis', 'MISSÕES', '#4dff88')) this.open('missions');
    if (this.holo(ctx, 'dev', 78, 336, 'lobby_nav_dev', 'DEV', '#ff8c3b')) this.open('dev');
  }

  // clickable consoles on the hub art: hologram shops ----------------------
  drawComputers(ctx, G) {
    const hovL = UI.hit(28, 138, 110, 80);
    const hovR = UI.hit(512, 156, 96, 64);
    if (hovL) UI.hoverId = 'pcL';
    if (hovR) UI.hoverId = 'pcR';
    this._holoShop(ctx, 83, 138, 'LOJA NEXUS', '#4dd8ff', hovL);
    this._holoShop(ctx, 560, 156, 'LOJA COSMÉTICA', '#ff5df2', hovR);
    if (hovL && UI.anyClick) this.open('nexus');
    if (hovR && UI.anyClick) this.open('cos');
  }

  _holoShop(ctx, x, yTop, label, color, hov) {
    const flick = 0.75 + Math.sin(this.t * 13 + x) * 0.12 + (Math.sin(this.t * 47) > 0.96 ? -0.3 : 0);
    const a = hov ? 1 : 0.55;
    ctx.save();
    ctx.globalAlpha = a * flick;
    // light cone from the console
    ctx.fillStyle = color + '22';
    ctx.beginPath();
    ctx.moveTo(x - 16, yTop + 26);
    ctx.lineTo(x + 16, yTop + 26);
    ctx.lineTo(x + 30, yTop - 14);
    ctx.lineTo(x - 30, yTop - 14);
    ctx.closePath();
    ctx.fill();
    // holo plate
    const w = 96, h = 18;
    ctx.fillStyle = '#0d0a1ecc';
    ctx.fillRect(x - w / 2, yTop - 14 - h, w, h);
    ctx.strokeStyle = color;
    ctx.strokeRect(x - w / 2 + 0.5, yTop - 14 - h + 0.5, w - 1, h - 1);
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, yTop - 14 - h, w, 1);
    // scanlines
    ctx.fillStyle = color + '33';
    for (let yy = yTop - 14 - h + 3; yy < yTop - 14 - 2; yy += 3) ctx.fillRect(x - w / 2 + 2, yy, w - 4, 1);
    drawText(ctx, label, x, yTop - 14 - h + 5, { align: 'center', scale: 1, color: hov ? '#ffffff' : color, shadow: true });
    ctx.restore();
  }

  // ============================================================ overlays ====
  drawOverlay(ctx, G) {
    ctx.fillStyle = 'rgba(5,4,10,0.82)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (this.overlay === 'arch') {
      if (SPR.ui_menubg) { ctx.globalAlpha = 0.4; ctx.drawImage(SPR.ui_menubg, 0, 0, VIEW_W, VIEW_H); ctx.globalAlpha = 1; }
      this.arch.draw(ctx, 40, 34, 560, 292);
      drawText(ctx, 'NEXUS ARCHIVES', VIEW_W / 2, 12, { align: 'center', scale: 2, color: '#4dd8ff', shadow: true, style: 'hero' });
      drawText(ctx, 'ENCICLOPÉDIA DO NEXO — DESCUBRA JOGANDO', VIEW_W / 2, 332, { align: 'center', scale: 1, color: '#7a74a0' });
      if (UI.button('closeO', 566, 8, 54, 18, 'FECHAR', { color: '#ff4d4d', icon: 'ic_quit' })) { this.overlay = null; Audio.sfx('uiBack'); }
      return;
    }
    const T = { nexus: 'NEXUS CORE', cos: 'COSMÉTICA', missions: 'MISSÕES', dev: 'CONSOLE DEV', cfg: 'CONFIGURAÇÕES' };
    const C = { nexus: '#d8b64c', cos: '#ff5df2', missions: '#4dff88', dev: '#ff8c3b', cfg: '#8a84a8' };
    this.frame(ctx, 40, 30, 560, 300, C[this.overlay]);
    drawText(ctx, T[this.overlay], 52, 38, { scale: 2, color: C[this.overlay], shadow: true, style: 'hero' });
    if (UI.button('closeO', 540, 38, 48, 16, 'X', { color: '#ff4d4d' })) { this.overlay = null; Audio.sfx('uiBack'); }
    if (this.overlay === 'nexus') this.drawNexus(ctx, G);
    else if (this.overlay === 'cos') this.drawCosmetics(ctx, G);
    else if (this.overlay === 'missions') this.drawMissions(ctx, G);
    else if (this.overlay === 'dev') this.drawDev(ctx, G);
    else if (this.overlay === 'cfg') this.drawConfig(ctx, G);
  }

  drawNexus(ctx, G) {
    const s = Save.data;
    HEROES.forEach((h, hi) => {
      const nodes = HERO_NODES.filter((n) => n.hero === h.id);
      const x = 52 + (hi % 3) * 182, y = 62 + ((hi / 3) | 0) * 132;
      ctx.fillStyle = '#120e2a';
      ctx.fillRect(x, y, 174, 124);
      ctx.strokeStyle = '#2a2450';
      ctx.strokeRect(x + 0.5, y + 0.5, 173, 123);
      const em = SPR['hero_' + h.id];
      if (em) drawSprite(ctx, em, x + 16, y + 14, { scale: 0.8 });
      drawText(ctx, h.name.split(' ')[0], x + 32, y + 6, { color: h.color, shadow: true });
      nodes.forEach((n, ni) => {
        const ny = y + 28 + ni * 46;
        const rank = s.nexusNodes[n.id] || 0;
        const maxed = rank >= n.max;
        const cost = maxed ? 0 : nodeCost(n, rank);
        const hov = UI.hit(x + 6, ny, 162, 42);
        if (hov) UI.hoverId = 'n' + n.id;
        ctx.fillStyle = hov ? '#241b52' : '#0d0a1e';
        ctx.fillRect(x + 6, ny, 162, 42);
        ctx.strokeStyle = maxed ? '#ffd94a' : rank > 0 ? '#b06bff' : '#2a2450';
        ctx.strokeRect(x + 6.5, ny + 0.5, 161, 41);
        drawText(ctx, n.name, x + 12, ny + 4, { color: '#ffffff' });
        for (let i = 0; i < n.max; i++) {
          ctx.fillStyle = i < rank ? '#b06bff' : '#2a2450';
          ctx.fillRect(x + 12 + i * 8, ny + 15, 6, 6);
        }
        drawText(ctx, maxed ? 'MÁX' : cost + ' FR', x + 162, ny + 4, { align: 'right', color: maxed ? '#ffd94a' : s.fragments >= cost ? '#9feaff' : '#9a93c8' });
        this.wrap(ctx, n.desc, x + 12, ny + 26, 150, '#9a93c8', 8);
        if (hov && UI.anyClick && !maxed) {
          if (Save.spendFragments(cost)) { s.nexusNodes[n.id] = rank + 1; Audio.sfx('buy'); }
          else Audio.sfx('deny');
        }
      });
    });
  }

  drawCosmetics(ctx, G) {
    const s = Save.data;
    SKINS.forEach((sk, i) => {
      const x = 52, y = 62 + i * 46;
      const sel = this.skinSel === sk.id;
      const owned = s.cosmeticsOwned[sk.id];
      const equipped = s.cosmeticsEquipped[sk.hero] === sk.id;
      const hov = UI.hit(x, y, 190, 42);
      if (hov) UI.hoverId = 'sk' + sk.id;
      ctx.fillStyle = hov || sel ? '#241b52' : '#120e2a';
      ctx.fillRect(x, y, 190, 42);
      ctx.strokeStyle = equipped ? '#4dff88' : sel ? RARITY_SHOP[sk.rarity].color : '#2a2450';
      ctx.strokeRect(x + 0.5, y + 0.5, 189, 41);
      const em = SPR['skin_' + sk.id];
      if (em) drawSprite(ctx, em, x + 20, y + 21, { scale: 1 });
      drawText(ctx, sk.name, x + 40, y + 6, { color: '#ffffff' });
      drawText(ctx, heroById(sk.hero).name.split(' ')[0] + ' · ' + RARITY_SHOP[sk.rarity].name, x + 40, y + 18, { color: RARITY_SHOP[sk.rarity].color });
      drawText(ctx, owned ? (equipped ? 'EQUIPADO' : 'ADQUIRIDO') : sk.price + ' FR', x + 40, y + 30, { color: owned ? (equipped ? '#4dff88' : '#9feaff') : '#ffd94a' });
      if (hov && UI.anyClick) { this.skinSel = sk.id; Audio.sfx('ui'); }
    });
    // preview
    const sk = skinById(this.skinSel);
    const hero = heroById(sk.hero);
    this.frame(ctx, 252, 62, 336, 200, RARITY_SHOP[sk.rarity].color);
    const big = SPR['skin_' + sk.id + '_big'] || SPR['skin_' + sk.id];
    ctx.globalAlpha = 0.3 + Math.sin(this.t * 2) * 0.1;
    ctx.fillStyle = sk.fx.aura;
    ctx.beginPath(); ctx.ellipse(340, 190, 50, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    if (big) drawSprite(ctx, big, 340, 140, { scale: 84 / big.height });
    drawText(ctx, sk.name, 340, 200, { align: 'center', scale: 2, color: RARITY_SHOP[sk.rarity].color, shadow: true });
    drawText(ctx, hero.name, 340, 218, { align: 'center', color: '#9a93c8' });
    this.wrap(ctx, sk.desc, 264, 232, 312, '#dcd6f6', 9);
    const owned = s.cosmeticsOwned[sk.id];
    const equipped = s.cosmeticsEquipped[sk.hero] === sk.id;
    if (!owned) {
      if (UI.button('buy', 264, 276, 170, 20, `COMPRAR · ${sk.price} FR`, { color: '#4dff88' })) {
        if (Save.spendFragments(sk.price)) { s.cosmeticsOwned[sk.id] = true; s.cosmeticsEquipped[sk.hero] = sk.id; Audio.sfx('buy'); }
        else Audio.sfx('deny');
      }
    } else {
      if (UI.button('equip', 264, 276, 110, 20, equipped ? 'EQUIPADO' : 'EQUIPAR', { color: equipped ? '#8a84a8' : '#7b5cff' })) {
        if (!equipped) { s.cosmeticsEquipped[sk.hero] = sk.id; Audio.sfx('buy'); }
      }
      if (equipped && UI.button('std', 382, 276, 90, 20, 'PADRÃO')) {
        delete s.cosmeticsEquipped[sk.hero];
        Save.save(); Audio.sfx('uiBack');
      }
    }
    drawText(ctx, 'COSMÉTICO — SEM VANTAGEM', 576, 284, { align: 'right', color: '#7a74a0' });
  }

  drawMissions(ctx, G) {
    const s = Save.data;
    MISSIONS.forEach((m, i) => {
      const col = i % 2, row = (i / 2) | 0;
      const x = 56 + col * 276, y = 62 + row * 54;
      const [cur, max] = m.check(s);
      const done = cur >= max;
      const claimed = s.missionsClaimed[m.id];
      const hov = UI.hit(x, y, 264, 48);
      if (hov) UI.hoverId = 'm' + m.id;
      ctx.fillStyle = hov ? '#241b52' : '#120e2a';
      ctx.fillRect(x, y, 264, 48);
      ctx.strokeStyle = claimed ? '#3a3350' : done ? '#4dff88' : '#2a2450';
      ctx.strokeRect(x + 0.5, y + 0.5, 263, 47);
      drawText(ctx, m.name, x + 8, y + 5, { color: claimed ? '#8a84a8' : '#ffffff' });
      this.wrap(ctx, m.desc, x + 8, y + 17, 180, '#9a93c8', 8);
      ctx.fillStyle = '#1d1740'; ctx.fillRect(x + 8, y + 38, 180, 4);
      ctx.fillStyle = done ? '#4dff88' : '#4dd8ff';
      ctx.fillRect(x + 8, y + 38, Math.round(180 * clamp(cur / max, 0, 1)), 4);
      const rw = (m.reward.frag ? m.reward.frag + ' FR' : '') + (m.reward.cred ? ' + ' + m.reward.cred + ' CR' : '');
      if (done && !claimed) {
        if (UI.button('cl' + m.id, x + 196, y + 12, 60, 22, 'RESGATAR', { color: '#4dff88' })) {
          s.missionsClaimed[m.id] = true;
          if (m.reward.frag) s.fragments += m.reward.frag;
          if (m.reward.cred) s.credits += m.reward.cred;
          Save.save(); Audio.sfx('buy');
        }
      } else {
        drawText(ctx, claimed ? 'FEITO' : rw, x + 256, y + 16, { align: 'right', color: claimed ? '#7a74a0' : '#ffd94a' });
      }
    });
  }

  drawDev(ctx, G) {
    const s = Save.data;
    s.dev = s.dev || { god: false, infSpecial: false, speed2: false, startRound: 1 };
    const tog = (id, x, y, label, val) => {
      if (UI.button(id, x, y, 200, 20, label + ': ' + (val ? 'ON' : 'OFF'), { color: val ? '#4dff88' : '#8a84a8' })) {
        s.dev[id] = !s.dev[id]; Save.save(); Audio.sfx('ui');
      }
    };
    tog('god', 56, 66, 'MODO DEUS', s.dev.god);
    tog('infSpecial', 56, 92, 'ESPECIAL INFINITO', s.dev.infSpecial);
    tog('speed2', 56, 118, 'VELOCIDADE 1.6x', s.dev.speed2);
    if (UI.button('frag', 56, 154, 200, 20, '+10.000 FRAGMENTOS', { color: '#9feaff' })) { s.fragments += 10000; Save.save(); Audio.sfx('buy'); }
    if (UI.button('cred', 56, 180, 200, 20, '+1.000 CRÉDITOS', { color: '#ffe9a0' })) { s.credits += 1000; Save.save(); Audio.sfx('buy'); }
    if (UI.button('heroes', 56, 216, 200, 20, 'DESBLOQUEAR HERÓIS', { color: '#b06bff' })) {
      HEROES.forEach((h) => (s.heroesUnlocked[h.id] = true)); Save.save(); Audio.sfx('buy');
    }
    if (UI.button('skins', 56, 242, 200, 20, 'DESBLOQUEAR SKINS', { color: '#b06bff' })) {
      SKINS.forEach((k) => (s.cosmeticsOwned[k.id] = true)); Save.save(); Audio.sfx('buy');
    }
    if (UI.button('nexus', 56, 268, 200, 20, 'MAX NEXUS NODES', { color: '#b06bff' })) {
      HERO_NODES.forEach((n) => (s.nexusNodes[n.id] = n.max)); Save.save(); Audio.sfx('buy');
    }
    const sr = s.dev.startRound || 1;
    drawText(ctx, 'ROUND INICIAL', 300, 70, { color: '#9a93c8' });
    if (UI.button('sr-', 300, 86, 24, 20, '-')) { s.dev.startRound = Math.max(1, sr - 1); Save.save(); Audio.sfx('ui'); }
    ctx.fillStyle = '#1d1740'; ctx.fillRect(332, 90, 120, 12);
    ctx.fillStyle = '#4dff88'; ctx.fillRect(332, 90, Math.round(120 * sr / 12), 12);
    drawText(ctx, 'ROUND ' + sr, 392, 92, { align: 'center', color: '#ffffff', shadow: true });
    if (UI.button('sr+', 460, 86, 24, 20, '+')) { s.dev.startRound = Math.min(12, sr + 1); Save.save(); Audio.sfx('ui'); }
    this.wrap(ctx, 'Rounds de chefe: 3 Ultron · 6 Loki · 8 Hela · 10 Devorador · 12 Thanos. God/inf/2x valem na hora; round inicial vale na próxima partida.', 300, 120, 280, '#9a93c8', 9);
    if (UI.button('reset', 300, 268, 200, 22, 'APAGAR SAVE (2x)', { color: '#ff4d4d' })) {
      if (this._resetArm2) { Save.reset(); Audio.sfx('defeat'); this._resetArm2 = false; }
      else this._resetArm2 = true;
    }
    if (this._resetArm2) drawText(ctx, 'CLIQUE DE NOVO PARA CONFIRMAR', 400, 296, { align: 'center', color: '#ff4d4d' });
  }

  drawConfig(ctx, G) {
    const s = Save.data.settings;
    UI.panel(150, 36, 340, 288, { title: 'CONFIGURAÇÕES', icon: 'ic_gear' });
    const cx = 162, cw = 316;
    drawText(ctx, 'ÁUDIO', cx + 8, 66, { scale: 1, color: '#9a93c8' });
    UI.slider('mus', cx, 78, cw, 'MÚSICA', 'ic_music', s.music, (v) => { s.music = v; Save.save(); });
    UI.slider('sfx', cx, 98, cw, 'EFEITOS', 'ic_speaker', s.sfx, (v) => { s.sfx = v; Save.save(); });
    drawText(ctx, 'VÍDEO / COMBATE', cx + 8, 126, { scale: 1, color: '#9a93c8' });
    if (UI.toggle('t1', cx, 138, cw, 'VIBRAÇÃO DE TELA', 'ic_shake', s.screenshake)) { s.screenshake = !s.screenshake; Save.save(); }
    if (UI.toggle('t2', cx, 158, cw, 'NÚMEROS DE DANO', 'ic_dmg', s.dmgNumbers)) { s.dmgNumbers = !s.dmgNumbers; Save.save(); }
    if (UI.toggle('t3', cx, 178, cw, 'MIRA AUTOMÁTICA', 'ic_aim', s.autofire)) { s.autofire = !s.autofire; Save.save(); }
    if (UI.toggle('t4', cx, 198, cw, 'ESCALA INTEIRA', 'ic_pixel', s.integerScale)) { s.integerScale = !s.integerScale; Save.save(); G.resize && G.resize(); }
    if (UI.button('fs', cx + 8, 224, 148, 22, 'TELA CHEIA', { icon: 'ic_full' })) toggleFullscreen();
    if (UI.button('tut', cx + 164, 224, 148, 22, 'RETUTORIAL', { icon: 'ic_play' })) { Save.data.tutorialDone = false; Audio.sfx('ui'); }
    if (UI.button('reset2', cx + 8, 256, 148, 22, 'APAGAR SAVE', { icon: 'ic_quit', color: '#ff4d4d', textColor: this._resetArm ? '#ffffff' : '#ff8c8c' })) {
      if (this._resetArm) { Save.reset(); Audio.sfx('defeat'); this._resetArm = false; }
      else this._resetArm = true;
    }
    if (this._resetArm) drawText(ctx, 'CLIQUE DE NOVO PARA CONFIRMAR', cx + 236, 264, { align: 'center', color: '#ff4d4d' });
    drawText(ctx, 'AS MESMAS OPÇÕES VALEM NO MENU DE PAUSA', 320, 296, { align: 'center', scale: 1, color: '#5a5470' });
    Audio.setVolumes({ music: s.music, sfx: s.sfx, master: s.master });
    Save.save();
  }
}

