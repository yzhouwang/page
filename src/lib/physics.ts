/**
 * Mondrian Physics Engine
 *
 * Each cell becomes a Matter.js body anchored to its layout position
 * by a spring constraint. The cursor exerts a repulsion force within
 * a 350px radius. Cells displace up to 15px, revealing wider grid
 * lines as they breathe. Mint flashes on actively displaced cells.
 *
 * Design tokens (from DESIGN.md):
 *   --max-displacement: 15px
 *   --spring-stiffness: 0.0002
 *   --spring-damping: 0.15
 *   --cursor-radius: 350px
 */
import Matter from 'matter-js';

const { Engine, Bodies, Body, Composite, Runner } = Matter;

const CURSOR_RADIUS = 350;
const MAX_DISPLACEMENT = 15;
const SPRING_STIFFNESS = 0.0002;
const SPRING_DAMPING = 0.15;
const REPULSION_STRENGTH = 0.003;
const DISPLACEMENT_THRESHOLD = 2; // px — below this, cell is "at rest"
const MOUSE_OFFSCREEN = -9999;
const WAVE_NUDGE_FORCE = 0.0008;
const WAVE_DELAY_MS = 200;

interface CellPhysics {
  el: HTMLElement;
  body: Matter.Body;
  anchorX: number;
  anchorY: number;
}

export interface PhysicsInstance {
  destroy: () => void;
  collapse: () => void;
  restore: () => void;
  setDesignerMode: (on: boolean) => void;
  readonly collapsed: boolean;
}

/**
 * Initialize physics on a rendered Mondrian grid.
 * Attaches to all .cell elements inside the container.
 */
export function initPhysics(container: HTMLElement): PhysicsInstance {
  const engine = Engine.create({ gravity: { x: 0, y: 0 } });
  const runner = Runner.create();

  const cellEls = container.querySelectorAll<HTMLElement>('.cell');
  const cells: CellPhysics[] = [];

  // Clear entrance animation so physics transforms take effect.
  // CSS animation fill-mode:both overrides inline styles in the cascade.
  for (const el of cellEls) {
    el.style.animation = 'none';
  }

  for (const el of cellEls) {
    const left = parseFloat(el.style.left);
    const top = parseFloat(el.style.top);
    const w = parseFloat(el.style.width);
    const h = parseFloat(el.style.height);

    if (isNaN(left) || isNaN(top) || isNaN(w) || isNaN(h)) continue;

    // Center of the cell in layout coordinates
    const cx = left + w / 2;
    const cy = top + h / 2;

    const body = Bodies.rectangle(cx, cy, w, h, {
      isStatic: false,
      frictionAir: SPRING_DAMPING,
      inertia: Infinity, // prevent rotation
      inverseInertia: 0,
    });

    Composite.add(engine.world, body);

    cells.push({ el, body, anchorX: cx, anchorY: cy });
  }

  // Mouse state
  let mouseX = MOUSE_OFFSCREEN;
  let mouseY = MOUSE_OFFSCREEN;

  const onMouseMove = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  };

  const onMouseLeave = () => {
    mouseX = MOUSE_OFFSCREEN;
    mouseY = MOUSE_OFFSCREEN;
  };

  // Listen on the document so we track the mouse even between cells
  document.addEventListener('mousemove', onMouseMove, { passive: true });
  container.addEventListener('mouseleave', onMouseLeave, { passive: true });

  // Gravity collapse state (Easter egg #1)
  let gravityCollapsed = false;

  // Designer mode state (Easter egg #3) — chaotic physics
  let designerMode = false;
  let designerInterval: ReturnType<typeof setInterval> | null = null;
  const DESIGNER_SPRING = 0.00003;       // 7x weaker springs — cells are jelly
  const DESIGNER_MAX_DISP = 120;         // cells can fly way out
  const DESIGNER_CHAOS_MS = 400;         // random force interval
  const DESIGNER_CHAOS_FORCE = 0.006;    // how hard the random shoves are
  const DESIGNER_GRAVITY_PERIOD = 3000;  // gravity oscillation period

  // Floor + walls for gravity collapse (added to world on collapse)
  const containerW = container.offsetWidth;
  const containerH = container.scrollHeight || container.offsetHeight;
  const wallThickness = 60;
  const floor = Bodies.rectangle(containerW / 2, containerH + wallThickness / 2, containerW * 2, wallThickness, { isStatic: true });
  const wallL = Bodies.rectangle(-wallThickness / 2, containerH / 2, wallThickness, containerH * 4, { isStatic: true });
  const wallR = Bodies.rectangle(containerW + wallThickness / 2, containerH / 2, wallThickness, containerH * 4, { isStatic: true });

  // Apply forces before each engine step
  const beforeUpdate = () => {
    for (const cell of cells) {
      const { body, anchorX, anchorY } = cell;
      const pos = body.position;

      if (!gravityCollapsed) {
        // Spring force toward anchor — much weaker in designer mode
        const stiffness = designerMode ? DESIGNER_SPRING : SPRING_STIFFNESS;
        const dx = anchorX - pos.x;
        const dy = anchorY - pos.y;
        Body.applyForce(body, pos, {
          x: dx * stiffness * body.mass,
          y: dy * stiffness * body.mass,
        });
      }

      // Designer mode: oscillating gravity makes cells drunkenly bob
      if (designerMode && !gravityCollapsed) {
        const t = performance.now() / DESIGNER_GRAVITY_PERIOD;
        engine.gravity.y = Math.sin(t * Math.PI * 2) * 0.4;
        engine.gravity.x = Math.cos(t * Math.PI * 2 * 0.7) * 0.15;
      }

      // Cursor repulsion (active in both modes)
      const cdx = pos.x - mouseX;
      const cdy = pos.y - mouseY;
      const dist = Math.sqrt(cdx * cdx + cdy * cdy);

      if (dist < CURSOR_RADIUS && dist > 1) {
        const factor = (1 - dist / CURSOR_RADIUS) * REPULSION_STRENGTH;
        Body.applyForce(body, pos, {
          x: (cdx / dist) * factor * body.mass,
          y: (cdy / dist) * factor * body.mass,
        });
      }
    }
  };

  // Clamp after integration so bodies can't overshoot the 15px limit
  const afterUpdate = () => {
    if (gravityCollapsed) return; // no clamping during collapse
    const maxDisp = designerMode ? DESIGNER_MAX_DISP : MAX_DISPLACEMENT;
    for (const cell of cells) {
      const { body, anchorX, anchorY } = cell;
      const dispX = body.position.x - anchorX;
      const dispY = body.position.y - anchorY;
      const dispDist = Math.sqrt(dispX * dispX + dispY * dispY);

      if (dispDist > maxDisp) {
        const scale = maxDisp / dispDist;
        Body.setPosition(body, {
          x: anchorX + dispX * scale,
          y: anchorY + dispY * scale,
        });
        Body.setVelocity(body, { x: 0, y: 0 });
      }
    }
  };

  Matter.Events.on(engine, 'beforeUpdate', beforeUpdate);
  Matter.Events.on(engine, 'afterUpdate', afterUpdate);

  // Render loop — sync DOM with physics
  let raf: number;

  const syncDOM = () => {
    for (const cell of cells) {
      const { el, body, anchorX, anchorY } = cell;
      const pos = body.position;

      const offsetX = pos.x - anchorX;
      const offsetY = pos.y - anchorY;
      const displacement = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

      // Use CSS transform for sub-pixel smoothness
      el.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

      // Mint flash on displaced cells
      if (displacement > DISPLACEMENT_THRESHOLD) {
        el.classList.add('cell--displaced');
      } else {
        el.classList.remove('cell--displaced');
      }
    }
  };

  const render = () => {
    syncDOM();
    raf = requestAnimationFrame(render);
  };

  // Pause Runner when tab is hidden to avoid burning CPU in background
  const onVisibilityChange = () => {
    if (document.hidden) {
      Runner.stop(runner);
      cancelAnimationFrame(raf);
    } else {
      Runner.run(runner, engine);
      raf = requestAnimationFrame(render);
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Start
  Runner.run(runner, engine);
  raf = requestAnimationFrame(render);

  // Signal interactivity: cursor hint + initial wave pulse
  container.classList.add('physics-active');

  // Gentle outward wave from center so cells visibly breathe on load
  let waveTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    waveTimeout = null;
    const cx = container.offsetWidth / 2;
    const cy = container.offsetHeight / 2;
    for (const cell of cells) {
      const dx = cell.body.position.x - cx;
      const dy = cell.body.position.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      Body.applyForce(cell.body, cell.body.position, {
        x: (dx / dist) * WAVE_NUDGE_FORCE * cell.body.mass,
        y: (dy / dist) * WAVE_NUDGE_FORCE * cell.body.mass,
      });
    }
  }, WAVE_DELAY_MS);

  return {
    get collapsed() { return gravityCollapsed; },

    setDesignerMode(on: boolean) {
      designerMode = on;
      if (on) {
        // Lower air friction so cells are floatier
        for (const cell of cells) {
          cell.body.frictionAir = 0.03;
        }
        // Periodic random shoves — cells bounce around like drunk bubbles
        designerInterval = setInterval(() => {
          const lucky = cells[Math.floor(Math.random() * cells.length)];
          if (lucky) {
            Body.applyForce(lucky.body, lucky.body.position, {
              x: (Math.random() - 0.5) * DESIGNER_CHAOS_FORCE * lucky.body.mass,
              y: (Math.random() - 0.5) * DESIGNER_CHAOS_FORCE * lucky.body.mass,
            });
          }
        }, DESIGNER_CHAOS_MS);
      } else {
        // Restore sanity
        if (designerInterval) { clearInterval(designerInterval); designerInterval = null; }
        engine.gravity.y = 0;
        engine.gravity.x = 0;
        for (const cell of cells) {
          cell.body.frictionAir = SPRING_DAMPING;
          // Snap back to anchors
          Body.setPosition(cell.body, { x: cell.anchorX, y: cell.anchorY });
          Body.setVelocity(cell.body, { x: 0, y: 0 });
        }
      }
    },

    collapse() {
      if (gravityCollapsed) return;
      gravityCollapsed = true;
      engine.gravity.y = 0.8;
      // Add floor + walls so cells pile up
      Composite.add(engine.world, [floor, wallL, wallR]);
      // Give each cell a small random horizontal nudge for visual variety
      for (const cell of cells) {
        Body.applyForce(cell.body, cell.body.position, {
          x: (Math.random() - 0.5) * 0.002 * cell.body.mass,
          y: 0,
        });
      }
      container.classList.add('gravity-collapsed');
    },

    restore() {
      if (!gravityCollapsed) return;
      gravityCollapsed = false;
      engine.gravity.y = 0;
      Composite.remove(engine.world, floor);
      Composite.remove(engine.world, wallL);
      Composite.remove(engine.world, wallR);
      // Snap cells back to anchors with a spring-like impulse
      for (const cell of cells) {
        Body.setPosition(cell.body, { x: cell.anchorX, y: cell.anchorY });
        Body.setVelocity(cell.body, { x: 0, y: 0 });
      }
      container.classList.remove('gravity-collapsed');
    },

    destroy() {
      if (designerInterval) { clearInterval(designerInterval); designerInterval = null; }
      if (waveTimeout) { clearTimeout(waveTimeout); waveTimeout = null; }
      cancelAnimationFrame(raf);
      Runner.stop(runner);
      Matter.Events.off(engine, 'beforeUpdate', beforeUpdate);
      Matter.Events.off(engine, 'afterUpdate', afterUpdate);
      Engine.clear(engine);
      document.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      container.classList.remove('physics-active');
      container.classList.remove('gravity-collapsed');

      for (const cell of cells) {
        cell.el.style.transform = '';
        cell.el.classList.remove('cell--displaced');
      }
      cells.length = 0;
    },
  };
}
