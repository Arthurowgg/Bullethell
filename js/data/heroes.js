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
    attack: { kind: 'webshot', dmg: 9, rate: 3.1, speed: 340, pierce: 1, sfx: 'webshot' },
    ability: { name: 'TEIA APRISIONANTE', cd: 6, desc: 'Prende inimigos próximos em teias por 2,5s.' },
    special: { name: 'TEMPESTADE DE TEIAS', cd: 12, desc: 'Sequência de teias em área: anéis expansivos prendem e atingem vários inimigos.' },
    passive: { name: 'SENTIDO ARANHA', desc: '+15% de velocidade e esquiva mais rápida.' },
  },
  {
    id: 'stormgod', name: 'THOR', role: 'DANO EM ÁREA',
    desc: 'Raios em cadeia, martelo giratório e a fúria da tempestade de Asgard.',
    color: '#4dd8ff', hp: 120, speed: 112,
    attack: { kind: 'bolt', dmg: 13, rate: 1.7, chains: 3, sfx: 'boltheavy' },
    ability: { name: 'MARTELO GIRATÓRIO', cd: 7, desc: 'Mjölnir orbita você por 3s causando dano.' },
    special: { name: 'TEMPESTADE DE ASGARD', cd: 13, desc: 'Grande tempestade: raios caem em múltiplos pontos com impacto central devastador.' },
    passive: { name: 'FÚRIA ELÉTRICA', desc: 'Seus ataques eletrocutam em cadeia.' },
  },
  {
    id: 'ironknight', name: 'IRON MAN', role: 'PRECISÃO E TECNOLOGIA',
    desc: 'Repulsores, mísseis teleguiados e sobrecarga total da armadura.',
    color: '#ffd94a', hp: 100, speed: 118,
    attack: { kind: 'burst', dmg: 7, rate: 1.15, speed: 400, sfx: 'repul' },
    ability: { name: 'MÍSSEIS TELEGUIADOS', cd: 5, desc: 'Dispara 4 mísseis que perseguem inimigos.' },
    special: { name: 'SALVA DE MÍSSEIS', cd: 14, desc: 'Salva teleguiada em grande escala cobrindo a arena + explosão final.' },
    passive: { name: 'MIRA ASSISTIDA', desc: '+10% de chance de crítico (2x dano).' },
  },
  {
    id: 'merc', name: 'DEADPOOL', role: 'VELOCIDADE E RISCO',
    desc: 'Pistolas, katanas e projéteis que ricocheteiam. Caos com regeneração.',
    color: '#ff6b6b', hp: 90, speed: 124,
    attack: { kind: 'chaos', dmg: 6, rate: 4.4, speed: 300, sfx: 'pistol' },
    ability: { name: 'KATANAS RICOCHETE', cd: 5, desc: 'Lâminas que quicam nas paredes 3 vezes.' },
    special: { name: 'SEQUÊNCIA FRENÉTICA', cd: 11, desc: 'Dança frenética atravessando inimigos com cortes velozes e giro final.' },
    passive: { name: 'FATOR DE CURA', desc: 'Regenera 1 de vida a cada 2s.' },
  },
  {
    id: 'claws', name: 'WOLVERINE', role: 'COMBATE AGRESSIVO',
    desc: 'Garras de adamantium em área, investidas e fúria berserker.',
    color: '#ffe14a', hp: 130, speed: 116,
    attack: { kind: 'claws', dmg: 14, rate: 2.6, range: 56, sfx: 'claw1' },
    ability: { name: 'INVESTIDA', cd: 4, desc: 'Avanço rápido que corta tudo no caminho.' },
    special: { name: 'INVESTIDA BRUTAL', cd: 12, desc: 'Avanço brutal atravessando a arena em cortes + impacto final atordoante.' },
    passive: { name: 'GARRAS DESENTERRADAS', desc: 'Destroi projéteis inimigos ao seu redor.' },
  },
  {
    id: 'mystic', name: 'DOUTOR ESTRANHO', role: 'MAGIA E ESPAÇO',
    desc: 'Discos místicos, espirais, portais e runas de proteção.',
    color: '#ff9d4d', hp: 90, speed: 114,
    attack: { kind: 'sigil', dmg: 12, rate: 2.0, speed: 210, pierce: 1, sfx: 'sigil' },
    ability: { name: 'ESPIRAL MÍSTICA', cd: 6, desc: 'Espiral de projéteis arcanos ao seu redor.' },
    special: { name: 'PORTAL DO NEXUS', cd: 13, desc: 'Portal místico bombardeia a arena com dardos arcanos teleguiados.' },
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
