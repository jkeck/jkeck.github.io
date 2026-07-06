/**
 * Canyon Run — pure game logic. No DOM, no Three.js, fully unit-testable.
 *
 * Coordinates: x = lateral position across the canyon (0 = center),
 * z = depth along the flight path. All curves are functions of distance
 * flown so difficulty is deterministic and resumable.
 */

/** Playable half-width of the canyon floor. */
export const BOUNDS_HALF_W = 14;

/** Ship collision half-width. */
export const SHIP_HALF_W = 1.1;

/** Forward speed in world units/second at distance 0. */
export const BASE_SPEED = 42;

/** Asymptotic top speed. */
export const MAX_SPEED = 118;

/** Distance between obstacle rows at the start / floor. */
const ROW_SPACING_START = 62;
const ROW_SPACING_MIN = 26;

/** Half-width of the guaranteed passable gap at the start / floor. */
const GAP_HALF_START = 5.6;
const GAP_HALF_MIN = SHIP_HALF_W * 2.4;

/** Obstacles narrower than this are dropped (visual noise, unfair hitboxes). */
const MIN_OBSTACLE_HALF_W = 0.8;

/**
 * Deterministic PRNG (mulberry32). Same seed → same run layout.
 * @param {number} seed
 * @returns {() => number} float in [0, 1)
 */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth ramp from 0 → 1 as distance grows; `scale` sets the half-way point. */
function ramp(distance, scale) {
  return distance / (distance + scale);
}

/**
 * Forward speed at a given distance flown. Starts at BASE_SPEED, rises
 * quickly early on, asymptotically approaches MAX_SPEED.
 * @param {number} distance
 */
export function speedAt(distance) {
  return BASE_SPEED + (MAX_SPEED - BASE_SPEED) * ramp(distance, 4200);
}

/** Spacing (z) between consecutive obstacle rows at a given distance. */
export function rowSpacingAt(distance) {
  return ROW_SPACING_START - (ROW_SPACING_START - ROW_SPACING_MIN) * ramp(distance, 6000);
}

/** Half-width of the guaranteed passable gap at a given distance. */
export function gapHalfWidthAt(distance) {
  return GAP_HALF_START - (GAP_HALF_START - GAP_HALF_MIN) * ramp(distance, 5000);
}

/**
 * Generate one obstacle row: a guaranteed passable gap plus obstacle blocks
 * filling (most of) the rest of the canyon width.
 *
 * @param {() => number} rng
 * @param {number} distance distance flown when this row will be reached
 * @returns {{ gapX: number, obstacles: Array<{x: number, halfW: number, height: number}> }}
 */
export function generateRow(rng, distance) {
  const gapHalf = gapHalfWidthAt(distance);
  const range = BOUNDS_HALF_W - gapHalf;
  const gapX = (rng() * 2 - 1) * range;

  const obstacles = [];
  fillSpan(rng, -BOUNDS_HALF_W, gapX - gapHalf, obstacles);
  fillSpan(rng, gapX + gapHalf, BOUNDS_HALF_W, obstacles);

  // Degenerate case: gap hugging a wall can leave one side too thin to fill.
  // A row must never be empty, so drop a pillar on the wide side.
  if (obstacles.length === 0) {
    const side = gapX > 0 ? -1 : 1;
    const edge = side > 0 ? gapX + gapHalf : -BOUNDS_HALF_W;
    const far = side > 0 ? BOUNDS_HALF_W : gapX - gapHalf;
    const halfW = Math.max((far - edge) / 2, MIN_OBSTACLE_HALF_W);
    obstacles.push({ x: (edge + far) / 2, halfW, height: pickHeight(rng) });
  }

  return { gapX, obstacles };
}

/**
 * Fill [from, to] with 1–2 obstacle blocks, leaving small random breathing
 * room so rows read as clusters rather than solid walls. Sub-gaps created
 * here are decorative — only the declared row gap is guaranteed passable.
 */
function fillSpan(rng, from, to, obstacles) {
  const width = to - from;
  if (width < MIN_OBSTACLE_HALF_W * 2) return;

  const pieces = width > 9 && rng() < 0.45 ? 2 : 1;
  if (pieces === 1) {
    // Cover 70–100% of the span, anchored at a random offset within it.
    const w = width * (0.7 + rng() * 0.3);
    const x0 = from + rng() * (width - w);
    obstacles.push({ x: x0 + w / 2, halfW: w / 2, height: pickHeight(rng) });
  } else {
    const split = from + width * (0.35 + rng() * 0.3);
    fillSpan(rng, from, split - 0.6, obstacles);
    fillSpan(rng, split + 0.6, to, obstacles);
  }
}

/** Obstacle visual height — varied so the skyline looks jagged. */
function pickHeight(rng) {
  return 3 + rng() * 9;
}

/**
 * Strict AABB overlap on the x/z plane. Edge contact does not count —
 * grazing an obstacle should feel like a near miss, not a death.
 * @param {{x:number,z:number,halfW:number,halfL:number}} a
 * @param {{x:number,z:number,halfW:number,halfL:number}} b
 */
export function collides(a, b) {
  return (
    Math.abs(a.x - b.x) < a.halfW + b.halfW &&
    Math.abs(a.z - b.z) < a.halfL + b.halfL
  );
}
