// ---------------------------------------------------------------------------
// MARVEL NEXUS — data/campaign.js
// The run is ONE continuous bullet-hell campaign: acts of themed waves on the
// main maps, each closed by an incursion (reality tear -> portal -> exclusive
// boss world -> reward -> return). 24 waves + 6 incursions.
// ---------------------------------------------------------------------------

export const WAVE_KINDS = {
  basic:    { dur: 26, count: 14, batch: [1, 2], gap: [0.7, 1.2], pool: ['drone', 'chitauri'], label: 'ONDA DE COMBATE', desc: 'HOSTIS SE APROXIMANDO' },
  combo:    { dur: 28, count: 16, batch: [2, 3], gap: [0.8, 1.3], pool: ['drone', 'symbiote', 'chitauri'], label: 'COMBINAÇÃO HOSTIL', desc: 'MÚLTIPLAS ESPÉCIES DETECTADAS' },
  aerial:   { dur: 26, count: 14, batch: [2, 2], gap: [0.8, 1.2], pool: ['spectre', 'drone', 'sorcerer'], sky: true, label: 'ONDA AÉREA', desc: 'CONTATOS VOANDO ALTO' },
  special:  { dur: 28, count: 14, batch: [1, 2], gap: [0.8, 1.2], pool: ['sorcerer', 'symbiote', 'spectre'], label: 'ONDA ESPECIAL', desc: 'ASSINATURAS ARCANAS' },
  elite:    { dur: 30, count: 10, batch: [1, 2], gap: [1.0, 1.6], pool: ['sentinel', 'jotun', 'spectre'], elite: 0.35, label: 'ELITES DETECTADOS', desc: 'AMEAÇAS APRIMORADAS' },
  event:    { dur: 28, count: 14, batch: [2, 2], gap: [0.8, 1.2], pool: ['drone', 'chitauri', 'symbiote'], event: true, label: 'ONDA INSTÁVEL', desc: 'FLUXO DO NEXUS ANÔMALO' },
  survival: { dur: 32, count: 999, trickle: 0.85, pool: ['drone', 'chitauri', 'symbiote', 'sorcerer'], label: 'SOBREVIVÊNCIA', desc: 'RESISTA À PRESSÃO' },
  miniboss: { dur: 42, count: 8, batch: [1, 1], gap: [2.2, 3.2], pool: ['chitauri', 'drone'], miniboss: true, label: 'ALVO COLOSSAL', desc: 'ASSINATURA MASSIVA DETECTADA' },
  intense:  { dur: 30, count: 22, batch: [2, 3], gap: [0.5, 0.9], pool: ['chitauri', 'symbiote', 'sentinel', 'spectre'], elite: 0.2, event: true, label: 'ALTA INTENSIDADE', desc: 'PRESSÃO MÁXIMA' },
  final:    { dur: 34, count: 26, batch: [3, 3], gap: [0.5, 0.8], pool: ['sentinel', 'jotun', 'chaos', 'spectre'], elite: 0.3, label: 'O VÉU FINAL', desc: 'TUDO O QUE RESTOU' },
};

export const CAMPAIGN = [
  { map: 'wakanda',   waves: ['basic', 'combo', 'aerial', 'elite'] },
  { incursion: 'ultron' },
  { map: 'skydeck',   waves: ['aerial', 'event', 'survival', 'intense'] },
  { incursion: 'loki' },
  { map: 'ruins',     waves: ['basic', 'special', 'miniboss', 'combo'] },
  { incursion: 'hela' },
  { map: 'asgard',    waves: ['aerial', 'event', 'elite', 'intense'] },
  { incursion: 'kang' },
  { map: 'nexuscore', waves: ['special', 'survival', 'miniboss', 'elite'] },
  { incursion: 'devourer' },
  { map: 'newyork',   waves: ['combo', 'event', 'miniboss', 'final'] },
  { incursion: 'thanos', final: true },
];

export const TOTAL_WAVES = CAMPAIGN.reduce((a, s) => a + (s.waves ? s.waves.length : 0), 0);

export const WORLD_LABEL = {
  wakanda: 'REINO DE VIBRANIUM', asgard: 'PONTE DO ARCO-ÍRIS', newyork: 'CRUZAMENTO DOS HERÓIS',
  skydeck: 'PONTE AÉREA DA FROTA', ruins: 'CIDADE EM RUÍNAS', nexuscore: 'CÂMARA DO NEXUS',
  boss_ultron: 'SOKOVIA SUSPENSA', boss_loki: 'SALÃO DAS ILUSÕES', boss_hela: 'REINO DOS MORTOS',
  boss_kang: 'CIDADELA DO TEMPO', boss_devourer: 'VAZIO CÓSMICO', boss_thanos: 'MUNDO EM CINZAS',
};

// locate the segment + inner wave index that owns global wave n (1-based)
export function locateWave(n) {
  let w = 0;
  for (let s = 0; s < CAMPAIGN.length; s++) {
    const seg = CAMPAIGN[s];
    if (!seg.waves) continue;
    for (let i = 0; i < seg.waves.length; i++) {
      w++;
      if (w >= n) return { seg: s, wi: i, wave: w };
    }
  }
  return { seg: CAMPAIGN.length - 1, wi: 0, wave: w };
}
