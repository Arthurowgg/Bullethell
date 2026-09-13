// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/shop.js
// The permanent NEXUS STORE catalog. Cosmetics never grant combat power.
// `fx` describes what the item changes visually (tint, trail, bullet color...).
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  { id: 'traje', name: 'TRAJES' },
  { id: 'mascara', name: 'MÁSCARAS' },
  { id: 'ataque', name: 'EFEITOS DE ATAQUE' },
  { id: 'habilidade', name: 'EFEITOS DE HABILIDADE' },
  { id: 'rastro', name: 'RASTROS' },
  { id: 'entrada', name: 'ANIMAÇÕES DE ENTRADA' },
  { id: 'vitoria', name: 'ANIMAÇÕES DE VITÓRIA' },
  { id: 'moldura', name: 'MOLDURAS' },
  { id: 'icone', name: 'ÍCONE DE JOGADOR' },
  { id: 'tema', name: 'TEMAS DO LOBBY' },
];

const R = { c: 1, r: 2, e: 3, l: 4 }; // rarities: comum/raro/épico/lendário
export const RARITY_SHOP = {
  1: { name: 'COMUM', color: '#9aa5b1' },
  2: { name: 'RARO', color: '#4dd8ff' },
  3: { name: 'ÉPICO', color: '#b06bff' },
  4: { name: 'LENDÁRIO', color: '#ffd94a' },
};

const I = (id, cat, name, desc, rarity, price, currency, fx) =>
  ({ id, cat, name, desc, rarity, price, currency, fx });

export const SHOP_ITEMS = [
  // --- TRAJES (tint the hero sprite) ---
  I('tr_classic', 'traje', 'TRAJE CLÁSSICO', 'O visual original do herói.', R.c, 0, 'frag', { tint: null }),
  I('tr_negro', 'traje', 'TRAJE SOMBRA', 'Tonalidade escura e furtiva.', R.r, 180, 'frag', { tint: '#5a5a7a' }),
  I('tr_dourado', 'traje', 'TRAJE DOURADO', 'Brilho de campeão.', R.e, 420, 'frag', { tint: '#d8a53c' }),
  I('tr_cosmico', 'traje', 'TRAJE CÓSMICO', 'Energia estelar percorre o traje.', R.l, 900, 'frag', { tint: '#7b5cff' }),
  I('tr_carmesim', 'traje', 'TRAJE CARMESIM', 'Vermelho profundo de batalha.', R.r, 200, 'frag', { tint: '#c02434' }),
  I('tr_gelo', 'traje', 'TRAJE DE GELO', 'Azul cristalino de Jotunheim.', R.e, 450, 'frag', { tint: '#7fd4ff' }),
  // --- MÁSCARAS ---
  I('ms_padrao', 'mascara', 'MÁSCARA PADRÃO', 'Sem alterações na máscara.', R.c, 0, 'frag', { mask: null }),
  I('ms_olhos_furia', 'mascara', 'OLHOS DE FÚRIA', 'Olhos avermelhados.', R.r, 150, 'frag', { eye: '#ff4d4d' }),
  I('ms_olhos_void', 'mascara', 'OLHOS DO VAZIO', 'Olhos violeta do Nexus.', R.e, 380, 'frag', { eye: '#b06bff' }),
  I('ms_visor', 'mascara', 'VISOR TÁTICO', 'Visor ciano tecnológico.', R.r, 170, 'frag', { eye: '#4dd8ff' }),
  // --- EFEITOS DE ATAQUE (bullet color) ---
  I('at_padrao', 'ataque', 'PROJÉTIL PADRÃO', 'A cor clássica do herói.', R.c, 0, 'frag', { bullet: null }),
  I('at_plasma', 'ataque', 'PLASMA VERDE', 'Projéteis de plasma esmeralda.', R.r, 220, 'frag', { bullet: '#4dff88' }),
  I('at_solar', 'ataque', 'FÚRIA SOLAR', 'Projéteis incandescentes.', R.e, 430, 'frag', { bullet: '#ff8c3b' }),
  I('at_void', 'ataque', 'RAJADAS DO VAZIO', 'Projéteis violeta instáveis.', R.l, 850, 'frag', { bullet: '#b06bff' }),
  I('at_gelo', 'ataque', 'ESTILHAÇOS DE GELO', 'Projéteis cristalinos.', R.r, 240, 'frag', { bullet: '#7fd4ff' }),
  // --- EFEITOS DE HABILIDADE ---
  I('hb_padrao', 'habilidade', 'AURA PADRÃO', 'Aura de habilidade padrão.', R.c, 0, 'frag', { aura: null }),
  I('hb_nova', 'habilidade', 'NOVA ESTELAR', 'Explosões douradas de habilidade.', R.e, 400, 'frag', { aura: '#ffd94a' }),
  I('hb_tempestade', 'habilidade', 'TEMPESTADE IÔNICA', 'Faíscas ciano nas habilidades.', R.r, 210, 'frag', { aura: '#4dd8ff' }),
  I('hb_sangue', 'habilidade', 'ECARLATE', 'Aura escarlate dramática.', R.r, 190, 'frag', { aura: '#ff4d6b' }),
  // --- RASTROS ---
  I('ra_nenhum', 'rastro', 'SEM RASTRO', 'Movimento limpo.', R.c, 0, 'frag', { trail: null }),
  I('ra_fogo', 'rastro', 'RASTRO DE BRASAS', 'Deixa brasas ao correr.', R.r, 200, 'frag', { trail: '#ff8c3b' }),
  I('ra_estrelas', 'rastro', 'POEIRA ESTELAR', 'Estrelas ao seu passo.', R.e, 460, 'frag', { trail: '#ffd94a' }),
  I('ra_void', 'rastro', 'FENDA DO VAZIO', 'Rastro violeta dimensional.', R.l, 880, 'frag', { trail: '#b06bff' }),
  I('ra_gelo', 'rastro', 'NEVASCA', 'Flocos de gelo ao mover.', R.r, 210, 'frag', { trail: '#7fd4ff' }),
  // --- ENTRADA ---
  I('en_padrao', 'entrada', 'ENTRADA PADRÃO', 'Chegada discreta.', R.c, 0, 'frag', { entry: 'default' }),
  I('en_portal', 'entrada', 'PORTAL DIMENSIONAL', 'Chega por um portal giratório.', R.e, 420, 'frag', { entry: 'portal' }),
  I('en_queda', 'entrada', 'QUEDA HEROICA', 'Desce do céu com impacto.', R.r, 230, 'frag', { entry: 'drop' }),
  // --- VITÓRIA ---
  I('vi_padrao', 'vitoria', 'POSE PADRÃO', 'Vitória clássica.', R.c, 0, 'frag', { victory: 'default' }),
  I('vi_danca', 'vitoria', 'DANÇA DA VITÓRIA', 'Não resiste a comemorar.', R.r, 240, 'frag', { victory: 'dance' }),
  I('vi_braco', 'vitoria', 'PUNHO AO ALTO', 'Ergue o punho em triunfo.', R.r, 220, 'frag', { victory: 'fist' }),
  // --- MOLDURAS ---
  I('mo_padrao', 'moldura', 'MOLDURA PADRÃO', 'Moldura básica de perfil.', R.c, 0, 'frag', { frame: '#9aa5b1' }),
  I('mo_nexus', 'moldura', 'MOLDURA NEXUS', 'Bordas de energia violeta.', R.e, 380, 'frag', { frame: '#7b5cff' }),
  I('mo_ouro', 'moldura', 'MOLDURA DE OURO', 'Para lendas vivas.', R.l, 800, 'frag', { frame: '#ffd94a' }),
  I('mo_hela', 'moldura', 'MOLDURA NECRO', 'Verde espectral de Hel.', R.r, 260, 'frag', { frame: '#4dff88' }),
  // --- ÍCONES ---
  I('ic_padrao', 'icone', 'ÍCONE NEXUS', 'O emblema padrão.', R.c, 0, 'frag', { icon: 'nexus' }),
  I('ic_aranha', 'icone', 'ÍCONE ARACNÍDEO', 'Emblema de teia.', R.r, 180, 'frag', { icon: 'web' }),
  I('ic_raio', 'icone', 'ÍCONE TROVÃO', 'Emblema do trovão.', R.r, 180, 'frag', { icon: 'bolt' }),
  I('ic_reator', 'icone', 'ÍCONE REATOR', 'Emblema do reator.', R.r, 180, 'frag', { icon: 'core' }),
  I('ic_caveira', 'icone', 'ÍCONE CAVEIRA', 'Para quem não teme nada.', R.e, 350, 'frag', { icon: 'skull' }),
  I('ic_infinito', 'icone', 'ÍCONE INFINITO', 'Seis gemas em miniatura.', R.l, 900, 'frag', { icon: 'stones' }),
  // --- TEMAS DO LOBBY ---
  I('te_padrao', 'tema', 'BASE NEXUS', 'A base padrão dos heróis.', R.c, 0, 'frag', { lobby: 'nexus' }),
  I('te_asgard', 'tema', 'SALÃO DE ASGARD', 'Dourado e majestoso.', R.e, 500, 'frag', { lobby: 'asgard' }),
  I('te_fabrica', 'tema', 'OFICINA', 'Painéis e consoles industriais.', R.r, 260, 'frag', { lobby: 'factory' }),
  I('te_void', 'tema', 'SANTUÁRIO DO VAZIO', 'Místico e estelar.', R.l, 950, 'frag', { lobby: 'collapse' }),
];

export const itemById = (id) => SHOP_ITEMS.find((i) => i.id === id);
export const itemsByCat = (cat) => SHOP_ITEMS.filter((i) => i.cat === cat);
