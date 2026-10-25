/* ==========================================================================
   LOST & FOUND — settings
   Fill these in once. Supabase dashboard → Project Settings → API.
   The anon key is meant to be public: what people can see is decided by the
   rules in supabase/lost-found-setup.sql, not by keeping this key secret.
   ========================================================================== */
window.LF_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-ANON-PUBLIC-KEY",

  // School email domains (same as the lf_domains table). Used to give a
  // friendly message before sending a login email. The real check is in Supabase.
  schoolDomains: ["your-school-domain.sch.id"],

  // How people sign in: "email" (a login link is emailed to them),
  // "google" (Sign in with Google: needs the Google provider set up in Supabase),
  // or "both".
  signIn: "email",

  // Shown under the photos.
  collectAt: "the library"
};
