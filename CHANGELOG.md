# Changelog

All notable changes to this project will be documented in this file.

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
