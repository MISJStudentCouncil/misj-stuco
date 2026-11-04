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
  const form = $('.an-form'), heading = $('.an-form__title'), file = $('#an-file');
  const photo = $('.an-photo'), frame = $('.an-crop'), shown = $('.an-crop__img'), zoom = $('#an-zoom'), change = $('.an-crop__change');
  const title = $('#an-title'), desc = $('#an-desc'), until = $('#an-until');
  const submit = $('.lf-up__submit'), submitLabel = $('.an-submit-label'), cancel = $('.an-cancel'), msg = $('.lf-up__msg');
  const liveList = $('.an-live'), pastList = $('.an-past'), liveCount = $('.an-live-count'), pastCount = $('.an-past-count');
  // tried in order until a photo is small enough: [width in px, JPEG quality]
  const COMPRESS = [[1400, 0.8], [1400, 0.65], [1100, 0.6], [900, 0.55]], TARGET = 350 * 1024;
  const SHAPE = 4 / 3;   // the homepage slide's photo frame (.hero__media)
  let rows = [], picked = null, editing = null;
  // the photo in the crop frame: how far in it's zoomed, and which point of it is in the middle
  let src = null, view = { z: 1, x: 0.5, y: 0.5 }, moved = false, loading = 0;

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

  /* ---------- crop: drag, pinch, wheel, slider or keys. Nothing is cut until Publish. ---------- */
  const loadImage = (url, cors) => new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';   // a saved photo comes from Supabase and is cropped again on a canvas
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('read'));
    img.src = url;
  });
  // the part of the photo inside the frame, in the photo's own pixels
  const visible = () => { const w = Math.min(src.w, src.h * SHAPE) / view.z; return [w, w / SHAPE]; };
  function draw() {
    if (!src) return;
    const [vw, vh] = visible();
    view.x = Math.min(1 - vw / 2 / src.w, Math.max(vw / 2 / src.w, view.x));
    view.y = Math.min(1 - vh / 2 / src.h, Math.max(vh / 2 / src.h, view.y));
    const s = frame.clientWidth / vw;
    shown.style.width = `${src.w * s}px`; shown.style.height = `${src.h * s}px`;
    shown.style.transform = `translate(${frame.clientWidth / 2 - view.x * src.w * s}px, ${frame.clientHeight / 2 - view.y * src.h * s}px)`;
    zoom.value = view.z;
  }
  const pan = (dx, dy) => { const k = visible()[0] / frame.clientWidth; view.x += dx * k / src.w; view.y += dy * k / src.h; moved = true; draw(); };
  const zoomTo = (z) => { view.z = Math.min(4, Math.max(1, z)); moved = true; draw(); };
  function setPhoto(img, url) {
    if (src && src.url) URL.revokeObjectURL(src.url);
    src = img && { img, w: img.naturalWidth, h: img.naturalHeight, url };
    view = { z: 1, x: 0.5, y: 0.5 };
    photo.classList.toggle('has-photo', !!src);
    if (src) { shown.src = img.src; draw(); } else shown.removeAttribute('src');
  }
  new ResizeObserver(draw).observe(frame);

  const touches = new Map();
  let pinch = 0;
  frame.addEventListener('pointerdown', (e) => { frame.setPointerCapture(e.pointerId); touches.set(e.pointerId, [e.clientX, e.clientY]); pinch = 0; });
  frame.addEventListener('pointermove', (e) => {
    const last = touches.get(e.pointerId);
    if (!last || !src) return;
    if (touches.size === 1) pan(last[0] - e.clientX, last[1] - e.clientY);
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2) {
      const [a, b] = [...touches.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch) zoomTo(view.z * d / pinch);
      pinch = d;
    }
  });
  ['pointerup', 'pointercancel'].forEach((t) => frame.addEventListener(t, (e) => { touches.delete(e.pointerId); pinch = 0; }));
  frame.addEventListener('wheel', (e) => { if (!src) return; e.preventDefault(); zoomTo(view.z * Math.exp(-e.deltaY / 500)); }, { passive: false });
  frame.addEventListener('keydown', (e) => {
    const step = frame.clientWidth / 20, keys = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (!src) return;
    if (keys[e.key]) pan(...keys[e.key]);
    else if (e.key === '+' || e.key === '=') zoomTo(view.z * 1.1);
    else if (e.key === '-') zoomTo(view.z / 1.1);
    else return;
    e.preventDefault();
  });
  zoom.addEventListener('input', () => { if (src) zoomTo(+zoom.value); });
  change.addEventListener('click', () => file.click());

  // the framed part, as a JPEG at most `max` wide
  function cropped(max, quality) {
    const [vw, vh] = visible(), c = document.createElement('canvas');
    c.width = Math.round(Math.min(max, vw)); c.height = Math.round(c.width / SHAPE);
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);   // JPEG has no transparency
    x.drawImage(src.img, view.x * src.w - vw / 2, view.y * src.h - vh / 2, vw, vh, 0, 0, c.width, c.height);
    return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('convert'))), 'image/jpeg', quality));
  }
  async function compress() {
    let blob;
    for (const [max, quality] of COMPRESS) {
      blob = await cropped(max, quality);
      if (blob.size <= TARGET) break;
    }
    return blob;
  }

  /* ---------- pick a photo: only real images get through ---------- */
  async function showSaved() {
    const ticket = ++loading;
    picked = null; moved = false;
    if (!editing) return setPhoto(null);
    // shown as the homepage shows it: centred and filling the frame
    const img = await loadImage(photoUrl(editing.image_path), true).catch(() => null);
    if (ticket === loading) setPhoto(img);
  }
  async function pick(f) {
    if (!f) return;
    const ticket = ++loading, url = URL.createObjectURL(f);
    try {
      // the type alone isn't proof: a PDF renamed to .jpg fails to load as an image
      if (!/^image\//.test(f.type)) throw new Error('not an image');
      const img = await loadImage(url);
      if (ticket !== loading) return URL.revokeObjectURL(url);
      picked = f;
      setPhoto(img, url);
      moved = true;
      say(`Photo ready (${size(f.size)}). Drag it to choose what shows, and zoom in to crop tighter. It's compressed when you publish.`);
    } catch (err) {
      URL.revokeObjectURL(url);
      file.value = '';
      say("That file can't be used. Choose an image such as JPG, PNG or WebP. PDFs and other files aren't allowed.", true);
    }
  }
  file.addEventListener('change', () => pick(file.files[0]));
  ['dragenter', 'dragover'].forEach((t) => photo.addEventListener(t, (e) => { e.preventDefault(); photo.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => photo.addEventListener(t, (e) => { e.preventDefault(); photo.classList.remove('is-over'); }));
  photo.addEventListener('drop', (e) => pick(e.dataTransfer.files[0]));

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
    if (!src) return say(editing ? 'The saved photo is still loading. Try again in a moment.' : 'Choose a photo first.', true);
    if (!title.value.trim()) return say('Add a title.', true);
    if (!desc.value.trim()) return say('Add a description.', true);
    const end = until.value ? new Date(until.value) : null;
    if (end && end <= new Date()) return say('The removal date needs to be in the future.', true);
    submit.disabled = true;
    const oldPath = editing && editing.image_path;
    let path = oldPath;
    try {
      // a new photo, or the saved one cropped differently
      if (picked || moved) {
        say('Cropping and compressing the photo…');
        let blob;
        try { blob = await compress(); } catch (err) { throw new Error("Couldn't crop the saved photo. Press Change photo and choose it again."); }
        say(`Publishing (photo compressed to ${size(blob.size)})…`);
        path = `${crypto.randomUUID()}.jpg`;
        const up = await LF.db.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
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
