// ---------------------------------------------------------------------------
// MARVEL NEXUS — game/archives.js
// NEXUS ARCHIVES: the unlockable comic-book encyclopedia. One object replaces
// Worlds + Incursions + Info. Comic panels, rough pixel pages, stamps,
// doodles, big inked illustrations, page-flip + open/close (with back cover)
// animations and discovery unlocks.
// ---------------------------------------------------------------------------
import { drawText, textWidth } from '../core/font.js';
import { SPR, drawSprite } from '../core/pixel.js';
import { UI } from '../scenes/scene.js';
import { Audio } from '../core/audio.js';
import { Save } from '../core/save.js';
import { ENEMIES } from '../data/enemies.js';
import { bossById } from '../data/bosses.js';
import { WORLD_LABEL } from '../data/campaign.js';
import { clamp } from '../core/util.js';

const CHAPTERS = [
  { id: 'worlds', icon: 'arch_i_world', label: 'MUNDOS', color: '#4dd8ff' },
  { id: 'bosses', icon: 'arch_i_boss', label: 'GUARDIÕES', color: '#ff8c8c' },
  { id: 'enemies', icon: 'arch_i_enemy', label: 'AMEAÇAS', color: '#ffd94a' },
  { id: 'records', icon: 'arch_i_info', label: 'REGISTROS', color: '#b06bff' },
];

const WORLD_ENTRIES = [
  { id: 'wakanda', desc: 'Selva tecnológica de vibranium. Ondas 1-4.', traits: 'Selva densa · sem obstáculos centrais', extra: 'O rasgo daqui levou à forja de Ultron.' },
  { id: 'skydeck', desc: 'Convés de porta-aviões celestial. A faixa de céu acima do deck é só de voadores.', traits: 'Faixa aérea hostil · caixas de carga nas laterais', extra: 'Incursão de Loki aberta sobre as nuvens.' },
  { id: 'ruins', desc: 'Rua colapsada em S entre escombros incandescentes.', traits: 'Corredor em S · vents de fogo pulsantes', extra: 'Hela reclamou os mortos deste campo.' },
  { id: 'asgard', desc: 'Ponte do arco-íris, pilares nos cantos.', traits: 'Cantos bloqueados · campo aberto', extra: 'O Devorador rondou a ponte após o crepúsculo.' },
  { id: 'nexuscore', desc: 'Câmara do núcleo: pilones e vents de plasma alternados.', traits: '4 pilones · vents centrais alternados', extra: 'Kang tentou tomar o núcleo do tempo.' },
  { id: 'newyork', desc: 'Cruzamento dos heróis, quinas fechadas por destroços.', traits: 'Quinas bloqueadas · combate urbano', extra: 'Aqui começou a queda final de Thanos.' },
];
const BOSS_EXTRA = {
  ultron: 'Núcleo adaptativo; anéis e drones em cruz.',
  loki: 'Ilusões em leque; adagas espelhadas.',
  hela: 'Lâminas necróticas; ondas de espectros.',
  kang: 'Blinks temporais, poço gravitacional e espiral da manopla.',
  devourer: 'Vórtices de tentáculos; meteoros famintos.',
  thanos: 'Colapso do nexo; rajadas da manopla. REGISTRO FINAL.',
};
const ENEMY_EXTRA = {
  drone: 'Formação geométrica; rajadas em cruz.',
  chitauri: 'Enxame envolvente; tiros mirados.',
  symbiote: 'Errático; divide-se ao morrer.',
  sorcerer: 'Mantém distância; espirais arcanas.',
  sentinel: 'Lento e blindado; anéis pesados.',
  spectre: 'Atravessa tudo; toque gélido.',
  jotun: 'Gigante glacial; ondas de gelo.',
  chaos: 'Instável; explosão ao cair.',
};

export class ArchivesUI {
  constructor() {
    this.openT = 0;          // 0 closed cover .. 1 open spread
    this.closing = false;
    this.turnT = 0;          // page flip anim
    this.chapter = 0;
    this.sel = 0;
    this.newFlags = new Set();
  }

  open() { this.closing = false; this.openT = 0; Audio.sfx('page'); }

  /** returns true when fully closed (lobby should drop the overlay) */
  update(dt) {
    if (this.closing) {
      this.openT = Math.max(0, this.openT - dt * 2.6);
      if (this.openT <= 0) return true;
    } else {
      this.openT = Math.min(1, this.openT + dt * 2.6);
    }
    this.turnT = Math.max(0, this.turnT - dt * 3.2);
    return false;
  }

  close() { this.closing = true; Audio.sfx('page'); }

  entries() {
    const s = Save.data;
    s.discovered.worlds = s.discovered.worlds || {};
    s.discovered.kills = s.discovered.kills || {};
    const ch = CHAPTERS[this.chapter].id;
    if (ch === 'worlds') return WORLD_ENTRIES.map((w) => ({
      id: w.id, kind: 'world',
      name: WORLD_LABEL[w.id] || w.id,
      seen: !!s.discovered.worlds[w.id],
      full: !!s.bossesDefeated[this._worldBoss(w.id)],
      data: w,
    }));
    if (ch === 'bosses') return ['ultron', 'loki', 'hela', 'kang', 'devourer', 'thanos'].map((b) => ({
      id: b, kind: 'boss', name: bossById(b).name,
      seen: !!s.discovered.bosses[b], full: (s.bossesDefeated[b] || 0) > 0,
      data: bossById(b),
    }));
    if (ch === 'enemies') return ['drone', 'chitauri', 'symbiote', 'sorcerer', 'sentinel', 'spectre', 'jotun', 'chaos'].map((e) => ({
      id: e, kind: 'enemy', name: ENEMIES[e].name,
      seen: !!s.discovered.enemies[e], full: (s.discovered.kills[e] || 0) > 0,
      data: ENEMIES[e],
    }));
    return [
      { id: 'r1', kind: 'record', name: 'CAMPANHA', seen: true, full: true },
      { id: 'r2', kind: 'record', name: 'AMEAÇAS ABATIDAS', seen: true, full: true },
      { id: 'r3', kind: 'record', name: 'DESCOBERTAS', seen: true, full: true },
    ];
  }

  _worldBoss(id) { return { wakanda: 'ultron', skydeck: 'loki', ruins: 'hela', nexuscore: 'kang', asgard: 'devourer', newyork: 'thanos' }[id]; }

  setChapter(i) { if (i !== this.chapter) { this.chapter = i; this.sel = 0; this.turnT = 1; Audio.sfx('page'); } }
  setSel(i) { if (i !== this.sel) { this.sel = i; this.turnT = 1; Audio.sfx('ui'); const e = this.entries()[i]; if (e) this.newFlags.delete(e.id); } }

  // ------------------------------------------------------------ drawing ----
  draw(ctx, bx, by, bw, bh) {
    const t = performance.now() / 1000;
    const o = this.openT;
    const ease = 1 - Math.pow(1 - o, 3);
    ctx.save();
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.scale(0.6 + 0.4 * ease, 0.6 + 0.4 * ease);
    ctx.globalAlpha = 0.2 + 0.8 * ease;
    ctx.translate(-(bx + bw / 2), -(by + bh / 2));

    // book spread shadow + backing
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(bx + 4, by + 6, bw, bh);
    ctx.fillStyle = '#241738';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(bx - 0.5, by - 0.5, bw + 1, bh + 1);
    ctx.fillStyle = '#170e26';
    ctx.fillRect(bx + bw / 2 - 4, by, 8, bh);

    // LEFT page: chapter tabs + entry list
    const lx = bx + 8, ly = by + 8, lw = bw / 2 - 16, lh = bh - 16;
    if (SPR.arch_page) ctx.drawImage(SPR.arch_page, lx, ly, lw, lh);
    else { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(lx, ly, lw, lh); }
    CHAPTERS.forEach((c, i) => {
      const tx = lx + 6 + i * 52, ty = ly + 4;
      const act = i === this.chapter;
      if (SPR.arch_bookmark) drawSprite(ctx, SPR.arch_bookmark, tx + 22, ty + (act ? 10 : 6), { scaleX: 1.1, scaleY: act ? 1.2 : 0.9 });
      ctx.fillStyle = act ? '#00000055' : '#00000022';
      ctx.fillRect(tx + 4, ty + 12, 36, 14);
      UI.icon(c.icon, tx + 12, ty + 19, 1);
      drawText(ctx, c.label, tx + 22, ty + 16, { align: 'center', scale: 1, color: act ? '#241b52' : '#7a6a4a' });
      const hov = !this.closing && UI.hit(tx, ty, 46, 30);
      if (hov) { UI.hoverId = 'archc' + i; if (UI.anyClick) this.setChapter(i); }
    });
    drawText(ctx, 'NEXUS ARCHIVES', lx + lw / 2, ly + 34, { align: 'center', scale: 1, color: '#5a4a2a', style: 'hero', outline: '#e8dcc0' });
    if (SPR.arch_divider) drawSprite(ctx, SPR.arch_divider, lx + lw / 2, ly + 46, { scaleX: (lw - 40) / 128, scaleY: 1 });
    const list = this.entries();
    const col = CHAPTERS[this.chapter].color;
    list.forEach((e, i) => {
      const ey = ly + 56 + i * Math.min(26, Math.floor((lh - 66) / list.length));
      const hov = !this.closing && UI.hit(lx + 6, ey, lw - 12, 22);
      if (hov) { UI.hoverId = 'arche' + i; ctx.fillStyle = '#00000018'; ctx.fillRect(lx + 6, ey, lw - 12, 22); }
      const sel = i === this.sel;
      if (sel) {
        ctx.fillStyle = col + '33';
        ctx.fillRect(lx + 6, ey, lw - 12, 22);
        if (SPR.arch_arrow) drawSprite(ctx, SPR.arch_arrow, lx + 14, ey + 11, { scaleX: 0.6, scaleY: 0.8 });
      }
      const disc = e.seen;
      drawText(ctx, disc ? e.name : '??? ???', lx + 26, ey + 4, { scale: 1, color: sel ? '#241b52' : disc ? '#4a3a20' : '#9a8a6a' });
      if (!disc) drawText(ctx, 'OCULTO', lx + lw - 10, ey + 4, { align: 'right', scale: 1, color: '#b06bff' });
      else if (e.full) drawText(ctx, '✔', lx + lw - 10, ey + 4, { align: 'right', scale: 1, color: '#2f8f4f' });
      if (hov && UI.anyClick) this.setSel(i);
    });
    drawText(ctx, `CAP. ${this.chapter + 1} · PÁG. ${this.sel + 1}/${list.length}`, lx + 8, ly + lh - 12, { scale: 1, color: '#8a7a5a' });

    // RIGHT page: detail (with flip anim)
    const rx = bx + bw / 2 + 8, ry = by + 8, rw = bw / 2 - 16, rh = bh - 16;
    const flip = this.turnT > 0 ? Math.abs(Math.cos(this.turnT * Math.PI)) : 1;
    ctx.save();
    ctx.translate(rx + rw / 2, ry);
    ctx.scale(Math.max(0.12, flip), 1);
    ctx.translate(-(rx + rw / 2), -ry);
    if (this.turnT > 0 && flip < 0.9) { ctx.fillStyle = '#00000033'; ctx.fillRect(rx + 4, ry + 4, rw, rh); }
    if (SPR.arch_page) ctx.drawImage(SPR.arch_page, rx, ry, rw, rh);
    else { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(rx, ry, rw, rh); }
    // corner ornaments + stickers
    if (SPR.arch_corner1) drawSprite(ctx, SPR.arch_corner1, rx + 12, ry + 10, { scale: 1 });
    if (SPR.arch_corner2) { ctx.save(); ctx.translate(rx + rw - 12, ry + rh - 12); ctx.rotate(Math.PI); ctx.translate(-(rx + rw - 12), -(ry + rh - 12)); drawSprite(ctx, SPR.arch_corner2, rx + rw - 12, ry + rh - 12, { scale: 1 }); ctx.restore(); }
    if (SPR.arch_s3) { ctx.save(); ctx.globalAlpha = 0.9; drawSprite(ctx, SPR.arch_s3, rx + rw - 20, ry + 16, { scale: 0.9, rot: 0.2 }); ctx.restore(); }
    const e = list[clamp(this.sel, 0, list.length - 1)];
    if (e) this._drawEntry(ctx, e, rx, ry, rw, rh, t);
    ctx.restore();

    // cover / back-cover ghost while opening / closing
    if (o < 1) {
      const cov = this.closing ? SPR.arch_back : SPR.arch_cover;
      if (cov) {
        ctx.globalAlpha = (1 - o) * ease + 0.25;
        drawSprite(ctx, cov, bx + bw / 2, by + bh / 2, { scaleX: (bh * 0.9) / 120 * (1 - o * 0.5), scaleY: (bh * 0.9) / 120 });
        ctx.globalAlpha = 0.2 + 0.8 * ease;
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  _drawEntry(ctx, e, x, y, w, h, t) {
    const ink = '#3a2a14';
    const ch = CHAPTERS[this.chapter];
    drawText(ctx, ch.label, x + w - 8, y + 6, { align: 'right', scale: 1, color: '#8a7a5a' });
    if (SPR.arch_stamp) { ctx.globalAlpha = 0.5; drawSprite(ctx, SPR.arch_stamp, x + w - 22, y + 26, { scale: 0.8, rot: 0.3 }); ctx.globalAlpha = 1; }
    if (!e.seen) {
      drawText(ctx, 'REGISTRO OCULTO', x + w / 2, y + 14, { align: 'center', scale: 2, color: '#7a6a4a', style: 'hero', outline: '#e8dcc0' });
      const sil = e.kind === 'enemy' ? SPR['en_' + e.id] : e.kind === 'boss' ? (SPR['archb_' + e.id] || SPR['portrait_' + e.id]) : SPR['wicon_' + e.id];
      if (sil) { ctx.globalAlpha = 0.14; drawSprite(ctx, sil, x + w / 2, y + 84, { scale: e.kind === 'world' ? 3 : 2.6 }); ctx.globalAlpha = 1; }
      if (SPR.arch_lock) drawSprite(ctx, SPR.arch_lock, x + w / 2, y + 84, { scale: 1.6 });
      drawText(ctx, '???', x + w / 2, y + 120, { align: 'center', scale: 2, color: '#9a8a6a' });
      this._wrap(ctx, e.kind === 'enemy' ? 'Encontre esta ameaça em combate para abrir a página.' : e.kind === 'boss' ? 'Testemunhe este guardião para abrir a página.' : 'Pise neste mundo para abrir a página.', x + 24, y + 148, w - 48, '#7a6a4a', 10);
      if (SPR.arch_under) drawSprite(ctx, SPR.arch_under, x + w / 2, y + h - 16, { scaleX: 2, scaleY: 1 });
      return;
    }
    // header
    drawText(ctx, e.name, x + 10, y + 8, { scale: 2, color: ink, style: 'hero', outline: '#e8dcc0' });
    if (SPR.arch_under) drawSprite(ctx, SPR.arch_under, x + 10 + textWidth(e.name, 2) / 2, y + 26, { scaleX: Math.min(3, textWidth(e.name, 2) / 32), scaleY: 1 });

    let my;
    if (e.kind === 'boss' && e.id === 'thanos' && SPR.arch_spread) {
      // final record: double-page splash spread
      const sw = w - 20, sh = Math.min(104, sw / 2);
      drawSprite(ctx, SPR.arch_spread, x + w / 2, y + 34 + sh / 2, { scaleX: sw / SPR.arch_spread.width, scaleY: sh / SPR.arch_spread.height });
      if (SPR.arch_s1) drawSprite(ctx, SPR.arch_s1, x + 20, y + 40, { scale: 0.8, rot: -0.2 });
      my = y + 44 + sh;
      if (SPR.arch_divider) drawSprite(ctx, SPR.arch_divider, x + w / 2, my + 2, { scaleX: (w - 60) / 128, scaleY: 1 });
      my += 8;
      this._wrap(ctx, e.data.intro || 'REGISTRO FINAL.', x + 12, my, w - 24, '#5a4a2a', 9); my += 20;
      this._wrap(ctx, '>> ' + BOSS_EXTRA.thanos, x + 12, my, w - 24, e.full ? '#2f6f3f' : '#8a7a5a', 9);
    } else if (e.kind !== 'record') {
      const fx = x + 12, fy = y + 34, fs = 74;
      if (e.kind === 'world') {
        if (SPR.arch_polaroid) drawSprite(ctx, SPR.arch_polaroid, fx + fs / 2, fy + fs / 2, { scaleX: (fs + 16) / 88, scaleY: (fs + 16) / 66 * 0.95 });
        const wa = SPR['archw_' + e.id];
        if (wa) drawSprite(ctx, wa, fx + fs / 2, fy + fs / 2 - 1, { scaleX: (fs - 2) / wa.width, scaleY: (fs - 18) / wa.height });
        if (SPR.arch_tape) drawSprite(ctx, SPR.arch_tape, fx + 8, fy + 2, { scale: 1, rot: -0.4 });
      } else {
        if (SPR.arch_frame) drawSprite(ctx, SPR.arch_frame, fx + fs / 2, fy + fs / 2, { scaleX: fs / 96, scaleY: fs / 96 });
        const art = e.kind === 'enemy' ? SPR['en_' + e.id] : (SPR['archb_' + e.id] || SPR['portrait_' + e.id] || SPR['boss_' + e.id]);
        if (art) drawSprite(ctx, art, fx + fs / 2, fy + fs / 2, { scale: Math.min(62 / art.height, 62 / art.width) });
        if (SPR.arch_tape) drawSprite(ctx, SPR.arch_tape, fx + 6, fy + 2, { scale: 1, rot: -0.4 });
      }
      // meta column
      my = fy + 4;
      const mx = fx + fs + 12, mw = w - fs - 36;
      if (e.kind === 'enemy') {
        this._kv(ctx, 'CLASSE', e.data.behavior.toUpperCase(), mx, my, ink); my += 12;
        this._kv(ctx, 'CONTATO', String(e.data.contact), mx, my, ink); my += 12;
        this._kv(ctx, 'ABATES', String(Save.data.discovered.kills[e.id] || 0), mx, my, ink); my += 12;
        this._wrap(ctx, e.data.desc, mx, my, mw, '#5a4a2a', 9); my += 28;
        this._wrap(ctx, e.full ? '>> ' + ENEMY_EXTRA[e.id] : '>> Abata 1 para revelar o padrão de ataque.', mx, my, mw, e.full ? '#2f6f3f' : '#8a7a5a', 9);
      } else if (e.kind === 'boss') {
        this._kv(ctx, 'MUNDO', 'boss_' + e.id, mx, my, ink); my += 12;
        this._kv(ctx, 'VITÓRIAS', String(Save.data.bossesDefeated[e.id] || 0), mx, my, ink); my += 12;
        this._wrap(ctx, e.data.intro || 'Guardião de incursão.', mx, my, mw, '#5a4a2a', 9); my += 28;
        this._wrap(ctx, e.full ? '>> ' + BOSS_EXTRA[e.id] : '>> Derrote para completar o registro.', mx, my, mw, e.full ? '#2f6f3f' : '#8a7a5a', 9);
      } else {
        this._kv(ctx, 'SETOR', e.id.toUpperCase(), mx, my, ink); my += 12;
        this._kv(ctx, 'GUARDIÃO', e.full ? 'VENCIDO' : 'ATIVO', mx, my, ink); my += 12;
        this._wrap(ctx, e.data.desc, mx, my, mw, '#5a4a2a', 9); my += 28;
        this._wrap(ctx, e.data.traits, mx, my, mw, '#5a4a2a', 9); my += 20;
        this._wrap(ctx, e.full ? '>> ' + e.data.extra : '>> Complete a incursão para revelar o anexo.', mx, my, mw, e.full ? '#2f6f3f' : '#8a7a5a', 9);
      }
    }
    if (e.kind === 'record') this._records(ctx, e, x + 12, y + 40, w - 24, ink);
    // discovered stamp
    if (e.full && SPR.arch_stamp) { ctx.globalAlpha = 0.7; drawSprite(ctx, SPR.arch_stamp, x + w - 30, y + h - 30, { scale: 1, rot: -0.2 }); ctx.globalAlpha = 1; }
    // unlock flash for fresh entries
    if (this.newFlags.has(e.id) && SPR.arch_unlock) {
      const p = (t * 2) % 1;
      ctx.globalAlpha = 0.7 * (1 - p);
      drawSprite(ctx, SPR.arch_unlock, x + w / 2, y + h / 2, { scale: 1.4 + p });
      ctx.globalAlpha = 1;
    }
  }

  _kv(ctx, k, v, x, y, ink) {
    drawText(ctx, k, x, y, { scale: 1, color: '#8a7a5a' });
    drawText(ctx, v, x + 62, y, { scale: 1, color: ink });
  }

  _wrap(ctx, txt, x, y, w, color, lh) {
    let line = '', ly = y;
    for (const wd of String(txt).split(' ')) {
      if (textWidth(line + wd) > w) { drawText(ctx, line, x, ly, { color }); ly += lh; line = ''; }
      line += (line ? ' ' : '') + wd;
    }
    if (line) drawText(ctx, line, x, ly, { color });
  }

  _records(ctx, e, x, y, w, ink) {
    const s = Save.data;
    if (SPR.arch_divider) drawSprite(ctx, SPR.arch_divider, x + w / 2, y - 4, { scaleX: (w - 40) / 128, scaleY: 1 });
    if (e.id === 'r1') {
      this._wrap(ctx, `Partidas ${s.stats.runs} · Vitórias ${s.stats.wins} · Nível máx ${s.stats.levelReached} · Balas desviadas ${s.stats.bulletsDodged}`, x, y, w, '#5a4a2a', 10);
    } else if (e.id === 'r2') {
      this._wrap(ctx, `Abates totais ${s.stats.kills}. Guardiões vencidos: ${['ultron', 'loki', 'hela', 'kang', 'devourer', 'thanos'].map((b) => (s.bossesDefeated[b] ? bossById(b).name.split(' ')[0] + ' x' + s.bossesDefeated[b] : null)).filter(Boolean).join(' · ') || 'nenhum ainda.'}`, x, y, w, '#5a4a2a', 10);
    } else {
      const d = s.discovered;
      const en = ['drone', 'chitauri', 'symbiote', 'sorcerer', 'sentinel', 'spectre', 'jotun', 'chaos'].filter((i) => d.enemies[i]).length;
      const bo = ['ultron', 'loki', 'hela', 'kang', 'devourer', 'thanos'].filter((i) => d.bosses[i]).length;
      const wo = Object.keys(d.worlds || {}).length;
      this._wrap(ctx, `Ameaças ${en}/8 · Guardiões ${bo}/6 · Mundos ${wo}/6. O arquivo cresce conforme você joga.`, x, y, w, '#5a4a2a', 10);
    }
  }

  flagNew(kind, id) { this.newFlags.add(id); }
}
