/* ==========================================================================
   MISJ STUCO — CORE
   Utilities · smooth scroll · frame loop · scroll scenes · reveals ·
   cursor · navigation + menu · atmosphere · the journey line
   ========================================================================== */
(function () {
  'use strict';

  const SC = (window.SC = {});
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  SC.$ = $;
  SC.$$ = $$;
  SC.reduce = html.classList.contains('reduce');
  SC.fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  SC.mqMobile = matchMedia('(max-width: 900px)');
  SC.mqSwipe = matchMedia('(max-width: 900px), (hover: none)');
  SC.vw = innerWidth;
  SC.vh = innerHeight;
  SC.scrollY = scrollY;

  /* ---------- small helpers ---------- */
  SC.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  SC.lerp = (a, b, t) => a + (b - a) * t;
  SC.range = (v, a, b) => SC.clamp((v - a) / (b - a));
  SC.ease = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    in: (t) => t * t * t
  };
  SC.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  SC.pad = (n) => String(n).padStart(2, '0');
  SC.initials = (name) => String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  SC.slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  /* An image, or a designed placeholder when no photo has been added yet */
  const PH_POS = [['22%', '18%'], ['78%', '24%'], ['30%', '82%'], ['72%', '70%'], ['50%', '8%'], ['12%', '55%'], ['88%', '50%']];
  let phCount = 0;
  SC.media = function (img, o = {}) {
    const src = typeof img === 'string' ? img : (img && img.src) || '';
    const alt = (img && typeof img === 'object' && img.alt) || o.alt || '';
    const cls = 'media' + (o.cls ? ' ' + o.cls : '');
    const tag = o.tag || 'div';   // use 'span' inside buttons
    const attrs = o.attrs ? ' ' + o.attrs : '';
    if (src) {
      const srcset = img && img.srcset ? ` srcset="${SC.esc(img.srcset)}" sizes="${SC.esc(o.sizes || '100vw')}"` : '';
      return `<${tag} class="${cls}"${attrs}><img src="${SC.esc(src)}"${srcset} alt="${SC.esc(alt)}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async"></${tag}>`;
    }
    const p = PH_POS[phCount++ % PH_POS.length];
    return `<${tag} class="${cls}"${attrs}><span class="ph${o.portrait ? ' ph--portrait' : ''}" role="img" aria-label="${SC.esc(alt || 'Photo placeholder')}" style="display:block;--px:${p[0]};--py:${p[1]}">` +
      (o.label === false ? '' : `<span class="ph__label" aria-hidden="true">${SC.esc(o.label || 'MISJ photo · replace')}</span>`) +
      (o.mark ? `<span class="ph__mark" aria-hidden="true">${SC.esc(o.mark)}</span>` : '') + `</span></${tag}>`;
  };

  /* ---------- smooth scroll ---------- */
  SC.lenis = null;
  SC.initSmooth = function () {
    if (SC.reduce || !window.Lenis) return;
    try { SC.lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true }); } catch (e) { SC.lenis = null; }
  };
  SC.scrollTo = function (target, opts = {}) {
    const el = typeof target === 'string' ? $(target) : target;
    if (el == null) return;
    let y = typeof el === 'number' ? el : el.getBoundingClientRect().top + scrollY + (opts.offset || 0);
    if (el && el.id === 'top') y = 0;
    if (SC.lenis) {
      const dist = Math.abs(y - scrollY);
      SC.lenis.scrollTo(y, { duration: opts.immediate ? 0 : Math.min(3.4, 1.1 + dist / 7000), immediate: !!opts.immediate, force: true });
    } else {
      window.scrollTo({ top: y, behavior: SC.reduce || opts.immediate ? 'auto' : 'smooth' });
    }
  };
  SC.lock = function (on) {
    if (SC.lenis) on ? SC.lenis.stop() : SC.lenis.start();
    html.style.overflow = on ? 'hidden' : '';
  };

  /* ---------- focus helpers ---------- */
  SC.focusables = (root) => $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea', root).filter((el) => el.getClientRects().length);
  SC.trap = function (e, els) {
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1], a = document.activeElement;
    if (!els.includes(a)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  };

  /* ---------- frame loop ---------- */
  const tickers = new Set();
  SC.onFrame = (fn) => { tickers.add(fn); return () => tickers.delete(fn); };
  function loop(t) {
    if (SC.lenis) SC.lenis.raf(t);
    SC.scrollY = window.scrollY;
    SC.time = t;
    tickers.forEach((fn) => fn(t));
    requestAnimationFrame(loop);
  }
  SC.start = () => requestAnimationFrame(loop);

  /* ---------- scroll scenes ----------
     A scene receives progress p (0 → 1).
     Pinned (tall) sections: p runs while the sticky stage is held.
     Normal sections: p runs while the target element crosses the viewport. */
  const scenes = [];
  SC.scene = function (el, update, opts = {}) {
    if (!el) return null;
    const s = { el, update, opts, target: opts.target || el, top: 0, h: 0, ttop: 0, th: 0, last: -1, sticky: false };
    scenes.push(s);
    return s;
  };
  SC.measure = function () {
    scenes.forEach((s) => {
      const r = s.el.getBoundingClientRect();
      s.top = r.top + scrollY;
      s.h = s.el.offsetHeight;
      s.sticky = !SC.reduce && (s.opts.sticky ? s.opts.sticky() : s.h > SC.vh * 1.3);
      const t = s.target.getBoundingClientRect();
      s.ttop = t.top + scrollY;
      s.th = t.height;
      s.last = -1;
    });
    if (SC.reduce) scenes.forEach((s) => s.update(s.opts.staticP != null ? s.opts.staticP : 1, s));
  };
  function runScenes() {
    const y = SC.scrollY, vh = SC.vh;
    for (const s of scenes) {
      const p = s.sticky
        ? SC.clamp((y - s.top) / Math.max(1, s.h - vh))
        : SC.clamp((y + vh * 0.9 - s.ttop) / (vh * 0.6 + s.th * 0.5));
      if (p !== s.last) { s.last = p; s.update(p, s); }
    }
  }

  /* ---------- reveals ---------- */
  SC.split = function (el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi';
            wi.style.setProperty('--i', i++); wi.textContent = part;
            w.appendChild(wi); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
  };
  SC.countUp = function (el) {
    const end = parseFloat(el.dataset.count) || 0;
    const dec = (String(el.dataset.count).split('.')[1] || '').length;
    const fmt = (v) => (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US'));
    if (SC.reduce) { el.textContent = fmt(end); return; }
    const dur = 1900 + Math.min(1300, end * 2), t0 = performance.now();
    const step = (now) => {
      const t = SC.clamp((now - t0) / dur);
      el.textContent = fmt(end * SC.ease.expo(t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  function onIO(entries, obs) {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      if (el.dataset.count != null) SC.countUp(el);
      obs.unobserve(el);
    });
  }
  const io = new IntersectionObserver(onIO, { rootMargin: '0px 0px -12% 0px' });
  const markIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('reached', e.boundingClientRect.top < SC.vh * 0.62));
  }, { rootMargin: '0px 0px -38% 0px' });
  SC.reveal = function (root = document, ioRoot = null) {
    const obs = ioRoot ? new IntersectionObserver(onIO, { root: ioRoot, rootMargin: '0px 0px -8% 0px' }) : io;
    $$('[data-split]', root).forEach(SC.split);
    $$('[data-reveal], [data-split], .ev, [data-count]', root).forEach((el) => obs.observe(el));
    if (!ioRoot) $$('.jp-mark', root).forEach((el) => markIO.observe(el));
    return obs;
  };

  /* ---------- cursor (desktop only) ---------- */
  SC.initCursor = function () {
    if (!SC.fine) return;
    html.classList.add('has-cursor');
    const c = $('.cursor'), ring = $('.cursor__ring'), dot = $('.cursor__dot'), label = $('.cursor__label');
    let x = -100, y = -100, rx = x, ry = y, shown = false;
    c.classList.add('is-off');
    addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!shown) { rx = x; ry = y; shown = true; c.classList.remove('is-off'); }
    }, { passive: true });
    html.addEventListener('mouseleave', () => { c.classList.add('is-off'); shown = false; });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor], a, button, input, select, textarea');
      const kind = t ? t.dataset.cursor || 'button' : '';
      const isLabel = kind === 'view' || kind === 'explore' || kind === 'open';
      c.classList.toggle('is-btn', kind === 'button');
      c.classList.toggle('is-label', isLabel);
      if (isLabel) label.textContent = kind.toUpperCase();
    });
    SC.onFrame(() => {
      const k = SC.reduce ? 1 : 0.2;
      rx += (x - rx) * k; ry += (y - ry) * k;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      ring.style.transform = `translate3d(${rx.toFixed(2)}px,${ry.toFixed(2)}px,0)`;
    });
  };

  /* ---------- in-page anchors ---------- */
  SC.initAnchors = function () {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.closest('#menu')) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      SC.scrollTo(el);
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    });
  };

  /* ---------- menu ---------- */
  SC.initMenu = function () {
    const menu = $('#menu'), btn = $('.nav__menu'), list = $('.menu__list'), lbl = $('.nav__menu-label');
    let open = false, lastFocus = null, timer;
    function set(o) {
      if (o === open) return;
      open = o;
      clearTimeout(timer);
      btn.setAttribute('aria-expanded', String(o));
      lbl.textContent = o ? 'Close' : 'Menu';
      document.body.classList.toggle('menu-open', o);
      if (o) {
        lastFocus = document.activeElement;
        menu.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('open')));
        SC.lock(true);
        timer = setTimeout(() => { const a = list.querySelector('a'); if (a) a.focus({ preventScroll: true }); }, 380);
      } else {
        menu.classList.remove('open');
        SC.lock(false);
        timer = setTimeout(() => { if (!open) menu.hidden = true; }, SC.reduce ? 10 : 950);
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      }
    }
    SC.menu = { set, isOpen: () => open };
    btn.addEventListener('click', () => set(!open));
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      e.preventDefault();
      const target = a.getAttribute('href');
      set(false);
      setTimeout(() => SC.scrollTo(target), SC.reduce ? 0 : 320);
    });
    document.addEventListener('keydown', (e) => {
      if (!open) return;
      if (e.key === 'Escape') set(false);
      if (e.key === 'Tab') SC.trap(e, [btn, ...SC.focusables(menu)]);
    });
  };

  /* ---------- atmosphere colour + chapter indicator + nav ink ---------- */
  let bgSecs = [], inkSecs = [], chapters = [], lastBg = '', curChap = null;
  const atmos = $('.atmos');
  const hexToRgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, (c) => c + c); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  SC.measureAtmos = function () {
    const all = $$('[data-bg]').map((el) => {
      const r = el.getBoundingClientRect();
      return { el, top: r.top + scrollY, h: el.offsetHeight, rgb: hexToRgb(el.dataset.bg), blend: ((parseFloat(el.dataset.blend) || 45) / 100) * SC.vh, dark: el.dataset.ink === 'dark' };
    });
    bgSecs = all.filter((s) => !s.dark);   // opaque light sections paint their own background
    inkSecs = all.filter((s) => s.dark);
    chapters = all.filter((s) => s.el.dataset.chapter != null);
    lastBg = ''; curChap = null;
  };
  function runAtmos() {
    if (!bgSecs.length) return;
    const y = SC.scrollY + SC.vh * 0.5;
    let i = bgSecs.findIndex((s) => y < s.top + s.h);
    if (i < 0) i = bgSecs.length - 1;
    const s = bgSecs[i], n = bgSecs[i + 1];
    let rgb = s.rgb;
    if (n) {
      const t = SC.ease.inOut(SC.clamp((y - (s.top + s.h - s.blend)) / s.blend));
      rgb = s.rgb.map((v, k) => Math.round(v + (n.rgb[k] - v) * t));
    }
    const bg = `rgb(${rgb.join(',')})`;
    if (bg !== lastBg) { atmos.style.backgroundColor = bg; lastBg = bg; }

    const ny = SC.scrollY + 44;
    document.body.classList.toggle('ink-dark', inkSecs.some((d) => ny >= d.top && ny < d.top + d.h));

    const cy = SC.scrollY + SC.vh * 0.45;
    let c = chapters[0];
    for (const ch of chapters) if (ch.top <= cy) c = ch;
    if (c && c !== curChap) {
      curChap = c;
      $('.nav__num').textContent = c.el.dataset.chapter;
      $('.nav__title').textContent = c.el.dataset.title;
      const id = '#' + c.el.id;
      $$('.menu__list a').forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === id)));
    }
  }

  /* ---------- the journey line ----------
     A single path through waypoints declared on chapters:
     data-jp="x,y x,y" (x = fraction of width, y = fraction of section height)
     and data-jp-anchor on elements (their centre). Drawn up to 60% of the viewport. */
  SC.journey = (function () {
    const g = $('.journey__g'), path = $('.journey__path'), ghost = $('.journey__ghost'), head = $('.journey__head'), main = $('#main');
    let len = 0, step = 10, xs = [], ys = [], ymax = [], base = 0, ready = false, lastT = null;

    function curve(p) {
      if (p.length < 2) return '';
      const f = (v) => v.toFixed(1);
      let d = `M${f(p[0][0])},${f(p[0][1])}`;
      for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
        const c1x = p1[0] + (p2[0] - p0[0]) / 6, c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c1y = SC.clamp(p1[1] + (p2[1] - p0[1]) / 6, p1[1], p2[1]);
        const c2y = SC.clamp(p2[1] - (p3[1] - p1[1]) / 6, p1[1], p2[1]);
        d += ` C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2[0])},${f(p2[1])}`;
      }
      return d;
    }

    function build() {
      const W = main.clientWidth;
      base = main.getBoundingClientRect().top + scrollY;
      const mobile = SC.mqMobile.matches;
      const pts = [];
      $$('[data-jp]', main).forEach((sec) => {
        const top = sec.getBoundingClientRect().top + scrollY - base, h = sec.offsetHeight;
        sec.dataset.jp.trim().split(/\s+/).forEach((pair) => {
          const [fx, fy] = pair.split(',').map(Number);
          pts.push([fx, top + fy * h]);
        });
      });
      $$('[data-jp-anchor]', main).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width) pts.push([(r.left + r.width / 2) / W, r.top + scrollY - base + r.height / 2]);
      });
      pts.sort((a, b) => a[1] - b[1]);
      const P = [];
      pts.forEach(([fx, y]) => {
        const pt = [mobile ? 9 : fx * W, y];
        const prev = P[P.length - 1];
        if (!prev || Math.abs(prev[1] - y) > 2 || Math.abs(prev[0] - pt[0]) > 2) P.push(pt);
      });
      const d = curve(P);
      path.setAttribute('d', d);
      ghost.setAttribute('d', d);
      len = d ? path.getTotalLength() : 0;
      if (!len) { ready = false; return; }
      step = Math.max(6, len / 3500);
      const n = Math.ceil(len / step);
      xs = new Float32Array(n + 1); ys = new Float32Array(n + 1); ymax = new Float32Array(n + 1);
      let m = -Infinity;
      for (let i = 0; i <= n; i++) {
        const pt = path.getPointAtLength(Math.min(len, i * step));
        xs[i] = pt.x; ys[i] = pt.y; m = Math.max(m, pt.y); ymax[i] = m;
      }
      path.style.strokeDasharray = `${len} ${len + 20}`;
      ready = true; lastT = null;
    }

    function draw() {
      if (!ready) return;
      const sy = SC.scrollY;
      g.style.transform = `translate3d(0,${(base - sy).toFixed(1)}px,0)`;
      const target = sy + SC.vh * 0.6 - base;
      let lo = 0, hi = ymax.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (ymax[mid] < target) lo = mid + 1; else hi = mid; }
      if (lo !== lastT) { lastT = lo; path.style.strokeDashoffset = String(len - lo * step); }
      head.classList.toggle('on', lo > 0 && lo < ymax.length - 1);
      head.style.transform = `translate3d(${xs[lo].toFixed(1)}px,${(ys[lo] + base - sy).toFixed(1)}px,0)`;
    }
    return { build, draw };
  })();

  /* ---------- refresh on resize / layout change ---------- */
  const resizers = [];
  SC.onResize = (fn) => resizers.push(fn);
  SC.refresh = function () {
    SC.vw = innerWidth; SC.vh = innerHeight;
    html.style.setProperty('--vh', SC.vh / 100 + 'px');
    resizers.forEach((fn) => fn());
    SC.measure();
    SC.measureAtmos();
    SC.journey.build();
  };
  let rt, lastW = innerWidth, lastH = innerHeight;
  addEventListener('resize', () => {
    // ignore the small height changes caused by mobile browser bars
    if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return;
    lastW = innerWidth; lastH = innerHeight;
    clearTimeout(rt); rt = setTimeout(SC.refresh, 180);
  });
  let lastBodyH = 0, rot;
  SC.watchLayout = function () {
    if (!window.ResizeObserver) return;
    new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - lastBodyH) < 4) return;
      lastBodyH = h;
      clearTimeout(rot); rot = setTimeout(SC.refresh, 220);
    }).observe(document.body);
  };

  SC.tick = function () {
    if (!SC.reduce) runScenes();
    runAtmos();
    SC.journey.draw();
  };
})();
