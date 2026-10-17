// Check of the Geant4 replay in shower.js, no browser.
// Run: node test_g4_replay.js [shower.js] [showers.json], default the site files
// A fake DOM and a fake fetch drive both passes for 600 frames and count what
// each canvas draws. Scenarios: data loaded, data missing (toy fallback).
var fs = require('fs');
var SRC = fs.readFileSync(process.argv[2] || __dirname + '/../shower.js', 'utf8');
var DATA = JSON.parse(fs.readFileSync(process.argv[3] || __dirname + '/../showers.json', 'utf8'));
var W = 1400, H = 900, SCROLL = 2000;

async function run(opts) {
    var seed = 12345, n = { hero: { arc: 0, line: 0 }, page: { arc: 0, line: 0 } }, clicks = {}, queue = [];
    Math.random = function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    function makeCtx(name) {
        return new Proxy({}, {
            get: function (o, k) {
                if (k === 'arc') return function () { n[name].arc++; };
                if (k === 'lineTo') return function () { n[name].line++; };
                return function () {};
            },
            set: function () { return true; }
        });
    }
    var rect = function (x, y, w, h) { return function () { return { left: x, top: y, width: w, height: h }; }; };
    function makeCanvas(name, parent) {
        var ctx = makeCtx(name);
        return { clientWidth: W, clientHeight: H, style: {}, getContext: function () { return ctx; },
            getBoundingClientRect: rect(0, 0, W, H), parentNode: parent };
    }
    var cap = { hidden: true, innerHTML: '' };
    var heroEl = { addEventListener: function (ev, f) { if (ev === 'click') clicks.hero = f; } };
    var heroCanvas = makeCanvas('hero', heroEl);
    global.window = {
        scrollX: 0, scrollY: SCROLL, matchMedia: function () { return { matches: false }; },
        addEventListener: function (ev, f) { if (ev === 'load') f(); },
        fetch: function (url) {
            if (!/^showers\.json/.test(url)) throw new Error('unexpected url ' + url);
            return Promise.resolve({ ok: opts.data, json: function () { return Promise.resolve(DATA); } });
        }
    };
    global.document = {
        body: { appendChild: function () {} },
        documentElement: { scrollHeight: 6000 },
        createElement: function () { return makeCanvas('page', null); },
        addEventListener: function (ev, f) { if (ev === 'click') clicks.page = f; },
        querySelector: function (s) {
            if (s === '.shower') return heroCanvas;
            if (s === '.shower-caption') return cap;
            if (s === 'footer') return { getBoundingClientRect: rect(0, 5500 - SCROLL, W, 300) };
            return { getBoundingClientRect: rect(100, 300, 500, 300) };
        }
    };
    global.requestAnimationFrame = function (f) { queue.push(f); };
    new Function(SRC)();
    await new Promise(function (r) { setTimeout(r, 0); });  // let the fetch promise resolve
    function target(where) {
        return { closest: function (sel) {
            if (where === 'hero') return sel.indexOf('.hero') >= 0 ? {} : null;
            if (where === 'link') return {};
            return null;
        } };
    }
    var heroCaption = null, fired = 0, names = [];
    for (var i = 1; i <= 600; i++) {
        var w = opts.clicks && opts.clicks[i];
        if (w) {
            var ev = { target: target(w), clientX: 1200, clientY: 300, detail: opts.detail || 1 };
            if (w === 'hero') {
                cap.innerHTML = '';
                clicks.hero(ev);
                heroCaption = cap.innerHTML;
                if (heroCaption) { fired++; names.push(heroCaption); }
            }
            clicks.page(ev);
        }
        var q = queue; queue = [];
        for (var j = 0; j < q.length; j++) q[j](i * 16);
    }
    return { n: n, cap: cap, heroCaption: heroCaption, fired: fired, names: names };
}

(async function () {
    var ok = true;
    function check(cond, msg) { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) ok = false; }

    // data present, no clicks: the hero replays Geant4, the page canvas stays idle
    var a = await run({ data: true });
    check(a.n.hero.arc > 100 && a.n.hero.line > 100, 'hero draws Geant4 deposits and tracks: ' + JSON.stringify(a.n.hero));
    check(a.n.page.arc === 0 && a.n.page.line === 0, 'page canvas idle without clicks');
    check(!a.cap.hidden && /Geant4 showers in the OpenDataDetector/.test(a.cap.innerHTML), 'caption shown after load');

    // clicks on text in a light section fire on the page canvas, links do not
    var b = await run({ data: true, clicks: { 60: 'page' } });
    check(b.n.page.arc > 0 && b.n.page.line > 0, 'page click replays a shower: ' + JSON.stringify(b.n.page));
    var c = await run({ data: true, clicks: { 60: 'link' } });
    check(c.n.page.arc === 0 && c.n.page.line === 0, 'click on a link draws nothing');

    // a hero click names the shower it fired, only from the 20 GeV and up pool
    var d = await run({ data: true, clicks: { 60: 'hero' } });
    var m = /Geant4 &middot; (\d+) GeV/.exec(d.heroCaption || '');
    check(m && +m[1] >= 20, 'hero click caption: ' + d.heroCaption);
    check(d.n.page.arc === 0, 'hero click stays on the hero canvas');

    // repeated hero clicks, also fast ones, each fire a shower and rename the caption
    var many = {}, f;
    for (var k = 0; k < 15; k++) many[100 + 20 * k] = 'hero';
    f = await run({ data: true, clicks: many, detail: 2, trace: true });
    check(f.fired === 15, 'every one of 15 hero clicks fires: ' + f.fired);
    check(f.names.every(function (x) { return !/&mu;/.test(x); }), 'no muon fired by a click');

    // data missing: toy cascade, caption hidden
    var e = await run({ data: false });
    check(e.n.hero.arc > 100 && e.cap.hidden, 'fallback toy cascade without data: ' + JSON.stringify(e.n.hero));

    // every particle type of the file is reachable by the uniform pick
    var types = {};
    DATA.ev.forEach(function (ev) { types[ev.p] = (types[ev.p] || 0) + 1; });
    var counts = Object.keys(types).map(function (k) { return types[k]; });
    check(Object.keys(types).length >= 12 && Math.min.apply(null, counts) === Math.max.apply(null, counts),
        'particle types equally represented: ' + JSON.stringify(types));
    process.exit(ok ? 0 : 1);
})();
