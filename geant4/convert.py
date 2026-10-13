"""EDM4hep showers from sim.sh -> compact JSON for the website hero (shower.js).

Each event is projected on the plane spanned by the primary direction (depth) and its
transverse partner in x-y (lateral). Only the calorimeter window is kept. Tracks are
MC particles drawn as straight chords from vertex to endpoint, hits are calorimeter
cells. Units in the output: mm (relative to the window start), GeV, ns.

Usage: python3 convert.py <root_dir> <out.json> [--tracks N] [--hits N]
"""

import argparse
import glob
import json
import math
import os
import re

from podio.root_io import Reader

DIR = (1.0, 0.05)  # primary direction in x-y, as in sim.sh
NORM = math.hypot(*DIR)
D = (DIR[0] / NORM, DIR[1] / NORM)
N = (-D[1], D[0])
WIN = (1150.0, 3500.0)  # depth window: just before the ECal front to the HCal back
LAT = 700.0  # lateral half width kept
C_MM_NS = 299.792458
CALO = ("ECalBarrelCollection", "HCalBarrelCollection", "ECalEndcapCollection", "HCalEndcapCollection")


def kind(pdg, charge):
    a = abs(pdg)
    if a == 11:
        return "e"
    if a == 22:
        return "g"
    if a == 13:
        return "mu"
    if a in (12, 14, 16):
        return "nu"
    return "h" if charge != 0 else "n"


def proj(v):
    return v.x * D[0] + v.y * D[1], v.x * N[0] + v.y * N[1]


def clip(u0, v0, u1, v1):
    """Clip the chord to the depth window, None if it lies outside."""
    lo, hi = WIN
    if max(u0, u1) < lo or min(u0, u1) > hi:
        return None
    du = u1 - u0
    f0, f1 = 0.0, 1.0
    if du != 0:
        fa, fb = (lo - u0) / du, (hi - u0) / du
        f0, f1 = max(f0, min(fa, fb)), min(f1, max(fa, fb))
    if f0 >= f1:
        return None
    return f0, f1


def event_json(ev, n_tracks, n_hits):
    mcs = ev.get("MCParticles")
    e0 = mcs[0].getEnergy()
    tracks = []
    for p in mcs:
        k = kind(p.getPDG(), p.getCharge())
        if k == "nu":
            continue
        e = p.getEnergy()
        ekin = e - p.getMass()
        # neutral hadrons are faint dashes, keep only the energetic ones
        if ekin < max(0.002 * e0, 0.005) or (k == "n" and ekin < 0.05):
            continue
        u0, v0 = proj(p.getVertex())
        u1, v1 = proj(p.getEndpoint())
        f = clip(u0, v0, u1, v1)
        if f is None:
            continue
        mom = p.getMomentum()
        pmag = math.sqrt(mom.x**2 + mom.y**2 + mom.z**2)
        beta = max(pmag / e, 0.05) if e > 0 else 1.0
        vt, ve = p.getVertex(), p.getEndpoint()
        L = math.sqrt((ve.x - vt.x) ** 2 + (ve.y - vt.y) ** 2 + (ve.z - vt.z) ** 2)
        t0 = p.getTime()
        T = L / (beta * C_MM_NS)
        a = (u0 + f[0] * (u1 - u0), v0 + f[0] * (v1 - v0))
        b = (u0 + f[1] * (u1 - u0), v0 + f[1] * (v1 - v0))
        if math.hypot(b[0] - a[0], b[1] - a[1]) < 3 or abs(a[1]) > LAT:
            continue
        tracks.append((ekin, k, a, b, t0 + f[0] * T, t0 + f[1] * T))
    # the most energetic tracks draw the core, an even pick by rank of the rest
    # keeps the soft halo that a pure energy cut would drop
    tracks.sort(key=lambda t: -t[0])
    n_top = min(len(tracks), n_tracks // 2)
    rest = tracks[n_top:]
    k = n_tracks - n_top
    if len(rest) > k > 0:
        rest = [rest[int(i * len(rest) / k)] for i in range(k)]
    tracks = tracks[:n_top] + rest[:k]

    hits = []
    avail = set(ev.getAvailableCollections())
    for name in CALO:
        if name not in avail:
            continue
        for h in ev.get(name):
            u, v = proj(h.getPosition())
            if not (WIN[0] <= u <= WIN[1]) or abs(v) > LAT:
                continue
            ts = [c.getTime() for c in h.getContributions()]
            hits.append((h.getEnergy(), u, v, min(ts) if ts else (u / C_MM_NS)))
    e_vis = sum(h[0] for h in hits)
    hits.sort(key=lambda h: -h[0])
    hits = hits[:n_hits]

    lo = WIN[0]
    r1 = lambda x: round(x, 1)  # noqa: E731
    return {
        "t": [
            [round(a[0] - lo), round(a[1]), round(b[0] - lo), round(b[1]), k, r1(t0), r1(t1), round(ekin, 4)]
            for ekin, k, a, b, t0, t1 in tracks
        ],
        "h": [[round(u - lo), round(v), round(e, 5), r1(t)] for e, u, v, t in hits],
        "ev": round(e_vis, 3),
        "n_mc": len(mcs),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root_dir")
    ap.add_argument("out")
    ap.add_argument("--tracks", type=int, default=220)
    ap.add_argument("--hits", type=int, default=320)
    args = ap.parse_args()

    events = []
    for f in sorted(glob.glob(os.path.join(args.root_dir, "*.edm4hep.root"))):
        m = re.match(r"(.+)_(\d+)GeV\.edm4hep\.root", os.path.basename(f))
        part, energy = m.group(1), int(m.group(2))
        for i, ev in enumerate(Reader(f).get("events")):
            if i == 0 and not events:
                print("collections:", sorted(ev.getAvailableCollections()))
            j = event_json(ev, args.tracks, args.hits)
            print(f"{part:12s} {energy:4d} GeV ev{i}: mc={j['n_mc']} tracks={len(j['t'])} hits={len(j['h'])} E_vis={j['ev']}")
            del j["n_mc"]
            events.append({"p": part, "E": energy, **j})
    out = {"det": "OpenDataDetector", "win": [WIN[0], WIN[1]], "lat": LAT, "ev": events}
    with open(args.out, "w") as fh:
        json.dump(out, fh, separators=(",", ":"))
    print(f"wrote {args.out}: {len(events)} events, {os.path.getsize(args.out) / 1e3:.0f} kB")


if __name__ == "__main__":
    main()
