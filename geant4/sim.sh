#!/bin/bash
#SBATCH --partition=allcpu
#SBATCH --time=06:00:00
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=2
#SBATCH --mem=8G
#SBATCH --job-name=site_g4
#SBATCH --output=/data/dust/user/valentel/maxwell.merged/general_caloAI/temporary/site_geant4_20261014/log/sim_%A_%a.out
#SBATCH --error=/data/dust/user/valentel/maxwell.merged/general_caloAI/temporary/site_geant4_20261014/log/sim_%A_%a.err

# Geant4 showers in the full OpenDataDetector for the website hero. The gun sits just in
# front of the ECal (r = 1.2 m), so the solenoid field does not curl soft primaries away in
# the tracker. One array task per particle type, a fixed energy grid, NEV events per
# energy, all MC particles kept so the shower tracks can be drawn.
# Usage: sbatch --array=0-13 sim.sh   (env: ENERGIES="2 5 ...", NEV=3)

PARTICLES=(e- e+ gamma mu- mu+ pi+ pi- pi0 kaon+ kaon- kaon0L proton anti_proton neutron)
P=${PARTICLES[$SLURM_ARRAY_TASK_ID]}
ENERGIES=${ENERGIES:-"2 5 10 20 50 100 200"}
NEV=${NEV:-3}

WORK=/data/dust/user/valentel/maxwell.merged/general_caloAI
OUT=${OUT:-$WORK/temporary/site_geant4_20261014/root_v2}
mkdir -p "$OUT"

source /cvmfs/sw.hsf.org/key4hep/setup.sh -r 2025-05-29
source $WORK/OpenDataDetector/install/bin/this_odd.sh
COMPACT=$WORK/OpenDataDetector/install/share/OpenDataDetector/xml/OpenDataDetector.xml

for E in $ENERGIES; do
    # small phi offset so the primary does not run along a stave boundary,
    # the start point lies on the same line from the origin
    SEED=$((1000 * SLURM_ARRAY_TASK_ID + E))
    /usr/bin/time -v ddsim --compactFile "$COMPACT" \
        --enableGun --gun.particle "$P" --gun.energy "${E}*GeV" \
        --gun.position "(1200,60,0)" --gun.direction "(1,0.05,0)" \
        --part.keepAllParticles True --part.userParticleHandler "" --physicsList FTFP_BERT \
        --random.seed $SEED -N $NEV \
        --outputFile "$OUT/${P}_${E}GeV.edm4hep.root" 2>&1 | tail -n 40
    ls -l "$OUT/${P}_${E}GeV.edm4hep.root"
done
