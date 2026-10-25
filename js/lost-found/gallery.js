/* ==========================================================================
   LOST & FOUND — student gallery (photos only, school accounts only)
   ========================================================================== */
(function () {
  'use strict';

  const LF = window.LF, C = window.LF_CONFIG || {}, $ = LF.$;
  const card = $('.lf-card'), gallery = $('.lf-gallery'), grid = $('.lf-grid'), count = $('.lf-count'), who = $('.lf-who');
  const box = $('.lf-box'), boxImg = $('.lf-box__img'), boxNum = $('.lf-box__num');
  let items = [], loadedAt = 0, cur = 0;

  function show(state) {
    card.hidden = state === 'gallery';
    gallery.hidden = state !== 'gallery';
  }

  async function start() {
    if (!LF.configured) { show('card'); return LF.renderNotConfigured(card); }
    let a;
    try { a = await LF.access(); } catch (e) { a = { error: e }; }
    if (!a.session) { who.hidden = true; show('card'); return LF.renderSignIn(card); }
    LF.renderWho(who, a.email);
    if (!a.student && !a.librarian) {
      show('card');
      card.innerHTML = `<p class="label">Students only</p>
        <h2 class="lf-card__title">This account can't open Lost &amp; Found.</h2>
        <p class="lf-card__text">You're signed in as <b>${LF.esc(a.email)}</b>. Sign out and use your school email${LF.domainHint ? ` (<b>${LF.esc(LF.domainHint)}</b>)` : ''}.</p>
        <button class="btn btn--big lf-switch" type="button"><span>Use a different account</span><span class="btn__arrow" aria-hidden="true">→</span></button>`;
      $('.lf-switch', card).addEventListener('click', async () => { await LF.signOut(); location.reload(); });
      return;
    }
    if (a.librarian) $('.lf-admin-link').hidden = false;
    show('gallery');
    await load();
  }

  async function load() {
    grid.setAttribute('aria-busy', 'true');
    const { data, error } = await LF.db.from('lost_items').select('id, image_path, created_at').order('created_at', { ascending: false });
    if (error) { grid.innerHTML = `<li class="lf-empty">Couldn't load the photos. Please refresh the page.</li>`; return; }
    let urls = {};
    try { urls = await LF.signedUrls(data.map((d) => d.image_path)); } catch (e) { /* shown as missing below */ }
    items = data.filter((d) => urls[d.image_path]).map((d) => ({ id: d.id, url: urls[d.image_path] }));
    loadedAt = Date.now();
    count.textContent = items.length === 1 ? '1 item' : `${items.length} items`;
    grid.innerHTML = items.length
      ? items.map((it, i) => `<li class="lf-item" style="--i:${Math.min(i, 12)}"><button class="lf-item__btn" type="button" data-i="${i}" aria-label="Open photo ${i + 1} of ${items.length}"><img src="${LF.esc(it.url)}" alt="" loading="lazy" decoding="async"></button></li>`).join('')
      : `<li class="lf-empty"><span class="lf-empty__big">Nothing here right now.</span>Nothing has been handed in. Check back soon.</li>`;
    grid.removeAttribute('aria-busy');
  }

  /* ---------- lightbox ---------- */
  function open(i) {
    cur = (i + items.length) % items.length;
    boxImg.src = items[cur].url;
    boxImg.alt = `Lost item photo ${cur + 1}`;
    boxNum.textContent = `${String(cur + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    if (!box.open) box.showModal();
  }
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.lf-item__btn');
    if (b) open(+b.dataset.i);
  });
  $('.lf-box__prev').addEventListener('click', () => open(cur - 1));
  $('.lf-box__next').addEventListener('click', () => open(cur + 1));
  $('.lf-box__close').addEventListener('click', () => box.close());
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') open(cur - 1);
    if (e.key === 'ArrowRight') open(cur + 1);
  });

  // photo links last an hour; refresh them when someone comes back to an old tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !gallery.hidden && Date.now() - loadedAt > 50 * 60 * 1000) load();
  });

  document.querySelectorAll('.lf-collect').forEach((el) => (el.textContent = C.collectAt || 'the library'));
  LF.onAuth(start);
})();
