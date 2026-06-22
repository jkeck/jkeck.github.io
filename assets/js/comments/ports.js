/**
 * Port (interface) definitions. Implemented by:
 *   - Supabase*Gateway classes (production)
 *   - Fake*Gateway classes in test/fakes/ (unit tests)
 *
 * tsc --checkJs enforces that all implementors match these shapes.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {boolean} isAnonymous
 * @property {string|null} [displayName]
 * @property {string|null} [avatarUrl]
 */

/**
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string} userId
 * @property {string} postSlug
 * @property {string} body
 * @property {string} createdAt
 * @property {string|null} [displayName]
 * @property {string|null} [avatarUrl]
 */

/**
 * @typedef {Object} AuthGateway
 * @property {() => (User|null)} currentUser
 * @property {() => Promise<void>} signInWithGoogle
 * @property {() => Promise<void>} signInAnonymously
 * @property {() => Promise<void>} signOut
 * @property {(cb: (u: User|null) => void) => (() => void)} onChange
 */

/**
 * @typedef {Object} LikesGateway
 * @property {(postSlug: string) => Promise<number>} count
 * @property {(postSlug: string) => Promise<boolean>} hasLiked
 * @property {(postSlug: string) => Promise<void>} like
 * @property {(postSlug: string) => Promise<void>} unlike
 */

/**
 * @typedef {Object} CommentsGateway
 * @property {(postSlug: string) => Promise<Comment[]>} list
 * @property {(postSlug: string, body: string) => Promise<Comment>} add
 * @property {(id: string) => Promise<void>} remove
 */

export {}
