// Composition root — only place that knows about Supabase client + DOM + config.
// Wires: client → gateways → services → UI components.
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, OWNER_ID, getPostSlug } from './config.js'
import { SupabaseAuthGateway } from './gateways/auth.js'
import { SupabaseLikesGateway } from './gateways/likes.js'
import { SupabaseCommentsGateway } from './gateways/comments.js'
import { LikeService } from './domain/like-service.js'
import { CommentService } from './domain/comment-service.js'
import { AuthControls } from './ui/auth-controls.js'
import { LikeButton } from './ui/like-button.js'
import { CommentList } from './ui/comment-list.js'
import { CommentForm } from './ui/comment-form.js'

const root = document.getElementById('post-engagement')
if (!root) throw new Error('Missing #post-engagement mount point')

const postSlug = getPostSlug()
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const authGateway = new SupabaseAuthGateway(client)
const likesGateway = new SupabaseLikesGateway(client)
const commentsGateway = new SupabaseCommentsGateway(client)

const likeService = new LikeService(likesGateway, authGateway)
const commentService = new CommentService(commentsGateway, authGateway)

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

// --- Comments ---
const commentsEl = document.createElement('div')
commentsEl.className = 'engagement-comments'
root.appendChild(commentsEl)

const commentListEl = document.createElement('div')
commentListEl.className = 'engagement-comment-list'
commentsEl.appendChild(commentListEl)

const commentFormEl = document.createElement('div')
commentFormEl.className = 'engagement-comment-form'
commentsEl.appendChild(commentFormEl)

let currentUser = /** @type {import('./ports.js').User|null} */ (null)
let commentState = { comments: /** @type {import('./ports.js').Comment[]} */ ([]), currentUserId: /** @type {string|null} */ (null) }
let formState = { user: currentUser, error: /** @type {string|null} */ (null), submitting: false }

async function refreshComments() {
  const comments = await commentService.load(postSlug)
  commentState = { comments, currentUserId: currentUser?.id ?? null, isOwner: currentUser?.id === OWNER_ID }
  commentList.render(commentState)
}

const commentList = new CommentList({
  onRemove: async (id) => {
    await commentService.remove(id)
    await refreshComments()
  },
}).mount(commentListEl)

const commentForm = new CommentForm({
  onSubmit: async (body) => {
    commentForm.render({ ...formState, submitting: true, error: null })
    try {
      await commentService.add(postSlug, body)
      await refreshComments()
      commentForm.render({ ...formState, submitting: false, error: null })
    } catch (/** @type {any} */ err) {
      commentForm.render({ ...formState, submitting: false, error: err.message ?? 'Something went wrong.' })
    }
  },
}).mount(commentFormEl)

// --- Subscribe to auth — re-render on session change ---
authGateway.onChange((user) => {
  currentUser = user
  authControls.render({ user })
  commentState = { ...commentState, currentUserId: user?.id ?? null, isOwner: user?.id === OWNER_ID }
  formState = { ...formState, user }
  commentList.render(commentState)
  commentForm.render(formState)
})
authControls.render({ user: null })
commentList.render(commentState)
commentForm.render(formState)

// --- Load initial state ---
likeService.load(postSlug).then(state => likeButton.render({ ...state, loading: false }))
refreshComments()
