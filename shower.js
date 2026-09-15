// Particles crossing a calorimeter, drawn behind the hero text.
// Kinds: e (electron or positron), g (photon), h (charged hadron: pion, kaon,
// proton), n (neutron or neutral kaon), mu (muon), nu (neutrino).
// Energies in GeV. Primaries enter log-uniform between 1 GeV and 1 TeV.
// Electrons and photons cascade Heitler-style (split after one radiation
// length, energy halves, small angular kick). Hadrons ionise minimally until
// one interaction length, then break into secondaries whose number grows with
// the energy, softer ones at wider angles, some of them neutral pions that
// show up as photons, plus a few slow nuclear fragments in every direction.
// The cascade is resolved track by track down to 1/64 of the primary energy.
// Below that, each leaf is drawn as what the calorimeter sees: an unresolved
// sub-shower, a cloud of deposits along its direction with a gamma-like
// longitudinal profile, a Moliere-like lateral spread, a length growing with
// log(E) and a number of deposits growing with E. Deposits fluctuate
// Landau-like. Muons ionise minimally and leave. Neutrinos and neutrons
// deposit nothing. Off with reduced motion. Phones (narrow or touch) get a
// lighter budget: 1 to 100 GeV, fewer deposits and tracks, sparser showers.
(function () {
    var canvas = document.querySelector('.shower');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, last = 0, nextShower = -1e9;
    var dots = [], tracks = [], segs = [];
    var LITE = window.matchMedia('(max-width: 700px), (pointer: coarse)').matches;
    var LIFE = 7, SPEED = 170, MAX_DOTS = LITE ? 1500 : 5000, MAX_TRACKS = LITE ? 150 : 400;
    var E_MAX_DEC = LITE ? 2 : 3, GAP = LITE ? 1.5 : 1.0, PREROLL = LITE ? 0 : 8;
    var E_CRIT = 0.01, STEP = 7;
    var COLOR = { e: '46,196,214', g: '255,255,255', h: '255,181,71', n: '255,181,71', mu: '220,225,240', nu: '220,225,240' };
    var DASH = { g: [4, 4], n: [1, 5], nu: [2, 8] };
    var MIX = [['e', 0.28], ['g', 0.18], ['h', 0.24], ['n', 0.08], ['mu', 0.1], ['nu', 0.12]];

    var text = document.querySelector('.hero-text'), hole = null;
    function resize() {
        W = canvas.width = canvas.clientWidth;
        H = canvas.height = canvas.clientHeight;
        // particles are drawn dimmer behind the text block
        hole = null;
        if (text) {
            var c = canvas.getBoundingClientRect(), r = text.getBoundingClientRect();
            hole = { x: r.left - c.left - 16, y: r.top - c.top - 12, w: r.width + 32, h: r.height + 24 };
        }
    }
    function randn() {
        var u = 1 - Math.random(), v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    function pickKind() {
        var r = Math.random();
        for (var i = 0; i < MIX.length; i++) { r -= MIX[i][1]; if (r <= 0) return MIX[i][0]; }
        return 'e';
    }
    function radLength() { return H * (0.05 + 0.04 * Math.random()); }
    function intLength() { return H * (0.2 + 0.25 * Math.random()); }
    function pathLength(kind) {
        if (kind === 'e') return radLength();
        if (kind === 'g') return radLength() * 9 / 7 * (0.5 + 1.5 * Math.random());
        if (kind === 'h' || kind === 'n') return intLength();
        return 1e9;
    }
    function track(kind, x, y, a, e) {
        return { k: kind, x: x, y: y, a: a, e: e, left: pathLength(kind), since: 0, lx: x, ly: y };
    }
    // slow nuclear fragment: a short range-out with a Bragg peak, no further split
    function stub(kind, x, y, a) {
        var t = track(kind, x, y, a, E_CRIT);
        t.stub = t.len = STEP * (1.5 + 2 * Math.random());
        t.left = t.len;
        return t;
    }
    // unresolved sub-shower: deposits along the direction, no further split.
    // n = mean deposits per STEP at the shower maximum, w = lateral scale (px)
    function cloud(q) {
        var em = q.k !== 'h';
        q.k = em ? 'e' : 'h';
        q.cloud = true;
        q.len = q.left = Math.max(STEP, em ? radLength() * Math.log(q.e / E_CRIT)
            : intLength() * (0.5 + 0.1 * Math.log(1 + q.e)));
        q.n = (em ? 6 : 4) * Math.pow(q.e, 0.6) * STEP / q.len;
        q.w = em ? 5 : 14;
        q.tm = em ? 0.35 : 0.3;
        q.r0 = 0.6 + 0.3 * Math.log(1 + q.e / 0.1);
        return q;
    }
    function spawn() {
        var kind = pickKind();
        var e = Math.pow(10, E_MAX_DEC * Math.random());
        var t = track(kind, W * (0.05 + 0.9 * Math.random()), -10, (Math.random() - 0.5) * 0.5, e);
        t.e0 = e;
        tracks.push(t);
    }
    function deposits(kind) { return kind === 'e' || kind === 'h' || kind === 'mu'; }

    function split(p, now, born) {
        var out = [];
        if (p.k === 'e') {
            // bremsstrahlung: electron keeps half, photon takes half
            var kick = 0.12 + 0.18 * Math.sqrt(E_CRIT / p.e);
            out.push(track('e', p.x, p.y, p.a - kick * (0.4 + Math.random()), p.e / 2));
            out.push(track('g', p.x, p.y, p.a + kick * (0.4 + Math.random()), p.e / 2));
        } else if (p.k === 'g') {
            // pair production
            var k2 = 0.12 + 0.18 * Math.sqrt(E_CRIT / p.e);
            out.push(track('e', p.x, p.y, p.a - k2 * (0.4 + Math.random()), p.e / 2));
            out.push(track('e', p.x, p.y, p.a + k2 * (0.4 + Math.random()), p.e / 2));
        } else {
            // hadronic interaction: multiplicity grows with log(E), soft
            // secondaries at wide angles, slow nuclear fragments anywhere
            var n = Math.min(16, 2 + Math.floor(Math.random() * 3) + Math.floor(1.5 * Math.log2(1 + 8 * p.e)));
            var w = [], sum = 0, i;
            for (i = 0; i < n; i++) { w.push(0.2 + Math.random()); sum += w[i]; }
            for (i = 0; i < n; i++) {
                var r = Math.random(), kind = r < 0.5 ? 'h' : (r < 0.85 ? 'g' : 'n');
                var ei = p.e * w[i] / sum;
                var kh = (0.15 + 0.7 * Math.random()) / Math.sqrt(1 + 4 * ei);
                out.push(track(kind, p.x, p.y, p.a + (Math.random() < 0.5 ? -kh : kh), ei));
            }
            var nf = 1 + Math.floor(Math.random() * 3);
            for (i = 0; i < nf; i++) out.push(stub('h', p.x, p.y, Math.random() * 2 * Math.PI));
        }
        var vis = Math.max(p.e0 / 64, 4 * E_CRIT);
        for (var j = 0; j < out.length; j++) {
            if (tracks.length + born.length >= MAX_TRACKS) break;
            var q = out[j];
            q.e0 = p.e0;
            if (q.e >= vis || q.stub) born.push(q);
            else if (q.k !== 'n') born.push(cloud(q));
        }
    }

    function step(dt, now) {
        if (now > nextShower) {
            spawn();
            nextShower = now + GAP * (1 + Math.random());
        }
        var born = [];
        for (var i = tracks.length - 1; i >= 0; i--) {
            var p = tracks[i];
            var d = SPEED * dt;
            p.x += Math.sin(p.a) * d;
            p.y += Math.cos(p.a) * d;
            p.left -= d;
            p.since += d;
            var stepLen = p.k === 'mu' ? STEP * 2 : STEP;
            if (p.since >= stepLen) {
                p.since = 0;
                segs.push({ k: p.k, x1: p.lx, y1: p.ly, x2: p.x, y2: p.y, e: p.e, born: now });
                p.lx = p.x; p.ly = p.y;
                if (p.cloud) {
                    // gamma-like profile peaking at tm, lateral spread growing with depth
                    var t = 1 - p.left / p.len, shape = (t / p.tm) * Math.exp(1 - t / p.tm);
                    var kd = Math.floor(p.n * shape + Math.random());
                    var sg = p.w * (0.25 + t), ca = Math.cos(p.a), sa = Math.sin(p.a);
                    for (var c = 0; c < kd && dots.length < MAX_DOTS; c++) {
                        var u = randn() * sg, v = randn() * STEP / 2;
                        dots.push({
                            x: p.x + u * ca + v * sa, y: p.y - u * sa + v * ca,
                            r: Math.min(6, p.r0 * (0.6 + 0.8 * shape) * Math.exp(0.35 * randn())),
                            born: now, c: COLOR[p.k]
                        });
                    }
                } else if (deposits(p.k) && dots.length < MAX_DOTS) {
                    // dE/dx: Bragg rise along a stub, 1/beta^2-ish for slow
                    // hadrons, otherwise a MIP, Landau tail on everything
                    var r = p.stub ? 1.2 + 1.6 * (1 - p.left / p.len)
                        : p.k === 'h' ? 0.8 + 0.5 * Math.sqrt(E_CRIT / p.e)
                        : 1.0;
                    dots.push({
                        x: p.x + randn() * 1.2, y: p.y + randn() * 1.2,
                        r: Math.min(6, r * Math.exp(0.35 * randn())), born: now, c: COLOR[p.k]
                    });
                }
            }
            if (p.y > H + 10 || p.x < -20 || p.x > W + 20) { tracks.splice(i, 1); continue; }
            if (p.left <= 0) { tracks.splice(i, 1); if (!p.stub && !p.cloud) split(p, now, born); }
        }
        tracks = tracks.concat(born);
        for (var j = dots.length - 1; j >= 0; j--) if (now - dots[j].born > LIFE) dots.splice(j, 1);
        for (var m = segs.length - 1; m >= 0; m--) if (now - segs[m].born > LIFE) segs.splice(m, 1);
    }

    function inHole(x, y) {
        return x >= hole.x && x <= hole.x + hole.w && y >= hole.y && y <= hole.y + hole.h;
    }
    // inside: undefined paints all, true only what falls in the text hole, false the rest
    function paint(now, gain, inside) {
        for (var k = 0; k < segs.length; k++) {
            var g = segs[k];
            if (inside !== undefined && inHole((g.x1 + g.x2) / 2, (g.y1 + g.y2) / 2) !== inside) continue;
            var base = (g.k === 'nu' || g.k === 'n') ? 0.16 : (g.k === 'g' ? 0.24 : 0.38);
            var la = gain * base * (1 - (now - g.born) / LIFE);
            ctx.beginPath();
            ctx.setLineDash(DASH[g.k] || []);
            ctx.moveTo(g.x1, g.y1);
            ctx.lineTo(g.x2, g.y2);
            ctx.lineWidth = 0.4 + 0.15 * Math.log(1 + g.e / E_CRIT);
            ctx.strokeStyle = 'rgba(' + COLOR[g.k] + ',' + la.toFixed(3) + ')';
            ctx.stroke();
        }
        ctx.setLineDash([]);
        for (var i = 0; i < dots.length; i++) {
            var d = dots[i];
            if (inside !== undefined && inHole(d.x, d.y) !== inside) continue;
            var a = gain * 0.7 * (1 - (now - d.born) / LIFE);
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(' + d.c + ',' + a.toFixed(3) + ')';
            ctx.fill();
        }
    }

    function draw(now) {
        ctx.clearRect(0, 0, W, H);
        if (!hole) { paint(now, 1); return; }
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.rect(hole.x, hole.y, hole.w, hole.h);
        ctx.clip('evenodd');
        paint(now, 1, false);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.rect(hole.x, hole.y, hole.w, hole.h);
        ctx.clip();
        paint(now, 0.45, true);
        ctx.restore();
    }

    var running = false, slow = 0, dead = false;
    function frame(ts) {
        if (!running) return;
        var now = ts / 1000;
        var raw = last ? now - last : 0.016;
        // device cannot keep up (below ~12 fps for 20 frames): give up for good
        if (raw > 0.08) slow++; else if (slow > 0) slow--;
        if (slow > 20) { dead = true; running = false; ctx.clearRect(0, 0, W, H); return; }
        var dt = Math.min(0.05, raw);
        last = now;
        step(dt, now);
        draw(now);
        requestAnimationFrame(frame);
    }
    function run(on) {
        if (dead || on === running) return;
        running = on;
        last = 0;
        if (on) requestAnimationFrame(frame);
    }

    function init() {
        resize();
        window.addEventListener('resize', resize);
        for (var t = -PREROLL; t < 0; t += 1 / 30) step(1 / 30, t);
        draw(0);
        // animate only while the hero is on screen (battery on phones)
        if (window.IntersectionObserver) {
            new window.IntersectionObserver(function (es) { run(es[0].isIntersecting); }).observe(canvas);
        } else {
            run(true);
        }
    }
    // phones: let the page paint first, start the cascade afterwards
    if (LITE) setTimeout(init, 300); else init();
})();
