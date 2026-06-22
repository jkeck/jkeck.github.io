// Replace with your Supabase project URL and anon key (both are public/safe to ship)
export const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
export const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'

/** @returns {string} post slug from the mount point's data attribute */
export function getPostSlug() {
  const el = document.getElementById('post-engagement')
  return el?.dataset.postSlug ?? ''
}
