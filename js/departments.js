/* ==========================================================================
   MISJ STUCO — 04 THE TEAMS
   Living department network · immersive department experience · project sheet
   Everything adapts to the number of departments in content.js.
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SC, $ = SC.$, $$ = SC.$$, esc = SC.esc, pad = SC.pad;
  const keysHTML = (d) => d.keywords.map(esc).join(' <b>→</b> ');
  const firstSentence = (s) => { const m = String(s).match(/^.*?[.!?](\s|$)/); return m ? m[0].trim() : s; };

  /* ---------- the network ---------- */
  function network() {
    const D = SC.C.departments;
    const net = $('.net'), svg = $('.net__lines'), ul = $('.net__nodes'), info = $('.net__info'), canvas = $('.net__motif');
    ul.innerHTML = D.map((d, i) =>
      `<li class="nnode"><button class="nnode__btn" type="button" data-dept="${i}" data-cursor="explore" aria-label="${esc(d.name)} — explore this department"><span class="nnode__dot" aria-hidden="true"></span><span class="nnode__txt" aria-hidden="true"><span class="nnode__num micro">${pad(i + 1)}</span><span class="nnode__name">${esc(d.short || d.name)}</span></span></button></li>`).join('');
    svg.innerHTML = D.map(() => '<path class="spoke"/>').join('') + '<path class="ring"/>';
    const nodes = $$('.nnode', ul), spokes = $$('.spoke', svg), ring = $('.ring', svg);
    let W = 0, H = 0, cx = 0, cy = 0, r0 = 0, base = [], visible = false, active = -1, motif = null;
    const phase = D.map((_, i) => i * 1.7);

    function layout() {
      W = net.clientWidth; H = net.clientHeight;
      if (!W) return;
      cx = W / 2; cy = H / 2;
      const coreSize = Math.min(W * 0.26, H * 0.42, 360);
      r0 = coreSize / 2;
      net.style.setProperty('--core', coreSize + 'px');
      net.classList.toggle('net--compact', coreSize < 290);
      const rx = Math.min(W * 0.4, W / 2 - 175), ry = H * 0.37;
      base = D.map((_, i) => {
        const a = -Math.PI / 2 + (i / D.length) * Math.PI * 2 + 0.13, j = i % 2 ? 0.05 : -0.05;
        return [cx + Math.cos(a) * rx * (1 + j), cy + Math.sin(a) * ry * (1 - j)];
      });
      nodes.forEach((n, i) => n.classList.toggle('nnode--l', base[i][0] < cx - 4));
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      frame(SC.time || 0, true);
    }

    function frame(t, force) {
      if ((!visible && !force) || !base.length) return;
      const f = (v) => v.toFixed(1);
      const pos = base.map(([x, y], i) => (SC.reduce ? [x, y] : [x + Math.sin(t * 0.00042 + phase[i]) * 9, y + Math.cos(t * 0.00036 + phase[i] * 1.3) * 9]));
      pos.forEach(([x, y], i) => {
        nodes[i].style.transform = `translate3d(${f(x)}px,${f(y)}px,0)`;
        const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1;
        const sx = cx + (dx / l) * r0, sy = cy + (dy / l) * r0;
        const qx = (sx + x) / 2 - dy * 0.1, qy = (sy + y) / 2 + dx * 0.1;
        spokes[i].setAttribute('d', `M${f(sx)},${f(sy)} Q${f(qx)},${f(qy)} ${f(x)},${f(y)}`);
      });
      ring.setAttribute('d', 'M' + pos.map((p) => `${f(p[0])},${f(p[1])}`).join(' L') + ' Z');
    }

    function activate(i) {
      if (i === active) return;
      active = i;
      net.classList.toggle('has-active', i >= 0);
      nodes.forEach((n, k) => n.classList.toggle('is-on', k === i));
      spokes.forEach((s, k) => s.classList.toggle('on', k === i));
      if (motif) { motif.stop(); motif = null; }
      if (i < 0) return;
      const d = D[i];
      info.innerHTML = `<div class="ni"><p class="ni__num micro">${pad(i + 1)} / ${pad(D.length)}</p><p class="ni__name">${esc(d.name)}</p><p class="ni__desc">${esc(firstSentence(d.description))}</p><p class="ni__keys micro">${keysHTML(d)}</p></div>`;
      motif = SC.motifs.mount(canvas, d.motif || d.id);
    }

    ul.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const n = e.target.closest('.nnode');
      activate(n ? nodes.indexOf(n) : -1);
    });
    net.addEventListener('pointerleave', () => activate(-1));
    ul.addEventListener('focusin', (e) => { const n = e.target.closest('.nnode'); if (n) activate(nodes.indexOf(n)); });
    ul.addEventListener('focusout', (e) => { if (!ul.contains(e.relatedTarget)) activate(-1); });

    new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (!visible) activate(-1); }).observe(net);
    SC.onResize(layout);
    SC.onFrame((t) => frame(t));
  }

  /* ---------- the department experience ---------- */
  const dv = $('#dview'), content = $('.dview__content'), scroller = $('.dview__scroll'), countEl = $('.dview__count'), canvas = $('.dview__motif');
  let cur = -1, isOpen = false, pushed = false, motifD = null, dvIO = null, lastFocus = null, swapTimer;

  const splitTitle = (d) => d.titleLines || d.name.split(/\s+(?=and\s)/i);
  /* measure the real line widths at 100px, then scale so the longest line fits */
  function fitTitle() {
    const t = $('.dv-title', content);
    if (!t) return;
    t.style.setProperty('--fs', '100px');
    const widest = Math.max(...$$('.dv-title > span > span', content).map((s) => s.scrollWidth));
    const avail = content.clientWidth - 2 * parseFloat(getComputedStyle($('.dv-hero', content)).paddingLeft);
    t.style.setProperty('--fs', Math.floor(Math.min(SC.vw * 0.15, SC.vh * 0.24, (avail * 0.98 * 100) / Math.max(1, widest))) + 'px');
  }
  function stopMotif() { if (motifD) { motifD.stop(); motifD = null; } }

  function fill(i) {
    const D = SC.C.departments, n = D.length, d = D[i];
    cur = i;
    countEl.innerHTML = `<b>${pad(i + 1)}</b> / ${pad(n)}`;
    const lines = splitTitle(d);
    const projects = SC.C.projects.map((p, idx) => ({ p, idx })).filter((x) => x.p.department === d.id);
    const prev = D[(i - 1 + n) % n], next = D[(i + 1) % n];
    const gallery = d.gallery && d.gallery.length ? d.gallery : ['', '', ''];
    content.innerHTML =
      `<header class="dv-hero">
        <p class="dv-num micro">Department ${pad(i + 1)} / ${pad(n)}</p>
        <h2 class="dv-title" id="dview-title">${lines.map((l) => `<span><span>${esc(l)}</span></span>`).join('')}</h2>
        <p class="dv-tag" data-reveal><span class="ydot" aria-hidden="true"></span>${esc(d.tagline || '')}</p>
        <p class="dv-keys micro" data-reveal style="--d:.12s">${keysHTML(d)}</p>
      </header>` +
      SC.media(d.image, { cls: 'dv-image', alt: d.name, label: 'Department photo · replace', mark: (d.short || d.name).split(' ')[0], attrs: 'data-cursor="view" data-reveal' }) +
      `<section class="dv-block dv-block--first"><p class="dv-label micro">01 / Our mission</p><p class="dv-mission" data-reveal>${esc(d.mission)}</p></section>
      <section class="dv-block"><p class="dv-label micro">02 / What we do</p><ol class="dv-do">${(d.whatWeDo || []).map((w, k) => `<li data-reveal style="--d:${(k * 0.07).toFixed(2)}s"><span class="micro">${pad(k + 1)}</span>${esc(w)}</li>`).join('')}</ol></section>
      <section class="dv-block"><p class="dv-label micro">03 / Our people</p><div class="dv-people">
        <figure class="dv-head" data-reveal>${SC.media(d.head.photo, { portrait: true, mark: pad(i + 1), alt: `Portrait of ${d.head.name}, head of ${d.name}`, label: 'Portrait · replace', attrs: 'data-cursor="view"' })}
          <figcaption class="dv-head__cap"><span class="micro">Head of department</span><strong>${esc(d.head.name)}</strong>${d.head.quote ? `<q>${esc(d.head.quote)}</q>` : ''}</figcaption></figure>
        <div data-reveal style="--d:.1s"><p class="micro dv-members-label">Members</p><ul class="dv-members">${(d.members || []).map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>
      </div></section>
      <section class="dv-block"><p class="dv-label micro">04 / Our projects</p>${projects.length
        ? `<ul class="dv-projects">${projects.map(({ p, idx }) => `<li data-reveal><button class="dv-proj" type="button" data-project="${idx}" data-cursor="open"><span class="dv-proj__title">${esc(p.title)}</span><span class="micro">${esc(p.status)}</span><span class="micro">${esc(p.year)}</span></button></li>`).join('')}</ul>`
        : '<p class="dv-empty">No projects listed yet — the first one could be yours.</p>'}</section>
      <section class="dv-block"><p class="dv-label micro">05 / Our impact</p><div class="dv-stats">${(d.stats || []).map((s) => `<div data-reveal><p class="dv-stat__num" aria-label="${esc(s.value)}${esc(s.suffix || '')}"><b data-count="${esc(s.value)}" aria-hidden="true" style="font-weight:inherit">0</b><span aria-hidden="true">${esc(s.suffix || '')}</span></p><p class="dv-stat__label micro">${esc(s.label)}</p></div>`).join('')}</div></section>
      <section class="dv-block dv-block--full"><p class="dv-label micro">06 / Gallery</p><div class="dv-gallery">${gallery.map((g, k) => SC.media(g, { alt: `${d.name} — gallery photo ${k + 1}`, label: 'Gallery · replace', attrs: 'data-cursor="view"' })).join('')}</div></section>
      <nav class="dv-nav" aria-label="Department navigation">
        <button type="button" data-go="${(i - 1 + n) % n}" data-cursor="button"><span class="dv-nav__dir micro">← Previous department</span><span class="dv-nav__name">${esc(prev.name)}</span></button>
        <button type="button" data-go="${(i + 1) % n}" data-cursor="button"><span class="dv-nav__dir micro">Next department →</span><span class="dv-nav__name">${esc(next.name)}</span></button>
      </nav>
      <div class="dv-foot"><button type="button" class="micro" data-close data-cursor="button">← Back to all departments</button><span class="micro">${pad(i + 1)} / ${pad(n)}</span></div>`;
    fitTitle();
    stopMotif();
    motifD = SC.motifs.mount(canvas, d.motif || d.id);
    if (dvIO) dvIO.disconnect();
    dvIO = SC.reveal(content, scroller);
  }

  SC.openDept = function (i, fromEl, opts = {}) {
    const D = SC.C.departments;
    if (!D[i]) return;
    if (isOpen) { switchTo(i); return; }
    isOpen = true;
    lastFocus = document.activeElement;
    let ox = innerWidth / 2, oy = innerHeight / 2;
    if (fromEl) {
      const dot = fromEl.querySelector('.nnode__dot, .dl__dot') || fromEl, r = dot.getBoundingClientRect();
      ox = r.left + r.width / 2; oy = r.top + r.height / 2;
    }
    dv.style.setProperty('--ox', ox + 'px');
    dv.style.setProperty('--oy', oy + 'px');
    dv.hidden = false;   // still clipped to a 0px circle, but measurable
    fill(i);
    scroller.scrollTop = 0;
    SC.lock(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      dv.classList.add('open');
      setTimeout(() => { dv.classList.add('ready'); scroller.focus({ preventScroll: true }); }, SC.reduce ? 0 : 480);
    }));
    if (!opts.fromHistory) { history.pushState({ dept: D[i].id }, '', '#department/' + D[i].id); pushed = true; }
  };

  function switchTo(i) {
    if (i === cur) return;
    clearTimeout(swapTimer);
    content.classList.add('is-out');
    dv.classList.remove('ready');
    swapTimer = setTimeout(() => {
      fill(i);
      scroller.scrollTop = 0;
      content.classList.remove('is-out');
      requestAnimationFrame(() => dv.classList.add('ready'));
      history.replaceState({ dept: SC.C.departments[i].id }, '', '#department/' + SC.C.departments[i].id);
    }, SC.reduce ? 0 : 380);
  }

  function closeDept(fromHistory) {
    if (!isOpen) return;
    isOpen = false;
    dv.classList.remove('ready', 'open');
    setTimeout(() => { if (!isOpen) { dv.hidden = true; stopMotif(); content.innerHTML = ''; } }, SC.reduce ? 10 : 1060);
    SC.lock(false);
    if (!fromHistory) {
      if (pushed) history.back();
      else history.replaceState(null, '', location.pathname + location.search);
    }
    pushed = false;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  window.addEventListener('popstate', () => {
    const m = location.hash.match(/^#department\/(.+)$/);
    if (m) { const i = SC.deptIndex(decodeURIComponent(m[1])); if (i >= 0) isOpen ? switchTo(i) : SC.openDept(i, null, { fromHistory: true }); }
    else if (isOpen) { pushed = false; closeDept(true); }
  });

  dv.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) { switchTo(+go.dataset.go); return; }
    if (e.target.closest('[data-close], .dview__back')) { closeDept(false); return; }
    const pr = e.target.closest('[data-project]');
    if (pr) SC.openProject(+pr.dataset.project, pr);
  });

  /* ---------- project sheet ---------- */
  const sheet = $('#sheet'), sheetContent = $('.sheet__content'), sheetClose = $('.sheet__close');
  let sheetOpen = false, sheetFocus = null;
  SC.openProject = function (idx) {
    const p = SC.C.projects[idx];
    if (!p) return;
    const d = SC.deptById(p.department);
    sheetContent.innerHTML = SC.media(p.image, { cls: 'sheet__media', alt: p.title, label: 'Project photo · replace', eager: true }) +
      `<div class="sheet__body"><div><p class="micro" style="color:var(--yellow)">${esc(d ? d.name : '')}</p><h2 class="sheet__title" id="sheet-title">${esc(p.title)}</h2><p class="sheet__desc">${esc(p.description)}</p>` +
      (p.link ? `<p style="margin-top:2rem"><a class="btn" href="${esc(p.link)}" target="_blank" rel="noopener" data-cursor="button"><span>Learn more</span><span class="btn__arrow" aria-hidden="true">→</span></a></p>` : '') +
      `</div><dl class="sheet__meta micro"><div><dt>Department</dt><dd>${esc(d ? d.short : '')}</dd></div><div><dt>Year</dt><dd>${esc(p.year)}</dd></div><div><dt>Status</dt><dd>${esc(p.status)}</dd></div></dl></div>`;
    sheetOpen = true;
    sheetFocus = document.activeElement;
    sheet.hidden = false;
    SC.lock(true);
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open')));
    setTimeout(() => sheetClose.focus({ preventScroll: true }), 60);
  };
  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    sheet.classList.remove('open');
    setTimeout(() => { if (!sheetOpen) sheet.hidden = true; }, SC.reduce ? 10 : 900);
    if (!isOpen) SC.lock(false);
    if (sheetFocus && sheetFocus.focus) sheetFocus.focus({ preventScroll: true });
  }
  sheetClose.addEventListener('click', closeSheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', (e) => {
    if (sheetOpen) {
      if (e.key === 'Escape') closeSheet();
      if (e.key === 'Tab') SC.trap(e, SC.focusables(sheet));
      return;
    }
    if (isOpen) {
      if (e.key === 'Escape') closeDept(false);
      if (e.key === 'Tab') SC.trap(e, SC.focusables(dv));
    }
  });

  SC.initDepartments = function () {
    network();
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-dept]');
      if (b) SC.openDept(+b.dataset.dept, b);
    });
    addEventListener('resize', () => { if (isOpen) fitTitle(); });
    const m = location.hash.match(/^#department\/(.+)$/);
    if (m) { const i = SC.deptIndex(decodeURIComponent(m[1])); if (i >= 0) setTimeout(() => SC.openDept(i, null, { fromHistory: true }), 300); }
  };
})();
