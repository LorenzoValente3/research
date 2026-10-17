# Lorenzo Valente, research website

Source of my personal website, served with GitHub Pages at
**https://lorenzovalente3.github.io/research/**

I am a PhD candidate at the Institute of Experimental Physics of the University
of Hamburg. I work on generative models for the simulation of particle showers
in calorimeters, and on making one shower model reusable across detector
geometries.

## What is on the site

- **Research**: multi-geometry pre-training, cross-geometry transfer, datasets.
- **About**: short biography and timeline.
- **News**
- **Publications**: papers with links to arXiv, the journal, code, data and a one-page summary.
- **Talks**: conference talks with slides and recordings where public.
- **Teaching**
- **Code and data**: repositories, datasets and pre-trained weights.
- **CV**: `cv/Lorenzo_Valente_CV.pdf`

## How it is built

A single static page, no framework and no build step.

| File | Role |
|---|---|
| `index.html` | the whole page |
| `style.css` | layout and colours |
| `shower.js` | replays the Geant4 showers of `showers.json` behind the hero, plain canvas, no libraries. Click anywhere outside a link to fire a shower. A simple JavaScript cascade stands in while the file loads. |
| `showers.json` | 112 Geant4 showers, 14 particle types at 8 energies in the OpenDataDetector, read by `shower.js` |
| `geant4/` | `sim.sh` simulates the showers (SLURM, Key4hep `ddsim`), `convert.py` turns the EDM4hep output into `showers.json` |
| `notes/` | short pages: the paper summaries and how the showers are made |
| `images/` | portrait, figures and logos, paper thumbnails in `images/papers/` |
| `cv/` | the CV served by the site |
| `tests/` | checks of `shower.js` without a browser (`test_shower_click.js`, `test_g4_replay.js`) and Firefox headless screenshots at several widths (`screens.sh`, `screens_full.sh`). Run from the repo root with `sbatch tests/test.sh` or `sbatch tests/screens.sh`, output in `tests/out/` (ignored by git) |

To preview it locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

To regenerate the showers, run `sbatch geant4/sim.sh` in a Key4hep environment,
then `python3 geant4/convert.py <root_dir> showers.json` on its output, and raise
the `?v=` of `showers.json` in `shower.js`.

After a change to `style.css` or `shower.js`, raise the `?v=` number on the
matching line of `index.html`, so browsers drop the cached copy.

## Contact

[lorenzo.valente@uni-hamburg.de](mailto:lorenzo.valente@uni-hamburg.de)
