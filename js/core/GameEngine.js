/**
 * GameEngine.js
 * Core simulation loop using requestAnimationFrame.
 * Decoupled from physics and rendering — it orchestrates both via the EventBus.
 *
 * States: IDLE → FLYING → LANDED
 */
import { bus } from './EventBus.js';
import { Config } from './Config.js';

export class GameEngine {
  constructor() {
    /** @type {'IDLE'|'FLYING'|'LANDED'} */
    this.state = 'IDLE';

    this._rafId = null;
    this._lastTimestamp = 0;

    /** Physics accumulator for fixed timestep. */
    this._accumulator = 0;
    this._DT = Config.PHYSICS.DT;
    this._simSpeed = 1;

    /** External callbacks injected by main.js */
    this.onPhysicsTick = null;  // (dt) => void
    this.onRenderFrame = null;  // (alpha) => void
    this.onLanded = null;       // () => void
  }

  /** Start the simulation. */
  start() {
    if (this.state === 'FLYING') return;
    this.state = 'FLYING';
    this._accumulator = 0;
    this._lastTimestamp = performance.now();
    bus.emit('engine:state', 'FLYING');
    this._loop(this._lastTimestamp);
  }

  /** Stop and reset. */
  stop() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.state = 'IDLE';
    bus.emit('engine:state', 'IDLE');
  }

  /** Called by physics when projectile lands. */
  land() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.state = 'LANDED';
    bus.emit('engine:state', 'LANDED');
    this.onLanded?.();
  }

  setSimSpeed(s) { this._simSpeed = s; }

  /** RAF loop with fixed-timestep physics + interpolated render. */
  _loop(timestamp) {
    this._rafId = requestAnimationFrame(ts => this._loop(ts));

    let elapsed = (timestamp - this._lastTimestamp) / 1000;
    this._lastTimestamp = timestamp;

    // Clamp — prevents spiral of death on tab switch
    if (elapsed > 0.1) elapsed = 0.1;

    const scaledElapsed = elapsed * this._simSpeed;
    this._accumulator += scaledElapsed;

    // Fixed-timestep physics ticks
    while (this._accumulator >= this._DT) {
      if (this.onPhysicsTick) {
        const shouldStop = this.onPhysicsTick(this._DT);
        if (shouldStop) {
          this.land();
          return;
        }
      }
      this._accumulator -= this._DT;
    }

    // Interpolation factor for smooth render
    const alpha = this._accumulator / this._DT;
    this.onRenderFrame?.(alpha);
  }
}
