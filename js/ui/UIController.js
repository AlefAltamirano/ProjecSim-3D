/**
 * UIController.js
 * Binds DOM elements to application state.
 * Handles: parameter sliders/inputs, viz toggles, buttons, telemetry display.
 * Communicates via EventBus only — no direct physics/scene calls.
 */
import { bus } from '../core/EventBus.js';
import { Config } from '../core/Config.js';
import { TrajectoryCalculator } from '../physics/TrajectoryCalculator.js';
import { clamp } from '../utils/MathUtils.js';
import { fmt, fmtTime, fmtDist, fmtVel, fmtEnergy } from '../utils/FormatUtils.js';

export class UIController {
  constructor() {
    /** Current parameter values. */
    this.params = {
      angleDeg:  Config.PHYSICS.ANGLE_DEG,
      speed:     Config.PHYSICS.SPEED,
      height:    Config.PHYSICS.HEIGHT,
      gravity:   Config.PHYSICS.GRAVITY,
      drag:      Config.PHYSICS.DRAG,
      simSpeed:  Config.PHYSICS.SIM_SPEED,
      mass:      Config.PHYSICS.MASS,
    };

    this._bindParams();
    this._bindVizToggles();
    this._bindButtons();
    this._bindEngineEvents();
    this._updatePredictions();
    this._hideScentHintAfterDelay();

    // FPS counter
    this._fpsEl = document.getElementById('fps-counter');
    this._fpsFrames = 0;
    this._fpsLast = performance.now();
  }

  // ── Parameter Binding ────────────────────────────────

  _bindParams() {
    const pairs = [
      ['sl-angle',    'in-angle',    'angleDeg',  v => v],
      ['sl-speed',    'in-speed',    'speed',     v => v],
      ['sl-height',   'in-height',   'height',    v => v],
      ['sl-gravity',  'in-gravity',  'gravity',   v => v],
      ['sl-drag',     'in-drag',     'drag',      v => v],
      ['sl-simspeed', 'in-simspeed', 'simSpeed',  v => v],
    ];

    pairs.forEach(([slId, inId, key, transform]) => {
      const slider = document.getElementById(slId);
      const input  = document.getElementById(inId);

      const apply = (raw) => {
        const v = transform(parseFloat(raw));
        if (!isFinite(v)) return;
        this.params[key] = v;
        slider.value = v;
        input.value  = v;
        bus.emit('params:changed', this.params);
        this._updatePredictions();
      };

      slider.addEventListener('input', e => apply(e.target.value));
      input.addEventListener('change', e => {
        const v = clamp(
          parseFloat(e.target.value),
          parseFloat(input.min),
          parseFloat(input.max)
        );
        apply(v);
      });
    });
  }

  // ── Viz Toggles ──────────────────────────────────────

  _bindVizToggles() {
    const toggles = [
      ['viz-grid',       'grid'],
      ['viz-trajectory', 'trajectory'],
      ['viz-velocity',   'velocity'],
      ['viz-vx',         'vx'],
      ['viz-vy',         'vy'],
      ['viz-projX',      'projX'],
      ['viz-projY',      'projY'],
      ['viz-apogee',     'apogee'],
      ['viz-impact',     'impact'],
      ['viz-energy',     'energy'],
    ];

    toggles.forEach(([id, key]) => {
      const el = document.getElementById(id);
      el.addEventListener('change', () => {
        bus.emit('viz:changed', { key, value: el.checked });
      });
    });
  }

  // ── Buttons ──────────────────────────────────────────

  _bindButtons() {
    document.getElementById('btn-fire').addEventListener('click', () => {
      bus.emit('action:fire', this.params);
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      bus.emit('action:reset');
    });
    document.getElementById('btn-target').addEventListener('click', () => {
      const x = parseFloat(prompt('Posición del objetivo X (metros):', Config.TARGET.DEFAULT_X));
      if (isFinite(x) && x > 0) bus.emit('target:move', x);
    });
  }

  // ── Engine State UI ──────────────────────────────────

  _bindEngineEvents() {
    bus.on('engine:state', state => {
      const chip    = document.getElementById('status-chip');
      const dot     = chip.querySelector('.status-dot');
      const btnFire = document.getElementById('btn-fire');

      chip.dataset.state = state.toLowerCase();
      dot.className = 'status-dot ' + state.toLowerCase();

      switch (state) {
        case 'FLYING':
          chip.lastChild.textContent = ' VOLANDO';
          btnFire.disabled = true;
          break;
        case 'LANDED':
          chip.lastChild.textContent = ' ATERRIZÓ';
          btnFire.disabled = false;
          break;
        default:
          chip.lastChild.textContent = ' INACTIVO';
          btnFire.disabled = false;
      }
    });
  }

  // ── Predictions ───────────────────────────────────────

  _updatePredictions() {
    const p = TrajectoryCalculator.predict(this.params);

    document.getElementById('pred-hmax').textContent  = fmtDist(p.hmax);
    document.getElementById('pred-tof').textContent   = fmtTime(p.tof);
    document.getElementById('pred-range').textContent = fmtDist(p.range);
    document.getElementById('pred-vimp').textContent  = fmtVel(p.vImpact);
    document.getElementById('pred-ek').textContent    = fmtEnergy(p.Ek0);
    document.getElementById('pred-ep').textContent    = fmtEnergy(p.Ep0);

    // Show predicted impact ring
    bus.emit('prediction:range', p.range);
  }

  // ── Telemetry Update ─────────────────────────────────

  /**
   * Update telemetry display with live state.
   * @param {object} s  physics state
   */
  updateTelemetry(s) {
    const M = Config.TELEM_MAX;
    const setBar = (id, val, max) => {
      const el = document.getElementById('bar-' + id);
      if (el) el.style.width = clamp((Math.abs(val) / max) * 100, 0, 100) + '%';
    };

    // Text values
    document.getElementById('tel-t').textContent    = fmtTime(s.t);
    document.getElementById('tel-x').textContent    = fmtDist(s.x);
    document.getElementById('tel-y').textContent    = fmtDist(s.y);
    document.getElementById('tel-vx').textContent   = fmtVel(s.vx);
    document.getElementById('tel-vy').textContent   = fmtVel(s.vy);
    document.getElementById('tel-v').textContent    = fmtVel(s.speed);
    document.getElementById('tel-ek').textContent   = fmtEnergy(s.Ek);
    document.getElementById('tel-ep').textContent   = fmtEnergy(s.Ep);
    document.getElementById('tel-em').textContent   = fmtEnergy(s.Em);
    document.getElementById('tel-ymax').textContent = fmtDist(s.ymax);

    // Header
    document.getElementById('header-time').textContent = 't = ' + fmtTime(s.t);
    document.getElementById('header-pos').textContent  = 'x = ' + fmtDist(s.x);

    // Bars
    setBar('t',    s.t,     M.t);
    setBar('x',    s.x,     M.x);
    setBar('y',    s.y,     M.y);
    setBar('vx',   s.vx,    M.vx);
    setBar('vy',   s.vy,    M.vy);
    setBar('v',    s.speed, M.v);
    setBar('ek',   s.Ek,    M.E);
    setBar('ep',   s.Ep,    M.E);
    setBar('em',   s.Em,    M.E);
    setBar('ymax', s.ymax,  M.y);

    // Energy overlay
    const emTotal = s.Em > 0 ? s.Em : 1;
    document.getElementById('ebar-ek').style.height = clamp((s.Ek / emTotal) * 100, 0, 100) + '%';
    document.getElementById('ebar-ep').style.height = clamp((s.Ep / emTotal) * 100, 0, 100) + '%';
    document.getElementById('ebar-em').style.height = clamp((s.Em / emTotal) * 100, 0, 100) + '%';
  }

  /** Reset telemetry display to zeros. */
  resetTelemetry() {
    const ids = ['tel-t','tel-x','tel-y','tel-vx','tel-vy','tel-v','tel-ek','tel-ep','tel-em','tel-ymax'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    ['bar-t','bar-x','bar-y','bar-vx','bar-vy','bar-v','bar-ek','bar-ep','bar-em','bar-ymax'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.width = '0%';
    });
    document.getElementById('header-time').textContent = 't = 0.000 s';
    document.getElementById('header-pos').textContent  = 'x = 0.00 m';
  }

  /** Update FPS counter (call once per render frame). */
  tickFPS() {
    this._fpsFrames++;
    const now = performance.now();
    const elapsed = now - this._fpsLast;
    if (elapsed >= 1000) {
      const fps = Math.round(this._fpsFrames * 1000 / elapsed);
      this._fpsEl.textContent = fps + ' FPS';
      this._fpsFrames = 0;
      this._fpsLast = now;
    }
  }

  _hideScentHintAfterDelay() {
    setTimeout(() => {
      const hint = document.getElementById('scene-hint');
      if (hint) hint.classList.add('hidden');
    }, 4000);
  }
}
