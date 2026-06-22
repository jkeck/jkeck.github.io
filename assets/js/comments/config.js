// Replace with your Supabase project URL and anon key (both are public/safe to ship)
export const SUPABASE_URL = 'https://bgapignqwufzcjprycuj.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_4vBLNnSKrVXkoUp5n9gKHg_U20KZ5he'

// Site owner's auth UID — grants moderator delete affordance in the UI.
// The actual permission is enforced by an RLS policy in the DB; this is UI-only.
export const OWNER_ID = '0eccb957-ca0f-44bf-bc1d-e308dd330d26'

/** @returns {string} post slug from the mount point's data attribute */
export function getPostSlug() {
  const el = document.getElementById('post-engagement')
  return el?.dataset.postSlug ?? ''
}
