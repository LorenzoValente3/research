// Particles crossing a calorimeter, drawn behind the hero text.
// Kinds: e (electron or positron), g (photon), h (charged hadron: pion, kaon,
// proton), n (neutron or neutral kaon), mu (muon), nu (neutrino).
// Electrons and photons cascade Heitler-style (split after one radiation
// length, energy halves, small angular kick). Hadrons ionise minimally until
// one interaction length, then break into a few wide-angle secondaries, some
// of them neutral pions that show up as photons. Muons ionise minimally and
// leave. Neutrinos and neutrons deposit nothing. Off with reduced motion.
(function () {
    var canvas = document.querySelector('.shower');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, last = 0, nextShower = -1e9;
    var dots = [], tracks = [], segs = [];
    var LIFE = 7, SPEED = 170, MAX_DOTS = 4000, MAX_TRACKS = 120;
    var E_CRIT = 1 / 32, STEP = 7;
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
    function radLength() { return H * (0.08 + 0.06 * Math.random()); }
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
    function spawn() {
        var kind = pickKind();
        tracks.push(track(kind, W * (0.05 + 0.9 * Math.random()), -10, (Math.random() - 0.5) * 0.5, 1));
    }
    function deposits(kind) { return kind === 'e' || kind === 'h' || kind === 'mu'; }

    function split(p, now, born) {
        var out = [];
        if (p.k === 'e') {
            // bremsstrahlung: electron keeps half, photon takes half
            var kick = 0.12 + 0.18 * Math.sqrt(1 / (p.e * 32));
            out.push(track('e', p.x, p.y, p.a - kick * (0.4 + Math.random()), p.e / 2));
            out.push(track('g', p.x, p.y, p.a + kick * (0.4 + Math.random()), p.e / 2));
        } else if (p.k === 'g') {
            // pair production
            var k2 = 0.12 + 0.18 * Math.sqrt(1 / (p.e * 32));
            out.push(track('e', p.x, p.y, p.a - k2 * (0.4 + Math.random()), p.e / 2));
            out.push(track('e', p.x, p.y, p.a + k2 * (0.4 + Math.random()), p.e / 2));
        } else {
            // hadronic interaction: a few secondaries, wide angles
            var n = 2 + Math.floor(Math.random() * 3), w = [], sum = 0, i;
            for (i = 0; i < n; i++) { w.push(0.2 + Math.random()); sum += w[i]; }
            for (i = 0; i < n; i++) {
                var r = Math.random(), kind = r < 0.5 ? 'h' : (r < 0.85 ? 'g' : 'n');
                var ang = p.a + (Math.random() < 0.5 ? -1 : 1) * (0.2 + 0.5 * Math.random());
                out.push(track(kind, p.x, p.y, ang, p.e * w[i] / sum));
            }
        }
        for (var j = 0; j < out.length; j++) {
            if (out[j].e >= E_CRIT && tracks.length + born.length < MAX_TRACKS) born.push(out[j]);
        }
    }

    function step(dt, now) {
        if (now > nextShower) {
            spawn();
            nextShower = now + 0.8 + 0.8 * Math.random();
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
                if (deposits(p.k) && dots.length < MAX_DOTS) {
                    var mip = p.k === 'mu' || (p.k === 'h' && p.left > 0);
                    dots.push({
                        x: p.x + randn() * 1.2, y: p.y + randn() * 1.2,
                        r: mip ? 1.0 : 0.6 + 2.0 * Math.sqrt(p.e), born: now, c: COLOR[p.k]
                    });
                }
            }
            if (p.y > H + 10 || p.x < -20 || p.x > W + 20) { tracks.splice(i, 1); continue; }
            if (p.left <= 0) { tracks.splice(i, 1); split(p, now, born); }
        }
        tracks = tracks.concat(born);
        for (var j = dots.length - 1; j >= 0; j--) if (now - dots[j].born > LIFE) dots.splice(j, 1);
        for (var m = segs.length - 1; m >= 0; m--) if (now - segs[m].born > LIFE) segs.splice(m, 1);
    }

    function paint(now, gain) {
        for (var k = 0; k < segs.length; k++) {
            var g = segs[k];
            var base = (g.k === 'nu' || g.k === 'n') ? 0.16 : (g.k === 'g' ? 0.24 : 0.38);
            var la = gain * base * (1 - (now - g.born) / LIFE);
            ctx.beginPath();
            ctx.setLineDash(DASH[g.k] || []);
            ctx.moveTo(g.x1, g.y1);
            ctx.lineTo(g.x2, g.y2);
            ctx.lineWidth = 0.4 + 1.0 * Math.sqrt(g.e);
            ctx.strokeStyle = 'rgba(' + COLOR[g.k] + ',' + la.toFixed(3) + ')';
            ctx.stroke();
        }
        ctx.setLineDash([]);
        for (var i = 0; i < dots.length; i++) {
            var d = dots[i];
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
        paint(now, 1);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.rect(hole.x, hole.y, hole.w, hole.h);
        ctx.clip();
        paint(now, 0.45);
        ctx.restore();
    }

    function frame(ts) {
        var now = ts / 1000;
        var dt = last ? Math.min(0.05, now - last) : 0.016;
        last = now;
        step(dt, now);
        draw(now);
        requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    for (var t = -8; t < 0; t += 1 / 30) step(1 / 30, t);
    draw(0);
    requestAnimationFrame(frame);
})();
