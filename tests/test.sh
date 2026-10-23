#!/bin/bash
#SBATCH --partition=allcpu,maxcpu
#SBATCH --time=0-00:10:00
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=1
#SBATCH --mem=2G
#SBATCH --job-name=site_test
#SBATCH --output=tests/out/test_%j.out
# Click and Geant4-replay tests of shower.js, no browser.
# Usage, from the repo root: sbatch tests/test.sh   (env NODE if node is not on PATH)
set -e
NODE=${NODE:-node}
# Every page links the same style.css?v=, else the stale pages serve the cached CSS. SITE: another tree.
SITE=${SITE:-$SLURM_SUBMIT_DIR}
css=$(cat "$SITE"/*.html "$SITE"/*/*.html | grep -o 'style\.css?v=[^"'\'']*' | sort -u || true)
if [ "$(printf '%s\n' "$css" | wc -l)" -gt 1 ]; then echo "FAIL style.css versions differ:" $css; exit 1; fi
echo "ok   one style.css version: $css"
$NODE "$SLURM_SUBMIT_DIR/tests/test_shower_click.js"
$NODE "$SLURM_SUBMIT_DIR/tests/test_g4_replay.js"
