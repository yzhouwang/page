/**
 * Section-based Mondrian layout engine.
 *
 * Content flows in narrative sections (Hero → Research → Projects →
 * Languages → CTA). Each section gets a vertical band; within that
 * band the recursive subdivision produces a unique Mondrian composition.
 *
 * Sections are defined in index.astro; the engine only handles geometry.
 */
import type { Rect, ContentNode, LayoutCell, LayoutConfig, SectionInput } from './types';

/** Content-type minimum cell dimensions. */
const CONTENT_MIN_SIZES: Record<string, { minWidth: number; minHeight: number }> = {
  hero: { minWidth: 500, minHeight: 400 },
  'research-feature': { minWidth: 380, minHeight: 320 },
  research: { minWidth: 280, minHeight: 220 },
  project: { minWidth: 280, minHeight: 220 },
  languages: { minWidth: 400, minHeight: 300 },
  cta: { minWidth: 400, minHeight: 280 },
  accent: { minWidth: 100, minHeight: 80 },
};

const DEFAULT_CONFIG: LayoutConfig = {
  lineWidth: 4,
  minCellWidth: 280,
  minCellHeight: 200,
  maxDepth: 6,
};

/**
 * Generate a section-based Mondrian layout.
 * Each section gets a vertical band proportional to its heightWeight.
 * Subdivision runs independently within each band.
 */
export function generateLayout(
  viewportWidth: number,
  viewportHeight: number,
  sections: SectionInput[],
  prng: () => number,
  config: LayoutConfig = DEFAULT_CONFIG
): LayoutCell[] {
  const { lineWidth } = config;

  const totalWeight = sections.reduce((s, sec) => s + sec.heightWeight, 0);
  const numSections = sections.filter((s) => s.nodes.length > 0).length;
  const borderGaps = (numSections + 1) * lineWidth;
  const totalContentHeight = viewportHeight * 3.6 - borderGaps;

  let y = lineWidth;
  const allCells: LayoutCell[] = [];

  for (const section of sections) {
    if (section.nodes.length === 0) continue;

    const sectionHeight = Math.round(
      (section.heightWeight / totalWeight) * totalContentHeight
    );
    const rect: Rect = {
      x: lineWidth,
      y,
      width: viewportWidth - lineWidth * 2,
      height: sectionHeight,
    };

    const cells = subdivide(rect, section.nodes, prng, 0, config);
    allCells.push(...cells);

    y += sectionHeight + lineWidth;
  }

  return allCells;
}

// ── Subdivision (unchanged logic, runs per-section) ──────────────────

function partitionFits(rect: Rect, nodes: ContentNode[]): boolean {
  if (nodes.length === 0) return true;
  const maxMinW = Math.max(
    ...nodes.map((n) => (CONTENT_MIN_SIZES[n.type] || { minWidth: 280 }).minWidth)
  );
  const maxMinH = Math.max(
    ...nodes.map((n) => (CONTENT_MIN_SIZES[n.type] || { minHeight: 200 }).minHeight)
  );
  return rect.width >= maxMinW && rect.height >= maxMinH;
}

function computeSplit(
  rect: Rect,
  ratio: number,
  direction: 'vertical' | 'horizontal',
  lineWidth: number
): { rectA: Rect; rectB: Rect } {
  if (direction === 'vertical') {
    const w = Math.round((rect.width - lineWidth) * ratio);
    return {
      rectA: { x: rect.x, y: rect.y, width: w, height: rect.height },
      rectB: {
        x: rect.x + w + lineWidth,
        y: rect.y,
        width: rect.width - w - lineWidth,
        height: rect.height,
      },
    };
  }
  const h = Math.round((rect.height - lineWidth) * ratio);
  return {
    rectA: { x: rect.x, y: rect.y, width: rect.width, height: h },
    rectB: {
      x: rect.x,
      y: rect.y + h + lineWidth,
      width: rect.width,
      height: rect.height - h - lineWidth,
    },
  };
}

function subdivide(
  rect: Rect,
  nodes: ContentNode[],
  prng: () => number,
  depth: number,
  config: LayoutConfig
): LayoutCell[] {
  const { lineWidth, minCellWidth, minCellHeight, maxDepth } = config;

  if (nodes.length === 0) return [];

  if (nodes.length === 1) {
    return [{ ...rect, contentId: nodes[0].id }];
  }

  const canSplitV = rect.width >= minCellWidth * 2 + lineWidth;
  const canSplitH = rect.height >= minCellHeight * 2 + lineWidth;

  if (depth >= maxDepth || (!canSplitV && !canSplitH)) {
    return stackInRect(rect, nodes, lineWidth);
  }

  const aspect = rect.width / rect.height;
  let preferred: 'vertical' | 'horizontal';

  if (aspect > 1.5 && canSplitV) {
    preferred = 'vertical';
  } else if (aspect < 0.67 && canSplitH) {
    preferred = 'horizontal';
  } else if (canSplitV && canSplitH) {
    preferred = prng() > 0.5 ? 'vertical' : 'horizontal';
  } else {
    preferred = canSplitV ? 'vertical' : 'horizontal';
  }

  const sorted = [...nodes].sort((a, b) => b.priority - a.priority);

  const nodesA: ContentNode[] = [sorted[0]];
  const nodesB: ContentNode[] = [];
  let priorityA = sorted[0].priority;
  let priorityB = 0;

  for (let i = 1; i < sorted.length; i++) {
    if (priorityA <= priorityB) {
      nodesA.push(sorted[i]);
      priorityA += sorted[i].priority;
    } else {
      nodesB.push(sorted[i]);
      priorityB += sorted[i].priority;
    }
  }

  if (nodesB.length === 0 && nodesA.length > 1) {
    const moved = nodesA.pop()!;
    nodesB.push(moved);
    priorityA -= moved.priority;
    priorityB += moved.priority;
  }

  if (nodesB.length === 0) {
    return [{ ...rect, contentId: sorted[0].id }];
  }

  const totalPriority = priorityA + priorityB;
  let ratio = priorityA / totalPriority;
  ratio += (prng() - 0.5) * 0.06;
  ratio = Math.max(0.35, Math.min(0.65, ratio));

  const directions: ('vertical' | 'horizontal')[] = [preferred];
  const alt: 'vertical' | 'horizontal' =
    preferred === 'vertical' ? 'horizontal' : 'vertical';
  if ((alt === 'vertical' && canSplitV) || (alt === 'horizontal' && canSplitH)) {
    directions.push(alt);
  }

  for (const dir of directions) {
    const { rectA, rectB } = computeSplit(rect, ratio, dir, lineWidth);

    if (
      rectA.width >= minCellWidth &&
      rectA.height >= minCellHeight &&
      rectB.width >= minCellWidth &&
      rectB.height >= minCellHeight &&
      partitionFits(rectA, nodesA) &&
      partitionFits(rectB, nodesB)
    ) {
      return [
        ...subdivide(rectA, nodesA, prng, depth + 1, config),
        ...subdivide(rectB, nodesB, prng, depth + 1, config),
      ];
    }
  }

  return stackInRect(rect, nodes, lineWidth);
}

function stackInRect(
  rect: Rect,
  nodes: ContentNode[],
  lineWidth: number
): LayoutCell[] {
  const n = nodes.length;
  const totalGaps = (n - 1) * lineWidth;
  const availHeight = rect.height - totalGaps;

  const minHeights = nodes.map(
    (node) => (CONTENT_MIN_SIZES[node.type] || { minHeight: 200 }).minHeight
  );
  const totalPriority = nodes.reduce((sum, node) => sum + node.priority, 0);

  let heights = nodes.map((node, i) => {
    const proportional = Math.round((node.priority / totalPriority) * availHeight);
    return Math.max(minHeights[i], proportional);
  });

  const totalAllocated = heights.reduce((s, h) => s + h, 0);
  if (totalAllocated > availHeight) {
    const excess = totalAllocated - availHeight;
    const flexibleTotal = heights.reduce(
      (s, h, i) => s + Math.max(0, h - minHeights[i]),
      0
    );
    if (flexibleTotal > 0) {
      heights = heights.map((h, i) => {
        const flexible = Math.max(0, h - minHeights[i]);
        return Math.max(
          minHeights[i],
          Math.round(h - (flexible / flexibleTotal) * excess)
        );
      });
    }
  }

  let y = rect.y;
  return nodes.map((node, i) => {
    const cell: LayoutCell = {
      x: rect.x,
      y,
      width: rect.width,
      height: heights[i],
      contentId: node.id,
    };
    y += heights[i] + lineWidth;
    return cell;
  });
}
