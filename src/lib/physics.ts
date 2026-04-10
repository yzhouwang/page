/**
 * Mondrian Physics Engine
 *
 * Each cell becomes a Matter.js body anchored to its layout position
 * by a spring constraint. The cursor exerts a repulsion force within
 * a 150px radius. Cells displace up to 15px, revealing wider grid
 * lines as they breathe. Mint flashes on actively displaced cells.
 *
 * Design tokens (from DESIGN.md):
 *   --max-displacement: 15px
 *   --spring-stiffness: 0.02
 *   --spring-damping: 0.2
 *   --cursor-radius: 150px
 */
import Matter from 'matter-js';

const { Engine, Bodies, Body, Composite, Runner } = Matter;

const CURSOR_RADIUS = 150;
const MAX_DISPLACEMENT = 15;
const SPRING_STIFFNESS = 0.02;
const SPRING_DAMPING = 0.2;
const REPULSION_STRENGTH = 0.15;
const DISPLACEMENT_THRESHOLD = 2; // px — below this, cell is "at rest"

interface CellPhysics {
  el: HTMLElement;
  body: Matter.Body;
  anchorX: number;
  anchorY: number;
  baseLeft: number;
  baseTop: number;
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

  for (const el of cellEls) {
    const left = parseFloat(el.style.left);
    const top = parseFloat(el.style.top);
    const w = parseFloat(el.style.width);
    const h = parseFloat(el.style.height);

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

    cells.push({
      el,
      body,
      anchorX: cx,
      anchorY: cy,
      baseLeft: left,
      baseTop: top,
    });
  }

  // Mouse state
  let mouseX = -9999;
  let mouseY = -9999;

  const onMouseMove = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  };

  const onMouseLeave = () => {
    mouseX = -9999;
    mouseY = -9999;
  };

  // Listen on the document so we track the mouse even between cells
  document.addEventListener('mousemove', onMouseMove, { passive: true });
  container.addEventListener('mouseleave', onMouseLeave, { passive: true });

  // Physics loop — runs each frame via Matter.js runner
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

      // Clamp displacement
      const dispX = pos.x - anchorX;
      const dispY = pos.y - anchorY;
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

  // Start
  Runner.run(runner, engine);
  raf = requestAnimationFrame(render);

  // Cleanup
  return {
    destroy() {
      cancelAnimationFrame(raf);
      Runner.stop(runner);
      Engine.clear(engine);
      document.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      Matter.Events.off(engine, 'beforeUpdate', beforeUpdate);

      // Reset transforms
      for (const cell of cells) {
        cell.el.style.transform = '';
        cell.el.classList.remove('cell--displaced');
      }
    },
  };
}
