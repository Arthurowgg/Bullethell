#!/bin/bash
# MARVEL NEXUS — head emblems (heroes+skins) + 8 new official enemies
cd "$(dirname "$0")/.."
source tools/key.sh
mkdir -p assets/sprites/heads

key assets_raw/sheets/heads_heroes.png /tmp/hh.png
read W HT <<< "$(identify -format '%w %h' /tmp/hh.png)"
CW=$((W/6)); IN=10
hh=(arachnid stormgod ironknight merc claws mystic)
for i in 0 1 2 3 4 5; do
  convert /tmp/hh.png -crop $((CW-2*IN))x$((HT-2*IN))+$((i*CW+IN))+${IN} +repage \
    -fuzz 28% -transparent "rgb(255,0,255)" -channel A -threshold 40% +channel -trim +repage \
    -filter point -resize 32x32 assets/sprites/heads/head_${hh[$i]}.png
done

key assets_raw/sheets/heads_skins.png /tmp/hs.png
read W HT <<< "$(identify -format '%w %h' /tmp/hs.png)"
CW=$((W/5)); IN=10
hs=(miles ragnarok hulkbuster xforce umbral)
for i in 0 1 2 3 4; do
  convert /tmp/hs.png -crop $((CW-2*IN))x$((HT-2*IN))+$((i*CW+IN))+${IN} +repage \
    -fuzz 28% -transparent "rgb(255,0,255)" -channel A -threshold 40% +channel -trim +repage \
    -filter point -resize 32x32 assets/sprites/heads/head_${hs[$i]}.png
done

key assets_raw/sheets/enemies_a.png /tmp/ea.png
read W HT <<< "$(identify -format '%w %h' /tmp/ea.png)"
CW=$((W/4)); IN=12
ea=(outrider kree sakaaran aim)
for i in 0 1 2 3; do
  convert /tmp/ea.png -crop $((CW-2*IN))x$((HT-2*IN))+$((i*CW+IN))+${IN} +repage \
    -fuzz 28% -transparent "rgb(255,0,255)" -channel A -threshold 40% +channel -trim +repage \
    -filter point -resize 24x24 assets/sprites/enemies/${ea[$i]}.png
done

key assets_raw/sheets/enemies_b.png /tmp/eb.png
read W HT <<< "$(identify -format '%w %h' /tmp/eb.png)"
CW=$((W/4)); IN=12
eb=(hydra mysterio destroyer skrull)
for i in 0 1 2 3; do
  convert /tmp/eb.png -crop $((CW-2*IN))x$((HT-2*IN))+$((i*CW+IN))+${IN} +repage \
    -fuzz 28% -transparent "rgb(255,0,255)" -channel A -threshold 40% +channel -trim +repage \
    -filter point -resize 24x24 assets/sprites/enemies/${eb[$i]}.png
done
echo cut7-done
