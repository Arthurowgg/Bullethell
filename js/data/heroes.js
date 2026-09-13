// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/heroes.js
// The six playable heroes: stats, kit definitions and sprite loading.
// Sprites are AI-pixel-art processed through ImageMagick (see
// tools/process_heroes.sh) and loaded from assets/sprites/heroes/*.png.
// ---------------------------------------------------------------------------
import { SPR } from '../core/pixel.js';
import { Pix, reg } from '../core/pixel.js';

export const HEROES = [
  {
    id: 'arachnid', name: 'HOMEM-ARANHA', role: 'MOBILIDADE E CONTROLE',
    desc: 'Teias que atravessam inimigos, armadilhas e uma esquiva ágil. O amigo da vizinhança do Nexus.',
    color: '#ff4d4d', hp: 95, speed: 128,
    attack: { kind: 'pierce', dmg: 9, rate: 2.6, speed: 260, pierce: 2, sfx: 'web' },
    ability: { name: 'TEIA APRISIONANTE', cd: 6, desc: 'Prende inimigos próximos em teias por 2,5s.' },
    special: { name: 'TEMPESTADE DE TEIAS', desc: 'Anel de teias + prende todos os inimigos da tela.' },
    passive: { name: 'SENTIDO ARANHA', desc: '+15% de velocidade e esquiva mais rápida.' },
  },
  {
    id: 'stormgod', name: 'THOR', role: 'DANO EM ÁREA',
    desc: 'Raios em cadeia, martelo giratório e a fúria da tempestade de Asgard.',
    color: '#4dd8ff', hp: 120, speed: 112,
    attack: { kind: 'chain', dmg: 8, rate: 1.9, chains: 3, sfx: 'zap' },
    ability: { name: 'MARTELO GIRATÓRIO', cd: 7, desc: 'Mjölnir orbita você por 3s causando dano.' },
    special: { name: 'TEMPESTADE DE ASGARD', desc: 'Trovões caem sobre toda a arena por 4s.' },
    passive: { name: 'FÚRIA ELÉTRICA', desc: 'Seus ataques eletrocutam em cadeia.' },
  },
  {
    id: 'ironknight', name: 'IRON MAN', role: 'PRECISÃO E TECNOLOGIA',
    desc: 'Repulsores, mísseis teleguiados e sobrecarga total da armadura.',
    color: '#ffd94a', hp: 100, speed: 118,
    attack: { kind: 'repulsor', dmg: 7, rate: 3.4, speed: 320, sfx: 'shoot' },
    ability: { name: 'MÍSSEIS TELEGUIADOS', cd: 5, desc: 'Dispara 4 mísseis que perseguem inimigos.' },
    special: { name: 'SOBRECARGA DA ARMADURA', desc: 'Cadência dobrada + varredura de laser Unibeam.' },
    passive: { name: 'MIRA ASSISTIDA', desc: '+10% de chance de crítico (2x dano).' },
  },
  {
    id: 'merc', name: 'DEADPOOL', role: 'VELOCIDADE E RISCO',
    desc: 'Pistolas, katanas e projéteis que ricocheteiam. Caos com regeneração.',
    color: '#ff6b6b', hp: 90, speed: 124,
    attack: { kind: 'dual', dmg: 6, rate: 4.2, speed: 300, sfx: 'shoot' },
    ability: { name: 'KATANAS RICOCHETE', cd: 5, desc: 'Lâminas que quicam nas paredes 3 vezes.' },
    special: { name: 'CAOS TOTAL', desc: 'Rajada circular massiva + regen rápida.' },
    passive: { name: 'FATOR DE CURA', desc: 'Regenera 1 de vida a cada 2s.' },
  },
  {
    id: 'claws', name: 'WOLVERINE', role: 'COMBATE AGRESSIVO',
    desc: 'Garras de adamantium em área, investidas e fúria berserker.',
    color: '#ffe14a', hp: 130, speed: 116,
    attack: { kind: 'slash', dmg: 14, rate: 2.4, range: 52, sfx: 'hit' },
    ability: { name: 'INVESTIDA', cd: 4, desc: 'Avanço rápido que corta tudo no caminho.' },
    special: { name: 'FÚRIA BERSERKER', desc: '+60% velocidade de ataque e regen por 5s.' },
    passive: { name: 'GARRAS DESENTERRADAS', desc: 'Destroi projéteis inimigos ao seu redor.' },
  },
  {
    id: 'mystic', name: 'DOUTOR ESTRANHO', role: 'MAGIA E ESPAÇO',
    desc: 'Discos místicos, espirais, portais e runas de proteção.',
    color: '#ff9d4d', hp: 90, speed: 114,
    attack: { kind: 'disc', dmg: 12, rate: 2.0, speed: 200, pierce: 1, sfx: 'port' },
    ability: { name: 'ESPIRAL MÍSTICA', cd: 6, desc: 'Espiral de projéteis arcanos ao seu redor.' },
    special: { name: 'DISTORÇÃO DA REALIDADE', desc: 'Congela inimigos e apaga projéteis próximos.' },
    passive: { name: 'RUNAS DE PROTEÇÃO', desc: '2 runas orbitais bloqueiam projéteis.' },
  },
];

export const heroById = (id) => HEROES.find((h) => h.id === id) || HEROES[0];

// Fallback silhouettes (used only if a PNG fails to load, e.g. file:// quirk)
function fallbackHero(color) {
  const p = new Pix(28, 28);
  p.disc(14, 10, 7, color);
  p.rect(6, 16, 16, 9, color);
  p.rect(9, 8, 3, 3, '#ffffff'); p.rect(16, 8, 3, 3, '#ffffff');
  p.outline('#0b0a14');
  return p;
}

export function loadHeroArt(onProgress) {
  if (typeof Image === 'undefined') {
    for (const h of HEROES) reg('hero_' + h.id, fallbackHero(h.color));
    onProgress && onProgress(HEROES.length, HEROES.length);
    return Promise.resolve();
  }
  let done = 0;
  return Promise.all(HEROES.map((h) => new Promise((res) => {
    const img = new Image();
    const finish = () => { done++; onProgress && onProgress(done, HEROES.length); res(); };
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      reg('hero_' + h.id, c);
      // big portrait = nearest-neighbour upscale for lobby/shop
      const b = document.createElement('canvas');
      const s = 4;
      b.width = img.width * s; b.height = img.height * s;
      const g = b.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(img, 0, 0, b.width, b.height);
      reg('hero_' + h.id + '_big', b);
      finish();
    };
    img.onerror = () => { reg('hero_' + h.id, fallbackHero(h.color)); reg('hero_' + h.id + '_big', fallbackHero(h.color)); finish(); };
    img.src = 'assets/sprites/heroes/' + h.id + '.png';
  })));
}
