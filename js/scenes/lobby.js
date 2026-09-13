// ---------------------------------------------------------------------------
// MARVEL NEXUS — scenes/lobby.js
// The hero base lobby with 8 functional tabs. Pixel-art room, not a website.
// ---------------------------------------------------------------------------
import { Scene, UI } from './scene.js';
import { drawText, textWidth } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { Save, xpForLevel } from '../core/save.js';
import { VIEW_W, VIEW_H } from '../game/arena.js';
import { THEMES } from '../data/sprites.js';
import { HEROES, heroById } from '../data/heroes.js';
import { ENEMIES } from '../data/enemies.js';
import { BOSSES } from '../data/bosses.js';
import { RAIDS, raidUnlocked } from '../data/raids.js';
import { NEXUS_NODES, nodeCost } from '../data/nexuscore.js';
import { SHOP_ITEMS, CATEGORIES, RARITY_SHOP, itemById } from '../data/shop.js';
import { MISSIONS, HERO_UNLOCK_COST } from '../data/missions.js';
import { clamp, fmtTime, RNG } from '../core/util.js';

const TABS = ['JOGAR', 'HERÓIS', 'LOJA', 'NEXUS CORE', 'INCURSÕES', 'COLEÇÃO', 'MISSÕES', 'CONFIG'];

export class LobbyScene extends Scene {
  enter(G, params) {
    this.t = 0;
    this.tab = (params && params.tab) || 0;
    this.shopCat = 'traje';
    this.shopScroll = 0;
    this.selectedItem = null;
    this.search = '';
    this.searchFocus = false;
    this.heroView = Save.data.heroSelected;
    this.raidSel = 0;
    Audio.playTrack('lobby');
    this.rng = new RNG(42);
  }

  update(dt, G) {
    this.t += dt;
    const s = Save.data;
    // search capture
    if (this.searchFocus) {
      for (const k of Input.pressedKeys) {
        if (k === 'Escape') { this.searchFocus = false; continue; }
        if (k === 'Backspace') { this.search = this.search.slice(0, -1); continue; }
        if (k.startsWith('Key')) this.search = (this.search + k.slice(3)).slice(0, 14);
        if (k.startsWith('Digit')) this.search = (this.search + k.slice(5)).slice(0, 14);
        if (k === 'Space') this.search += ' ';
      }
    }
  }

  draw(ctx, G) {
    const s = Save.data;
    // ---- room background ----
    this.drawRoom(ctx);

    // ---- header ----
    ctx.fillStyle = '#0d0a1ecc';
    ctx.fillRect(0, 0, VIEW_W, 22);
    drawText(ctx, 'MARVEL', 6, 4, { scale: 1, color: '#e8e0ff' });
    drawText(ctx, 'NEXUS', 40, 4, { scale: 1, color: '#ff4d4d' });
    // account
    drawText(ctx, `NV ${s.accountLevel}`, 92, 7, { color: '#b06bff' });
    ctx.fillStyle = '#1d1740';
    ctx.fillRect(120, 8, 60, 4);
    ctx.fillStyle = '#b06bff';
    ctx.fillRect(120, 8, Math.round(60 * clamp(s.accountXp / xpForLevel(s.accountLevel + 1), 0, 1)), 4);
    drawSprite(ctx, SPR.fragment, 470, 12, { scale: 0.9 });
    drawText(ctx, String(s.fragments), 480, 7, { color: '#9feaff' });
    drawSprite(ctx, SPR.credit, 540, 12, { scale: 0.9 });
    drawText(ctx, String(s.credits), 550, 7, { color: '#ffe9a0' });

    // ---- tabs ----
    const tw = VIEW_W / TABS.length;
    TABS.forEach((t, i) => {
      if (UI.tab('tab' + i, i * tw, 22, tw, 16, t, this.tab === i)) this.tab = i;
    });

    ctx.fillStyle = '#0d0a1e99';
    ctx.fillRect(0, 38, VIEW_W, VIEW_H - 38);

    switch (this.tab) {
      case 0: this.drawPlay(ctx, G); break;
      case 1: this.drawHeroes(ctx, G); break;
      case 2: this.drawShop(ctx, G); break;
      case 3: this.drawNexus(ctx, G); break;
      case 4: this.drawRaids(ctx, G); break;
      case 5: this.drawCollection(ctx, G); break;
      case 6: this.drawMissions(ctx, G); break;
      case 7: this.drawConfig(ctx, G); break;
    }
  }

  drawRoom(ctx) {
    const themeId = (() => {
      const eq = Save.data.cosmeticsEquipped.tema;
      const it = eq ? itemById(eq) : null;
      return it ? it.fx.lobby : 'nexus';
    })();
    const theme = THEMES[themeId] || THEMES.nexus;
    // floor
    const f0 = SPR['floor_' + themeId + '_0'], f1 = SPR['floor_' + themeId + '_1'];
    for (let y = 60; y < VIEW_H; y += 16)
      for (let x = 0; x < VIEW_W; x += 16)
        ctx.drawImage(((x / 16 + y / 16) % 2 === 0) ? f0 : f1, x, y);
    // back wall
    ctx.fillStyle = theme.wall;
    ctx.fillRect(0, 38, VIEW_W, 26);
    ctx.fillStyle = theme.wallTop;
    ctx.fillRect(0, 62, VIEW_W, 2);
    // props
    ctx.drawImage(SPR['portal_' + themeId], 30, 42);
    ctx.drawImage(SPR['console_' + themeId], 560, 46);
    ctx.drawImage(SPR['console_' + themeId], 100, 46);
    ctx.drawImage(SPR['banner_' + themeId], 300, 40);
    ctx.drawImage(SPR['banner_' + themeId], 340, 40);
    // animated portal glow
    ctx.globalAlpha = 0.3 + Math.sin(this.t * 3) * 0.15;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(36, 48, 12, 16);
    ctx.globalAlpha = 1;
  }

  // ============================ JOGAR ======================================
  drawPlay(ctx, G) {
    const s = Save.data;
    const hero = heroById(s.heroSelected);
    // hero pedestal
    const spr = SPR['hero_' + hero.id + '_big'];
    if (spr) drawSprite(ctx, spr, 140, 190 + Math.round(Math.sin(this.t * 2) * 2), { scale: 1 });
    ctx.fillStyle = '#00000066';
    ctx.beginPath(); ctx.ellipse(140, 250, 40, 8, 0, 0, Math.PI * 2); ctx.fill();

    UI.panel(240, 60, 380, 200, { title: 'HERÓI SELECIONADO' });
    drawText(ctx, hero.name, 254, 84, { scale: 2, color: hero.color, shadow: true });
    drawText(ctx, hero.role, 254, 102, { color: '#9a93c8' });
    const wrap = (txt, x, y, w, color) => {
      let line = '', ly = y;
      for (const wd of txt.split(' ')) {
        if (textWidth(line + wd) > w) { drawText(ctx, line, x, ly, { color }); ly += 9; line = ''; }
        line += (line ? ' ' : '') + wd;
      }
      if (line) drawText(ctx, line, x, ly, { color });
      return ly + 9;
    };
    let y = wrap(hero.desc, 254, 118, 350, '#cfc8f2');
    y = wrap('ATAQUE: ' + hero.ability.name, 254, y + 4, 350, '#8a84a8');
    y = wrap('ESPECIAL: ' + hero.special.name, 254, y, 350, '#8a84a8');
    y = wrap('PASSIVA: ' + hero.passive.name, 254, y, 350, '#8a84a8');
    // stat bars
    const bar = (label, val, max, yy, col) => {
      drawText(ctx, label, 254, yy, { color: '#9a93c8' });
      ctx.fillStyle = '#1d1740'; ctx.fillRect(320, yy + 1, 120, 5);
      ctx.fillStyle = col; ctx.fillRect(320, yy + 1, Math.round(120 * clamp(val / max, 0, 1)), 5);
    };
    bar('VIDA', hero.hp, 140, y + 6, '#ff4d6b');
    bar('VELOCIDADE', hero.speed, 140, y + 16, '#4dd8ff');

    if (UI.button('start', 254, 222, 170, 30, 'INICIAR PARTIDA', { color: '#4dff88', accent: true })) {
      G.startGame({ mode: 'run', heroId: hero.id });
    }
    if (UI.button('raids', 434, 222, 170, 30, 'INCURSÕES', { color: '#b06bff' })) { this.tab = 4; }
    drawText(ctx, 'SOBREVIVA ÀS ONDAS E DERROTE O CHEFE FINAL', 254, 262, { color: '#5a5470' });

    // mission teaser
    const next = MISSIONS.find((m) => { const [c, mx] = m.check(s); return c < mx && !s.missionsClaimed[m.id]; });
    if (next) drawText(ctx, 'MISSÃO ATIVA: ' + next.name, 20, 344, { color: '#ffd94a' });
  }

  // ============================ HERÓIS =====================================
  drawHeroes(ctx, G) {
    const s = Save.data;
    UI.panel(8, 46, 400, 306, { title: 'ESQUADRÃO' });
    HEROES.forEach((h, i) => {
      const x = 20 + (i % 3) * 130, y = 70 + ((i / 3) | 0) * 140;
      const unlocked = s.heroesUnlocked[h.id];
      const sel = s.heroSelected === h.id;
      const hov = UI.hit(x, y, 120, 128);
      if (hov) UI.hoverId = 'h' + i;
      ctx.fillStyle = hov ? '#241b52' : '#171233';
      ctx.fillRect(x, y, 120, 128);
      ctx.strokeStyle = sel ? h.color : hov ? '#7b5cff' : '#3a3350';
      ctx.strokeRect(x + 0.5, y + 0.5, 119, 127);
      const spr = SPR['hero_' + h.id + '_big'];
      if (spr) drawSprite(ctx, spr, x + 60, y + 52, { alpha: unlocked ? 1 : 0.35 });
      drawText(ctx, h.name, x + 60, y + 100, { align: 'center', color: unlocked ? '#ffffff' : '#5a5470', shadow: true });
      drawText(ctx, h.role, x + 60, y + 112, { align: 'center', color: '#8a84a8' });
      if (!unlocked) {
        drawSprite(ctx, SPR.lock, x + 104, y + 10, { scale: 0.9 });
        drawText(ctx, String(HERO_UNLOCK_COST[h.id]), x + 60, y + 86, { align: 'center', color: '#4dd8ff' });
      }
      if (hov && UI.anyClick) {
        if (unlocked) { s.heroSelected = h.id; this.heroView = h.id; Save.save(); Audio.sfx('buy'); }
        else if (s.fragments >= HERO_UNLOCK_COST[h.id]) {
          s.fragments -= HERO_UNLOCK_COST[h.id];
          s.heroesUnlocked[h.id] = true;
          s.heroSelected = h.id;
          Save.save(); Audio.sfx('buy');
        } else Audio.sfx('deny');
      }
    });
    // side detail
    const h = heroById(this.heroView || s.heroSelected);
    UI.panel(416, 46, 216, 306, { title: 'DOSSIÊ' });
    const big = SPR['hero_' + h.id + '_big'];
    if (big) drawSprite(ctx, big, 524, 140);
    drawText(ctx, h.name, 524, 200, { align: 'center', scale: 1, color: h.color, shadow: true });
    let y = 220;
    const wrap = (txt, col) => {
      let line = '';
      for (const wd of txt.split(' ')) {
        if (textWidth(line + wd) > 190) { drawText(ctx, line, 426, y, { color: col }); y += 9; line = ''; }
        line += (line ? ' ' : '') + wd;
      }
      if (line) { drawText(ctx, line, 426, y, { color: col }); y += 9; }
    };
    wrap('ESP: ' + h.special.desc, '#9a93c8');
    y += 4;
    wrap('PASSIVA: ' + h.passive.desc, '#9a93c8');
  }

  // ============================ LOJA =======================================
  itemIcon(ctx, item, x, y) {
    // tiny procedural pixel glyph per category
    const c = RARITY_SHOP[item.rarity].color;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = c;
    const px = (a, b, w = 2, h = 2) => ctx.fillRect(a, b, w, h);
    switch (item.cat) {
      case 'traje': px(6, 2, 4, 2); px(4, 4, 8, 8); px(2, 4, 2, 5); px(12, 4, 2, 5); break;
      case 'mascara': px(4, 3, 8, 7); ctx.fillStyle = '#fff'; px(5, 5, 2, 2); px(9, 5, 2, 2); break;
      case 'ataque': px(7, 1, 2, 4); px(7, 11, 2, 4); px(1, 7, 4, 2); px(11, 7, 4, 2); px(6, 6, 4, 4); break;
      case 'habilidade': px(6, 2, 4, 4); px(4, 6, 8, 4); px(6, 10, 4, 3); break;
      case 'rastro': px(2, 10, 2, 2); px(5, 7, 2, 2); px(8, 4, 2, 2); px(11, 1, 2, 2); break;
      case 'entrada': px(3, 2, 2, 12); px(11, 2, 2, 12); px(6, 5, 4, 6); break;
      case 'vitoria': px(4, 2, 8, 6); px(6, 8, 4, 3); px(4, 11, 8, 2); break;
      case 'moldura': ctx.strokeStyle = c; ctx.strokeRect(2.5, 2.5, 11, 11); px(6, 6, 4, 4); break;
      case 'icone': px(4, 4, 8, 8); ctx.fillStyle = '#fff'; px(7, 7, 2, 2); break;
      case 'tema': px(2, 2, 5, 5); px(9, 2, 5, 5); px(2, 9, 5, 5); px(9, 9, 5, 5); break;
    }
    ctx.restore();
  }

  drawShop(ctx, G) {
    const s = Save.data;
    // header
    drawText(ctx, 'NEXUS STORE', 320, 46, { align: 'center', scale: 2, color: '#ffd94a', shadow: true });
    drawText(ctx, 'CATÁLOGO PERMANENTE', 320, 62, { align: 'center', color: '#5a5470' });
    // categories (left, 2 cols)
    CATEGORIES.forEach((c, i) => {
      const x = 8 + (i % 2) * 78, y = 76 + ((i / 2) | 0) * 24;
      if (UI.button('cat' + c.id, x, y, 74, 20, c.name, { scale: 1, color: this.shopCat === c.id ? '#ffd94a' : '#3a3350', silent: false, textColor: this.shopCat === c.id ? '#ffffff' : undefined })) {
        this.shopCat = c.id; this.shopScroll = 0; this.selectedItem = null;
      }
    });
    // search
    ctx.fillStyle = this.searchFocus ? '#241b52' : '#171233';
    ctx.fillRect(8, 200, 152, 16);
    ctx.strokeStyle = this.searchFocus ? '#ffd94a' : '#3a3350';
    ctx.strokeRect(8.5, 200.5, 151, 15);
    drawText(ctx, this.search ? this.search : 'PESQUISAR...', 14, 204, { color: this.search ? '#ffffff' : '#5a5470' });
    if (UI.hit(8, 200, 152, 16) && UI.anyClick) this.searchFocus = true;
    else if (UI.anyClick && !UI.hit(8, 200, 152, 16)) this.searchFocus = false;

    // item grid
    let items = SHOP_ITEMS.filter((i) => i.cat === this.shopCat);
    if (this.search) items = SHOP_ITEMS.filter((i) => i.name.includes(this.search.toUpperCase()) || i.cat.includes(this.search));
    UI.panel(168, 72, 290, 280, {});
    const cols = 4;
    const cell = 66;
    const gx = 178, gy = 82;
    const viewH = 260;
    UI.setWheelZone((m) => m.x > 168 && m.x < 458);
    const totalH = Math.ceil(items.length / cols) * (cell + 6);
    const off = UI.scrollbar(450, 82, viewH, viewH, totalH, this.shopScroll, (v) => (this.shopScroll = v));
    items.forEach((item, i) => {
      const x = gx + (i % cols) * (cell + 4);
      const y = gy + ((i / cols) | 0) * (cell + 6) - off;
      if (y < 76 || y > 340) return;
      const owned = s.cosmeticsOwned[item.id] || item.price === 0;
      const equipped = Object.values(s.cosmeticsEquipped).includes(item.id);
      const fav = s.favorites[item.id];
      const sel = this.selectedItem === item.id;
      const hov = UI.hit(x, y, cell, cell);
      if (hov) UI.hoverId = 'it' + item.id;
      ctx.fillStyle = hov || sel ? '#241b52' : '#120e2a';
      ctx.fillRect(x, y, cell, cell);
      ctx.strokeStyle = sel ? '#ffffff' : RARITY_SHOP[item.rarity].color;
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
      this.itemIcon(ctx, item, x + cell / 2 - 8, y + 8);
      if (fav) { ctx.fillStyle = '#ff4d6b'; ctx.fillRect(x + 4, y + 4, 3, 3); }
      if (equipped) drawSprite(ctx, SPR.check, x + cell - 10, y + 8, { scale: 0.8 });
      drawText(ctx, item.price === 0 ? '—' : String(item.price), x + cell / 2, y + cell - 12, { align: 'center', color: item.currency === 'cred' ? '#ffe9a0' : '#9feaff' });
      if (!owned) drawSprite(ctx, SPR.lock, x + cell - 12, y + cell - 14, { scale: 0.7 });
      if (hov && UI.anyClick) { this.selectedItem = item.id; Audio.sfx('ui'); }
    });

    // preview panel
    UI.panel(466, 72, 166, 280, { title: 'PRÉ-VISUALIZAÇÃO' });
    const item = this.selectedItem ? itemById(this.selectedItem) : null;
    const hero = heroById(s.heroSelected);
    // stage
    ctx.fillStyle = '#0d0a1e';
    ctx.fillRect(476, 92, 146, 120);
    ctx.strokeStyle = '#3a3350';
    ctx.strokeRect(476.5, 92.5, 145, 119);
    // themed backdrop
    const themeId = 'nexus';
    ctx.drawImage(SPR['floor_' + themeId + '_0'], 476, 180);
    ctx.drawImage(SPR['floor_' + themeId + '_1'], 492, 180);
    ctx.drawImage(SPR['floor_' + themeId + '_0'], 508, 180);
    const big = SPR['hero_' + hero.id + '_big'];
    if (big) {
      const tint = item && item.fx.tint ? item.fx.tint : (s.cosmeticsEquipped.traje ? (itemById(s.cosmeticsEquipped.traje) || {}).fx?.tint : null);
      drawSprite(ctx, big, 549, 160, { tint: tint || undefined });
      // bullet preview color
      const bc = item && item.fx.bullet ? item.fx.bullet : null;
      ctx.fillStyle = bc || '#4dd8ff';
      ctx.fillRect(500, 130, 4, 4); ctx.fillRect(590, 130, 4, 4);
      ctx.fillRect(500 + ((this.t * 60) % 40), 130, 3, 3);
    }
    if (item) {
      drawText(ctx, item.name, 482, 218, { color: RARITY_SHOP[item.rarity].color });
      drawText(ctx, RARITY_SHOP[item.rarity].name, 626, 218, { align: 'right', color: RARITY_SHOP[item.rarity].color });
      let y = 234;
      let line = '';
      for (const wd of item.desc.split(' ')) {
        if (textWidth(line + wd) > 146) { drawText(ctx, line, 482, y, { color: '#9a93c8' }); y += 9; line = ''; }
        line += (line ? ' ' : '') + wd;
      }
      if (line) drawText(ctx, line, 482, y, { color: '#9a93c8' });
      const owned = s.cosmeticsOwned[item.id] || item.price === 0;
      const equipped = Object.values(s.cosmeticsEquipped).includes(item.id);
      if (!owned) {
        if (UI.button('buy', 476, 300, 146, 22, `COMPRAR ${item.price} ${item.currency === 'cred' ? 'CR' : 'FR'}`, { color: '#4dff88' })) {
          const ok = item.currency === 'cred' ? Save.spendCredits(item.price) : Save.spendFragments(item.price);
          if (ok) { s.cosmeticsOwned[item.id] = true; Audio.sfx('buy'); }
          else Audio.sfx('deny');
        }
      } else {
        if (UI.button('equip', 476, 300, 96, 22, equipped ? 'EQUIPADO' : 'EQUIPAR', { color: equipped ? '#5a5470' : '#7b5cff' })) {
          if (!equipped) { s.cosmeticsEquipped[item.cat] = item.id; Audio.sfx('buy'); }
        }
        if (UI.button('fav', 578, 300, 44, 22, s.favorites[item.id] ? '★' : '☆', { color: '#ff4d6b' })) {
          s.favorites[item.id] = !s.favorites[item.id]; Audio.sfx('ui');
        }
      }
      drawText(ctx, 'COSMÉTICO — SEM VANTAGEM DE COMBATE', 482, 332, { color: '#3a3350' });
    } else {
      drawText(ctx, 'SELECIONE UM ITEM', 549, 260, { align: 'center', color: '#5a5470' });
    }
  }

  // ============================ NEXUS CORE =================================
  drawNexus(ctx, G) {
    const s = Save.data;
    drawText(ctx, 'NEXUS CORE', 320, 46, { align: 'center', scale: 2, color: '#b06bff', shadow: true });
    drawText(ctx, 'MELHORIAS PERMANENTES — FRAGMENTOS DO NEXUS', 320, 62, { align: 'center', color: '#5a5470' });
    // connection lines
    ctx.strokeStyle = '#2a2450';
    NEXUS_NODES.forEach((n) => {
      const x = 90 + n.col * 150, y = 110 + n.row * 80;
      NEXUS_NODES.forEach((m) => {
        if (m.row === n.row + 1 && Math.abs(m.col - n.col) <= 1) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(90 + m.col * 150, 110 + m.row * 80); ctx.stroke();
        }
      });
    });
    NEXUS_NODES.forEach((n) => {
      const x = 90 + n.col * 150, y = 110 + n.row * 80;
      const rank = s.nexusNodes[n.id] || 0;
      const maxed = rank >= n.max;
      const cost = maxed ? 0 : nodeCost(n, rank);
      const hov = UI.hit(x - 34, y - 22, 68, 44);
      if (hov) UI.hoverId = 'n' + n.id;
      ctx.fillStyle = hov ? '#241b52' : '#171233';
      ctx.fillRect(x - 34, y - 22, 68, 44);
      ctx.strokeStyle = maxed ? '#ffd94a' : rank > 0 ? '#b06bff' : '#3a3350';
      ctx.strokeRect(x - 33.5, y - 21.5, 67, 43);
      drawText(ctx, n.name, x, y - 14, { align: 'center', color: '#ffffff', shadow: true });
      // rank pips
      for (let i = 0; i < n.max; i++) {
        ctx.fillStyle = i < rank ? '#b06bff' : '#2a2450';
        ctx.fillRect(x - (n.max * 5) / 2 + i * 6, y + 2, 4, 4);
      }
      drawText(ctx, maxed ? 'MÁX' : cost + ' FR', x, y + 10, { align: 'center', color: maxed ? '#ffd94a' : s.fragments >= cost ? '#9feaff' : '#5a5470' });
      if (hov) {
        UI.panel(200, 300, 240, 44, {});
        let yy = 308;
        let line = '';
        for (const wd of n.desc.split(' ')) {
          if (textWidth(line + wd) > 220) { drawText(ctx, line, 208, yy, { color: '#cfc8f2' }); yy += 9; line = ''; }
          line += (line ? ' ' : '') + wd;
        }
        if (line) drawText(ctx, line, 208, yy, { color: '#cfc8f2' });
      }
      if (hov && UI.anyClick && !maxed) {
        if (Save.spendFragments(cost)) { s.nexusNodes[n.id] = rank + 1; Audio.sfx('buy'); }
        else Audio.sfx('deny');
      }
    });
  }

  // ============================ INCURSÕES ==================================
  drawRaids(ctx, G) {
    const s = Save.data;
    drawText(ctx, 'INCURSÕES', 320, 46, { align: 'center', scale: 2, color: '#ff4d4d', shadow: true });
    RAIDS.forEach((r, i) => {
      const y = 70 + i * 56;
      const unlocked = raidUnlocked(r, s);
      const cleared = s.raidsCleared[r.id];
      const sel = this.raidSel === i;
      const hov = UI.hit(20, y, 600, 50);
      if (hov) UI.hoverId = 'r' + i;
      ctx.fillStyle = hov || sel ? '#241b52' : '#171233';
      ctx.fillRect(20, y, 600, 50);
      ctx.strokeStyle = sel ? '#ff4d4d' : '#3a3350';
      ctx.strokeRect(20.5, y + 0.5, 599, 49);
      const bs = SPR[BOSSES[r.boss].sprite];
      if (bs) drawSprite(ctx, bs, 52, y + 26, { scale: 0.8, alpha: unlocked ? 1 : 0.3 });
      drawText(ctx, r.name, 86, y + 8, { color: unlocked ? '#ffffff' : '#5a5470', shadow: true });
      drawText(ctx, r.desc.slice(0, 78), 86, y + 22, { color: '#8a84a8' });
      // stars
      for (let st = 0; st < 5; st++) {
        drawSprite(ctx, SPR.star, 86 + st * 10, y + 40, { scale: 0.7, alpha: st < r.stars ? 1 : 0.2 });
      }
      if (cleared) {
        drawText(ctx, 'CONCLUÍDA x' + cleared.wins + ' · MELHOR ' + fmtTime(cleared.bestTime), 400, y + 34, { color: '#4dff88' });
      }
      if (!unlocked) {
        drawSprite(ctx, SPR.lock, 590, y + 24, { scale: 1 });
        drawText(ctx, 'NV ' + r.unlockLevel, 570, y + 20, { align: 'right', color: '#5a5470' });
      } else if (UI.button('go' + i, 500, y + 12, 100, 26, 'INICIAR', { color: '#ff4d4d' })) {
        G.startGame({ mode: 'raid', raidId: r.id, heroId: s.heroSelected });
      }
      if (hov && UI.anyClick) this.raidSel = i;
    });
  }

  // ============================ COLEÇÃO ====================================
  drawCollection(ctx, G) {
    const s = Save.data;
    UI.panel(8, 46, 310, 306, { title: 'AMEAÇAS CATALOGADAS' });
    const types = Object.values(ENEMIES);
    types.forEach((e, i) => {
      const x = 22 + (i % 3) * 100, y = 72 + ((i / 3) | 0) * 66;
      const disc = s.discovered.enemies[e.id];
      const spr = SPR[e.sprite];
      if (spr) drawSprite(ctx, spr, x + 14, y + 16, { alpha: disc ? 1 : 0.15, tint: disc ? undefined : '#000000' });
      drawText(ctx, disc ? e.name : '???', x + 30, y + 10, { color: disc ? '#cfc8f2' : '#3a3350' });
      if (disc) drawText(ctx, e.desc.slice(0, 26), x + 30, y + 22, { color: '#5a5470' });
    });
    UI.panel(326, 46, 306, 180, { title: 'CHEFES' });
    Object.values(BOSSES).forEach((b, i) => {
      const x = 340 + (i % 3) * 100, y = 74 + ((i / 3) | 0) * 78;
      const disc = s.discovered.bosses[b.id];
      const kills = s.bossesDefeated[b.id] || 0;
      const spr = SPR[b.sprite];
      if (spr) drawSprite(ctx, spr, x + 20, y + 26, { scale: 0.7, alpha: disc ? 1 : 0.15 });
      drawText(ctx, disc ? b.name : '???', x + 44, y + 8, { color: disc ? '#ff8c8c' : '#3a3350' });
      if (disc) drawText(ctx, 'ABATIDOS: ' + kills, x + 44, y + 46, { color: '#8a84a8' });
    });
    UI.panel(326, 234, 306, 118, { title: 'COSMÉTICOS' });
    const owned = Object.keys(s.cosmeticsOwned).length;
    drawText(ctx, `ITENS ADQUIRIDOS: ${owned}/${SHOP_ITEMS.length}`, 340, 258, { color: '#cfc8f2' });
    drawText(ctx, `FRAGMENTOS: ${s.fragments}`, 340, 274, { color: '#9feaff' });
    drawText(ctx, `CRÉDITOS: ${s.credits}`, 340, 290, { color: '#ffe9a0' });
    drawText(ctx, `PARTIDAS: ${s.stats.runs} · VITÓRIAS: ${s.stats.wins}`, 340, 306, { color: '#8a84a8' });
    drawText(ctx, `ABATES: ${s.stats.kills} · DESVIOS: ${s.stats.bulletsDodged}`, 340, 322, { color: '#8a84a8' });
  }

  // ============================ MISSÕES ====================================
  drawMissions(ctx, G) {
    const s = Save.data;
    drawText(ctx, 'MISSÕES', 320, 46, { align: 'center', scale: 2, color: '#ffd94a', shadow: true });
    MISSIONS.forEach((m, i) => {
      const y = 68 + i * 28;
      const [cur, max] = m.check(s);
      const done = cur >= max;
      const claimed = s.missionsClaimed[m.id];
      ctx.fillStyle = claimed ? '#120e2a' : '#171233';
      ctx.fillRect(60, y, 520, 24);
      ctx.strokeStyle = done && !claimed ? '#4dff88' : '#3a3350';
      ctx.strokeRect(60.5, y + 0.5, 519, 23);
      drawText(ctx, m.name, 68, y + 4, { color: claimed ? '#5a5470' : '#ffffff' });
      drawText(ctx, m.desc, 68, y + 13, { color: '#8a84a8' });
      ctx.fillStyle = '#1d1740'; ctx.fillRect(400, y + 9, 100, 5);
      ctx.fillStyle = done ? '#4dff88' : '#ffd94a';
      ctx.fillRect(400, y + 9, Math.round(100 * clamp(cur / max, 0, 1)), 5);
      drawText(ctx, `${Math.min(cur, max)}/${max}`, 508, y + 7, { color: '#cfc8f2' });
      if (done && !claimed && UI.button('cl' + m.id, 540, y + 3, 34, 18, 'OK', { color: '#4dff88' })) {
        s.missionsClaimed[m.id] = true;
        if (m.reward.frag) s.fragments += m.reward.frag;
        if (m.reward.cred) s.credits += m.reward.cred;
        Save.save(); Audio.sfx('buy');
      }
      if (claimed) drawSprite(ctx, SPR.check, 552, y + 8, { scale: 0.9 });
    });
  }

  // ============================ CONFIG =====================================
  drawConfig(ctx, G) {
    const s = Save.data;
    UI.panel(180, 60, 280, 260, { title: 'CONFIGURAÇÕES' });
    const row = (label, y) => drawText(ctx, label, 196, y, { color: '#9a93c8' });
    row('VOLUME MÚSICA', 92);
    if (UI.button('cm-', 320, 88, 20, 14, '-')) s.music = clamp(s.music - 0.1, 0, 1);
    ctx.fillStyle = '#1d1740'; ctx.fillRect(348, 91, 60, 6);
    ctx.fillStyle = '#b06bff'; ctx.fillRect(348, 91, Math.round(60 * s.music), 6);
    if (UI.button('cm+', 416, 88, 20, 14, '+')) s.music = clamp(s.music + 0.1, 0, 1);
    row('VOLUME SFX', 114);
    if (UI.button('cs-', 320, 110, 20, 14, '-')) s.sfx = clamp(s.sfx - 0.1, 0, 1);
    ctx.fillStyle = '#1d1740'; ctx.fillRect(348, 113, 60, 6);
    ctx.fillStyle = '#4dd8ff'; ctx.fillRect(348, 113, Math.round(60 * s.sfx), 6);
    if (UI.button('cs+', 416, 110, 20, 14, '+')) s.sfx = clamp(s.sfx + 0.1, 0, 1);
    if (UI.button('t1', 196, 136, 240, 18, 'VIBRAÇÃO DE TELA: ' + (s.screenshake ? 'ON' : 'OFF'))) s.screenshake = !s.screenshake;
    if (UI.button('t2', 196, 160, 240, 18, 'NÚMEROS DE DANO: ' + (s.dmgNumbers ? 'ON' : 'OFF'))) s.dmgNumbers = !s.dmgNumbers;
    if (UI.button('t3', 196, 184, 240, 18, 'MIRA AUTOMÁTICA: ' + (s.autofire ? 'ON' : 'OFF'))) s.autofire = !s.autofire;
    if (UI.button('tut', 196, 208, 240, 18, 'REEXIBIR TUTORIAL')) s.tutorialDone = false;
    if (UI.button('reset', 196, 244, 240, 20, 'APAGAR SAVE (CLIQUE 2x)', { color: '#ff4d4d' })) {
      if (this._resetArm) { Save.reset(); Audio.sfx('defeat'); this._resetArm = false; }
      else { this._resetArm = true; }
    }
    if (this._resetArm) drawText(ctx, 'CLIQUE NOVAMENTE PARA CONFIRMAR', 320, 272, { align: 'center', color: '#ff4d4d' });
    Audio.setVolumes({ music: s.music, sfx: s.sfx, master: s.master });
    Save.save();
    drawText(ctx, 'MARVEL NEXUS v1.0 — FAN GAME PIXEL ART', 320, 330, { align: 'center', color: '#3a3350' });
    drawText(ctx, 'SEM AFILIAÇÃO COM A MARVEL. SEM FINS LUCRATIVOS.', 320, 342, { align: 'center', color: '#3a3350' });
  }
}
