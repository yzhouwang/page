# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0.0] - 2026-04-12

### Added
- Full blog system with MDX support, reading time estimation, and RSS feed
- Blog layout with CSS-only hamburger menu, sidebar metadata, and prev/next navigation
- Five MDX components for rich content: CalloutTile, AsideTile, CodeBlock, FigureTile, LinkCard
- Interactive Tone Derivation Visualizer for Kinyarwanda linguistics, with step-through animation and responsive grid
- Two seed posts: physics engine explainer and Kinyarwanda tone spreading primer with 4 interactive examples
- Blog feed section on homepage (both CSS grid and generative layouts)
- Playwright E2E test suite (28 tests across desktop and mobile viewports)
- Draft filtering and centralized blog helpers

### Fixed
- BASE_URL path joining across blog routes, RSS feed, and navigation links
- Blog nav dropdown positioning for resilient mobile layout

## [0.2.2.0] - 2026-04-11

### Added
- Five hidden Easter eggs for curious visitors:
  - Gravity Collapse: click the 語 mark 5 times to release springs and let cells fall with physics
  - Zero-Shot Scramble: type "NLP" or "KINTONE" anywhere to scramble headings through Cyrillic, Greek, Devanagari, CJK, Arabic, and Hangul scripts
  - Comic Sans Designer Mode: hidden toggle in footer corner enables joke styling with chaotic physics (oscillating gravity, jelly springs, random cell shoves)
  - Console Syntax Tree: styled constituency parse tree and Mondrian banner art printed to DevTools console on load
  - Kinyarwanda Tone Shift: click trigger block on KINTONE cells to send a multi-color vowel wave (blue/coral/yellow/mint) spreading outward through text
- Physics engine extensions: gravity collapse with floor/walls containment, restore snap-back, designer mode with 7x weaker springs and random force shoves
- Generative layout footer matching CSS Grid footer design
- MutationObserver-based trigger injection for tone shift to catch dynamically rendered cells

### Fixed
- Text scramble now preserves `<br>` and inline markup in headings (saves innerHTML, restores after animation)

## [0.2.1.0] - 2026-04-11

### Added
- Smooth crossfade transition between CSS Grid fallback and generative layout (350ms fade-out, staggered cell reveal)
- Physics interaction hint: cursor changes to grab on physics-active cells, initial wave pulse nudges cells outward on load
- Mondrian-style proficiency blocks replace progress bars in language section (5 blocks per language, filled proportional to proficiency)

### Fixed
- Race condition: rapid mode switching during crossfade no longer leaves both layouts invisible
- Wave pulse timeout properly cleaned up on physics destroy to prevent stale callbacks
- Physics initialization delayed until container is visible after crossfade completes

## [0.2.0.0] - 2026-04-11

### Added
- Matter.js physics engine with cursor repulsion on Mondrian cells
- Spring constraints anchor cells to layout positions (stiffness 0.0002, damping 0.15)
- 350px cursor force field displaces nearby cells up to 15px
- Mint glow indicator on actively displaced cells
- prefers-reduced-motion disables all physics

### Fixed
- CSS animation fill-mode cascade no longer blocks physics transforms
- Force constants tuned for Matter.js Verlet integration (dt² amplification)

## [0.1.0.0] - 2026-04-10

### Added
- Astro 4 site with content collections for papers, projects, and languages
- Dual-layout system: CSS Grid fallback (mobile/noscript) + generative Mondrian engine (desktop >= 1024px)
- Section-based generative layout engine with recursive Mondrian subdivision per narrative section (Hero, Research, Projects, Languages, CTA)
- PRNG seed system (Mulberry32 + FNV-1a hash) for deterministic-per-session compositions with sessionStorage salt
- 7-color expanded pastel palette (blue, coral, yellow, lavender, sage, peach, rose) with PRNG-driven color assignment
- 3D rotating cube visualization for research areas
- Responsive language grid (3x3) with viewport-relative clamp() sizing
- Cell entrance animations with staggered delays
- Design system (DESIGN.md) defining typography, color, spacing, and motion tokens
- Test suite (vitest) covering PRNG, hash, and layout engine
