#!/bin/bash
# MARVEL NEXUS — hero sprite pipeline (ImageMagick 6)
# raw AI pixel-art on magenta key -> keyed/trimmed/normalized game sprite (28x28)
# + 4x nearest-neighbour portrait used by lobby / shop / selection screens.
set -e
SRC=assets_raw/heroes
OUT=assets/sprites/heroes
BIG=assets/sprites/heroes_big
for f in arachnid stormgod ironknight merc claws mystic; do
  convert "$SRC/$f.png" \
    -fuzz 22% -transparent 'rgb(255,0,255)' \
    -trim +repage \
    -filter box -resize 28x28 \
    -gravity center -background none -extent 28x28 \
    "$OUT/$f.png"
  convert "$OUT/$f.png" -filter point -resize 400% "$BIG/$f.png"
done
