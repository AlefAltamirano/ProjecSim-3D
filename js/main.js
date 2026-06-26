/**
 * main.js
 * Application entry point.
 *
 * Responsibilities:
 *   - Instantiate all modules
 *   - Wire EventBus connections
 *   - Provide physics tick / render frame callbacks to GameEngine
 */
import { bus }                  from './core/EventBus.js';
import { GameEngine }           from './core/GameEngine.js';
import { Config }               from './core/Config.js';
import { ProjectilePhysics }    from './physics/ProjectilePhysics.js';
import { Scene3D }              from './scene/Scene3D.js';
import { TargetSystem }         from './scene/TargetSystem.js';
import { UIController }         from './ui/UIController.js';

// ════════════════════════════════════════════════════════
// Bootstrap
// ════════════════════════════════════════════════════════

const canvas    = document.getElementById('three-canvas');
const scene3D   = new Scene3D(canvas);
const targets   = new TargetSystem(scene3D.scene, Config.SCALE.METER_TO_UNIT);
const physics   = new ProjectilePhysics();
const engine    = new GameEngine();
const ui        = new UIController();

// ── Idle render loop (always running for orbit controls) ──
let _simActive = false;

function idleLoop() {
  requestAnimationFrame(idleLoop);
  if (!_simActive) {
    scene3D.render();
    ui.tickFPS();
  }
}
idleLoop();

// ════════════════════════════════════════════════════════
// EventBus Wiring
// ════════════════════════════════════════════════════════

/** Fire! */
bus.on('action:fire', params => {
  if (engine.state === 'FLYING') return;

  // Init physics
  physics.init({
    angleDeg: params.angleDeg,
    speed:    params.speed,
    height:   params.height,
    gravity:  params.gravity,
    drag:     params.drag,
    mass:     params.mass,
  });

  // Set sim speed
  engine.setSimSpeed(params.simSpeed);

  // Prepare scene
  targets.startSimulation();

  _simActive = true;
  engine.start();
});

/** Reset */
bus.on('action:reset', () => {
  engine.stop();
  _simActive = false;
  physics.reset();
  targets.reset();
  ui.resetTelemetry();
  scene3D.render();
});

/** Viz toggles */
bus.on('viz:changed', ({ key, value }) => {
  targets.setVis(key, value);
  if (key === 'grid') scene3D.setGridVisible(value);
  if (key === 'energy') {
    const overlay = document.getElementById('energy-overlay');
    overlay.classList.toggle('hidden', !value);
  }
});

/** Target position update */
bus.on('target:move', xMetres => {
  targets.setTargetX(xMetres);
});

/** Prediction range → show ghost impact ring */
bus.on('prediction:range', rangeMetre => {
  targets.showPredictedImpact(rangeMetre);
});

// ════════════════════════════════════════════════════════
// Engine Callbacks
// ════════════════════════════════════════════════════════

/**
 * Physics tick — called with fixed dt.
 * @param {number} dt
 * @returns {boolean} true = stop simulation
 */
engine.onPhysicsTick = (dt) => {
  const landed = physics.step(dt);

  const state = {
    x:     physics.x,
    y:     physics.y,
    vx:    physics.vx,
    vy:    physics.vy,
    speed: physics.speed,
    ymax:  physics.ymax,
    t:     physics.t,
    Ek:    physics.Ek,
    Ep:    physics.Ep,
    Em:    physics.Em,
  };

  // Update 3D visuals
  targets.update(state);

  // Update UI telemetry
  ui.updateTelemetry(state);

  return landed;
};

/** Render frame — interpolated. */
engine.onRenderFrame = (_alpha) => {
  scene3D.render();
  ui.tickFPS();
};

/** Landed callback */
engine.onLanded = () => {
  _simActive = false;
  targets.showImpact(physics.x);

  // Final telemetry update
  ui.updateTelemetry({
    x:     physics.x,
    y:     0,
    vx:    physics.vx,
    vy:    0,
    speed: Math.abs(physics.vx),
    ymax:  physics.ymax,
    t:     physics.t,
    Ek:    physics.Ek,
    Ep:    0,
    Em:    physics.Ek,
  });

  scene3D.render();
};

// ════════════════════════════════════════════════════════
// Initial predictions on load
// ════════════════════════════════════════════════════════

// Trigger initial prediction display
bus.emit('params:changed', {
  angleDeg: Config.PHYSICS.ANGLE_DEG,
  speed:    Config.PHYSICS.SPEED,
  height:   Config.PHYSICS.HEIGHT,
  gravity:  Config.PHYSICS.GRAVITY,
  drag:     Config.PHYSICS.DRAG,
  mass:     Config.PHYSICS.MASS,
});
