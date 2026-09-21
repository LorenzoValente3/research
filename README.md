# Lorenzo Valente, research website

Source of my personal website, served with GitHub Pages at
**https://lorenzovalente3.github.io/research/**

I am a PhD candidate at the Institute of Experimental Physics of the University
of Hamburg. I work on generative models for the simulation of particle showers
in calorimeters, and on making one shower model reusable across detector
geometries.

## What is on the site

- **About**: short biography and timeline.
- **Research**: multi-geometry pre-training, cross-geometry transfer, datasets.
- **Publications**: papers with links to arXiv and the journal.
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
| `shower.js` | the particle cascade behind the hero, plain canvas, no libraries. Click in the hero to fire a shower. |
| `images/` | portrait, figures and logos |
| `cv/` | the CV served by the site |

To preview it locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

After a change to `style.css` or `shower.js`, raise the `?v=` number on the
matching line of `index.html`, so browsers drop the cached copy.

## Contact

[lorenzo.valente@uni-hamburg.de](mailto:lorenzo.valente@uni-hamburg.de)
