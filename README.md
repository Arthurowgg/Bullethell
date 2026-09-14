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
- **Partida padrão em ROUNDS** (escada de 12 rounds): rounds de ondas com
  eventos dinâmicos (Enxame do Caos, Chuva de Fragmentos, Elites à Solta)
  intercalados por 5 incursões de chefe — Ultron, Loki, Hela, Devorador e a
  final contra Thanos. Vencer uma incursão dá fragmentos, vida e +1 nível
  antes do próximo round.
- **30 upgrades** com ícone próprio (folhas de 10 ícones por imagem), incluindo
  builds específicas por herói; cada herói, inimigo e chefe dispara projéteis
  com sprite único.
- **UI de anúncios em estilo HQ pixel-art** (painéis inclinados, meio-tom,
  starbursts, ícones exclusivos por evento, animações de entrada/saída).
- **Lobby enxuto**: abas JOGAR (seleção de herói + partida + incursões) e
  LOJA com duas seções — **NEXUS** (upgrades permanentes customizados por
  herói) e **COSMÉTICA** (visuais exclusivos) — e configurações atrás de um
  ícone de engrenagem discreto.
- **Cosmética (escopo inicial, 3 skins premium)**: ARANHA VENOM (emblema
  negro bio-elétrico, teias viram descargas), TEMPESTADE RUBRA (Thor carmesim)
  e PROTÓTIPO MEIA-NOITE (Iron Man preto-ouro com plasma âmbar). Cada uma com
  sheet animado próprio, efeitos de tiro/rastro/aura distintos — sem vantagem
  de combate.
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
