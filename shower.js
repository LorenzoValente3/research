// Particle showers drawn as point clouds behind the hero text.
// Each shower is a track entering from the top: the number of deposits per unit
// depth follows a gamma-like longitudinal profile and the lateral spread grows
// with depth. Off when the visitor asks for reduced motion.
(function () {
    var canvas = document.querySelector('.shower');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx = canvas.getContext('2d');
    var dots = [], showers = [], W = 0, H = 0, last = 0, nextShower = -1e9;
    var LIFE = 5, SPEED = 0.2, MAX_DOTS = 1600;
    var COLORS = ['46,196,214', '46,196,214', '255,181,71', '255,255,255'];

    function resize() {
        W = canvas.width = canvas.clientWidth;
        H = canvas.height = canvas.clientHeight;
    }

    function randn() {
        var u = 1 - Math.random(), v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function spawnShower(now) {
        showers.push({
            x0: W * (0.05 + 0.9 * Math.random()),
            tilt: (Math.random() - 0.5) * 0.35,
            t: 0,
            born: now,
            scale: 0.7 + 0.6 * Math.random()
        });
    }

    function profile(t) {
        // gamma-like longitudinal profile, peak near a third of the depth
        return Math.pow(t, 2) * Math.exp(-6 * t) * 70;
    }

    function step(dt, now) {
        if (now > nextShower) {
            spawnShower(now);
            nextShower = now + 0.6 + 1.0 * Math.random();
        }
        for (var i = showers.length - 1; i >= 0; i--) {
            var s = showers[i];
            s.t += SPEED * dt / s.scale;
            if (s.t > 1) { showers.splice(i, 1); continue; }
            var n = profile(s.t) * s.scale * dt * 60;
            var count = Math.floor(n) + (Math.random() < n - Math.floor(n) ? 1 : 0);
            var y = s.t * H;
            var sigma = 2 + 110 * s.t * s.scale;
            for (var k = 0; k < count && dots.length < MAX_DOTS; k++) {
                dots.push({
                    x: s.x0 + s.tilt * y + randn() * sigma,
                    y: y + randn() * 6,
                    r: 1.2 + Math.random() * 2.0,
                    born: now,
                    c: COLORS[Math.floor(Math.random() * COLORS.length)]
                });
            }
        }
        for (var j = dots.length - 1; j >= 0; j--) {
            if (now - dots[j].born > LIFE) dots.splice(j, 1);
        }
    }

    function draw(now) {
        ctx.clearRect(0, 0, W, H);
        ctx.lineWidth = 1;
        for (var k = 0; k < showers.length; k++) {
            var s = showers[k], yf = s.t * H;
            ctx.beginPath();
            ctx.moveTo(s.x0, 0);
            ctx.lineTo(s.x0 + s.tilt * yf, yf);
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.stroke();
        }
        for (var i = 0; i < dots.length; i++) {
            var d = dots[i];
            var a = 0.8 * (1 - (now - d.born) / LIFE);
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(' + d.c + ',' + a.toFixed(3) + ')';
            ctx.fill();
        }
    }

    function frame(ts) {
        var now = ts / 1000;
        var dt = Math.min(0.05, now - last || 0.016);
        last = now;
        step(dt, now);
        draw(now);
        requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    // pre-roll so the first frame is already populated
    for (var t = -6; t < 0; t += 1 / 30) step(1 / 30, t);
    draw(0);
    requestAnimationFrame(frame);
})();
