#!/bin/bash
# MARVEL NEXUS — improved magenta keying (ImageMagick 6)
# flood-fill from the 4 corners (removes only background connected to edges,
# keeping interior pink/magenta-ish art) + pure-magenta sweep + alpha binarize.
key() { # $1 in, $2 out
  read W H <<< "$(identify -format '%w %h' "$1")"
  convert "$1" -fuzz 45% -fill none \
    -draw "color 0,0 floodfill" -draw "color $((W-1)),0 floodfill" \
    -draw "color 0,$((H-1)) floodfill" -draw "color $((W-1)),$((H-1)) floodfill" \
    -fuzz 14% -transparent 'rgb(255,0,255)' \
    -channel A -despeckle +channel "$2"
}
# per-cell finalize: sweep residual grid lines, binarize alpha (pixel art is opaque), trim
cellkey() { # $1 in, $2 out, $3 fuzz
  convert "$1" -fuzz "${3:-28}%" -transparent 'rgb(255,0,255)' \
    -channel A -threshold 40% +channel -trim +repage "$2"
}
