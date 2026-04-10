# Changelog

All notable changes to this project will be documented in this file.

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
