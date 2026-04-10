import { describe, it, expect } from 'vitest';
import { generateLayout } from '../src/lib/layout-engine';
import type { SectionInput, ContentNode, LayoutCell } from '../src/lib/types';

function makePRNG(seed = 42) {
  // Simple deterministic PRNG for tests
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNode(id: string, type: ContentNode['type'], priority = 5): ContentNode {
  return { id, type, priority, color: 'surface' };
}

describe('generateLayout', () => {
  it('returns one cell per content node', () => {
    const sections: SectionInput[] = [
      { nodes: [makeNode('hero', 'hero', 10)], heightWeight: 3 },
      { nodes: [makeNode('cta', 'cta', 6)], heightWeight: 1 },
    ];
    const cells = generateLayout(1280, 900, sections, makePRNG());
    expect(cells).toHaveLength(2);
    expect(cells.map((c) => c.contentId).sort()).toEqual(['cta', 'hero']);
  });

  it('sections flow top-to-bottom in order', () => {
    const sections: SectionInput[] = [
      { nodes: [makeNode('hero', 'hero', 10)], heightWeight: 3 },
      { nodes: [makeNode('research', 'research', 6)], heightWeight: 2 },
      { nodes: [makeNode('cta', 'cta', 6)], heightWeight: 1 },
    ];
    const cells = generateLayout(1280, 900, sections, makePRNG());
    const heroCell = cells.find((c) => c.contentId === 'hero')!;
    const researchCell = cells.find((c) => c.contentId === 'research')!;
    const ctaCell = cells.find((c) => c.contentId === 'cta')!;
    expect(heroCell.y).toBeLessThan(researchCell.y);
    expect(researchCell.y).toBeLessThan(ctaCell.y);
  });

  it('skips empty sections', () => {
    const sections: SectionInput[] = [
      { nodes: [makeNode('hero', 'hero', 10)], heightWeight: 3 },
      { nodes: [], heightWeight: 2 },
      { nodes: [makeNode('cta', 'cta', 6)], heightWeight: 1 },
    ];
    const cells = generateLayout(1280, 900, sections, makePRNG());
    expect(cells).toHaveLength(2);
  });

  it('all cells have positive width and height', () => {
    const sections: SectionInput[] = [
      {
        nodes: [
          makeNode('hero', 'hero', 10),
          makeNode('a1', 'accent', 1),
          makeNode('a2', 'accent', 1),
        ],
        heightWeight: 3,
      },
      {
        nodes: [
          makeNode('rf', 'research-feature', 8),
          makeNode('p1', 'research', 6),
          makeNode('p2', 'research', 6),
        ],
        heightWeight: 3,
      },
      {
        nodes: [makeNode('lang', 'languages', 6)],
        heightWeight: 2,
      },
    ];
    const cells = generateLayout(1280, 900, sections, makePRNG());
    for (const cell of cells) {
      expect(cell.width).toBeGreaterThan(0);
      expect(cell.height).toBeGreaterThan(0);
    }
  });

  it('cells do not extend beyond viewport width', () => {
    const vw = 1280;
    const sections: SectionInput[] = [
      { nodes: [makeNode('hero', 'hero', 10), makeNode('a', 'accent', 1)], heightWeight: 3 },
    ];
    const cells = generateLayout(vw, 900, sections, makePRNG());
    for (const cell of cells) {
      expect(cell.x + cell.width).toBeLessThanOrEqual(vw);
    }
  });

  it('produces deterministic output for same PRNG seed', () => {
    const sections: SectionInput[] = [
      { nodes: [makeNode('hero', 'hero', 10), makeNode('a', 'accent', 1)], heightWeight: 3 },
      { nodes: [makeNode('cta', 'cta', 6)], heightWeight: 1 },
    ];
    const cells1 = generateLayout(1280, 900, sections, makePRNG(99));
    const cells2 = generateLayout(1280, 900, sections, makePRNG(99));
    expect(cells1).toEqual(cells2);
  });
});
