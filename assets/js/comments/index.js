// Composition root — only place that knows about Supabase client + DOM + config.
// Wires: client → gateways → services → UI components.
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, getPostSlug } from './config.js'
import { SupabaseAuthGateway } from './gateways/auth.js'
import { SupabaseLikesGateway } from './gateways/likes.js'
import { SupabaseCommentsGateway } from './gateways/comments.js'
import { LikeService } from './domain/like-service.js'
import { AuthControls } from './ui/auth-controls.js'
import { LikeButton } from './ui/like-button.js'

const root = document.getElementById('post-engagement')
if (!root) throw new Error('Missing #post-engagement mount point')

const postSlug = getPostSlug()
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const authGateway = new SupabaseAuthGateway(client)
const likesGateway = new SupabaseLikesGateway(client)
const commentsGateway = new SupabaseCommentsGateway(client) // eslint-disable-line no-unused-vars

const likeService = new LikeService(likesGateway, authGateway)

// --- Auth controls ---
const authEl = document.createElement('div')
authEl.className = 'engagement-auth'
root.appendChild(authEl)

const authControls = new AuthControls({
  signInWithGoogle: () => authGateway.signInWithGoogle(),
  signOut: () => authGateway.signOut(),
})
authControls.mount(authEl)

// --- Like button ---
const likeEl = document.createElement('div')
likeEl.className = 'engagement-likes'
root.appendChild(likeEl)

const likeButton = new LikeButton({ likeService, postSlug })
likeButton.mount(likeEl).render({ count: 0, hasLiked: false, loading: true })

// Subscribe to auth — re-render auth controls on session change
authGateway.onChange((user) => authControls.render({ user }))
authControls.render({ user: null })

// Load initial like state
likeService.load(postSlug).then(state => likeButton.render({ ...state, loading: false }))
