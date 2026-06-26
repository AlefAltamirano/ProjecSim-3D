/**
 * ProjectilePhysics.js
 * Numerical simulation of projectile motion using RK4 integration.
 *
 * State vector: [x, y, vx, vy]
 * Equations of motion (with linear drag):
 *   dx/dt  = vx
 *   dy/dt  = vy
 *   dvx/dt = -(γ/m) * vx
 *   dvy/dt = -g - (γ/m) * vy
 */
import { Config } from '../core/Config.js';

export class ProjectilePhysics {
  constructor() {
    this.reset();
  }

  /**
   * Initialise with launch parameters.
   * @param {object} params
   * @param {number} params.angleDeg
   * @param {number} params.speed      m/s
   * @param {number} params.height     m (initial y)
   * @param {number} params.gravity    m/s²
   * @param {number} params.drag       γ (kg/s, linear drag coefficient)
   * @param {number} params.mass       kg
   */
  init({ angleDeg, speed, height, gravity, drag, mass = 1 }) {
    const rad = angleDeg * Math.PI / 180;
    this.x  = 0;
    this.y  = height;
    this.vx = speed * Math.cos(rad);
    this.vy = speed * Math.sin(rad);
    this.g  = gravity;
    this.γ  = drag;
    this.m  = mass;
    this.t  = 0;
    this.ymax = height;
    this._initialY = height;
  }

  reset() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.g = 9.81; this.γ = 0; this.m = 1;
    this.t = 0; this.ymax = 0;
    this._initialY = 0;
  }

  /**
   * Advance simulation by dt seconds using RK4.
   * @param {number} dt
   * @returns {boolean} true if projectile has landed (y <= 0 after init)
   */
  step(dt) {
    const state = [this.x, this.y, this.vx, this.vy];
    const next  = this._rk4(state, dt);

    this.x  = next[0];
    this.y  = next[1];
    this.vx = next[2];
    this.vy = next[3];
    this.t += dt;

    if (this.y > this.ymax) this.ymax = this.y;

    // Ground collision
    if (this.y <= 0 && this.t > 0.01) {
      this.y  = 0;
      this.vy = 0;
      return true; // landed
    }

    return false;
  }

  /** Speed (magnitude of velocity vector). */
  get speed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  /** Kinetic energy. */
  get Ek() {
    return 0.5 * this.m * (this.vx * this.vx + this.vy * this.vy);
  }

  /** Potential energy (relative to ground). */
  get Ep() {
    return this.m * this.g * Math.max(this.y, 0);
  }

  /** Mechanical energy (may decrease with drag). */
  get Em() {
    return this.Ek + this.Ep;
  }

  // ── Private ──────────────────────────────────────

  /**
   * Derivative function: d(state)/dt = f(state)
   * @param {number[]} s  [x, y, vx, vy]
   * @returns {number[]}  [dx, dy, dvx, dvy]
   */
  _derivatives(s) {
    const [, , vx, vy] = s;
    const kOverM = this.γ / this.m;
    return [
      vx,
      vy,
      -kOverM * vx,
      -this.g - kOverM * vy,
    ];
  }

  /**
   * Classical Runge-Kutta 4th order.
   * @param {number[]} s   state
   * @param {number}   dt
   * @returns {number[]}   new state
   */
  _rk4(s, dt) {
    const k1 = this._derivatives(s);
    const k2 = this._derivatives(this._add(s, this._scale(k1, dt / 2)));
    const k3 = this._derivatives(this._add(s, this._scale(k2, dt / 2)));
    const k4 = this._derivatives(this._add(s, this._scale(k3, dt)));

    return s.map((v, i) => v + (dt / 6) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
  }

  _add(a, b)   { return a.map((v, i) => v + b[i]); }
  _scale(a, s) { return a.map(v => v * s); }
}
