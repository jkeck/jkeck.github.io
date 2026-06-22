// Composition root — only place that knows about Supabase client + DOM + config.
// Wires: client → gateways → services → UI components.
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'
import { SupabaseAuthGateway } from './gateways/auth.js'
import { SupabaseLikesGateway } from './gateways/likes.js'
import { SupabaseCommentsGateway } from './gateways/comments.js'
import { AuthControls } from './ui/auth-controls.js'

const root = document.getElementById('post-engagement')
if (!root) throw new Error('Missing #post-engagement mount point')

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const authGateway = new SupabaseAuthGateway(client)
// eslint-disable-next-line no-unused-vars
const likesGateway = new SupabaseLikesGateway(client)
// eslint-disable-next-line no-unused-vars
const commentsGateway = new SupabaseCommentsGateway(client)

// --- Auth controls (Slice 0) ---
const authEl = document.createElement('div')
authEl.className = 'engagement-auth'
root.appendChild(authEl)

const authControls = new AuthControls({
  signInWithGoogle: () => authGateway.signInWithGoogle(),
  signOut: () => authGateway.signOut(),
})
authControls.mount(authEl)

// Subscribe — fires INITIAL_SESSION on load with the current session
authGateway.onChange((user) => authControls.render({ user }))
// Render signed-out state immediately; re-renders once session resolves
authControls.render({ user: null })
