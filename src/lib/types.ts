export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ContentNode {
  id: string;
  type: 'hero' | 'research' | 'research-feature' | 'project' | 'languages' | 'cta' | 'accent';
  priority: number;
  color: string;
  data?: any;
}

export interface LayoutCell extends Rect {
  contentId: string;
}

export interface LayoutConfig {
  lineWidth: number;
  minCellWidth: number;
  minCellHeight: number;
  maxDepth: number;
}

/**
 * A section groups related content nodes for sequential layout.
 * Sections flow top-to-bottom (Hero → Research → Projects → …).
 * Each section gets its own Mondrian subdivision.
 */
export interface SectionInput {
  nodes: ContentNode[];
  heightWeight: number;
}
