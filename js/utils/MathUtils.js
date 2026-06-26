/**
 * MathUtils.js
 * Pure mathematical helper functions.
 */

/** Clamp value to [min, max]. */
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/** Linear interpolation. */
export function lerp(a, b, t) { return a + (b - a) * t; }

/** Convert degrees to radians. */
export function degToRad(d) { return d * Math.PI / 180; }

/** Convert radians to degrees. */
export function radToDeg(r) { return r * 180 / Math.PI; }

/**
 * Map value from [inMin,inMax] to [outMin,outMax].
 */
export function mapRange(v, inMin, inMax, outMin, outMax) {
  const t = (v - inMin) / (inMax - inMin);
  return outMin + clamp(t, 0, 1) * (outMax - outMin);
}
