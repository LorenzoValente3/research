#!/bin/bash
#SBATCH --partition=allcpu,maxcpu
#SBATCH --time=0-00:20:00
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=2
#SBATCH --mem=8G
#SBATCH --job-name=site_screens_full
#SBATCH --output=tests/out/screens_full_%j.out
# Whole-page screenshots of the site working tree at four widths, cut into
# screen-sized tiles. The window is taller than the page, the hero is pinned to
# one screen height so it does not stretch with the window.
# Usage, from the repo root: sbatch tests/screens_full.sh   -> tests/out/screens_full_<jobid>/<W>_<NN>.png
SITE=$SLURM_SUBMIT_DIR
O=$SITE/tests/out/screens_full_$SLURM_JOB_ID
mkdir -p "$O/site"
(cd "$SITE" && git ls-files -z | xargs -0 cp --parents -t "$O/site")
cp "$SITE"/{index.html,style.css,shower.js} "$O/site/"
PORT=$((8000 + SLURM_JOB_ID % 1000))
python3 -m http.server $PORT --bind 127.0.0.1 --directory "$O/site" >/dev/null 2>&1 &
SRV=$!
sleep 3
for S in 375x812 768x1024 1280x800 1920x1080; do
  W=${S%x*}; H=${S#*x}
  sed "s#</head>#<style>*{animation:none!important} .hero{min-height:${H}px!important} .nav{position:absolute!important}</style></head>#" "$SITE/index.html" > "$O/site/index_$W.html"
  for try in 1 2; do
    P=$(mktemp -d "$O/prof.XXXX")
    timeout 120 firefox --headless --no-remote --profile "$P" --window-size=$W,9000 --screenshot "$O/full_$W.png" "http://127.0.0.1:$PORT/index_$W.html" >/dev/null 2>&1
    [ -s "$O/full_$W.png" ] && break
    sleep 2
  done
  python3 - "$O/full_$W.png" "$H" <<'PY'
import os, sys
from PIL import Image
p, h = sys.argv[1], int(sys.argv[2])
im = Image.open(p)
px = im.convert('L').load()
# trim the empty tail below the footer: last row that is not uniform
y_end = im.height
while y_end > 0 and len(set(px[x, y_end - 1] for x in range(0, im.width, 7))) == 1:
    y_end -= 1
n = 0
for y in range(0, y_end, h):
    d, b = os.path.split(p)
    im.crop((0, y, im.width, min(y + h, y_end))).save(os.path.join(d, b[5:-4] + f'_{n:02d}.png'))
    n += 1
print(p, im.size, 'page height', y_end, 'tiles', n)
PY
done
kill $SRV
