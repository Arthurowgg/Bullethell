#!/bin/bash
# MARVEL NEXUS — sheet pipeline (ImageMagick 6)
# AI sheets on magenta key -> keyed/trimmed game frames:
#   heroes: 4 frames each (idle, idle-alt, attack, hurt) normalized to 28x28 + 4x portrait
#   enemies: 4x2 grid cells -> per-enemy normalized sprites
#   bosses: side-by-side halves -> per-boss sprites
set -e
SRC=assets_raw/sheets
OUT=assets/sprites
mkdir -p $OUT/heroes $OUT/heroes_big $OUT/enemies $OUT/bosses

key() { # $1 in, $2 out : magenta key + trim
  convert "$1" -fuzz 22% -transparent 'rgb(255,0,255)' -trim +repage "$2"
}
dims() { identify -format '%w %h' "$1"; }

# ---- heroes: 4-frame strips ----
for f in arachnid stormgod ironknight merc claws mystic; do
  key "$SRC/$f.png" /tmp/strip.png
  read W H <<< "$(dims /tmp/strip.png)"
  FW=$((W / 4))
  for i in 0 1 2 3; do
    convert /tmp/strip.png -crop ${FW}x${H}+$((i * FW))+0 +repage \
      -trim +repage -filter box -resize 24x24 \
      -gravity center -background none -extent 28x28 "$OUT/heroes/${f}_f$i.png"
  done
  convert "$OUT/heroes/${f}_f0.png" -filter point -resize 400% "$OUT/heroes_big/$f.png"
done

# ---- enemies: 4x2 grid ----
key "$SRC/enemies.png" /tmp/egrid.png
read W H <<< "$(dims /tmp/egrid.png)"
CW=$((W / 4)); CH=$((H / 2))
names=(drone chitauri symbiote sorcerer sentinel spectre jotun chaos)
boxes=(20x20 20x22 20x20 20x22 26x26 20x24 24x20 12x12)
for idx in 0 1 2 3 4 5 6 7; do
  cx=$(( (idx % 4) * CW )); cy=$(( (idx / 4) * CH ))
  convert /tmp/egrid.png -crop ${CW}x${CH}+${cx}+${cy} +repage \
    -trim +repage -filter box -resize ${boxes[$idx]} \
    -gravity center -background none -extent ${boxes[$idx]} "$OUT/enemies/${names[$idx]}.png"
done

# ---- bosses: side-by-side halves ----
half() { # $1 src, $2 side(L|R), $3 out, $4 box
  key "$1" /tmp/boss.png
  read W H <<< "$(dims /tmp/boss.png)"
  HW=$((W / 2))
  if [ "$2" = L ]; then OFF=0; else OFF=$HW; fi
  convert /tmp/boss.png -crop ${HW}x${H}+${OFF}+0 +repage \
    -trim +repage -filter box -resize $4 "$3"
}
half "$SRC/bosses_a.png" L "$OUT/bosses/ultron.png" 48x48
half "$SRC/bosses_a.png" R "$OUT/bosses/loki.png"   44x48
half "$SRC/bosses_b.png" L "$OUT/bosses/hela.png"   44x48
half "$SRC/bosses_b.png" R "$OUT/bosses/devourer.png" 48x48
key "$SRC/thanos.png" /tmp/th.png
convert /tmp/th.png -filter box -resize 60x64 "$OUT/bosses/thanos.png"

echo OK
identify $OUT/heroes/arachnid_f0.png $OUT/enemies/drone.png $OUT/bosses/thanos.png | awk '{print $1, $3}'
