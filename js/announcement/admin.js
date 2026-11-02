/* ==========================================================================
   HOMEPAGE ANNOUNCEMENT — admins: photo + title + description.
   There is only ever one, so publishing replaces it. Sign-in and the admin
   list are shared with Lost & Found (js/lost-found/common.js).
   ========================================================================== */
(function () {
  'use strict';

  const LF = window.LF, $ = LF.$;
  const BUCKET = 'announcements', TABLE = 'hero_announcement';
  const card = $('.lf-card'), form = $('.an-form'), who = $('.lf-who');
  const file = $('#an-file'), drop = $('.lf-drop'), preview = $('.lf-drop__preview');
  const title = $('#an-title'), desc = $('#an-desc'), submit = $('.lf-up__submit'), msg = $('.lf-up__msg');
  let picked = null, current = null;   // current = the image path that is live now

  const say = (t, bad) => { msg.textContent = t; msg.classList.toggle('is-bad', !!bad); };
  const show = (src) => { preview.src = src; drop.classList.add('has-photo'); };

  async function start() {
    if (!LF.configured) { form.hidden = true; card.hidden = false; return LF.renderNotConfigured(card); }
    let a;
    try { a = await LF.access(); } catch (e) { a = { error: e }; }
    if (!a.session) {
      who.hidden = true; form.hidden = true; card.hidden = false;
      return LF.renderSignIn(card, { label: 'Admins only', title: 'Sign in to post an announcement.', text: 'Only StuCo admins can post.' });
    }
    LF.renderWho(who, a.email);
    if (!a.librarian) {
      form.hidden = true; card.hidden = false;
      card.innerHTML = `<p class="label">Admins only</p>
        <h2 class="lf-card__title">This account can't post announcements.</h2>
        <p class="lf-card__text">You're signed in as <b>${LF.esc(a.email)}</b>. If you should have access, ask StuCo to add this email to the admin list.</p>`;
      return;
    }
    card.hidden = true; form.hidden = false;
    await load();
  }

  /* ---------- what's live now, ready to edit ---------- */
  async function load() {
    const { data, error } = await LF.db.from(TABLE).select('title, description, image_path').eq('id', 1).maybeSingle();
    if (error) return say("Couldn't load the current announcement. Has supabase/announcement-setup.sql been run?", true);
    if (!data) return;
    current = data.image_path;
    title.value = data.title;
    desc.value = data.description;
    show(LF.db.storage.from(BUCKET).getPublicUrl(current).data.publicUrl);
  }

  /* ---------- pick a photo ---------- */
  function pick(f) {
    if (!f) return;
    if (!/^image\//.test(f.type)) return say('Please choose a photo (JPG, PNG or WebP).', true);
    picked = f;
    show(URL.createObjectURL(f));
    say('');
  }
  file.addEventListener('change', () => pick(file.files[0]));
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (e) => pick(e.dataTransfer.files[0]));

  /* ---------- publish ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!picked && !current) return say('Choose a photo first.', true);
    if (!title.value.trim()) return say('Add a title.', true);
    if (!desc.value.trim()) return say('Add a description.', true);
    submit.disabled = true; say('Publishing…');
    let path = current;
    try {
      if (picked) {
        let blob;
        try { blob = await LF.toJpeg(picked); } catch (err) { throw new Error("This photo format can't be read. Please use a JPG or PNG."); }
        path = `${crypto.randomUUID()}.jpg`;
        const up = await LF.db.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
        if (up.error) throw up.error;
      }
      const row = { id: 1, title: title.value.trim(), description: desc.value.trim(), image_path: path, updated_at: new Date().toISOString() };
      const { error } = await LF.db.from(TABLE).upsert(row);
      if (error) {
        if (path !== current) await LF.db.storage.from(BUCKET).remove([path]);
        throw error;
      }
      if (current && path !== current) await LF.db.storage.from(BUCKET).remove([current]);
      current = path; picked = null; file.value = '';
      say("Published. It's live on the homepage now.");
    } catch (err) {
      say(err.message || 'Something went wrong. Please try again.', true);
    } finally {
      submit.disabled = false;
    }
  });

  LF.onAuth(start);
})();
