import { describe, it, expect } from 'vitest';
import { mulberry32, fnv1a } from '../src/lib/seed';

describe('mulberry32', () => {
  it('produces deterministic sequences from the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces values in [0, 1)', () => {
    const prng = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      const val = prng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });
});

describe('fnv1a', () => {
  it('produces deterministic hashes', () => {
    expect(fnv1a('hello')).toBe(fnv1a('hello'));
  });

  it('produces different hashes for different inputs', () => {
    expect(fnv1a('2026-04-10')).not.toBe(fnv1a('2026-04-11'));
  });

  it('returns a non-negative integer', () => {
    const hash = fnv1a('test');
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(hash)).toBe(true);
  });
});
