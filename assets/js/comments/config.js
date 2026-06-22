// Replace with your Supabase project URL and anon key (both are public/safe to ship)
export const SUPABASE_URL = 'https://bgapignqwufzcjprycuj.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_4vBLNnSKrVXkoUp5n9gKHg_U20KZ5he'

/** @returns {string} post slug from the mount point's data attribute */
export function getPostSlug() {
  const el = document.getElementById('post-engagement')
  return el?.dataset.postSlug ?? ''
}
