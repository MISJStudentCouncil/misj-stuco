/* ==========================================================================
   LOST & FOUND — admins: add a photo + description + date taken in,
   edit them, remove returned items
   ========================================================================== */
(function () {
  'use strict';

  const LF = window.LF, $ = LF.$;
  const card = $('.lf-card'), desk = $('.lf-desk'), who = $('.lf-who');
  const form = $('.lf-up'), file = $('#lf-file'), drop = $('.lf-drop'), preview = $('.lf-drop__preview');
  const desc = $('#lf-desc'), date = $('#lf-date'), submit = $('.lf-up__submit'), msg = $('.lf-up__msg');
  const list = $('.lf-list'), count = $('.lf-count');
  let picked = null;

  const say = (t, bad) => { msg.textContent = t; msg.classList.toggle('is-bad', !!bad); };
  // today in the admin's own time zone, as YYYY-MM-DD
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const resetDate = () => { date.value = today(); date.max = today(); };

  async function start() {
    if (!LF.configured) { desk.hidden = true; card.hidden = false; return LF.renderNotConfigured(card); }
    let a;
    try { a = await LF.access(); } catch (e) { a = { error: e }; }
    if (!a.session) {
      who.hidden = true; desk.hidden = true; card.hidden = false;
      return LF.renderAdminSignIn(card);
    }
    LF.renderWho(who, a.email);
    if (!a.librarian) {
      desk.hidden = true; card.hidden = false;
      card.innerHTML = `<p class="label">Admins only</p>
        <h2 class="lf-card__title">This account can't add items.</h2>
        <p class="lf-card__text">You're signed in as <b>${LF.esc(a.email)}</b>. If you should have access, ask StuCo to add this email to the admin list.</p>
        <a class="btn btn--big" href="../lost-found.html"><span>See the Lost &amp; Found</span><span class="btn__arrow" aria-hidden="true">→</span></a>`;
      return;
    }
    card.hidden = true; desk.hidden = false;
    resetDate();
    await load();
  }

  /* ---------- pick a photo ---------- */
  function pick(f) {
    if (!f) return;
    if (!/^image\//.test(f.type)) return say('Please choose a photo (JPG, PNG or WebP).', true);
    picked = f;
    preview.src = URL.createObjectURL(f);
    drop.classList.add('has-photo');
    say('');
  }
  file.addEventListener('change', () => pick(file.files[0]));
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (e) => pick(e.dataTransfer.files[0]));

  /* shrink big phone photos and drop their hidden location data */
  function toJpeg(f, max = 1600) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error('convert'))), 'image/jpeg', 0.85);
      };
      img.onerror = () => reject(new Error('read'));
      img.src = URL.createObjectURL(f);
    });
  }

  /* ---------- add an item ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!picked) return say('Choose a photo first.', true);
    if (!desc.value.trim()) return say('Add a short description, e.g. "Blue water bottle".', true);
    if (!date.value) return say('Add the date it was taken in.', true);
    submit.disabled = true; say('Uploading…');
    const path = `${crypto.randomUUID()}.jpg`;
    try {
      let blob;
      try { blob = await toJpeg(picked); } catch (err) { throw new Error("This photo format can't be read. Please use a JPG or PNG."); }
      const up = await LF.db.storage.from(LF.BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
      if (up.error) throw up.error;
      const ins = await LF.db.from('lost_items').insert({ image_path: path }).select('id').single();
      if (ins.error) { await LF.db.storage.from(LF.BUCKET).remove([path]); throw ins.error; }
      const note = await LF.db.from('lost_item_notes').insert({ item_id: ins.data.id, description: desc.value.trim(), found_on: date.value });
      if (note.error) throw note.error;
      form.reset(); resetDate(); picked = null; drop.classList.remove('has-photo'); preview.removeAttribute('src');
      say('Added. Students can see the photo now.');
      await load();
    } catch (err) {
      say(err.message || 'Something went wrong. Please try again.', true);
    } finally {
      submit.disabled = false;
    }
  });

  /* ---------- current items ---------- */
  async function load() {
    const { data, error } = await LF.db.from('lost_items').select('id, image_path, created_at, lost_item_notes(description, found_on)').order('created_at', { ascending: false });
    if (error) { list.innerHTML = `<li class="lf-empty">Couldn't load the items. Please refresh the page.</li>`; return; }
    let urls = {};
    try { urls = await LF.signedUrls(data.map((d) => d.image_path)); } catch (e) { /* thumbnails left blank */ }
    count.textContent = data.length === 1 ? '1 item' : `${data.length} items`;
    list.innerHTML = data.length ? data.map((d) => {
      const n = (Array.isArray(d.lost_item_notes) ? d.lost_item_notes[0] : d.lost_item_notes) || {};
      return `<li class="lf-row" data-id="${d.id}" data-path="${LF.esc(d.image_path)}">
        <span class="lf-row__img">${urls[d.image_path] ? `<img src="${LF.esc(urls[d.image_path])}" alt="" loading="lazy">` : ''}</span>
        <div class="lf-row__body">
          <label class="lf-row__date micro">Taken in <input class="lf-row__when" type="date" value="${LF.esc(n.found_on || '')}" max="${today()}"></label>
          <textarea class="lf-row__desc" rows="2" aria-label="Description (only admins see this)">${LF.esc(n.description || '')}</textarea>
          <div class="lf-row__actions">
            <button class="btn lf-row__save" type="button" hidden>Save changes</button>
            <button class="btn lf-row__remove" type="button">Returned · remove</button>
          </div>
        </div>
      </li>`;
    }).join('') : `<li class="lf-empty">No items yet. Add the first one with the form.</li>`;
  }

  const changed = (e) => {
    if (e.target.matches('.lf-row__desc, .lf-row__when')) $('.lf-row__save', e.target.closest('.lf-row')).hidden = false;
  };
  list.addEventListener('input', changed);
  list.addEventListener('change', changed);
  list.addEventListener('click', async (e) => {
    const row = e.target.closest('.lf-row');
    if (!row) return;
    if (e.target.closest('.lf-row__save')) {
      const btn = $('.lf-row__save', row), when = $('.lf-row__when', row).value;
      if (!when) return alert('Add the date it was taken in.');
      btn.disabled = true;
      const { error } = await LF.db.from('lost_item_notes').upsert({ item_id: row.dataset.id, description: $('.lf-row__desc', row).value.trim(), found_on: when });
      btn.disabled = false;
      if (error) return alert(error.message);
      btn.hidden = true;
    }
    if (e.target.closest('.lf-row__remove')) {
      if (!confirm('Remove this item? Do this once it has been collected. Students will no longer see it.')) return;
      const del = await LF.db.from('lost_items').delete().eq('id', row.dataset.id);
      if (del.error) return alert(del.error.message);
      await LF.db.storage.from(LF.BUCKET).remove([row.dataset.path]);
      await load();
    }
  });

  LF.onAuth(start);
})();
