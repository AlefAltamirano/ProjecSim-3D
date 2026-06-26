/**
 * TrajectoryCalculator.js
 * Analytical (closed-form) predictions for the ideal case (no drag).
 * Used to populate the Prediction panel before / during simulation.
 *
 * When drag ≠ 0, these are approximate (ideal baseline) and labeled as such.
 */

export class TrajectoryCalculator {

  /**
   * Compute predictions from current parameters.
   * @param {object} p
   * @param {number} p.angleDeg
   * @param {number} p.speed
   * @param {number} p.height
   * @param {number} p.gravity
   * @param {number} p.drag
   * @param {number} p.mass
   * @returns {{hmax, tof, range, vImpact, Ek0, Ep0}}
   */
  static predict({ angleDeg, speed, height, gravity, drag, mass = 1 }) {
    const g   = gravity;
    const v0  = speed;
    const θ   = angleDeg * Math.PI / 180;
    const y0  = height;
    const v0x = v0 * Math.cos(θ);
    const v0y = v0 * Math.sin(θ);

    // ── Without drag (analytical) ──
    // Time to reach apex
    const t_apex = v0y / g;

    // Maximum height
    const hmax = y0 + (v0y * v0y) / (2 * g);

    // Time of flight (quadratic formula: y0 + v0y*t - 0.5*g*t² = 0)
    // 0.5g t² - v0y t - y0 = 0
    const A = 0.5 * g;
    const B = -v0y;
    const C = -y0;
    const disc = B * B - 4 * A * C;
    const tof = disc < 0 ? 0 : (-B + Math.sqrt(disc)) / (2 * A);

    // Horizontal range
    const range = v0x * tof;

    // Impact speed (energy conservation)
    const vImpact = Math.sqrt(v0 * v0 + 2 * g * y0);

    // Initial energies
    const Ek0 = 0.5 * mass * v0 * v0;
    const Ep0 = mass * g * y0;

    return {
      hmax:    isFinite(hmax)    ? hmax    : 0,
      tof:     isFinite(tof)     ? tof     : 0,
      range:   isFinite(range)   ? range   : 0,
      vImpact: isFinite(vImpact) ? vImpact : 0,
      Ek0,
      Ep0,
      hasDrag: drag > 0,
    };
  }
}
