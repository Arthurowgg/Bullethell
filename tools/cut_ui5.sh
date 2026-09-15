#!/bin/bash
# MARVEL NEXUS — UI asset pipeline (plates, nav icons, logo) + global fringe cleanup
cd "$(dirname "$0")/.."
source tools/key.sh
U=assets_raw/ui
OUTU=assets/sprites/ui
OUTL=assets/sprites/lobby

# --- button plates: 2 cols x 3 rows ---
key $U/btn_plates.png /tmp/bp.png
read W H <<< "$(identify -format '%w %h' /tmp/bp.png)"
CW=$((W/2)); CHH=$((H/3)); IN=10
names=(gold purple hazard cyan green pink)
idx=0
for r in 0 1 2; do
  for c in 0 1; do
    n=${names[$idx]}; idx=$((idx+1))
    convert /tmp/bp.png -crop $((CW-2*IN))x$((CHH-2*IN))+$((c*CW+IN))+$((r*CHH+IN)) +repage \
      -fuzz 28% -transparent "rgb(255,0,255)" -channel A -threshold 40% +channel -trim +repage "$OUTU/plate_$n.png"
  done
done

# --- nav icons: 4 cols x 2 rows -> 16x16 ---
key $U/nav_icons.png /tmp/ni.png
read W H <<< "$(identify -format '%w %h' /tmp/ni.png)"
CW=$((W/4)); CHH=$((H/2)); IN=6
nav=(nav_play nav_gear nav_col nav_cos nav_cart nav_mis nav_dev nav_nexus)
idx=0
for r in 0 1; do
  for c in 0 1 2 3; do
    n=${nav[$idx]}; idx=$((idx+1))
    convert /tmp/ni.png -crop $((CW-2*IN))x$((CHH-2*IN))+$((c*CW+IN))+$((r*CHH+IN)) +repage \
      -fuzz 28% -transparent "rgb(255,0,255)" -channel A -threshold 40% +channel -trim +repage \
      -filter point -resize 16x16! "$OUTL/$n.png"
  done
done

# --- nexus logo: key + integer-ish downscale ---
key $U/nexus_logo.png /tmp/nl.png
convert /tmp/nl.png -channel A -threshold 40% +channel -trim +repage /tmp/nl2.png
read W H <<< "$(identify -format '%w %h' /tmp/nl2.png)"
F=$((W/420)); [ $F -lt 1 ] && F=1
NW=$((W/F)); NH=$((H/F))
convert /tmp/nl2.png -filter point -resize ${NW}x${NH}! "$OUTU/nexus_logo.png"
echo logo ${W}x${H} -\> ${NW}x${NH}

# --- fringe cleanup ONLY on opaque pixel-art finals (never glows/backgrounds) ---
for d in assets/sprites/bosses assets/sprites/skins assets/sprites/skins_big; do
  for f in $d/*.png; do
    convert "$f" -fuzz 18% -transparent "rgb(255,0,255)" -channel A -threshold 40% +channel "$f"
  done
done
for f in assets/sprites/lobby/nav_*.png assets/sprites/ui/loki_ugly.png assets/sprites/heroes/*.png; do
  convert "$f" -fuzz 18% -transparent "rgb(255,0,255)" -channel A -threshold 40% +channel "$f"
done
echo cleanup-done
