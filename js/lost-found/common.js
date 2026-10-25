/* ==========================================================================
   LOST & FOUND — shared: Supabase client · sign in · access checks
   ========================================================================== */
(function () {
  'use strict';

  const C = window.LF_CONFIG || {};
  const LF = (window.LF = {});
  const $ = (s, r = document) => r.querySelector(s);

  LF.$ = $;
  LF.BUCKET = 'lost-found';
  LF.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  LF.configured = !!(C.supabaseUrl && C.supabaseAnonKey && !/YOUR-/.test(C.supabaseUrl + C.supabaseAnonKey) && window.supabase);
  LF.db = LF.configured ? window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey) : null;

  // placeholder domains are ignored, so an unfinished config never locks anyone out here
  const domains = (C.schoolDomains || []).map((d) => String(d).toLowerCase().replace(/^@/, '')).filter((d) => d && !/your-school/.test(d));
  LF.isSchoolEmail = (email) => {
    const d = String(email || '').toLowerCase().split('@')[1];
    return !!d && (!domains.length || domains.includes(d));
  };
  LF.domainHint = domains.map((d) => '@' + d).join(' or ');

  /* the page people land on after clicking the email link */
  const here = () => location.origin + location.pathname;

  LF.signInEmail = (email) => LF.db.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: here() } });
  LF.signInGoogle = () => LF.db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: here(), queryParams: { prompt: 'select_account', ...(domains[0] ? { hd: domains[0] } : {}) } }
  });
  LF.signOut = () => LF.db.auth.signOut();

  /* ask Supabase (not the browser) whether this account is allowed */
  LF.access = async function () {
    const { data: { session } } = await LF.db.auth.getSession();
    if (!session) return { session: null, student: false, librarian: false };
    const [s, l] = await Promise.all([LF.db.rpc('lf_is_student'), LF.db.rpc('lf_is_librarian')]);
    return { session, email: session.user.email, student: s.data === true, librarian: l.data === true, error: s.error || l.error };
  };

  /* short-lived links to private photos */
  LF.signedUrls = async function (paths, seconds = 3600) {
    if (!paths.length) return {};
    const { data, error } = await LF.db.storage.from(LF.BUCKET).createSignedUrls(paths, seconds);
    if (error) throw error;
    const out = {};
    data.forEach((d) => { if (d.signedUrl) out[d.path] = d.signedUrl; });
    return out;
  };

  /* ---------- the sign-in card (shared by both pages) ---------- */
  LF.renderSignIn = function (box, opts = {}) {
    const mode = C.signIn || 'email';
    const google = mode === 'google' || mode === 'both';
    const email = mode === 'email' || mode === 'both';
    box.innerHTML = `
      <p class="label"><span class="lf-lock" aria-hidden="true"></span>${LF.esc(opts.label || 'Students only')}</p>
      <h2 class="lf-card__title">${LF.esc(opts.title || 'Sign in with your school email.')}</h2>
      <p class="lf-card__text">${LF.esc(opts.text || 'Lost & Found is only for MISJ students and staff.')}${LF.domainHint ? ` Use your <b>${LF.esc(LF.domainHint)}</b> address.` : ''}</p>
      ${google ? `<button class="btn btn--big lf-google" type="button"><span>Sign in with Google</span><span class="btn__arrow" aria-hidden="true">→</span></button>` : ''}
      ${google && email ? `<p class="lf-or micro"><span>or</span></p>` : ''}
      ${email ? `<form class="lf-form" novalidate>
        <label class="micro" for="lf-email">School email</label>
        <div class="lf-form__row">
          <input id="lf-email" type="email" autocomplete="email" inputmode="email" placeholder="name${LF.esc(LF.domainHint.split(' or ')[0] || '@school')}" required>
          <button class="btn btn--big" type="submit"><span>Send login link</span><span class="btn__arrow" aria-hidden="true">→</span></button>
        </div>
      </form>` : ''}
      <p class="lf-msg" role="status" aria-live="polite"></p>`;
    const msg = $('.lf-msg', box);
    const say = (t, bad) => { msg.textContent = t; msg.classList.toggle('is-bad', !!bad); };
    const g = $('.lf-google', box);
    if (g) g.addEventListener('click', async () => {
      const { error } = await LF.signInGoogle();
      if (error) say(error.message, true);
    });
    const form = $('.lf-form', box);
    if (form) form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('#lf-email', box), btn = $('button', form), value = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return say('Please type your full email address.', true);
      if (!LF.isSchoolEmail(value)) return say(`That isn't a school email.${LF.domainHint ? ' Use your ' + LF.domainHint + ' address.' : ''}`, true);
      btn.disabled = true; say('Sending…');
      const { error } = await LF.signInEmail(value);
      btn.disabled = false;
      if (error) return say(/rate|seconds/i.test(error.message) ? 'Too many login emails right now. Please wait a minute and try again.' : error.message, true);
      say(`Check your inbox. We sent a login link to ${value}. Open it on this device.`);
      form.reset();
    });
  };

  LF.renderNotConfigured = function (box) {
    box.innerHTML = `<p class="label">Setup needed</p>
      <h2 class="lf-card__title">Lost &amp; Found isn't connected yet.</h2>
      <p class="lf-card__text">Add the Supabase project URL and anon key in <code>js/lost-found/config.js</code>. See the README.</p>`;
  };

  /* signed-in bar: who you are + sign out */
  LF.renderWho = function (el, email) {
    el.hidden = false;
    el.innerHTML = `<span class="micro lf-who__email">${LF.esc(email)}</span><button class="lf-who__out micro" type="button">Sign out</button>`;
    $('.lf-who__out', el).addEventListener('click', async () => { await LF.signOut(); location.reload(); });
  };

  /* re-run a page's start function when the login link brings someone back */
  LF.onAuth = function (start) {
    if (!LF.db) return start();
    let last;
    LF.db.auth.onAuthStateChange((event, session) => {
      const id = session ? session.user.id : null;
      if (id === last) return;
      last = id;
      setTimeout(start, 0);   // never call Supabase inside the auth callback itself
    });
  };
})();
