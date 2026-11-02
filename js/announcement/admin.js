/* ==========================================================================
   HOMEPAGE ANNOUNCEMENTS — admins: post slides (photo + title + description
   + optional end date), edit them, archive them, look back at the history.
   Sign-in and the admin list are shared with Lost & Found (js/lost-found/common.js).
   ========================================================================== */
(function () {
  'use strict';

  const LF = window.LF, $ = LF.$;
  const BUCKET = 'announcements', TABLE = 'announcements';
  const card = $('.lf-card'), desk = $('.lf-desk'), who = $('.lf-who');
  const form = $('.an-form'), heading = $('.an-form__title'), file = $('#an-file'), drop = $('.lf-drop'), preview = $('.lf-drop__preview');
  const title = $('#an-title'), desc = $('#an-desc'), until = $('#an-until');
  const submit = $('.lf-up__submit'), submitLabel = $('.an-submit-label'), cancel = $('.an-cancel'), msg = $('.lf-up__msg');
  const liveList = $('.an-live'), pastList = $('.an-past'), liveCount = $('.an-live-count'), pastCount = $('.an-past-count');
  // tried in order until a photo is small enough: [longest side in px, JPEG quality]
  const COMPRESS = [[1400, 0.8], [1400, 0.65], [1100, 0.6], [900, 0.55]], TARGET = 350 * 1024;
  let rows = [], picked = null, editing = null;

  const say = (t, bad) => { msg.textContent = t; msg.classList.toggle('is-bad', !!bad); };
  const photoUrl = (path) => LF.db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const size = (n) => (n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`);
  const when = (iso) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  // a date as a datetime-local field wants it: in the admin's own time zone
  const toField = (d) => { const t = new Date(d); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); return t.toISOString().slice(0, 16); };
  const isLive = (a) => !a.archived_at && (!a.expires_at || new Date(a.expires_at) > new Date());

  async function start() {
    if (!LF.configured) { desk.hidden = true; card.hidden = false; return LF.renderNotConfigured(card); }
    let a;
    try { a = await LF.access(); } catch (e) { a = { error: e }; }
    if (!a.session) {
      who.hidden = true; desk.hidden = true; card.hidden = false;
      return LF.renderSignIn(card, { label: 'Admins only', title: 'Sign in to post an announcement.', text: 'Only StuCo admins can post.' });
    }
    LF.renderWho(who, a.email);
    if (!a.librarian) {
      desk.hidden = true; card.hidden = false;
      card.innerHTML = `<p class="label">Admins only</p>
        <h2 class="lf-card__title">This account can't post announcements.</h2>
        <p class="lf-card__text">You're signed in as <b>${LF.esc(a.email)}</b>. If you should have access, ask StuCo to add this email to the admin list.</p>`;
      return;
    }
    card.hidden = true; desk.hidden = false;
    resetForm();
    await load();
    // arrived from the Edit button on a homepage slide
    const params = new URLSearchParams(location.search), wanted = rows.find((r) => r.id === params.get('edit'));
    if (params.has('edit')) history.replaceState(null, '', location.pathname);
    if (wanted && isLive(wanted)) edit(wanted);
  }

  /* ---------- the two lists ---------- */
  const rowHtml = (a, note, buttons) => `<li class="lf-row" data-id="${LF.esc(a.id)}">
      <span class="lf-row__img"><img src="${LF.esc(photoUrl(a.image_path))}" alt="" loading="lazy"></span>
      <div class="lf-row__body">
        <strong class="an-row__title">${LF.esc(a.title)}</strong>
        <p class="an-row__desc">${LF.esc(a.description)}</p>
        <p class="micro an-row__when">${LF.esc(note)}</p>
        <div class="lf-row__actions">${buttons}</div>
      </div>
    </li>`;

  async function load() {
    const { data, error } = await LF.db.from(TABLE).select('id, title, description, image_path, expires_at, archived_at, created_at').order('created_at', { ascending: false });
    if (error) return say("Couldn't load the announcements. Has the latest supabase/announcement-setup.sql been run?", true);
    rows = data;
    const live = rows.filter(isLive);
    const past = rows.filter((a) => !isLive(a)).sort((a, b) => new Date(b.archived_at || b.expires_at) - new Date(a.archived_at || a.expires_at));
    liveCount.textContent = live.length === 1 ? '1 slide' : `${live.length} slides`;
    pastCount.textContent = `${past.length} archived`;
    liveList.innerHTML = live.map((a) => rowHtml(a, a.expires_at ? `Live until ${when(a.expires_at)}` : 'Live, no end date',
      `<button class="btn" type="button" data-act="edit">Edit</button>
       <button class="btn" type="button" data-act="replace">Replace photo</button>
       <button class="btn lf-row__remove" type="button" data-act="archive">Archive now</button>
       <button class="btn lf-row__remove" type="button" data-act="delete">Delete</button>`)).join('')
      || '<li class="lf-empty">Nothing on the homepage yet. Post the first one with the form.</li>';
    pastList.innerHTML = past.map((a) => rowHtml(a, `Archived ${when(a.archived_at || a.expires_at)}`,
      `<button class="btn" type="button" data-act="restore">Put back</button>
       <button class="btn lf-row__remove" type="button" data-act="delete">Delete forever</button>`)).join('')
      || '<li class="lf-empty">Nothing archived yet.</li>';
  }

  /* ---------- pick a photo: only real images get through ---------- */
  function showSaved() {
    picked = null;
    drop.classList.toggle('has-photo', !!editing);
    if (editing) preview.src = photoUrl(editing.image_path); else preview.removeAttribute('src');
  }
  async function compress(f) {
    let blob;
    for (const [max, quality] of COMPRESS) {
      blob = await LF.toJpeg(f, max, quality);
      if (blob.size <= TARGET) break;
    }
    return blob;
  }
  async function pick(f) {
    if (!f) return;
    submit.disabled = true; say('Checking and compressing the photo…');
    try {
      // the type alone isn't proof, so a PDF renamed to .jpg fails at the compress step
      if (!/^image\//.test(f.type)) throw new Error('not an image');
      picked = await compress(f);
      preview.src = URL.createObjectURL(picked);
      drop.classList.add('has-photo');
      say(`Photo ready: compressed from ${size(f.size)} to ${size(picked.size)}.`);
    } catch (err) {
      file.value = '';
      showSaved();
      say("That file can't be used. Choose an image such as JPG, PNG or WebP. PDFs and other files aren't allowed.", true);
    } finally {
      submit.disabled = false;
    }
  }
  file.addEventListener('change', () => pick(file.files[0]));
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (e) => pick(e.dataTransfer.files[0]));

  /* ---------- the form: new, or editing one ---------- */
  function resetForm() {
    editing = null;
    form.reset();
    showSaved();
    heading.textContent = 'New announcement';
    submitLabel.textContent = 'Publish';
    cancel.hidden = true;
    until.min = toField(new Date());
  }
  function edit(a) {
    editing = a;
    showSaved();
    file.value = '';
    title.value = a.title;
    desc.value = a.description;
    until.value = a.expires_at ? toField(a.expires_at) : '';
    until.min = toField(new Date());
    heading.textContent = 'Edit announcement';
    submitLabel.textContent = 'Save changes';
    cancel.hidden = false;
    say('');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  cancel.addEventListener('click', () => { resetForm(); say(''); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!picked && !editing) return say('Choose a photo first.', true);
    if (!title.value.trim()) return say('Add a title.', true);
    if (!desc.value.trim()) return say('Add a description.', true);
    const end = until.value ? new Date(until.value) : null;
    if (end && end <= new Date()) return say('The removal date needs to be in the future.', true);
    submit.disabled = true; say('Publishing…');
    const oldPath = editing && editing.image_path;
    let path = oldPath;
    try {
      if (picked) {
        path = `${crypto.randomUUID()}.jpg`;
        const up = await LF.db.storage.from(BUCKET).upload(path, picked, { contentType: 'image/jpeg' });
        if (up.error) throw up.error;
      }
      const row = { title: title.value.trim(), description: desc.value.trim(), image_path: path, expires_at: end ? end.toISOString() : null };
      const { error } = editing ? await LF.db.from(TABLE).update(row).eq('id', editing.id) : await LF.db.from(TABLE).insert(row);
      if (error) {
        if (path !== oldPath) await LF.db.storage.from(BUCKET).remove([path]);
        throw error;
      }
      if (oldPath && path !== oldPath) await LF.db.storage.from(BUCKET).remove([oldPath]);
      const done = editing ? 'Saved.' : "Published. It's on the homepage now.";
      resetForm();
      say(done);
      await load();
    } catch (err) {
      say(err.message || 'Something went wrong. Please try again.', true);
    } finally {
      submit.disabled = false;
    }
  });

  /* ---------- row buttons ---------- */
  async function act(a, what) {
    if (what === 'edit') return edit(a);
    if (what === 'replace') { edit(a); return file.click(); }
    let error;
    if (what === 'archive') {
      if (!confirm('Take this off the homepage? It stays in Archived.')) return;
      ({ error } = await LF.db.from(TABLE).update({ archived_at: new Date().toISOString() }).eq('id', a.id));
    }
    if (what === 'restore') {
      ({ error } = await LF.db.from(TABLE).update({ archived_at: null, expires_at: null }).eq('id', a.id));
    }
    if (what === 'delete') {
      if (!confirm('Delete this forever? The text and photo are gone for good, and this can\'t be undone.')) return;
      ({ error } = await LF.db.from(TABLE).delete().eq('id', a.id));
      if (!error) await LF.db.storage.from(BUCKET).remove([a.image_path]);
    }
    if (error) return alert(error.message);
    if (editing && editing.id === a.id) resetForm();
    await load();
  }
  [liveList, pastList].forEach((list) => list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const a = rows.find((r) => r.id === btn.closest('.lf-row').dataset.id);
    if (a) act(a, btn.dataset.act);
  }));

  LF.onAuth(start);
})();
