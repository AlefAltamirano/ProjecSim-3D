/**
 * FormatUtils.js
 * Formatting helpers for telemetry / prediction display.
 */

/** Format a number with fixed decimal places and a unit. */
export function fmt(v, decimals = 2, unit = '') {
  if (!isFinite(v)) return '—' + (unit ? ' ' + unit : '');
  return v.toFixed(decimals) + (unit ? ' ' + unit : '');
}

/** Format seconds with 3 decimals. */
export function fmtTime(t) { return fmt(t, 3, 's'); }

/** Format metres with 2 decimals. */
export function fmtDist(d) { return fmt(d, 2, 'm'); }

/** Format velocity m/s with 2 decimals. */
export function fmtVel(v) { return fmt(v, 2, 'm/s'); }

/** Format energy with 2 decimals. */
export function fmtEnergy(e) {
  if (!isFinite(e)) return '— J';
  if (Math.abs(e) >= 1000) return (e / 1000).toFixed(2) + ' kJ';
  return e.toFixed(2) + ' J';
}

/** Percentage string. */
export function fmtPct(v) { return v.toFixed(1) + '%'; }
