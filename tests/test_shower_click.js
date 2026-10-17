// Check of the click paths of shower.js, no browser.
// Run: node test_shower_click.js
// shower.js runs two passes: the hero canvas (ambient cascade + clicks in the
// hero) and a fixed page canvas (clicks anywhere else). Each scenario replays
// the same seeded random stream and counts the deposits drawn per canvas.
var path = require('path'), fs = require('fs');
var SRC = fs.readFileSync(path.join(__dirname, '..', 'shower.js'), 'utf8');
var W = 1400, H = 900, CX = 1200, CY = 300, SCROLL = 2000;

// where: null (no clicks), 'hero', 'page' (light section), 'link' (an <a> in a section)
function runOnce(where) {
    var seed = 12345, arcs = { hero: 0, page: 0 }, clicks = {}, queue = [];
    var realRandom = Math.random;
    Math.random = function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    function makeCtx(name) {
        return new Proxy({}, {
            get: function (o, k) { return k === 'arc' ? function () { arcs[name]++; } : function () {}; },
            set: function () { return true; }
        });
    }
    var rect = function (x, y, w, h) { return function () { return { left: x, top: y, width: w, height: h }; }; };
    function makeCanvas(name, parent) {
        var ctx = makeCtx(name);
        return { clientWidth: W, clientHeight: H, style: {}, getContext: function () { return ctx; },
            getBoundingClientRect: rect(0, 0, W, H), parentNode: parent };
    }
    var heroEl = { addEventListener: function (ev, f) { if (ev === 'click') clicks.hero = f; } };
    var heroCanvas = makeCanvas('hero', heroEl);
    global.window = { scrollX: 0, scrollY: SCROLL, matchMedia: function () { return { matches: false }; },
        addEventListener: function () {} };
    global.document = {
        body: { appendChild: function () {} },
        documentElement: { scrollHeight: 6000 },
        createElement: function () { return makeCanvas('page', null); },
        addEventListener: function (ev, f) { if (ev === 'click') clicks.page = f; },
        querySelector: function (s) {
            if (s === '.shower') return heroCanvas;
            if (s === 'footer') return { getBoundingClientRect: rect(0, 5500 - SCROLL, W, 300) };
            return { getBoundingClientRect: rect(100, 300, 500, 300) };
        }
    };
    global.requestAnimationFrame = function (f) { queue.push(f); };
    new Function(SRC)();
    if (!clicks.hero || !clicks.page) throw new Error('missing click listener');
    // what el.closest(selector) answers for each kind of click target
    var target = { closest: function (sel) {
        if (where === 'hero') return sel.indexOf('.hero') >= 0 ? {} : null;  // inside .hero, not a link
        if (where === 'link') return {};                                     // a link matches both selectors
        return null;                                                         // plain text in a light section
    } };
    for (var i = 1; i <= 600; i++) {
        if (where && i % 60 === 0) {
            // like the browser: the hero element hears only its own clicks, the document hears all
            var ev = { target: target, clientX: CX, clientY: CY };
            if (where === 'hero') clicks.hero(ev);
            clicks.page(ev);
        }
        var q = queue; queue = [];
        for (var j = 0; j < q.length; j++) q[j](i * 16);
    }
    Math.random = realRandom;
    arcs.pending = queue.length;
    return arcs;
}

var none = runOnce(null), hero = runOnce('hero'), page = runOnce('page'), link = runOnce('link');
console.log('no clicks   ', none);
console.log('hero clicks ', hero);
console.log('page clicks ', page);
console.log('link clicks ', link);
function check(ok, msg) { if (!ok) { console.error('FAIL: ' + msg); process.exit(1); } }
check(none.page === 0, 'the page pass must draw nothing without clicks');
check(none.pending === 1, 'without clicks only the hero pass keeps animating');
check(hero.hero > none.hero + 100, 'a hero click adds a visible shower in the hero');
check(hero.page === 0, 'a hero click must not reach the page pass');
check(page.page > 100, 'a click in a light section draws a shower on the page canvas');
check(link.page === 0, 'a click on a link fires nothing');
console.log('OK');
