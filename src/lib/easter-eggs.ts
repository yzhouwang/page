/**
 * Easter Eggs — v0.3.0
 *
 * Five hidden interactions for the curious:
 *   1. Gravity Collapse   — click 語 mark 5x → cells fall
 *   2. Zero-Shot Scramble  — type "NLP" anywhere → headings scramble through scripts
 *   3. Comic Sans Mode     — hidden footer toggle → joke styling
 *   4. Console Syntax Tree — styled console art on load
 *   5. Kinyarwanda Tone Shift — click trigger block on KINTONE cell → multi-color vowel wave
 */
import type { PhysicsInstance } from './physics';

// ────────────────────────────────────────────────
// 1. GRAVITY COLLAPSE
//    Click the 語 nav mark 5 times → springs release,
//    cells fall with gravity. Click again to restore.
// ────────────────────────────────────────────────

const COLLAPSE_CLICKS = 5;
const COLLAPSE_WINDOW_MS = 3000;

export function initGravityCollapse(
  getPhysics: () => PhysicsInstance | null,
): () => void {
  let clicks = 0;
  let resetTimer: ReturnType<typeof setTimeout> | null = null;

  const onClick = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.h-nav-mark, .gen-nav-mark')) return;

    const physics = getPhysics();
    if (!physics) return;

    // If already collapsed, any click restores
    if (physics.collapsed) {
      physics.restore();
      clicks = 0;
      return;
    }

    clicks++;
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { clicks = 0; }, COLLAPSE_WINDOW_MS);

    if (clicks >= COLLAPSE_CLICKS) {
      physics.collapse();
      clicks = 0;
      if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
    }
  };

  document.addEventListener('click', onClick);

  return () => {
    document.removeEventListener('click', onClick);
    if (resetTimer) clearTimeout(resetTimer);
  };
}

// ────────────────────────────────────────────────
// 2. ZERO-SHOT TEXT SCRAMBLE
//    Type "NLP" or "KINTONE" anywhere on page →
//    all headings scramble through random Unicode
//    scripts, then decode back to original.
// ────────────────────────────────────────────────

const SCRAMBLE_TRIGGERS = ['nlp', 'kintone'];
const SCRAMBLE_DURATION_MS = 2000;
const SCRAMBLE_TICK_MS = 50;

// Characters from various scripts — looks like a decoder running
const SCRIPT_CHARS = [
  // Cyrillic
  'Д', 'Ж', 'Щ', 'Ю', 'Я', 'Ф',
  // Greek
  'Σ', 'Ψ', 'Ω', 'Δ', 'Θ', 'Λ',
  // Devanagari
  'अ', 'क', 'ग', 'ज', 'ड', 'म',
  // CJK
  '語', '言', '文', '字', '音', '声',
  // Arabic
  'ع', 'ص', 'ض', 'ط', 'ظ', 'غ',
  // Hangul
  '한', '글', '음', '성', '말', '뜻',
  // Kinyarwanda-relevant
  'û', 'î', 'ê', 'ö', 'ā', 'ē',
];

let scrambleActive = false;

export function initTextScramble(): () => void {
  let buffer = '';

  const onKeyDown = (e: KeyboardEvent) => {
    // Don't trigger in input fields
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (scrambleActive) return;

    buffer += e.key.toLowerCase();
    // Keep buffer short
    if (buffer.length > 20) buffer = buffer.slice(-20);

    for (const trigger of SCRAMBLE_TRIGGERS) {
      if (buffer.endsWith(trigger)) {
        buffer = '';
        runScramble();
        return;
      }
    }
  };

  document.addEventListener('keydown', onKeyDown);

  return () => {
    document.removeEventListener('keydown', onKeyDown);
  };
}

function runScramble(): void {
  scrambleActive = true;

  // Collect all headings and titles across both layouts
  const selectors = [
    'h1', 'h2',
    '.r-title', '.r-feature-title',
    '.p-name', '.card-title', '.feature-title', '.cta-title',
    '.hero__name',
  ];
  const elements = document.querySelectorAll<HTMLElement>(selectors.join(','));

  // Store originals — use innerHTML to preserve <br> and inline markup
  const originals = new Map<HTMLElement, { text: string; html: string }>();
  for (const el of elements) {
    if (el.offsetParent !== null) { // only visible elements
      originals.set(el, { text: el.textContent || '', html: el.innerHTML });
    }
  }

  const startTime = performance.now();

  const tick = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / SCRAMBLE_DURATION_MS, 1);

    for (const [el, { text }] of originals) {
      if (progress < 0.5) {
        // Scrambling phase: replace more characters over time
        const scrambleRatio = progress * 2; // 0 → 1 over first half
        el.textContent = scrambleText(text, scrambleRatio);
      } else {
        // Decode phase: restore characters from left to right
        const decodeRatio = (progress - 0.5) * 2; // 0 → 1 over second half
        el.textContent = decodeText(text, decodeRatio);
      }
    }

    if (progress < 1) {
      setTimeout(tick, SCRAMBLE_TICK_MS);
    } else {
      // Restore full innerHTML to preserve <br> and inline markup
      for (const [el, { html }] of originals) {
        el.innerHTML = html;
      }
      scrambleActive = false;
    }
  };

  tick();
}

function scrambleText(original: string, ratio: number): string {
  const chars = [...original];
  const scrambleCount = Math.floor(chars.length * ratio);
  const indices = chars.map((_, i) => i).filter(i => chars[i].trim() !== '');

  // Pick random indices to scramble
  for (let i = 0; i < scrambleCount && i < indices.length; i++) {
    const idx = indices[Math.floor(Math.random() * indices.length)];
    chars[idx] = SCRIPT_CHARS[Math.floor(Math.random() * SCRIPT_CHARS.length)];
  }
  return chars.join('');
}

function decodeText(original: string, ratio: number): string {
  const chars = [...original];
  const restoreUpTo = Math.floor(chars.length * ratio);

  return chars.map((ch, i) => {
    if (i < restoreUpTo || ch.trim() === '') return ch;
    return SCRIPT_CHARS[Math.floor(Math.random() * SCRIPT_CHARS.length)];
  }).join('');
}

// ────────────────────────────────────────────────
// 3. COMIC SANS "DESIGNER" MODE
//    Hidden checkbox in footer → toggles joke styling.
//    All fonts become Comic Sans, cells get 9999px radius.
// ────────────────────────────────────────────────

export function initComicSansMode(
  getPhysics: () => PhysicsInstance | null,
): () => void {
  // Fixed-position toggle at bottom-left — visible in both layout modes
  const toggle = document.createElement('label');
  toggle.className = 'designer-toggle';
  toggle.innerHTML = `
    <input type="checkbox" class="designer-checkbox" />
    <span class="designer-label">unleash designer</span>
  `;
  document.body.appendChild(toggle);

  const checkbox = toggle.querySelector('input')!;
  const onChange = () => {
    const on = checkbox.checked;
    document.body.classList.toggle('comic-sans-mode', on);
    // Activate chaotic physics
    const physics = getPhysics();
    if (physics) physics.setDesignerMode(on);
  };
  checkbox.addEventListener('change', onChange);

  return () => {
    checkbox.removeEventListener('change', onChange);
    toggle.remove();
    document.body.classList.remove('comic-sans-mode');
    const physics = getPhysics();
    if (physics) physics.setDesignerMode(false);
  };
}

// ────────────────────────────────────────────────
// 4. CONSOLE SYNTAX TREE ART
//    Prints a styled syntax tree + Mondrian ASCII art
//    to the browser console on page load.
// ────────────────────────────────────────────────

export function initConsoleArt(): void {
  // Mondrian-colored banner
  const bannerStyles = [
    'color: #111; font-size: 14px; font-weight: bold; font-family: monospace; padding: 8px 0',
    'color: #7CC2E2; font-size: 14px; font-weight: bold; font-family: monospace',
    'color: #E89A7A; font-size: 14px; font-weight: bold; font-family: monospace',
    'color: #E8D26E; font-size: 14px; font-weight: bold; font-family: monospace',
    'color: #72D4A4; font-size: 14px; font-weight: bold; font-family: monospace',
    'color: #555; font-size: 11px; font-family: monospace',
  ];

  console.log(
    '%c┌─────────────────────────────────┐\n' +
    '│                                 │\n' +
    '│  %c語 %cYuzhou %cWang %c                │\n' +
    '│                                 │\n' +
    '│  AI × Computational Linguistics │\n' +
    '│                                 │\n' +
    '└─────────────────────────────────┘\n' +
    '%c',
    bannerStyles[0],
    bannerStyles[1],
    bannerStyles[2],
    bannerStyles[3],
    bannerStyles[0],
    bannerStyles[5],
  );

  // Syntax tree (constituency parse of the site's tagline)
  const treeStyle = 'color: #7CC2E2; font-family: monospace; font-size: 11px';
  const leafStyle = 'color: #E89A7A; font-family: monospace; font-size: 11px; font-weight: bold';
  const metaStyle = 'color: #999; font-family: monospace; font-size: 10px';

  console.log(
    '%c          S\n' +
    '         / \\\n' +
    '       NP    VP\n' +
    '       |    / \\\n' +
    '      %cYu%c   V    NP\n' +
    '           |   / \\\n' +
    '        %cbuilds%c N   PP\n' +
    '              |    |\n' +
    '          %csystems%c  \\\n' +
    '                  that\n' +
    '                 %cunderstand\n' +
    '                  language%c',
    treeStyle,
    leafStyle, treeStyle,
    leafStyle, treeStyle,
    leafStyle, treeStyle,
    leafStyle, treeStyle,
  );

  console.log(
    '%c\nHint: this site has 5 Easter eggs.\n' +
    'One of them involves typing. Another is in the footer.\n' +
    'The 語 mark knows how many times you\'ve clicked it.\n',
    metaStyle,
  );
}

// ────────────────────────────────────────────────
// 5. KINYARWANDA TONE SHIFT VISUALIZATION
//    Click the trigger block on any KINTONE cell →
//    multi-color vowel wave spreads through nearby text,
//    visualizing tone spreading in Bantu phonology.
// ────────────────────────────────────────────────

const TONE_WAVE_SPEED_MS = 40; // ms per character
const TONE_HOLD_MS = 2000;
const VOWELS = new Set('aeiouAEIOU àáâãäåèéêëìíîïòóôõöùúûü āēīōū');

export function initToneShift(): () => void {
  let active = false;

  const injectTrigger = (cell: HTMLElement) => {
    if (cell.querySelector('.tone-trigger-block')) return;
    const trigger = document.createElement('div');
    trigger.className = 'tone-trigger-block';
    
    // Ensure the parent cell can absolute-position the trigger properly
    if (getComputedStyle(cell).position === 'static') {
      cell.style.position = 'relative';
    }
    cell.appendChild(trigger);
  };

  const processDOM = () => {
    const cells = document.querySelectorAll<HTMLElement>('.l-cell, .cell, .r-cell, .p-hero, .p-mid, .p-accent');
    for (const cell of cells) {
      const text = cell.textContent?.toLowerCase() || '';
      const isTarget = cell.getAttribute('data-id')?.includes('kintone') ||
                       text.includes('kinyarwanda') ||
                       text.includes('kintone');
      if (isTarget) {
        injectTrigger(cell as HTMLElement);
      }
    }
  };

  // Initial pass
  processDOM();

  // Watch for Astro generative layout switching/rendering over time
  // Disconnect observer during tone wave to prevent lag
  let observer: MutationObserver;
  observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) shouldProcess = true;
    }
    if (shouldProcess) processDOM();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const onClick = (e: MouseEvent) => {
    if (active) return;
    const trigger = (e.target as HTMLElement).closest('.tone-trigger-block');
    if (!trigger) return;

    const cell = trigger.closest('.l-cell, .cell, .r-cell, .p-hero, .p-mid, .p-accent') as HTMLElement;
    if (cell) {
      observer.disconnect(); // Prevent observer from going wild
      runToneWave(cell, () => {
        // Reconnect observer when animation is entirely finished
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  };

  document.addEventListener('click', onClick);

  function runToneWave(origin: HTMLElement, onComplete: () => void): void {
    active = true;

    // Find the closest section or layout container
    const section = origin.closest('.mondrian-lang, .mondrian-research, #mondrian-container, #css-grid-layout');
    if (!section) { active = false; return; }

    // Collect all text nodes in the section FIRST before modifying DOM
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    const nodesToReplace: Text[] = [];
    
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      if (!node.textContent?.trim()) continue;
      // Skip script/style
      const parent = node.parentElement;
      if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') continue;
      if (parent.closest('.tone-trigger-block')) continue; // Skip trigger block itself
      nodesToReplace.push(node);
    }

    const textNodes: { node: Text; spans: HTMLSpanElement[] }[] = [];

    // Now modify the DOM safely
    for (const n of nodesToReplace) {
      const frag = document.createDocumentFragment();
      const spans: HTMLSpanElement[] = [];
      for (const ch of n.textContent || '') {
        const span = document.createElement('span');
        span.textContent = ch;
        if (VOWELS.has(ch)) {
          span.classList.add('tone-vowel');
        }
        spans.push(span);
        frag.appendChild(span);
      }
      n.parentNode!.replaceChild(frag, n);
      textNodes.push({ node: n, spans });
    }

    // Animate: wave spreads outward from origin
    const originRect = origin.getBoundingClientRect();
    const originX = originRect.left + originRect.width / 2;
    const originY = originRect.top + originRect.height / 2;

    // Calculate distance for each vowel span
    const vowelSpans: { span: HTMLSpanElement; dist: number }[] = [];
    for (const { spans } of textNodes) {
      for (const span of spans) {
        if (span.classList.contains('tone-vowel')) {
          const rect = span.getBoundingClientRect();
          const dx = rect.left - originX;
          const dy = rect.top - originY;
          vowelSpans.push({ span, dist: Math.sqrt(dx * dx + dy * dy) });
        }
      }
    }

    // Sort by distance, animate with staggered delay
    vowelSpans.sort((a, b) => a.dist - b.dist);
    const maxDist = vowelSpans[vowelSpans.length - 1]?.dist || 1;

    for (let i = 0; i < vowelSpans.length; i++) {
      const { span, dist } = vowelSpans[i];
      const delay = (dist / maxDist) * TONE_WAVE_SPEED_MS * vowelSpans.length * 0.3;
      const colorIndex = i % 4; // Cycles 0, 1, 2, 3

      setTimeout(() => {
        span.classList.add('tone-active', `tone-color-${colorIndex}`);
      }, delay);
    }

    // Clean up after wave completes
    const totalDuration = TONE_WAVE_SPEED_MS * vowelSpans.length * 0.3 + TONE_HOLD_MS;
    setTimeout(() => {
      // Restore original text nodes
      for (const { spans, node } of textNodes) {
        if (spans.length === 0) continue;
        const parent = spans[0].parentNode;
        if (!parent) continue;
        parent.replaceChild(node, spans[0]);
        for (let i = 1; i < spans.length; i++) {
          spans[i].remove();
        }
      }
      active = false;
      onComplete();
    }, totalDuration);
  }

  return () => {
    document.removeEventListener('click', onClick);
    observer.disconnect();
  };
}
