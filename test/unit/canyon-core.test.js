import { describe, it, expect } from 'vitest';
import {
  BOUNDS_HALF_W,
  SHIP_HALF_W,
  BASE_SPEED,
  MAX_SPEED,
  makeRng,
  speedAt,
  rowSpacingAt,
  gapHalfWidthAt,
  generateRow,
  collides,
} from '../../assets/js/arcade/canyon-core.js';

describe('makeRng', () => {
  it('is deterministic for the same seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });

  it('produces different sequences for different seeds', () => {
    const a = makeRng(1);
    const b = makeRng(2);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).not.toEqual(seqB);
  });

  it('yields values in [0, 1)', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('speedAt', () => {
  it('starts at BASE_SPEED', () => {
    expect(speedAt(0)).toBe(BASE_SPEED);
  });

  it('increases monotonically with distance', () => {
    let prev = speedAt(0);
    for (let d = 100; d <= 100000; d += 100) {
      const s = speedAt(d);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  it('never exceeds MAX_SPEED', () => {
    expect(speedAt(1e9)).toBeLessThanOrEqual(MAX_SPEED);
  });

  it('ramps meaningfully in the first stretch', () => {
    expect(speedAt(2000)).toBeGreaterThan(BASE_SPEED * 1.2);
  });
});

describe('rowSpacingAt', () => {
  it('shrinks monotonically with distance', () => {
    let prev = rowSpacingAt(0);
    for (let d = 100; d <= 100000; d += 100) {
      const s = rowSpacingAt(d);
      expect(s).toBeLessThanOrEqual(prev);
      prev = s;
    }
  });

  it('stays above a sane minimum even at extreme distance', () => {
    expect(rowSpacingAt(1e9)).toBeGreaterThanOrEqual(20);
  });
});

describe('gapHalfWidthAt', () => {
  it('shrinks monotonically with distance', () => {
    let prev = gapHalfWidthAt(0);
    for (let d = 100; d <= 100000; d += 100) {
      const g = gapHalfWidthAt(d);
      expect(g).toBeLessThanOrEqual(prev);
      prev = g;
    }
  });

  it('always leaves room for the ship with margin', () => {
    expect(gapHalfWidthAt(1e9)).toBeGreaterThanOrEqual(SHIP_HALF_W * 2);
  });
});

describe('generateRow', () => {
  const distances = [0, 500, 5000, 50000, 500000];

  it('always produces at least one obstacle', () => {
    for (let seed = 0; seed < 100; seed++) {
      const rng = makeRng(seed);
      for (const d of distances) {
        expect(generateRow(rng, d).obstacles.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every obstacle within canyon bounds', () => {
    for (let seed = 0; seed < 100; seed++) {
      const rng = makeRng(seed);
      for (const d of distances) {
        for (const o of generateRow(rng, d).obstacles) {
          expect(o.x - o.halfW).toBeGreaterThanOrEqual(-BOUNDS_HALF_W - 1e-9);
          expect(o.x + o.halfW).toBeLessThanOrEqual(BOUNDS_HALF_W + 1e-9);
        }
      }
    }
  });

  it('leaves the declared gap free of obstacles', () => {
    for (let seed = 0; seed < 100; seed++) {
      const rng = makeRng(seed);
      for (const d of distances) {
        const row = generateRow(rng, d);
        const gapHalf = gapHalfWidthAt(d);
        for (const o of row.obstacles) {
          const overlaps =
            o.x + o.halfW > row.gapX - gapHalf + 1e-9 &&
            o.x - o.halfW < row.gapX + gapHalf - 1e-9;
          expect(overlaps).toBe(false);
        }
      }
    }
  });

  it('declares a gap the ship can actually reach (inside bounds)', () => {
    for (let seed = 0; seed < 100; seed++) {
      const rng = makeRng(seed);
      for (const d of distances) {
        const row = generateRow(rng, d);
        const gapHalf = gapHalfWidthAt(d);
        expect(row.gapX - gapHalf).toBeGreaterThanOrEqual(-BOUNDS_HALF_W);
        expect(row.gapX + gapHalf).toBeLessThanOrEqual(BOUNDS_HALF_W);
      }
    }
  });

  it('gives every obstacle a positive height for the renderer', () => {
    const rng = makeRng(3);
    for (const o of generateRow(rng, 1000).obstacles) {
      expect(o.height).toBeGreaterThan(0);
    }
  });
});

describe('collides', () => {
  const ship = { x: 0, z: 0, halfW: 1, halfL: 2 };

  it('detects overlap on both axes', () => {
    expect(collides(ship, { x: 0.5, z: 1, halfW: 1, halfL: 2 })).toBe(true);
  });

  it('is false when separated on x', () => {
    expect(collides(ship, { x: 5, z: 0, halfW: 1, halfL: 2 })).toBe(false);
  });

  it('is false when separated on z', () => {
    expect(collides(ship, { x: 0, z: 10, halfW: 1, halfL: 2 })).toBe(false);
  });

  it('treats mere edge contact as a miss', () => {
    expect(collides(ship, { x: 2, z: 0, halfW: 1, halfL: 2 })).toBe(false);
  });
});
