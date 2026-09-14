# MARVEL NEXUS — Bullet Hell 2D Pixel Art

Fan game **bullet hell** top-down em pixel art, inspirado no universo Marvel.
Sem fins lucrativos, sem afiliação com a Marvel.

## Jogar

```bash
python3 -m http.server 8080 --bind 0.0.0.0   # ou qualquer servidor estático
# abra http://localhost:8080
```

### Controles

| Ação | Tecla |
|---|---|
| Mover | WASD / setas |
| Mirar / atirar (auto) | Mouse |
| Esquiva (i-frames) | Espaço |
| Habilidade | Q |
| Especial (carrega com dano/abates) | E |
| Pausa | P / Esc |

Gamepad suportado (analógico esquerdo move, direito mira, A/B/X/Y mapeados).

## O que existe hoje

- **6 heróis jogáveis** com kits distintos (básico / habilidade / especial / passiva):
  Homem-Aranha, Thor, Iron Man, Deadpool, Wolverine e Doutor Estranho.
- **8 tipos de inimigos** com comportamentos próprios (formação, enxame, erratico,
  kite, tanque com laser, fase/espectro, charger de gelo, wander explosivo).
- **5 incursões** com bosses: Ultron Prime, Loki, Hela, Devorador do Nexus e
  Thanos Corrompido — cada um com fases e padrões bullet hell próprios
  (anéis com gap, espirais, leques, chuva, ondas, lasers com aviso, zonas,
  poços de gravidade, perseguição).
- **Partida padrão** com ondas crescentes, mini-eventos, XP + escolha de
  upgrades (30+ upgrades, incluindo builds específicas por herói) e chefe final.
- **Lobby** com 8 abas funcionais: JOGAR, HERÓIS, LOJA, NEXUS CORE, INCURSÕES,
  COLEÇÃO, MISSÕES e CONFIG.
- **Loja permanente (NEXUS STORE)**: 10 categorias de cosméticos, raridades,
  preços em Fragmentos/Créditos, favoritos, pesquisa, pré-visualização e equip.
- **Progressão permanente (NEXUS CORE)**: árvore de melhorias, nível de conta,
  desbloqueio de heróis e incursões, missões com recompensas, conquistas de
  coleção — tudo salvo em `localStorage`.
- **Áudio 100% sintetizado** (WebAudio): SFX e trilhas chiptune de lobby/combate/boss.
- **HUD** discreta: vida, XP, nível, cooldowns, especial, cronômetro, abates,
  fragmentos e barra de boss com marcas de fase.

## Pipeline de sprites (ImageMagick)

- Heróis: **Hero Emblem Sprites** — sheets de 4 quadros (idle/idle-alt/ataque/
  dano) gerados por IA sobre fundo magenta e processados com ImageMagick
  (`tools/process_sheets.sh`): chroma-key, corte por quadro, normalização 28×28
  e retratos 4× — `assets/sprites/heroes/*_f0..f3.png`.
- Inimigos (grade 4×2) e bosses (pares lado a lado + Thanos) também vêm de
  sheets processados — `assets/sprites/enemies/` e `assets/sprites/bosses/`,
  com fallback procedural automático se o PNG faltar.
- Inimigos, bosses, tiles, props, ícones e balas: pixel art autoral compilada
  pelo módulo `js/core/pixel.js` e exportada para PNG via ImageMagick:

```bash
npm run sprites   # exporta 77 PNGs em assets/sprites/gen/ + contact sheet
```

## Testes

```bash
npm test               # simulação headless: run completa (250s, boss final),
                       # raid vs Ultron, boot dos 6 heróis e 5 incursões
node test/draw_smoke.mjs  # executa todos os paths de draw (telas/abas/overlays)
```

## Arquitetura

```
js/core/      util, fonte bitmap 5x7, pixel compiler, input, áudio, save, partículas
js/data/      heróis, inimigos, bosses, incursões, upgrades, nexus core, loja, missões, sprites
js/game/      arena, projéteis+hazards, padrões bullet hell, player, inimigos, boss, ondas, pickups, HUD, run
js/scenes/    title, lobby (8 abas), game, results + UI imediata pixel
tools/        process_heroes.sh (ImageMagick), build_sprites.mjs (export PNG)
test/         headless.mjs, draw_smoke.mjs
```

## Budget de gerações de imagem (regra de 10 por etapa)

- Etapa 1: 7/10 (1 probe + 6 heróis top-down originais).
- Etapa 2: **10/10** (6 sheets de emblemas de heróis + 1 sheet de inimigos +
  2 sheets de bosses + 1 Thanos). Budget esgotado — qualquer próxima mensagem
  do usuário redefine o budget para a etapa seguinte.
