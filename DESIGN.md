# Design System — Yuzhou Wang Personal Site

## Product Context
- **What this is:** Personal website for Yuzhou Wang, AI researcher and computational linguist
- **Who it's for:** Peers, recruiters, collaborators, internet strangers
- **Space/industry:** Academic research, AI, personal brand
- **Project type:** Interactive personal site with physics-driven Mondrian grid

## Aesthetic Direction
- **Direction:** De Stijl Kinetic Machine
- **Decoration level:** Minimal. The Mondrian composition and physics ARE the decoration. No additional embellishment.
- **Mood:** A precision instrument that breathes. Rigorous and playful at the same time. The visitor should feel: "this person operates with a set of rules I want to understand."
- **Core identity:** The CSS Grid gap IS the Mondrian line. The layout IS the art. The physics make it tactile. You don't look at the art. You hold it.

## Typography
- **Display/Headings:** Space Grotesk (variable, 300-700) — Monospace skeleton under proportional spacing. Reads as engineered, not friendly. "Built in a lab at 2am."
- **Body:** Outfit (400, 500, 600) — Clean, readable, pairs well with CJK. Doesn't fight the heading font.
- **CJK/Serif:** Noto Serif JP (400, 700, 900) — Anchors CJK glyphs as authoritative, not decorative. Used for research titles, project icons, language glyphs.
- **Mono:** JetBrains Mono (400, 500, 600) — For metadata, timestamps, project tags, language ISO codes. Signals: "this person thinks in systems."
- **Loading:** Google Fonts CDN with preconnect
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@400;700;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  ```
- **Scale:**

  | Level | Size | Font | Weight | Use |
  |-------|------|------|--------|-----|
  | Hero | clamp(56px, 8vw, 96px) | Space Grotesk | 700 | Name, page title |
  | H2 | clamp(32px, 4.5vw, 56px) | Space Grotesk | 600 | Section headings |
  | H3 | clamp(22px, 2.5vw, 30px) | Noto Serif JP | 900 | Card titles, project names |
  | Body | 16px | Outfit | 400 | Paragraphs, descriptions |
  | Small body | 15px | Outfit | 400 | Card descriptions |
  | Label | 11px | Space Grotesk | 700 | Nav links, button text |
  | Meta | 10-11px | JetBrains Mono | 500 | Section labels, timestamps, tags |
  | Caption | 9px | JetBrains Mono | 500 | Cell labels, fine print |

  All labels/meta use letter-spacing: 3-4px and text-transform: uppercase.

## Color

- **Approach:** Boosted pastels. Warmer and more saturated than typical pastels, but not full De Stijl primaries. Recognizably Yuzhou Wang's palette, with enough chromatic intensity for physics interactions.

  ```css
  :root {
    /* Surfaces */
    --surface: #F5F3EE;        /* warm paper white, cell interiors */
    --surface-alt: #EDEAE3;    /* slightly darker, secondary surfaces */
    --grid: #111111;           /* Mondrian lines, deep ink black */

    /* Text */
    --text: #111111;
    --text-muted: #555555;
    --text-ghost: #999999;

    /* Accents — layout colors */
    --blue: #7CC2E2;           /* boosted pastel blue */
    --blue-deep: #5AADCE;      /* blue hover state */
    --coral: #E89A7A;          /* boosted pastel coral */
    --coral-deep: #D4835E;     /* coral hover state */
    --yellow: #E8D26E;         /* boosted pastel yellow */

    /* Interaction state — NOT a layout color */
    --mint: #72D4A4;           /* physics interaction indicator */

    /* Grid system */
    --line: 4px;               /* Mondrian line width */
    --max-displacement: 15px;  /* physics max cell displacement */
  }
  ```

- **Rules:**
  - 70% neutrals (surface, grid, text), 30% accents
  - Never use 3+ accent colors in one viewport at the same size
  - Hero cell: always --surface (readability)
  - Mint (#72D4A4) appears ONLY during physics interaction (cell being displaced). It is NOT a layout color.
  - Hover states: use --blue-deep, --coral-deep (10-15% darker)

- **Dark mode (future):**
  - Surface: #1A1A1A
  - Grid lines: #F5F3EE (inverted)
  - Accents: bump lightness +10% (blue #8ACEE8, coral #F0A888, yellow #F0DC82)
  - Text: #F5F3EE

## Spacing
- **Base unit:** 4px (var(--line), the Mondrian line width)
- **Density:** Comfortable
- **Scale:**

  | Token | Value | Use |
  |-------|-------|-----|
  | 2xs | 4px | Grid gaps, micro spacing |
  | xs | 8px | Tag gaps, tight padding |
  | sm | 16px | Card internal gaps |
  | md | 24px | Section sub-spacing |
  | lg | 32px | Component gaps |
  | xl | 48px | Section padding (compact) |
  | 2xl | 56px | Section padding (standard) |
  | 3xl | 64px | Section padding (generous) |

## Layout
- **Approach:** Mondrian grid-as-layout. The grid IS the information architecture.
- **Positioning model:** Absolute positioning for physics. Layout engine outputs pixel rectangles. CSS transforms for displacement. Black background between cells = Mondrian lines.
- **Grid system:** Recursive seeded subdivision (not CSS Grid columns). Each visit generates a unique composition.
- **Max content width:** 1600px (centered, black margins beyond)
- **Border radius:** 0px everywhere. Rectangles only. This is Mondrian.
- **Responsive breakpoints:**

  | Breakpoint | Behavior |
  |------------|----------|
  | >= 1024px | Full generative Mondrian, all physics |
  | 768-1023px | Reduced subdivision depth, merged language cells |
  | < 768px | Fixed single-column stack, physics on individual cells |
  | < 320px | No physics, plain CSS flow layout |

## Motion
- **Approach:** The physics engine IS the motion system. Matter.js drives all movement.
- **No CSS animations** except:
  - Layout crossfade (opacity 0.35s ease, CSS Grid → generative on desktop load)
  - Cell entrance reveal (@keyframes cellReveal, staggered 60ms per cell)
  - Cube rotation (@keyframes, pauses on prefers-reduced-motion)
  - Hover transitions (background-color, 0.2-0.3s ease)
- **Physics interaction hints:**
  - cursor: grab on all cells when physics is active
  - Initial wave pulse (outward force from center) on physics init signals interactivity
- **Physics easing:** Spring constraints with damping 0.2 (natural settle, not eased curves)
- **Duration reference:** Cells return to anchor in ~0.3-0.5s after displacement
- **prefers-reduced-motion:** All physics disabled. Static layout. Cube pauses. Hover transitions remain.

## Novel Design Tokens

These tokens are unique to this design system. No other system has them.

| Token | Value | Description |
|-------|-------|-------------|
| --line | 4px | Mondrian line width (grid gap at rest) |
| --max-displacement | 15px | Maximum physics cell displacement from anchor |
| --line-range | 0px to 19px | Visual range of Mondrian lines when cells breathe |
| --spring-stiffness | 0.0002 | How fast cells return to anchor |
| --spring-damping | 0.15 | How quickly oscillation settles |
| --cursor-radius | 350px | Radius of cursor repulsion force field |

The breathing range of the grid (--line + displacement) is a first-class design primitive.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-10 | Created design system | /design-consultation with competitive research + Codex + Claude subagent outside voices |
| 2026-04-10 | Space Grotesk for headings | Both outside voices recommended replacing Outfit for headings. Space Grotesk has monospace DNA that reads as "engineered." |
| 2026-04-10 | Boosted pastels over saturated primaries | User chose warmth and recognizability over bold impact. Pastels are more distinctively Yu's. Boosted 15% for physics readability. |
| 2026-04-10 | Mint as interaction-only color | Novel design primitive. Mint signals physics displacement, not static layout. Reduces layout palette to clean triad. |
| 2026-04-10 | JetBrains Mono for metadata | Both outside voices recommended a monospace accent. Signals systematic thinking. |
| 2026-04-10 | 0px border-radius everywhere | Mondrian uses rectangles. No rounded corners, ever. |
| 2026-04-10 | Physics displacement as design token | --max-displacement and --line-range are novel tokens that define the grid's breathing behavior. |
| 2026-04-11 | Mondrian proficiency blocks over progress bars | 5 small squares per language replace continuous bars. Filled count = Math.round(proficiency/20). Matches grid aesthetic. |
| 2026-04-11 | Layout crossfade transition | 350ms opacity fade from CSS Grid to generative layout prevents FOUC on desktop load. |
| 2026-04-11 | Physics wave pulse on init | Gentle outward force nudge makes cells visibly breathe, signaling the interactive physics system. |
