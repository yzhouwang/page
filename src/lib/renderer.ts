/**
 * Mondrian Grid Renderer
 * Creates absolutely-positioned DOM elements from layout cells.
 * Each cell is a real DOM element (accessible, screen-reader friendly).
 * Physics (Phase 2) will add CSS transforms for displacement.
 */
import type { LayoutCell, ContentNode } from './types';
import { filledBlocks } from './lang-blocks';

/**
 * Render the Mondrian grid into the container element.
 */
export function renderGrid(
  container: HTMLElement,
  cells: LayoutCell[],
  nodeMap: Map<string, ContentNode>
): void {
  container.innerHTML = '';

  // Set container height to fit all cells
  let maxBottom = 0;
  for (const cell of cells) {
    const bottom = cell.y + cell.height;
    if (bottom > maxBottom) maxBottom = bottom;
  }
  container.style.height = `${maxBottom + 4}px`;

  // Sort cells by priority for DOM order (screen readers)
  // Higher priority content comes first in the DOM
  const domOrder = [...cells].sort((a, b) => {
    const nodeA = nodeMap.get(a.contentId);
    const nodeB = nodeMap.get(b.contentId);
    return (nodeB?.priority ?? 0) - (nodeA?.priority ?? 0);
  });

  for (const cell of domOrder) {
    const node = nodeMap.get(cell.contentId);
    if (!node) continue;

    const el = document.createElement('div');
    el.className = `cell cell--${node.type} cell--color-${node.color}`;
    el.dataset.id = node.id;
    el.style.cssText = `
      position: absolute;
      left: ${cell.x}px;
      top: ${cell.y}px;
      width: ${cell.width}px;
      height: ${cell.height}px;
      overflow: hidden;
    `;

    el.innerHTML = renderContent(node, cell);
    container.appendChild(el);
  }
}

function renderContent(node: ContentNode, cell: LayoutCell): string {
  switch (node.type) {
    case 'hero':
      return renderHero(cell);
    case 'research':
      return renderResearch(node);
    case 'research-feature':
      return renderResearchFeature();
    case 'project':
      return renderProject(node);
    case 'languages':
      return renderLanguages(node);
    case 'cta':
      return renderCTA();
    case 'accent':
      return '';
    default:
      return '';
  }
}

function renderHero(cell: LayoutCell): string {
  const isWide = cell.width > 580;
  const cubeSize = Math.min(180, Math.floor(cell.width * 0.2));
  const cubeHalf = Math.floor(cubeSize / 2);

  return `
    <div class="hero" style="display:flex;${isWide ? 'flex-direction:row' : 'flex-direction:column'};height:100%">
      <div class="hero__text" style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:clamp(28px,5vh,60px) clamp(24px,4vw,56px)">
        <span class="meta-label">AI &times; Computational Linguistics</span>
        <h1 class="hero__name">Yuzhou<br>Wang</h1>
        <p class="hero__desc">Building systems that understand language. AI executive at <strong>SuperX AI</strong> in Hong Kong. UChicago CS &amp; Linguistics '25.</p>
        <div class="hero__ctas">
          <a href="mailto:yuzhouyw@gmail.com" class="btn btn--primary">Get in Touch</a>
          <a href="https://github.com/yuzhouyw" class="btn btn--secondary">GitHub</a>
        </div>
      </div>
      ${
        isWide
          ? `<div class="hero__visual" style="flex:0 0 ${Math.min(Math.floor(cell.width * 0.35), 400)}px;background:var(--blue);display:flex;align-items:center;justify-content:center;position:relative">
        <div class="cube-wrap" style="width:${cubeSize}px;height:${cubeSize}px"><div class="cube">
          <div class="cube-face cube-face--front" style="width:${cubeSize}px;height:${cubeSize}px;transform:translateZ(${cubeHalf}px)"><span class="face-num">01</span><div class="face-label">NLP Research</div><div class="face-title">Language<br>Understanding</div></div>
          <div class="cube-face cube-face--right" style="width:${cubeSize}px;height:${cubeSize}px;transform:rotateY(90deg) translateZ(${cubeHalf}px)"><span class="face-num">02</span><div class="face-label">Low-Resource</div><div class="face-title">Kinyarwanda<br>Tone</div></div>
          <div class="cube-face cube-face--back" style="width:${cubeSize}px;height:${cubeSize}px;transform:rotateY(180deg) translateZ(${cubeHalf}px)"><span class="face-num">03</span><div class="face-label">Infrastructure</div><div class="face-title">Compliance<br>Agents</div></div>
          <div class="cube-face cube-face--left" style="width:${cubeSize}px;height:${cubeSize}px;transform:rotateY(-90deg) translateZ(${cubeHalf}px)"><span class="face-num">04</span><div class="face-label">Speech</div><div class="face-title">Automatic<br>Recognition</div></div>
          <div class="cube-face cube-face--top" style="width:${cubeSize}px;height:${cubeSize}px;transform:rotateX(90deg) translateZ(${cubeHalf}px)"><span class="face-num">05</span><div class="face-label">Interaction</div><div class="face-title">Human&ndash;AI<br>Writing</div></div>
          <div class="cube-face cube-face--bottom" style="width:${cubeSize}px;height:${cubeSize}px;transform:rotateX(-90deg) translateZ(${cubeHalf}px)"><span class="face-num">06</span><div class="face-label">Cultural</div><div class="face-title">Firebird<br>Magazine</div></div>
        </div></div>
        <span class="cell-label" style="position:absolute;bottom:16px;left:20px">Research Areas</span>
      </div>`
          : ''
      }
    </div>
  `;
}

function renderResearch(node: ContentNode): string {
  const d = node.data;
  if (!d) return '';
  return `
    <div class="research-card">
      <div>
        <div class="meta-label">${d.venue}</div>
        <div class="card-title">${d.title}</div>
        <div class="card-meta">${d.authors}${d.meta ? ' &middot; ' + d.meta : ''}</div>
      </div>
      <div class="card-year">${d.year}</div>
    </div>
  `;
}

function renderResearchFeature(): string {
  return `
    <div class="research-feature">
      <span class="feature-ghost">04</span>
      <div>
        <div class="meta-label" style="color:rgba(26,26,26,.4)">Research Threads</div>
        <div class="feature-title">Four domains,<br>one question:</div>
        <div class="feature-desc">How do we build machines that understand language the way humans do?</div>
      </div>
      <div class="feature-stats">
        <div class="stat"><div class="stat-num">9</div><div class="stat-label">Languages</div></div>
        <div class="stat"><div class="stat-num">5</div><div class="stat-label">Papers</div></div>
        <div class="stat"><div class="stat-num">3</div><div class="stat-label">Systems</div></div>
      </div>
    </div>
  `;
}

function renderProject(node: ContentNode): string {
  const d = node.data;
  if (!d) return '';
  const tags = d.tags
    .map((t: string) => `<span class="tag">${t}</span>`)
    .join('');
  return `
    <div class="project-card">
      <div class="project-icon">${d.icon}</div>
      <div class="project-info">
        <div class="meta-label">${d.label}</div>
        <div class="card-title">${d.name}</div>
        <div class="card-desc">${d.description}</div>
        <div class="tags">${tags}</div>
      </div>
    </div>
  `;
}

function renderLanguages(node: ContentNode): string {
  const langs = [...(node.data || [])].sort(
    (a: any, b: any) => b.proficiency - a.proficiency
  );
  const langCards = langs
    .map((l: any) => {
      const filled = filledBlocks(l.proficiency);
      const blocks = Array.from({ length: 5 }, (_, i) =>
        `<div class="lang-block ${i < filled ? 'lang-block--filled' : ''}"></div>`
      ).join('');
      return `
    <div class="lang-card ${l.level === 'native' ? 'lang-card--native' : ''}">
      <div class="lang-glyph">${l.glyph}</div>
      <div class="lang-name">${l.name}</div>
      <div class="lang-blocks">${blocks}</div>
    </div>
  `;
    })
    .join('');

  return `
    <div class="languages-grid">
      <div class="languages-header">
        <div class="meta-label" style="margin-bottom:0">Nine languages, five scripts.</div>
      </div>
      ${langCards}
    </div>
  `;
}

function renderCTA(): string {
  return `
    <div class="cta-card">
      <h2 class="cta-title">Let's<br>collaborate.</h2>
      <p class="cta-desc">Open to research collaborations in low-resource NLP, computational morphology, and AI compliance systems.</p>
      <div class="cta-links">
        <a href="mailto:yuzhouyw@gmail.com" class="cta-link">Email</a>
        <a href="https://github.com/yuzhouyw" class="cta-link">GitHub</a>
        <a href="https://scholar.google.com" class="cta-link">Scholar</a>
        <a href="https://x.com" class="cta-link">Twitter</a>
      </div>
    </div>
  `;
}
