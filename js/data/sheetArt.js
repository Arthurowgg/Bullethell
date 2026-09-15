// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/sheetArt.js
// Loads the ImageMagick-processed AI sheets over the procedural sprites:
// hero emblem frames (idle/idle-alt/attack/hurt), enemy sprites and boss
// sprites. Every load failure silently keeps the procedural fallback.
// ---------------------------------------------------------------------------
import { SPR } from '../core/pixel.js';
import { HEROES } from './heroes.js';

const HAS_IMG = typeof Image !== 'undefined';

export function loadSheetArt(onProgress) {
  if (!HAS_IMG) { onProgress && onProgress(1, 1); return Promise.resolve(); }

  const cnv = (img, scale) => {
    const c = document.createElement('canvas');
    c.width = img.width * scale; c.height = img.height * scale;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, c.width, c.height);
    return c;
  };

  const jobs = [];
  const load = (url, cb) => jobs.push(new Promise((res) => {
    const img = new Image();
    img.onload = () => { try { cb(img); } catch { /* keep fallback */ } res(); };
    img.onerror = () => res();
    img.src = url;
  }));

  // hero emblem frames
  for (const h of HEROES) {
    for (let i = 0; i < 4; i++) {
      load(`assets/sprites/heroes/${h.id}_f${i}.png`, (img) => {
        SPR['hero_' + h.id + '_f' + i] = cnv(img, 1);
        if (i === 0) {
          SPR['hero_' + h.id] = cnv(img, 1);
          SPR['hero_' + h.id + '_big'] = cnv(img, 4);
        }
      });
    }
  }
  // enemies
  for (const e of ['drone', 'chitauri', 'symbiote', 'sorcerer', 'sentinel', 'spectre', 'jotun', 'chaos']) {
    load(`assets/sprites/enemies/${e}.png`, (img) => { SPR['en_' + e] = cnv(img, 1); });
  }
  // bosses
  for (const b of ['ultron', 'loki', 'hela', 'devourer', 'thanos', 'kang']) {
    load(`assets/sprites/bosses/${b}.png`, (img) => { SPR['boss_' + b] = cnv(img, 1); });
  }
  // per-hero walk loops + ability icons
  for (const h of HEROES) {
    for (let i = 0; i < 4; i++) {
      load(`assets/sprites/heroes_anim/${h.id}_w${i}.png`, (img) => { SPR['hero_' + h.id + '_w' + i] = cnv(img, 1); });
    }
    load(`assets/sprites/ui/abil_${h.id}_q.png`, (img) => { SPR['abil_' + h.id + '_q'] = cnv(img, 1); });
    load(`assets/sprites/ui/abil_${h.id}_e.png`, (img) => { SPR['abil_' + h.id + '_e'] = cnv(img, 1); });
  }
  // enemy variant sprites (4 per family)
  for (const e of ['drone', 'chitauri', 'symbiote', 'sorcerer', 'sentinel', 'spectre', 'jotun', 'chaos']) {
    load(`assets/sprites/enemies/${e}_b.png`, (img) => { SPR['en_' + e + '_b'] = cnv(img, 1); });
    for (let v = 1; v <= 4; v++) {
      load(`assets/sprites/enemies/${e}_v${v}.png`, (img) => { SPR['en_' + e + '_v' + v] = cnv(img, 1); });
    }
  }
  // world icons, boss portraits and custom boss bar frames
  for (const w of ['wakanda', 'asgard', 'newyork', 'skydeck', 'ruins', 'nexuscore', 'boss_ultron', 'boss_loki', 'boss_hela', 'boss_devourer', 'boss_thanos', 'boss_kang']) {
    load(`assets/sprites/ui/wicon_${w}.png`, (img) => { SPR['wicon_' + w] = cnv(img, 1); });
  }
  for (const b of ['ultron', 'loki', 'hela', 'devourer', 'thanos', 'kang']) {
    load(`assets/sprites/ui/portrait_${b}.png`, (img) => { SPR['portrait_' + b] = cnv(img, 1); });
    load(`assets/sprites/ui/bar_${b}.png`, (img) => { SPR['bar_' + b] = cnv(img, 1); });
  }
  // world backgrounds (3 main worlds + 5 boss-exclusive worlds)
  for (const w of ['wakanda', 'asgard', 'newyork', 'skydeck', 'ruins', 'nexuscore', 'boss_ultron', 'boss_loki', 'boss_hela', 'boss_devourer', 'boss_thanos', 'boss_kang']) {
    load(`assets/sprites/worlds/${w}.png`, (img) => { SPR['world_' + w] = cnv(img, 1); });
  }
  // skin emblem frames
  for (const s of ['miles', 'ragnarok', 'hulkbuster', 'xforce', 'umbral']) {
    for (let i = 0; i < 4; i++) {
      load(`assets/sprites/skins/${s}_f${i}.png`, (img) => {
        SPR['skin_' + s + '_f' + i] = cnv(img, 1);
        if (i === 0) SPR['skin_' + s] = cnv(img, 1);
      });
    }
    load(`assets/sprites/skins_big/${s}.png`, (img) => { SPR['skin_' + s + '_big'] = cnv(img, 1); });
  }
  // upgrade icons (30)
  for (let i = 1; i <= 30; i++) {
    const k = 'up_' + String(i).padStart(2, '0');
    load(`assets/sprites/icons/${k}.png`, (img) => { SPR[k] = cnv(img, 1); });
  }
  // unique shots
  for (const h of ['arachnid', 'stormgod', 'ironknight', 'merc', 'claws', 'mystic'])
    load(`assets/sprites/shots/hero_${h}.png`, (img) => { SPR['shot_hero_' + h] = cnv(img, 1); });
  for (const e of ['drone', 'chitauri', 'symbiote', 'sorcerer', 'sentinel', 'spectre', 'jotun', 'chaos'])
    load(`assets/sprites/shots/en_${e}.png`, (img) => { SPR['shot_en_' + e] = cnv(img, 1); });
  for (const b of ['ultron', 'loki', 'hela', 'devourer', 'thanos', 'cosmic', 'kang'])
    load(`assets/sprites/shots/boss_${b}.png`, (img) => { SPR['shot_boss_' + b] = cnv(img, 1); });
  // comic UI icons
  for (const u of ['swarm', 'elite', 'frags', 'alarm', 'burst', 'shield', 'bolt', 'portal'])
    load(`assets/sprites/ui/${u}.png`, (img) => { SPR['ui_' + u] = cnv(img, 1); });
  // hero combat VFX (web/bolt/tech/blade/claw/mystic sheets)
  for (const f of ['fx_web_dart', 'fx_web_splat', 'fx_web_net', 'fx_cocoon',
    'fx_zapbolt', 'fx_bolt_impact', 'fx_hammer', 'fx_strike',
    'fx_repul', 'fx_missile', 'fx_boom', 'fx_reticle',
    'fx_tracer', 'fx_knife', 'fx_slashx', 'fx_arc',
    'fx_claw3', 'fx_clawarc', 'fx_rage', 'fx_clawblades',
    'fx_sigil', 'fx_portal', 'fx_rune', 'fx_dart',
    'fx_tear', 'fx_portalring', 'fx_collapse']) {
    load(`assets/sprites/fx/${f}.png`, (img) => { SPR[f] = cnv(img, 1); });
  }
  // campaign props: obstacle tops, hazard vents, deck tiles, kang vfx, pickups
  for (const k of ['obs_skydeck', 'obs_ruins', 'obs_nexuscore', 'tile_rail', 'tile_hazard', 'pk_xp', 'pk_heart', 'pk_frag'])
    load(`assets/sprites/ui/${k}.png`, (img) => { SPR[k] = cnv(img, 1); });
  for (const k of ['dz_fire', 'dz_vent', 'fx_gravwell', 'fx_gauntlet', 'fx_tclock'])
    load(`assets/sprites/fx/${k}.png`, (img) => { SPR[k] = cnv(img, 1); });
  // NEXUS ARCHIVES book art
  for (const k of ['arch_cover', 'arch_back', 'arch_page', 'arch_frame', 'arch_stamp', 'arch_unlock',
    'arch_bookmark', 'arch_lock', 'arch_arrow', 'arch_tape', 'arch_under',
    'arch_i_world', 'arch_i_boss', 'arch_i_enemy', 'arch_i_info',
    'archb_ultron', 'archb_loki', 'archb_hela', 'archb_kang', 'archb_devourer', 'archb_thanos',
    'archw_wakanda', 'archw_skydeck', 'archw_ruins', 'archw_asgard', 'archw_nexuscore', 'archw_newyork',
    'arch_spread', 'arch_s1', 'arch_s2', 'arch_s3', 'arch_s4', 'arch_corner1', 'arch_corner2',
    'arch_divider', 'arch_polaroid', 'arch_skull', 'arch_skull2', 'arch_page_tech', 'arch_page_map',
    'arch_compass', 'arch_pin', 'arch_rune1', 'arch_rune2', 'arch_rune3',
    'arch_sk_arachnid', 'arch_sk_stormgod', 'arch_sk_ironknight', 'arch_sk_merc', 'arch_sk_claws', 'arch_sk_mystic'])
    load(`assets/sprites/ui/${k}.png`, (img) => { SPR[k] = cnv(img, 1); });
  // universal UI kit: frames, icons, toggles, sliders, menu backdrop
  for (const k of ['ui_btn', 'ui_btn_gold', 'ui_panel', 'ui_header', 'ui_menubg', 'ui_keycap',
    'ui_toggle_on', 'ui_toggle_off', 'ui_slider_track', 'ui_slider_knob',
    'ic_play', 'ic_restart', 'ic_quit', 'ic_gear', 'ic_music', 'ic_speaker',
    'ic_shake', 'ic_dmg', 'ic_aim', 'ic_pixel', 'ic_full', 'ic_trophy'])
    load(`assets/sprites/ui/${k}.png`, (img) => { SPR[k] = cnv(img, 1); });
  // HUD frames + Nexus event icons (campaign rework)
  for (const k of ['hud_hp', 'hud_avatar', 'hud_abil', 'hud_wave', 'hud_timer',
    'ev_wave', 'ev_elite', 'ev_miniboss', 'ev_incursion', 'ev_tear', 'ev_swarm',
    'ev_reward', 'ev_diff', 'ev_bossin', 'ev_bossdown', 'ev_return', 'ev_upgrade']) {
    load(`assets/sprites/ui/${k}.png`, (img) => { SPR[k] = cnv(img, 1); });
  }
  // Nexus lobby hub art
  for (const l of ['bg', 'core', 'portal_shop', 'portal_cos', 'portal_worlds',
    'wemb_wakanda', 'wemb_asgard', 'wemb_newyork',
    'nav_play', 'nav_nexus', 'nav_cos', 'nav_inc', 'nav_col', 'nav_mis', 'nav_dev', 'nav_gear']) {
    load(`assets/sprites/lobby/${l}.png`, (img) => { SPR['lobby_' + l] = cnv(img, 1); });
  }

  let done = 0;
  const total = jobs.length;
  return Promise.all(jobs.map((p) => p.then(() => { done++; onProgress && onProgress(done, total); })));
}
