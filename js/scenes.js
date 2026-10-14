/* ==========================================================================
   MISJ STUCO — SCROLL CHOREOGRAPHY
   Arrival · The Beginning · Ideas → Impact · Projects · Impact · The Future
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SC, $ = SC.$, $$ = SC.$$, clamp = SC.clamp, range = SC.range, E = SC.ease;
  const NS = 'http://www.w3.org/2000/svg';

  /* smooth curve through points (px) */
  function curve(p) {
    let d = `M${p[0][0]},${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    return d;
  }

  /* ---------- 00 ARRIVAL ---------- */
  function hero() {
    const sec = $('#top'), stage = $('.hero__stage'), svg = $('.hero__line'), path = $('.hero__path'), dot = $('.hero__dot');
    const center = $('.hero__center'), title = $('.hero__title'), school = $('.hero__school'), start = $('.hero__start');
    const scroll = $('.hero__scroll'), metas = $$('.hero__meta'), glow = $('.hero__glow');
    let len = 0, introLen = 0, intro = 0, introDone = false, scrollP = 0;
    const tmp = document.createElementNS(NS, 'path');

    function build() {
      const w = stage.clientWidth, h = stage.clientHeight, mob = SC.mqMobile.matches;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const A = [
        [w * 0.08, h * 0.84], [w * 0.3, h * 0.77], [w * 0.55, h * 0.88], [w * 0.8, h * 0.74], [w * 0.94, h * 0.83]
      ];
      const B = mob ? [[w * 0.6, h * 0.95], [9, h]] : [[w * 0.74, h * 0.96], [w * 0.5, h]];
      const all = A.concat(B);
      path.setAttribute('d', curve(all));
      tmp.setAttribute('d', curve(A));
      svg.appendChild(tmp); introLen = tmp.getTotalLength(); svg.removeChild(tmp);
      len = path.getTotalLength();
      path.style.strokeDasharray = `${len} ${len + 10}`;
      paint();
    }
    function paint() {
      const drawn = Math.max(intro * introLen, introLen * (introDone ? 1 : 0) + (len - introLen) * range(scrollP, 0.08, 0.98));
      const L = clamp(Math.max(intro * introLen, drawn), 0, len);
      if (!isFinite(L) || !len) return;
      path.style.strokeDashoffset = String(len - L);
      const pt = path.getPointAtLength(L);
      dot.style.transform = `translate3d(${pt.x}px,${pt.y}px,0)`;
    }
    /* the point begins moving after the title has arrived */
    function runIntro() {
      if (SC.reduce) { intro = 1; introDone = true; paint(); return; }
      const t0 = performance.now() + 2300, dur = 3600;
      const step = (now) => {
        intro = E.inOut(clamp((now - t0) / dur));
        if (scrollP > 0.04) intro = 1;
        paint();
        if (intro < 1) requestAnimationFrame(step); else introDone = true;
      };
      requestAnimationFrame(step);
    }
    SC.onResize(build);
    SC.heroIntro = runIntro;
    SC.scene(sec, (p) => {
      scrollP = p;
      if (p > 0) document.documentElement.classList.add('arrived');
      const e = E.out(p);
      center.style.transform = `translate3d(0,${-16 * e}vh,0)`;
      title.style.transform = `scale(${1 - 0.46 * e})`;
      title.style.opacity = String(1 - 0.72 * e);
      school.style.transform = `translate3d(0,${-6 * e}vh,0)`;
      // at p = 0 leave opacity to CSS so the arrival intro can play
      const fade = p > 0 ? String(1 - range(p, 0, 0.22)) : '';
      school.style.opacity = p > 0 ? String(1 - 0.5 * e) : '';
      start.style.opacity = fade;
      scroll.style.opacity = fade;
      metas.forEach((m) => (m.style.opacity = fade));
      glow.style.transform = `translate(-50%,-50%) scale(${1 + 0.5 * e})`;
      glow.style.opacity = String(1 - 0.4 * e);
      if (introDone || p > 0.04) { introDone = true; intro = 1; }
      paint();
    }, { staticP: 0 });
  }

  /* ---------- 01 THE BEGINNING: one idea becomes something bigger ---------- */
  function beginning() {
    const sec = $('#beginning'), art = $('.begin__art');
    const rot = $('.seed__rot'), rays = $$('.seed__ray'), ends = $$('.seed__end'), tail = $('.seed__tail');
    const core = $('.seed__core'), halo = $('.seed__halo'), rings = $$('.seed__ring');
    SC.scene(sec, (p) => {
      const grow = E.out(range(p, 0.02, 0.24));
      core.setAttribute('r', (4 + 22 * grow).toFixed(2));
      halo.setAttribute('r', (10 + 70 * grow + 6 * Math.sin(p * 20)).toFixed(2));
      halo.style.opacity = String(0.4 + 0.6 * grow);
      rays.forEach((r, i) => {
        const t = E.inOut(range(p, 0.2 + i * 0.09, 0.42 + i * 0.09));
        r.style.strokeDashoffset = String(1 - t);
        ends[i].style.opacity = t > 0.96 ? '1' : '0';
      });
      rings.forEach((r, i) => (r.style.opacity = String(range(p, 0.1 + i * 0.1, 0.3 + i * 0.1))));
      const out = E.inOut(range(p, 0.8, 1));
      rot.setAttribute('transform', `rotate(${(-8 + 16 * range(p, 0, 1)).toFixed(2)} 300 300)`);
      rot.style.opacity = String(1 - 0.55 * out);
      tail.style.strokeDashoffset = String(1 - E.inOut(range(p, 0.74, 0.98)));
    }, { target: art, staticP: 0.78 });
  }

  /* ---------- 05 IDEA → PLAN → TEAM → ACTION → IMPACT ---------- */
  function ideas() {
    const sec = $('#ideas'), head = $('.ideas__head'), words = $$('.iw'), rail = $$('.ideas__rail li');
    const flood = $('.ideas__flood'), impact = $('.iw--impact'), I = $('.iw__i');
    const n = words.length;
    let origin = '50% 50%';
    SC.onResize(() => {
      impact.style.transform = 'none';
      const r = impact.getBoundingClientRect(), ir = I.getBoundingClientRect();
      origin = `${((ir.left + ir.width / 2 - r.left) / r.width) * 100}% ${((ir.top + ir.height * 0.5 - r.top) / r.height) * 100}%`;
      impact.style.transformOrigin = origin;
    });
    SC.scene(sec, (p) => {
      const span = 0.11, startAt = 0.1;
      head.style.opacity = String(1 - range(p, 0.6, 0.7));
      head.style.transform = `translate3d(0,${-4 * range(p, 0.6, 0.7)}vh,0)`;
      let active = 0;
      words.forEach((w, i) => {
        const a = startAt + i * span;
        const inT = range(p, a - 0.05, a + 0.02);
        const outT = i < n - 1 ? range(p, a + span - 0.05, a + span + 0.01) : 0;
        if (p >= a - 0.02) active = i;
        if (i < n - 1) {
          const y = (1 - E.out(inT)) * 40 - E.in(outT) * 40;
          w.style.opacity = String(inT * (1 - outT));
          w.style.transform = `translate3d(0,${y}%,0) scale(${1 - 0.06 * outT})`;
          w.style.filter = `blur(${((1 - inT) + outT) * 14}px)`;
        } else {
          /* IMPACT grows until it fills the screen, then floods it yellow */
          const grow = range(p, 0.66, 0.9);
          const s = 1 + 0.35 * E.out(range(p, 0.62, 0.72)) + 60 * Math.pow(grow, 3);
          w.style.opacity = String(inT);
          w.style.filter = `blur(${(1 - inT) * 14}px)`;
          w.style.transform = `translate3d(0,${(1 - E.out(inT)) * 40}%,0) scale(${s})`;
        }
      });
      rail.forEach((li, i) => li.classList.toggle('on', i <= active && p > startAt - 0.04));
      const fl = range(p, 0.8, 0.88), col = E.inOut(range(p, 0.9, 1));
      flood.style.opacity = String(fl);
      flood.style.transform = `scaleY(${Math.max(0.002, 1 - col)})`;
      document.body.classList.toggle('ink-flood', fl > 0.5 && col < 0.55);
    }, { staticP: 1 });
  }

  /* ---------- 06 projects: horizontal journey ---------- */
  function projects() {
    const sec = $('#projects'), pin = $('.proj__pin'), track = $('.proj__track'), bar = $('.proj__bar i'), count = $('.proj__count');
    let dist = 0, pinned = false, items = [];
    const setCount = (p) => {
      const n = SC.projectCount || 1, k = Math.min(n, Math.max(1, Math.round(p * (n - 1)) + 1));
      count.textContent = `${SC.pad(k)} / ${SC.pad(n)}`;
      bar.style.transform = `scaleX(${p})`;
    };
    SC.onResize(() => {
      pinned = !SC.mqSwipe.matches && !SC.reduce;
      track.style.transform = '';
      items = Array.from(track.children).map((c) => ({ img: c.querySelector('.media > img, .media > .ph'), cx: c.offsetLeft + c.offsetWidth / 2 }));
      if (!pinned) { pin.style.height = ''; dist = 0; return; }
      dist = Math.max(0, track.scrollWidth - SC.vw);
      pin.style.height = `${Math.round(SC.vh + dist * 0.62)}px`;   // the gallery travels faster than the page
    });
    SC.scene(pin, (p) => {
      if (!pinned) return;
      const x = dist * p;
      track.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`;
      setCount(p);
      /* subtle parallax inside each image */
      for (const it of items) {
        if (!it.img) continue;
        const rel = (it.cx - x - SC.vw / 2) / SC.vw;
        if (Math.abs(rel) < 1.5) it.img.style.transform = `translate3d(${(-rel * 6).toFixed(2)}%,0,0)`;
      }
    }, { staticP: 0, sticky: () => pinned });
    /* swipe layout (touch / small screens): progress follows the native scroller */
    track.addEventListener('scroll', () => {
      if (pinned) return;
      const max = track.scrollWidth - track.clientWidth;
      setCount(max > 0 ? track.scrollLeft / max : 0);
    }, { passive: true });
    track.addEventListener('click', (e) => {
      const b = e.target.closest('[data-project]');
      if (b) SC.openProject(+b.dataset.project, b);
    });
  }

  /* ---------- 08 impact: slow drift of the ghost word ---------- */
  function impact() {
    const sec = $('#impact'), ghost = $('.impact__ghost');
    SC.scene(sec, (p) => { ghost.style.transform = `translate3d(${-50 - 14 * (p - 0.5)}%,${(p - 0.5) * 20}vh,0)`; }, { staticP: 0.5 });
  }

  /* ---------- 09 THE FUTURE: the line travels across the whole screen ---------- */
  function future() {
    const sec = $('#future'), stage = $('.future__stage'), wrap = $('.future__line'), svg = $('.future__svg');
    const path = $('.future__path'), ghost = $('.future__ghost'), dot = $('.future__dot');
    let marks = [], pos = [], len = 0, final = false;
    SC.onResize(() => {
      marks = $$('.fm');
      const w = wrap.clientWidth, h = wrap.clientHeight, cy = SC.reduce ? h * 0.5 : h * (SC.mqMobile.matches ? 0.56 : 0.47), amp = Math.min(h * 0.07, 60);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const pts = [];
      for (let i = 0; i <= 8; i++) pts.push([-0.06 * w + (i / 8) * 1.16 * w, cy + Math.sin(i * 1.3) * amp]);
      const d = curve(pts);
      path.setAttribute('d', d); ghost.setAttribute('d', d);
      len = path.getTotalLength();
      path.style.strokeDasharray = `${len} ${len + 10}`;
      // place milestones evenly between 10% and 88% of the screen width
      pos = marks.map((m, i) => {
        const tx = w * (0.1 + (0.78 * i) / Math.max(1, marks.length - 1));
        let lo = 0, hi = len;
        for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2; if (path.getPointAtLength(mid).x < tx) lo = mid; else hi = mid; }
        const pt = path.getPointAtLength(lo);
        m.style.transform = `translate3d(${pt.x}px,${pt.y}px,0)`;
        return lo;
      });
    });
    SC.scene(sec, (p) => {
      const draw = E.inOut(range(p, 0.04, 0.6));
      const L = draw * len;
      path.style.strokeDashoffset = String(len - L);
      const pt = len ? path.getPointAtLength(L) : { x: 0, y: 0 };
      dot.style.transform = `translate3d(${pt.x}px,${pt.y}px,0)`;
      dot.style.opacity = draw > 0.002 ? '1' : '0';
      marks.forEach((m, i) => m.classList.toggle('lit', L >= pos[i] - 2));
      const f = p > 0.64;
      if (f !== final) { final = f; stage.classList.toggle('is-final', f); }
    }, { staticP: 1 });
  }

  SC.initScenes = function () {
    hero();
    beginning();
    ideas();
    projects();
    impact();
    future();
  };
})();
