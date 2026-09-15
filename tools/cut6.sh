#!/bin/bash
# MARVEL NEXUS — static heroes/skins sheets + boss fixes + loki_ugly v2
cd "$(dirname "$0")/.."
source tools/key.sh
HD=assets/sprites/heroes
HB=assets/sprites/heroes_big
S=assets/sprites/skins
SB=assets/sprites/skins_big
B=assets/sprites/bosses

key assets_raw/sheets/heroes_all.png /tmp/ha.png
read W HT <<< "$(identify -format '%w %h' /tmp/ha.png)"
CW=$((W/6)); IN=16
heroes=(arachnid stormgod ironknight merc claws mystic)
for i in 0 1 2 3 4 5; do
  h=${heroes[$i]}
  convert /tmp/ha.png -crop $((CW-2*IN))x$((HT-2*IN))+$((i*CW+IN))+${IN} +repage \
    -fuzz 28% -transparent "rgb(255,0,255)" -channel A -threshold 40% +channel -trim +repage \
    -filter point -resize 28x28! /tmp/cell.png
  for f in 0 1 2 3; do cp /tmp/cell.png "$HD/${h}_f${f}.png"; done
  cp /tmp/cell.png "$HD/$h.png"
  convert /tmp/cell.png -filter point -resize 400% "$HB/$h.png"
done

key assets_raw/sheets/skins_all.png /tmp/sa.png
read W HT <<< "$(identify -format '%w %h' /tmp/sa.png)"
CW=$((W/5)); IN=16
skins=(miles ragnarok hulkbuster xforce umbral)
for i in 0 1 2 3 4; do
  s=${skins[$i]}
  convert /tmp/sa.png -crop $((CW-2*IN))x$((HT-2*IN))+$((i*CW+IN))+${IN} +repage \
    -fuzz 28% -transparent "rgb(255,0,255)" -channel A -threshold 40% +channel -trim +repage \
    -filter point -resize 28x28! /tmp/cell.png
  for f in 0 1 2 3; do cp /tmp/cell.png "$S/${s}_f${f}.png"; done
  cp /tmp/cell.png "$S/$s.png"
  convert /tmp/cell.png -filter point -resize 400% "$SB/$s.png"
done

key assets_raw/sheets/bosses_fix.png /tmp/bf.png
read W HT <<< "$(identify -format '%w %h' /tmp/bf.png)"
CW=$((W/3)); IN=20
bosses=(ultron loki hela)
for i in 0 1 2; do
  b=${bosses[$i]}
  convert /tmp/bf.png -crop $((CW-2*IN))x$((HT-2*IN))+$((i*CW+IN))+${IN} +repage \
    -fuzz 28% -transparent "rgb(255,0,255)" -channel A -threshold 40% +channel -trim +repage \
    -filter point -resize 64x68 \
    -gravity center -background none -extent 64x68 "$B/$b.png"
done

key assets_raw/ui/loki_ugly2.png /tmp/lu2.png
convert /tmp/lu2.png -channel A -threshold 40% +channel -trim +repage \
  -filter point -resize 64x64! assets/sprites/ui/loki_ugly.png
echo cut6-done
