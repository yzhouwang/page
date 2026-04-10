/**
 * Mulberry32 PRNG — 32-bit state, fast, deterministic.
 * Same seed = same sequence every time.
 */
export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a hash — fast non-cryptographic hash for seed generation.
 */
export function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Generate a seed for the current session.
 * Uses today's date + a random salt stored in sessionStorage.
 * Same seed = same layout within a session.
 * New day or new session = new layout.
 */
export function createSeed(): number {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  let salt: string;
  try {
    salt = sessionStorage.getItem('mondrian-salt') || '';
    if (!salt) {
      salt = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('mondrian-salt', salt);
    }
  } catch {
    // sessionStorage unavailable (private browsing) — random each load
    salt = Math.random().toString(36).slice(2, 10);
  }

  return fnv1a(date + salt);
}

export function createPRNG(): () => number {
  return mulberry32(createSeed());
}
