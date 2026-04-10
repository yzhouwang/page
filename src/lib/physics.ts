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

  // Apply forces before each engine step
  const beforeUpdate = () => {
    for (const cell of cells) {
      const { body, anchorX, anchorY } = cell;
      const pos = body.position;

      // Spring force toward anchor
      const dx = anchorX - pos.x;
      const dy = anchorY - pos.y;
      Body.applyForce(body, pos, {
        x: dx * SPRING_STIFFNESS * body.mass,
        y: dy * SPRING_STIFFNESS * body.mass,
      });

      // Cursor repulsion
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
    for (const cell of cells) {
      const { body, anchorX, anchorY } = cell;
      const dispX = body.position.x - anchorX;
      const dispY = body.position.y - anchorY;
      const dispDist = Math.sqrt(dispX * dispX + dispY * dispY);

      if (dispDist > MAX_DISPLACEMENT) {
        const scale = MAX_DISPLACEMENT / dispDist;
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
    destroy() {
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

      for (const cell of cells) {
        cell.el.style.transform = '';
        cell.el.classList.remove('cell--displaced');
      }
      cells.length = 0;
    },
  };
}
