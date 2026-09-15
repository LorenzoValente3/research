// Electromagnetic showers behind the hero text, drawn as point clouds.
// Heitler cascade: a particle enters from the top, travels one radiation
// length, splits into two with half the energy each and a small angular kick,
// and so on until the energy falls below a critical value. The longitudinal
// profile and the lateral spread follow from the splitting alone.
// Off when the visitor asks for reduced motion.
(function () {
    var canvas = document.querySelector('.shower');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, last = 0, nextShower = -1e9;
    var dots = [], tracks = [];
    var LIFE = 6, SPEED = 170, MAX_DOTS = 4000, MAX_TRACKS = 96;
    var E_CRIT = 1 / 32, DEPOSIT_STEP = 7;
    var COLORS = ['46,196,214', '46,196,214', '255,181,71', '255,255,255'];

    function resize() {
        W = canvas.width = canvas.clientWidth;
        H = canvas.height = canvas.clientHeight;
    }
    function randn() {
        var u = 1 - Math.random(), v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    function radLength() { return H * (0.06 + 0.04 * Math.random()); }

    function spawnShower(now) {
        tracks.push({
            x: W * (0.05 + 0.9 * Math.random()), y: -10,
            a: (Math.random() - 0.5) * 0.4,
            e: 1, left: radLength() * (0.6 + 0.8 * Math.random()),
            since: 0
        });
    }

    function step(dt, now) {
        if (now > nextShower) {
            spawnShower(now);
            nextShower = now + 1.4 + 1.2 * Math.random();
        }
        var born = [];
        for (var i = tracks.length - 1; i >= 0; i--) {
            var p = tracks[i];
            var d = SPEED * dt;
            p.x += Math.sin(p.a) * d;
            p.y += Math.cos(p.a) * d;
            p.left -= d;
            p.since += d;
            if (p.since >= DEPOSIT_STEP && dots.length < MAX_DOTS) {
                p.since = 0;
                dots.push({
                    x: p.x + randn() * 1.2, y: p.y + randn() * 1.2,
                    r: 0.7 + 2.2 * Math.sqrt(p.e), born: now,
                    c: COLORS[Math.floor(Math.random() * COLORS.length)]
                });
            }
            if (p.y > H + 10 || p.x < -20 || p.x > W + 20) { tracks.splice(i, 1); continue; }
            if (p.left <= 0) {
                tracks.splice(i, 1);
                if (p.e / 2 < E_CRIT) continue;
                // multiple scattering grows as the energy drops
                var kick = 0.12 + 0.18 * Math.sqrt(1 / (p.e * 32));
                for (var k = 0; k < 2 && tracks.length + born.length < MAX_TRACKS; k++) {
                    born.push({
                        x: p.x, y: p.y,
                        a: p.a + (k ? 1 : -1) * kick * (0.4 + Math.random()),
                        e: p.e / 2, left: radLength(), since: 0
                    });
                }
            }
        }
        tracks = tracks.concat(born);
        for (var j = dots.length - 1; j >= 0; j--) {
            if (now - dots[j].born > LIFE) dots.splice(j, 1);
        }
    }

    function draw(now) {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < dots.length; i++) {
            var d = dots[i];
            var a = 0.85 * (1 - (now - d.born) / LIFE);
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(' + d.c + ',' + a.toFixed(3) + ')';
            ctx.fill();
        }
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
    for (var t = -7; t < 0; t += 1 / 30) step(1 / 30, t);
    draw(0);
    requestAnimationFrame(frame);
})();
