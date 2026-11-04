/* ==========================================================================
   MISJ STUCO — EVENTS + CONTACT PAGES
   events.html lists everything published at /announcementadmins that is still
   current. contact.html is built from `contact` and `socials` in content.js.
   ========================================================================== */
(function () {
  'use strict';

  const C = window.STUCO_CONTENT, ICONS = window.STUCO_ICONS;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const ig = C.socials.find((s) => s.icon === 'instagram');
  const handle = (url) => '@' + url.replace(/\/+$/, '').split('/').pop();

  document.querySelectorAll('.js-logo').forEach((img) => { img.src = C.site.logo.src; img.alt = C.site.logo.alt; });

  /* ---------- events ---------- */
  // Supabase only hands out announcements that are live: past their end date they drop out by themselves
  async function liveAnnouncements() {
    const { supabaseUrl: url, supabaseAnonKey: key } = window.LF_CONFIG || {};
    if (!url || !key || /YOUR-/.test(url + key)) return [];
    const res = await fetch(`${url}/rest/v1/announcements?select=id,title,description,image_path,expires_at,created_at&order=created_at.desc`, { headers: { apikey: key }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(res.statusText);
    return (await res.json()).map((r) => Object.assign(r, { image: `${url}/storage/v1/object/public/announcements/${encodeURIComponent(r.image_path)}` }));
  }

  async function renderEvents() {
    const grid = $('.ev-grid'), count = $('.ev-count');
    if (ig) $('.ev-follow').innerHTML = `For updates, follow <a href="${esc(ig.url)}" target="_blank" rel="noopener"><b>${esc(handle(ig.url))}</b></a> on Instagram.`;
    window.STUCO_isAdmin().then((admin) => { $('.lf-admin-link').hidden = !admin; });
    let rows;
    try { rows = await liveAnnouncements(); } catch (e) {
      count.textContent = 'Offline';
      grid.innerHTML = `<li class="lf-empty"><span class="lf-empty__big">Couldn't load the events.</span>Check your connection and refresh the page.</li>`;
      return;
    }
    count.textContent = rows.length === 1 ? '1 event' : `${rows.length} events`;
    grid.innerHTML = rows.map((a) => `<li class="ev-card">
        <div class="ev-card__img"><img src="${esc(a.image)}" alt="${esc(a.title)}" loading="lazy" decoding="async"></div>
        <div class="ev-card__body">
          <p class="micro ev-card__when">Posted ${esc(day(a.created_at))}${a.expires_at ? ` · Until ${esc(day(a.expires_at))}` : ''}</p>
          <h2 class="ev-card__title">${esc(a.title)}</h2>
          <p class="ev-card__desc">${esc(a.description)}</p>
        </div>
      </li>`).join('')
      || `<li class="lf-empty"><span class="lf-empty__big">Nothing on right now.</span>New events and announcements show up here as soon as StuCo posts them.</li>`;
  }

  /* ---------- contact ---------- */
  function renderContact() {
    const k = C.contact;
    $('.ct-office').textContent = k.office || '';
    const cards = [
      { icon: 'email', label: 'Email', value: k.email, action: 'Send us an email', href: `mailto:${k.email}` },
      ...C.socials.map((s) => ({ icon: s.icon, label: s.label, value: s.icon === 'email' ? s.url.replace(/^mailto:/, '') : handle(s.url), action: `Message us on ${s.label}`, href: s.url, out: true })),
      { icon: 'pin', label: 'Location', value: k.location, action: 'Open in Google Maps', href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(k.location)}`, out: true }
    ].filter((c) => c.value);
    $('.ct-grid').innerHTML = cards.map((c) => `<li>
        <a class="ct-card" href="${esc(c.href)}"${c.out ? ' target="_blank" rel="noopener"' : ''}>
          <span class="ct-card__icon">${ICONS[c.icon] || ICONS.email}</span>
          <span class="micro ct-card__label">${esc(c.label)}</span>
          <span class="ct-card__value">${esc(c.value)}</span>
          <span class="ct-card__action">${esc(c.action)} <span aria-hidden="true">${c.out ? '↗' : '→'}</span></span>
        </a>
      </li>`).join('');
  }

  if (document.body.dataset.page === 'events') renderEvents();
  if (document.body.dataset.page === 'contact') renderContact();
})();
