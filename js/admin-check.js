/* ==========================================================================
   MISJ STUCO — IS THIS VISITOR AN ADMIN?
   Used by the homepage (Edit on each slide) and events.html (the post link) to
   decide whether to show admin shortcuts. Supabase answers from its own admin
   list (lf_is_librarian), so a student who is signed in to Lost & Found gets
   false. It only hides or shows links: the admin page checks again itself.
   ========================================================================== */
window.STUCO_isAdmin = async function () {
  const { supabaseUrl: url, supabaseAnonKey: key } = window.LF_CONFIG || {};
  if (!url || !key || /YOUR-/.test(url + key)) return false;
  let token;
  try {
    const k = Object.keys(localStorage).find((x) => /^sb-.+-auth-token$/.test(x));
    token = k && JSON.parse(localStorage.getItem(k)).access_token;
  } catch (e) { return false; }
  if (!token) return false;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/lf_is_librarian`, {
      method: 'POST', body: '{}', signal: AbortSignal.timeout(4000),
      headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    return res.ok && (await res.json()) === true;
  } catch (e) { return false; }
};
