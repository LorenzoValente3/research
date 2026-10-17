#!/bin/bash
#SBATCH --partition=allcpu,maxcpu
#SBATCH --time=0-00:20:00
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=2
#SBATCH --mem=6G
#SBATCH --job-name=site_screens
#SBATCH --output=tests/out/screens_%j.out
# Viewport screenshots of the site working tree at several screen sizes (hero and research).
# One fresh Firefox profile per shot, one retry, so a single crash does not stop the run.
# Usage, from the repo root: sbatch tests/screens.sh   -> tests/out/screens_<jobid>/<W>x<H>_<view>.png
SITE=$SLURM_SUBMIT_DIR
O=$SITE/tests/out/screens_$SLURM_JOB_ID
mkdir -p "$O/site"
(cd "$SITE" && git ls-files -z | xargs -0 cp --parents -t "$O/site")
cp "$SITE"/{index.html,style.css,shower.js} "$O/site/"
sed -i 's#</head>#<style>*{animation:none!important}</style></head>#' "$O/site/index.html"
PORT=$((8000 + SLURM_JOB_ID % 1000))
python3 -m http.server $PORT --bind 127.0.0.1 --directory "$O/site" >/dev/null 2>&1 &
SRV=$!
sleep 3
shot() {
  for try in 1 2; do
    P=$(mktemp -d "$O/prof.XXXX")
    timeout 90 firefox --headless --no-remote --profile "$P" --window-size=$1 --screenshot "$O/$2.png" "http://127.0.0.1:$PORT/$3" >/dev/null 2>&1
    [ -s "$O/$2.png" ] && return
    sleep 2
  done
  echo "FAILED $2"
}
for S in 360x780 414x896 768x1024 1024x768 1280x800 1920x1080 2560x1440; do
  shot ${S/x/,} ${S}_hero index.html
  shot ${S/x/,} ${S}_research 'index.html#research'
done
kill $SRV
ls "$O"/*.png
