/* ==========================================================================
   LOST & FOUND — settings
   Fill these in once. Supabase dashboard → Project Settings → API.
   The anon key is meant to be public: what people can see is decided by the
   rules in supabase/lost-found-setup.sql, not by keeping this key secret.
   ========================================================================== */
window.LF_CONFIG = {
  supabaseUrl: "https://hcvsawbvmjmnpmcvayqb.supabase.co",
  supabaseAnonKey: "sb_publishable_9PppaucM5CAqQ6basJNG9Q_ZPmqj76J",

  // School email domains (same as the lf_domains table). Used to give a
  // friendly message before sending a login email. The real check is in Supabase.
  schoolDomains: ["mis.sch.id"],

  // How people sign in: "email" (a login link is emailed to them),
  // "google" (Sign in with Google: needs the Google provider set up in Supabase),
  // or "both".
  signIn: "email",

  // Admin page login. The username is just a nickname for this one Supabase
  // account; the password is set in Supabase (Authentication -> Users) and is
  // never stored here. This email must also be in the lf_librarians table.
  adminLogin: { username: "LOSTANDFOUNDISINLIBRARY", email: "students_council@mis.sch.id" },

  // Shown under the photos.
  collectAt: "the library"
};
