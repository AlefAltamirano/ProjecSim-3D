/**
 * Config.js
 * Centralised configuration and constants for ProjecSim 3D.
 * Single source of truth for physics defaults, rendering params, and UI settings.
 */

export const Config = Object.freeze({

  /** ── Physics Defaults ── */
  PHYSICS: {
    ANGLE_DEG:    45,
    SPEED:        30,     // m/s
    HEIGHT:       0,      // m
    GRAVITY:      9.81,   // m/s²
    DRAG:         0,      // kg/s
    MASS:         1,      // kg (implicit, affects energy display)
    SIM_SPEED:    1,
    DT:           0.005,  // fixed physics timestep (s) — RK4
  },

  /** ── Scene Scale ── */
  SCALE: {
    METER_TO_UNIT: 0.5,   // 1 m = 0.5 Three.js units
  },

  /** ── Rendering ── */
  RENDER: {
    FOG_NEAR:     80,
    FOG_FAR:      600,
    SHADOW_MAP:   2048,
    MAX_TRAJ_PTS: 4000,   // max trajectory line vertices
  },

  /** ── Colours (mirror CSS vars for Three.js materials) ── */
  COLORS: {
    BG:           0x283593, // Color de fondo de la escena 3D
    GROUND:       0x0D1525,
    GRID_MAIN:    0x1E2D45,
    GRID_SEC:     0x111C30,
    PROJECTILE:   0xF59E0B,
    TRAJECTORY:   0xF59E0B, // Color de la línea de trayectoria
    IMPACT:       0xEF4444,
    APOGEE:       0x10B981,
    VEL_V:        0xffffff,
    VEL_VX:       0x3B82F6,
    VEL_VY:       0x10B981,
    TARGET:       0xEF4444,
    PROJ_X:       0x3B82F6,
    PROJ_Y:       0x10B981,
  },

  /** ── Camera ── */
  CAMERA: {
    FOV:    55,
    NEAR:   0.1,
    FAR:    2000,
    INIT_POS: { x: 25, y: 20, z: 45 },
    TARGET:   { x: 20, y: 0,  z: 0  },
  },

  /** ── Target ── */
  TARGET: {
    DEFAULT_X: 60,  // m
    DEFAULT_Z: 0,
    RADIUS_M:  3,
  },

  /** ── Telemetry bar max values (for % normalisation) ── */
  TELEM_MAX: {
    t:    30,    // s
    x:    200,   // m
    y:    100,   // m
    vx:   100,   // m/s
    vy:   100,   // m/s
    v:    150,   // m/s
    E:    10000, // J
  },
});
