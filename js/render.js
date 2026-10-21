const groups = [];
    (C.leadership || []).forEach((p) => {
      const name = p.group || '';
      let g = groups.find((x) => x.name === name);
      if (!g) groups.push(g = { name, people: [] });
      g.people.push(p);
    });
    const leaders = [].concat(...groups.map((g) => g.people));   // same order as on screen/* ==========================================================================
   MISJ STUCO — RENDER
   Builds every chapter from content/content.js. No content lives in here.
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SC, $ = SC.$, $$ = SC.$$, esc = SC.esc, pad = SC.pad;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const ICONS = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm5.3-3.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.6 7.6 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.7z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15V9l5.8 3-5.8 3z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4z"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M2 5h20v14H2V5zm2 2.4V17h16V7.4l-8 5-8-5zM5.6 7l6.4 4 6.4-4H5.6z"/></svg>'
  };

  const parseDate = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const isExternal = (u) => /^https?:/i.test(u);

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
    title.innerHTML = Array.from(title.textContent.trim()).map((ch, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${esc(ch)}</span>`).join('');

    /* menu + footer navigation */
    $('.menu__list').innerHTML = C.menu.map((m, i) =>
      `<li><a href="${esc(m.href)}" style="--i:${i}" data-cursor="button"><span class="menu__dot" aria-hidden="true"></span><span class="menu__mask"><span class="menu__txt">${esc(m.label)}</span></span><span class="menu__idx" aria-hidden="true">${pad(i + 1)}</span></a></li>`).join('');
    $('.foot__nav ul').innerHTML = C.menu.map((m) => `<li><a href="${esc(m.href)}">${esc(m.label)}</a></li>`).join('');
    const mail = C.contact.email ? `<a href="mailto:${esc(C.contact.email)}">${esc(C.contact.email)}</a>` : '';
    $('.menu__contact').innerHTML = mail + C.socials.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('');
    $('.foot__contact').innerHTML = `<p class="micro">Contact</p>${mail}<p>${esc(C.contact.location)}</p><p>${esc(C.contact.office || '')}</p>`;
    $('.foot__social').innerHTML = C.socials.map((s) =>
      `<li><a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.label)} (opens in a new tab)" data-cursor="button">${ICONS[s.icon] || ICONS.email}</a></li>`).join('');

    /* 02 community words */
    $('.comm__words').innerHTML = C.community.map((w, i) =>
      `<li class="cword"><button class="cword__btn" type="button" aria-describedby="cw-${i}"><span>${esc(w.word)}</span><span class="cword__idx" aria-hidden="true">${pad(i + 1)}</span></button><p class="cword__line" id="cw-${i}">${esc(w.line)}</p></li>`).join('');
    initCommunity();

    /* 03 people */
    renderPeople(C, D);

    /* 04 departments: heading + mobile list (the network is built in departments.js) */
    $('.depts__count').textContent = `${D.length} Departments.`;
    $('.dlist').innerHTML = D.map((d, i) =>
      `<li><button class="dl__btn" type="button" data-dept="${i}" data-cursor="explore"><span class="dl__dot" aria-hidden="true"></span><span class="dl__num micro">${pad(i + 1)} / ${pad(D.length)}</span><span class="dl__name">${esc(d.name)}</span><span class="dl__keys micro">${d.keywords.map(esc).join(' → ')}</span><span class="dl__go" aria-hidden="true">→</span></button></li>`).join('');

    /* 06 projects */
    renderFilters(C);
    SC.renderProjects(0);

    /* 07 events */
    renderEvents(C);

    /* 08 impact */
    $('.stats').innerHTML = C.impact.map((s, i) =>
      `<li class="stat"><p class="stat__num" aria-label="${esc(s.value)}${esc(s.suffix || '')}"><span data-count="${esc(s.value)}" aria-hidden="true">0</span><span class="stat__suffix" aria-hidden="true">${esc(s.suffix || '')}</span></p><p class="stat__label"><span class="stat__idx micro">${pad(i + 1)}</span>${esc(s.label)}</p></li>`).join('');

    /* student voice */
    $('.voice__opts').innerHTML = C.voice.map((v, i) => {
      const url = v.url || `mailto:${C.contact.email}?subject=${encodeURIComponent(v.title + ' — StuCo')}`;
      const ext = isExternal(url);
      return `<li class="vopt"><a href="${esc(url)}"${ext ? ' target="_blank" rel="noopener"' : ''} data-cursor="button"${ext ? ` aria-label="${esc(v.title)} (opens in a new tab)"` : ''}><span class="vopt__idx micro">${pad(i + 1)}</span><span><span class="vopt__title">${esc(v.title)}</span><span class="vopt__text">${esc(v.text)}</span></span><span class="vopt__arrow" aria-hidden="true">→</span></a></li>`;
    }).join('');

    /* 09 future milestones */
    $('.future__marks').innerHTML = C.milestones.map((m) => `<div class="fm"><span class="fm__dot"></span><span class="fm__label micro">${esc(m)}</span></div>`).join('');
    $('.future__list').innerHTML = C.milestones.map((m) => `<li>${esc(m)}</li>`).join('');
  };

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
    const groups = [];
    (C.leadership || []).forEach((p) => {
      const name = p.group || '';
      let g = groups.find((x) => x.name === name);
      if (!g) groups.push(g = { name, people: [] });
      g.people.push(p);
    });
    const leaders = [].concat(...groups.map((g) => g.people));   // same order as on screen
    const heads = D.map((d, i) => ({ name: d.head.name, role: 'Head of department', department: d.name, short: d.short, photo: d.head.photo, quote: d.head.quote, num: pad(i + 1) }));
    const members = [];
    (C.members || []).forEach((m) => members.push({ name: m, tag: 'StuCo' }));
    D.forEach((d) => (d.members || []).forEach((m) => members.push({ name: m, tag: d.short })));

    const spotHTML = (p) => p
      ? `<div class="spot"><p class="spot__role micro">${esc(p.role)}</p><p class="spot__name">${esc(p.name)}</p><p class="spot__dept micro">${esc(p.department)}</p>${p.quote ? `<blockquote class="spot__quote">“${esc(p.quote)}”</blockquote>` : ''}</div>`
      : `<div class="spot"><p class="spot__role micro">${leaders.length} leaders · ${heads.length} heads · ${members.length}+ members</p><p class="spot__name">The people behind StuCo.</p><p class="spot__hint micro">${SC.fine ? 'Hover' : 'Tap'} a portrait to meet them</p></div>`;

    const stage = $('.crew__stage'), spot = $('.crew__spot');
    const personHTML = (p) =>
      `<li class="person"><button class="person__btn" type="button" data-cursor="view" aria-label="${esc(p.name)}, ${esc(p.role)}">${SC.media(p.photo, { tag: 'span', cls: 'person__frame', portrait: true, mark: p.mark || SC.initials(p.name), alt: `Portrait of ${p.name}, ${p.role}`, label: 'Portrait · replace' })}</button><div class="person__cap" aria-hidden="true"><span class="micro">${esc(p.role)}</span><strong>${esc(p.name)}</strong></div></li>`;
    stage.innerHTML = groups.map((g) =>
      `<div class="crew__group">${g.name ? `<p class="label label--sub">${esc(g.name)}</p>` : ''}<ul class="crew__row" style="--n:${g.people.length}">${g.people.map(personHTML).join('')}</ul></div>`).join('');
    spot.innerHTML = spotHTML(null);
    hoverGroup(stage, '.person', (i) => { spot.innerHTML = spotHTML(i < 0 ? null : leaders[i]); });

    const strip = $('.heads__strip'), cap = $('.heads__caption');
    strip.style.setProperty('--n', Math.max(1, heads.length));
    strip.innerHTML = heads.map((p) =>
      `<li class="head"><button class="head__btn" type="button" data-cursor="view" aria-label="${esc(p.name)}, head of ${esc(p.department)}">${SC.media(p.photo, { tag: 'span', portrait: true, mark: p.num, alt: `Portrait of ${p.name}, head of ${p.department}`, label: false })}<span class="head__num micro" aria-hidden="true">${p.num}</span></button><div class="head__cap"><span class="micro">${esc(p.short)}</span><strong>${esc(p.name)}</strong></div></li>`).join('');
    const capHTML = (p) => p
      ? `<span class="micro">${p.num} / ${esc(p.department)}</span><strong>${esc(p.name)}</strong>${p.quote ? `<em>“${esc(p.quote)}”</em>` : ''}`
      : `<span class="micro">${heads.length} departments</span><strong>One head for every team.</strong>`;
    cap.innerHTML = capHTML(null);
    hoverGroup(strip, '.head', (i) => { cap.innerHTML = capHTML(i < 0 ? null : heads[i]); });

    /* members marquee: two rows moving in opposite directions */
    const wrap = $('.members__marquee');
    if (!members.length) { $('.members').hidden = true; return; }
    const rows = [members.filter((_, i) => i % 2 === 0), members.filter((_, i) => i % 2 === 1)].filter((r) => r.length);
    const item = (m) => `<span class="marq__item">${esc(m.name)} <small>${esc(m.tag)}</small></span>`;
    wrap.innerHTML = rows.map((r) => {
      const seq = r.map(item).join('');
      return `<div class="marq" aria-hidden="true" style="--dur:${Math.max(30, r.length * 7)}s"><div class="marq__track">${seq}${seq}</div></div>`;
    }).join('') + `<ul class="sr-only">${members.map((m) => `<li>${esc(m.name)}, ${esc(m.tag)}</li>`).join('')}</ul>`;
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

  /* ---------- 07 events ---------- */
  function renderEvents(C) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const evs = C.events.map((e) => ({ ...e, d: parseDate(e.date), end: parseDate(e.endDate || e.date) })).sort((a, b) => a.d - b.d);
    evs.forEach((e) => { e.up = e.status ? /up|soon|next/i.test(e.status) : e.end >= today; });
    const nowHTML = `<li class="tl__now" aria-label="Today"><span class="micro">Today · ${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}</span></li>`;
    let out = '', placed = false, k = 0;
    evs.forEach((e) => {
      if (e.up && !placed) { out += nowHTML; placed = true; }
      const d = SC.deptById(e.department);
      const range = e.endDate ? ` – ${e.end.getDate()} ${MONTHS[e.end.getMonth()]}` : '';
      out += `<li class="ev ${e.up ? 'ev--up' : 'ev--past'}${k++ % 2 ? ' ev--r' : ''}"><span class="ev__dot" aria-hidden="true"></span>` +
        SC.media(e.image, { cls: 'ev__media', alt: e.title, label: 'Event photo · replace', attrs: 'data-cursor="view"' }) +
        `<div class="ev__text"><span class="tag${e.up ? '' : ' tag--past'}">${e.up ? 'Upcoming' : 'Memory'}</span>` +
        `<time class="ev__date" datetime="${esc(e.date)}"><span class="ev__day">${pad(e.d.getDate())}</span><span class="ev__mon micro">${MONTHS[e.d.getMonth()]} ${e.d.getFullYear()}${range}</span></time>` +
        `<h3 class="ev__title">${esc(e.title)}</h3><p class="ev__meta micro"><span>${esc(e.location)}</span><span>${esc(d ? d.short : '')}</span></p>` +
        `<p class="ev__desc">${esc(e.description)}</p></div></li>`;
    });
    if (!placed) out += nowHTML;
    $('.tl').innerHTML = out;
  }
})();
