/* ==========================================================================
   MISJ STUCO — RENDER
   Builds every chapter from content/content.js. No content lives in here.
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SC, $ = SC.$, $$ = SC.$$, esc = SC.esc, pad = SC.pad;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const SLIDES_MAX = 10, SLIDE_MS = 7000;   // hero panel: most slides shown, time on each

  const ICONS = window.STUCO_ICONS;

  const parseDate = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const isExternal = (u) => /^https?:/i.test(u);
  /* letter-by-letter reveal: letters stay inside their word so long lines still wrap between words */
  const splitChars = (text) => {
    let i = 0;
    return text.trim().split(/\s+/).map((word) =>
      `<span class="ch-word">${Array.from(word).map((ch) => `<span class="ch" aria-hidden="true" style="--i:${i++}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
  };

  SC.render = function (C) {
    SC.C = C;
    const D = C.departments || [];
    SC.deptById = (id) => D.find((d) => d.id === id) || null;
    SC.deptIndex = (id) => D.findIndex((d) => d.id === id);

    /* identity */
    $$('.js-logo').forEach((img) => { img.src = C.site.logo.src; img.alt = C.site.logo.alt; });
    const st = $('.js-stuco-logo');
    if (st && C.site.stucoLogo && C.site.stucoLogo.src) { st.src = C.site.stucoLogo.src; st.alt = C.site.stucoLogo.alt || ''; st.hidden = false; }
    $$('.js-term').forEach((el) => (el.textContent = C.site.term || ''));
    $$('.js-year').forEach((el) => (el.textContent = new Date().getFullYear()));
    const title = $('.hero__title');
    title.innerHTML = splitChars(title.textContent);

    /* menu + footer navigation */
    $('.menu__list').innerHTML = C.menu.map((m, i) =>
      `<li><a href="${esc(m.href)}" style="--i:${i}" data-cursor="button"><span class="menu__dot" aria-hidden="true"></span><span class="menu__mask"><span class="menu__txt">${esc(m.label)}</span></span><span class="menu__idx" aria-hidden="true">${pad(i + 1)}</span></a></li>`).join('');
    $('.foot__nav ul').innerHTML = C.menu.map((m) => `<li><a href="${esc(m.href)}">${esc(m.label)}</a></li>`).join('');
    const mail = C.contact.email ? `<a href="mailto:${esc(C.contact.email)}">${esc(C.contact.email)}</a>` : '';
    $('.menu__contact').innerHTML = mail + C.socials.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('');
    $('.foot__contact').innerHTML = `<p class="micro">Contact</p>${mail}<p>${esc(C.contact.location)}</p><p>${esc(C.contact.office || '')}</p>`;
    $('.foot__social').innerHTML = C.socials.map((s) =>
      `<li><a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.label)} (opens in a new tab)" data-cursor="button">${ICONS[s.icon] || ICONS.email}</a></li>`).join('');

    /* 00 hero panel: events + announcements */
    renderBoard(C);

    /* 03 people */
    renderPeople(C, D);

    /* 04 departments: heading + mobile list (the network is built in departments.js) */
    $('.depts__count').textContent = `${D.length} Departments.`;
    $('.dlist').innerHTML = D.map((d, i) =>
      `<li><div class="dl__btn"><span class="dl__dot" aria-hidden="true"></span><span class="dl__num micro">${pad(i + 1)} / ${pad(D.length)}</span><span class="dl__name">${esc(d.name)}</span><span class="dl__keys micro">${d.keywords.map(esc).join(' → ')}</span></div></li>`).join('');

    /* 06 projects section removed */

  };

  /* ---------- 00 hero panel ----------
     Shows what was published at /announcementadmins, or content.js if nothing
     has been (or Supabase can't be reached). Supabase itself leaves out anything
     past its end date. Plain fetch: the homepage doesn't need the Supabase
     library just to read a few public rows. */
  async function liveAnnouncements() {
    const { supabaseUrl: url, supabaseAnonKey: key } = window.LF_CONFIG || {};
    if (!url || !key || /YOUR-/.test(url + key)) return [];
    const res = await fetch(`${url}/rest/v1/announcements?select=id,title,description,image_path&order=created_at.desc&limit=${SLIDES_MAX}`, { headers: { apikey: key }, signal: AbortSignal.timeout(3000) });
    const rows = res.ok ? await res.json() : [];
    return rows.map((r) => ({ id: r.id, image: `${url}/storage/v1/object/public/announcements/${encodeURIComponent(r.image_path)}`, alt: r.title, subheading: r.title, description: r.description }));
  }
  async function renderBoard(C) {
    const live = await liveAnnouncements().catch(() => []);
    const list = live.length ? live : [C.heroBox];
    const board = $('.hero__board');
    $('.hero__slides').innerHTML = list.map((b, i) => `<article class="hero__slide${i ? '' : ' is-on'}" aria-roledescription="slide" aria-label="${i + 1} of ${list.length}">
      ${SC.media(b.image, { cls: 'hero__media', alt: b.alt, eager: true })}
      <div class="hero__copy">
        <p class="label hero__label">Events &amp; Announcements</p>
        <h2 class="hero__sub" aria-label="${esc(b.subheading)}">${splitChars(b.subheading)}</h2>
        <p class="hero__desc">${esc(b.description)}</p>
      </div>
    </article>`).join('');
    const ig = C.socials.find((s) => s.icon === 'instagram');
    if (ig) $('.hero__contact').innerHTML = `Contact us through IG: <a href="${esc(ig.url)}" target="_blank" rel="noopener" data-cursor="button">@${esc(ig.url.replace(/\/+$/, '').split('/').pop())}</a>`;
    initSlides(board, list.length);
    // admins (checked with Supabase, see admin-check.js) get an Edit shortcut on each slide
    window.STUCO_isAdmin().then((admin) => {
      if (admin) $$('.hero__slide', board).forEach((el, i) => el.insertAdjacentHTML('afterbegin',
        `<a class="hero__edit micro" href="announcementadmins/${list[i].id ? `?edit=${encodeURIComponent(list[i].id)}` : ''}" data-cursor="button">Edit</a>`));
    });
    void board.offsetWidth;   // lay the hidden letters out first, so the reveal below animates
    board.classList.add('is-ready');
  }
  /* arrows, dots, the right half of the slide, swipe and autoplay. Autoplay keeps going under the
     mouse, starts its count again after every change, and stops while someone tabs through it. */
  function initSlides(board, n) {
    if (n < 2) return;
    const slides = $$('.hero__slide', board), [prev, next] = $$('.hero__step', board), pips = $('.hero__pips', board);
    let cur = 0, timer, touchX = null;
    $('.hero__nav', board).hidden = false;
    $('.hero__slides', board).insertAdjacentHTML('beforeend', '<button class="hero__hit" type="button" tabindex="-1" aria-hidden="true" data-cursor="button"></button>');
    pips.innerHTML = slides.map((s, i) => `<button class="hero__pip" type="button" aria-label="Go to announcement ${i + 1}" aria-current="${!i}" data-cursor="button"></button>`).join('');
    const dots = $$('.hero__pip', pips);
    const stop = () => clearInterval(timer);
    const play = () => { stop(); if (!SC.reduce) timer = setInterval(() => show(cur + 1), SLIDE_MS); };
    const show = (i) => {
      cur = (i + n) % n;
      slides.forEach((s, k) => s.classList.toggle('is-on', k === cur));
      dots.forEach((d, k) => d.setAttribute('aria-current', String(k === cur)));
    };
    const go = (i) => { show(i); if (!board.contains(document.activeElement) || !document.activeElement.matches(':focus-visible')) play(); };
    prev.addEventListener('click', () => go(cur - 1));
    next.addEventListener('click', () => go(cur + 1));
    $('.hero__hit', board).addEventListener('click', () => go(cur + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    board.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) stop(); });
    board.addEventListener('focusout', (e) => { if (!board.contains(e.relatedTarget)) play(); });
    board.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    board.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
      play();
    }, { passive: true });
    play();
  }

  /* ---------- 02 community interaction ---------- */
  function initCommunity() {
    const comm = $('#community'), words = $('.comm__words'), items = $$('.cword', words);
    let cur = -1;
    /* size the four words so the longest always fits, whatever the words are */
    SC.onResize(() => {
      words.style.removeProperty('--cw-fs');
      const fs = parseFloat(getComputedStyle(items[0].querySelector('.cword__btn')).fontSize);
      const ratio = Math.max(...items.map((li) => li.querySelector('.cword__btn span').getBoundingClientRect().width / fs));
      const avail = words.clientWidth * (SC.mqSwipe.matches ? 0.9 : 0.64);
      words.style.setProperty('--cw-fs', Math.min(200, avail / ratio).toFixed(1) + 'px');
    });
    const act = (i) => {
      if (i === cur) return;
      cur = i;
      comm.dataset.active = i < 0 ? '' : String(i);
      words.classList.toggle('has-active', i >= 0);
      items.forEach((li, k) => li.classList.toggle('is-active', k === i));
    };
    words.addEventListener('pointerover', (e) => { const li = e.target.closest('.cword'); if (li && e.pointerType === 'mouse') act(items.indexOf(li)); });
    words.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') act(-1); });
    words.addEventListener('focusin', (e) => { const li = e.target.closest('.cword'); if (li) act(items.indexOf(li)); });
    words.addEventListener('focusout', (e) => { if (!words.contains(e.relatedTarget)) act(-1); });
    words.addEventListener('click', (e) => { const li = e.target.closest('.cword'); if (li) { const i = items.indexOf(li); act(cur === i && !SC.fine ? -1 : i); } });
  }

  /* ---------- 03 people ---------- */
  function renderPeople(C, D) {
    const groups = C.leadership || [];
    const heads = D.map((d, i) => ({ name: d.head.name, role: 'Head of department', department: d.name, short: d.short, photo: d.image, quote: d.head.quote, num: pad(i + 1) }));

    const stage = $('.crew__stage');
    stage.innerHTML = groups.map((g) =>
      `<div class="crew__group">${g.group ? `<p class="label label--sub">${esc(g.group)}</p>` : ''}${SC.media(g.photo, { cls: 'crew__photo', mark: g.people.map((p) => p.name[0]).join(''), alt: `${g.group} group photo`, label: 'Group photo · replace' })}<ul class="crew__names">${g.people.map((p) => `<li><span class="micro">${esc(p.role)}</span><strong>${esc(p.name)}</strong></li>`).join('')}</ul></div>`).join('');

    const strip = $('.heads__strip');
    strip.style.setProperty('--n', Math.max(1, heads.length));
    strip.innerHTML = heads.map((p) =>
      `<li class="head"><span class="head__tag micro" aria-hidden="true">${esc(p.short)}</span><button class="head__btn" type="button" data-cursor="view" aria-label="${esc(p.department)} team">${SC.media(p.photo, { tag: 'span', mark: p.num, alt: `${p.department} team photo`, label: false })}<span class="head__num micro" aria-hidden="true">${p.num}</span></button><div class="head__cap"><strong>${esc(p.department)}</strong></div></li>`).join('');
    hoverGroup(strip, '.head', () => {});

  }

  /* hover / focus / tap highlighting for a group of portraits */
  function hoverGroup(root, sel, onChange) {
    const items = () => $$(sel, root);
    let cur = -1;
    const set = (i) => {
      if (i === cur) return;
      cur = i;
      root.classList.toggle('is-hover', i >= 0);
      items().forEach((el, k) => el.classList.toggle('is-on', k === i));
      onChange(i);
    };
    root.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const el = e.target.closest(sel); if (el) set(items().indexOf(el)); });
    root.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') set(-1); });
    root.addEventListener('focusin', (e) => { const el = e.target.closest(sel); if (el) set(items().indexOf(el)); });
    root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) set(-1); });
    root.addEventListener('click', (e) => { const el = e.target.closest(sel); if (el) { const i = items().indexOf(el); set(cur === i && !SC.fine ? -1 : i); } });
  }

  /* ---------- 06 projects ---------- */
  let activeFilter = 0;
  function renderFilters(C) {
    const box = $('.proj__filters');
    box.innerHTML = C.projectFilters.map((f, i) => {
      const n = C.projects.filter((p) => !f.departments || f.departments.includes(p.department)).length;
      return `<button class="pf" type="button" data-filter="${i}" aria-pressed="${i === 0}" data-cursor="button">${esc(f.label)}<sup>${n}</sup></button>`;
    }).join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.pf');
      if (!b) return;
      const i = +b.dataset.filter;
      if (i === activeFilter) return;
      $$('.pf', box).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      SC.renderProjects(i);
      SC.refresh();
    });
  }
  SC.renderProjects = function (fi) {
    const C = SC.C, f = C.projectFilters[fi] || C.projectFilters[0];
    activeFilter = fi;
    const list = C.projects.map((p, idx) => ({ p, idx })).filter(({ p }) => !f.departments || f.departments.includes(p.department));
    const card = ({ p, idx }, i) => {
      const d = SC.deptById(p.department);
      const status = p.status || 'Ongoing';
      return `<li class="pcard is-in" style="--k:${i}"><button class="pcard__btn" type="button" data-project="${idx}" data-cursor="open" aria-label="Open project: ${esc(p.title)}">` +
        SC.media(p.image, { tag: 'span', alt: p.title, label: false, mark: d ? d.short.split(' ')[0] : '' }) +
        `<span class="pcard__scrim"></span><span class="pcard__num" aria-hidden="true">${pad(i + 1)}</span>` +
        `<span class="pcard__status micro status--${SC.slug(status)}"><span class="status-dot"></span>${esc(status)}</span>` +
        `<span class="pcard__body"><span class="pcard__meta micro"><span>${esc(d ? d.short : p.department)}</span><span>${esc(p.year)}</span></span>` +
        `<span class="pcard__title">${esc(p.title)}</span><span class="pcard__desc">${esc(p.description)}</span></span></button></li>`;
    };
    const end = `<li class="pcard pcard--end"><p>Every project started as <em>someone's idea.</em></p><a class="btn" href="#voice" data-cursor="button"><span>Start yours</span><span class="btn__arrow" aria-hidden="true">→</span></a></li>`;
    $('.proj__track').innerHTML = list.length ? list.map(card).join('') + end : `<li class="pcard pcard--empty"><p class="micro">No projects in this category yet — the next one could be yours.</p></li>`;
    SC.projectCount = list.length;
    $('.proj__count').textContent = `01 / ${pad(Math.max(1, list.length))}`;
  };
})();
