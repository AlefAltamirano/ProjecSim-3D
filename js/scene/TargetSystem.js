/**
 * TargetSystem.js
 * Manages all dynamic 3D visual elements:
 *   - Projectile sphere
 *   - Trajectory line (BufferGeometry, updated in-place)
 *   - Velocity vectors (ArrowHelpers)
 *   - Apogee marker
 *   - Impact marker
 *   - Target ring
 *   - Projection lines
 *
 * All positions use scene units (metres × SCALE).
 */
import * as THREE from 'three';
import { Config } from '../core/Config.js';

const C = Config.COLORS;

export class TargetSystem {
  /**
   * @param {THREE.Scene} scene
   * @param {number}      S      scale factor (metres→units)
   */
  constructor(scene, S) {
    this.scene = scene;
    this.S = S;

    /** Visibility flags — controlled by UIController. */
    this.vis = {
      grid:       true,
      trajectory: true,
      velocity:   true,
      vx:         false,
      vy:         false,
      projX:      false,
      projY:      false,
      apogee:     true,
      impact:     true,
      energy:     false,
    };

    this._trajPositions = new Float32Array(Config.RENDER.MAX_TRAJ_PTS * 3);
    this._trajCount = 0;

    this._buildProjectile();
    this._buildTrajectory();
    this._buildVectors();
    this._buildMarkers();
    this._buildTarget();
    this._buildProjections();
  }

  // ── Build ────────────────────────────────────────────

  _buildProjectile() {
    const geo = new THREE.SphereGeometry(0.4, 20, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: C.PROJECTILE,
      emissive: C.PROJECTILE,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.6,
    });
    this.projectile = new THREE.Mesh(geo, mat);
    this.projectile.castShadow = true;
    this.projectile.visible = false;
    this.scene.add(this.projectile);

    // Glow ring around projectile
    const ringGeo = new THREE.RingGeometry(0.5, 0.7, 20);
    const ringMat = new THREE.MeshBasicMaterial({
      color: C.PROJECTILE,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    this.projectileRing = new THREE.Mesh(ringGeo, ringMat);
    this.projectile.add(this.projectileRing);
    this.projectileRing.rotation.x = Math.PI / 2;
  }

  _buildTrajectory() {
    // Grupo que contendrá el tubo de la trayectoria
    this.trajectoryGroup = new THREE.Group();
    this.scene.add(this.trajectoryGroup);
    this.trajectoryTubeMesh = null;
  }

  _updateTrajectoryTube() {
    // Crear puntos Vector3 desde los datos de trayectoria
    const points = [];
    for (let i = 0; i < this._trajCount; i++) {
      const idx = i * 3;
      points.push(new THREE.Vector3(
        this._trajPositions[idx],
        this._trajPositions[idx + 1],
        this._trajPositions[idx + 2]
      ));
    }

    if (points.length < 2) return;

    // Crear curva catmull-rom
    const curve = new THREE.CatmullRomCurve3(points);

    // Crear tubo 3D
    const tubeGeo = new THREE.TubeGeometry(curve, Math.min(points.length * 2, 100), 0.1, 6, false);
    const tubeMat = new THREE.MeshPhongMaterial({
      color: C.TRAJECTORY,
      transparent: true,
      opacity: 0.8,
      emissive: C.TRAJECTORY,
      emissiveIntensity: 0.2,
    });

    // Limpiar tubo anterior
    if (this.trajectoryTubeMesh) {
      this.trajectoryTubeMesh.geometry.dispose();
      this.trajectoryTubeMesh.material.dispose();
      this.trajectoryGroup.remove(this.trajectoryTubeMesh);
    }

    this.trajectoryTubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    this.trajectoryGroup.add(this.trajectoryTubeMesh);
    this.trajectoryGroup.visible = this.vis.trajectory;
  }

  _buildVectors() {
    const origin = new THREE.Vector3();
    const dir    = new THREE.Vector3(1, 0, 0);

    // Total velocity
    this.arrowV = new THREE.ArrowHelper(dir, origin, 1, C.VEL_V, 0.5, 0.3);
    this.arrowV.visible = false;
    this.scene.add(this.arrowV);

    // Vx component
    this.arrowVx = new THREE.ArrowHelper(dir, origin, 1, C.VEL_VX, 0.4, 0.25);
    this.arrowVx.visible = false;
    this.scene.add(this.arrowVx);

    // Vy component
    this.arrowVy = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 1, C.VEL_VY, 0.4, 0.25);
    this.arrowVy.visible = false;
    this.scene.add(this.arrowVy);
  }

  _buildMarkers() {
    // Apogee marker (green sphere + spike)
    const apGeo = new THREE.SphereGeometry(0.3, 12, 10);
    const apMat = new THREE.MeshBasicMaterial({ color: C.APOGEE });
    this.apogeeMarker = new THREE.Mesh(apGeo, apMat);
    this.apogeeMarker.visible = false;
    this.scene.add(this.apogeeMarker);

    // Apogee dashed line to ground
    const linGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1, 0),
    ]);
    const linMat = new THREE.LineBasicMaterial({
      color: C.APOGEE, transparent: true, opacity: 0.4,
    });
    this.apogeeLine = new THREE.Line(linGeo, linMat);
    this.apogeeMarker.add(this.apogeeLine);

    // Impact marker (red circle on ground)
    const impGeo = new THREE.RingGeometry(0.3, 0.6, 24);
    const impMat = new THREE.MeshBasicMaterial({
      color: C.IMPACT, side: THREE.DoubleSide, transparent: true, opacity: 0.8,
    });
    this.impactMarker = new THREE.Mesh(impGeo, impMat);
    this.impactMarker.rotation.x = -Math.PI / 2;
    this.impactMarker.position.y = 0.02;
    this.impactMarker.visible = false;
    this.scene.add(this.impactMarker);

    // Predicted impact (ghost)
    const predGeo = new THREE.RingGeometry(0.4, 0.65, 24);
    const predMat = new THREE.MeshBasicMaterial({
      color: C.IMPACT, side: THREE.DoubleSide, transparent: true, opacity: 0.25,
    });
    this.predictedImpact = new THREE.Mesh(predGeo, predMat);
    this.predictedImpact.rotation.x = -Math.PI / 2;
    this.predictedImpact.position.y = 0.015;
    this.predictedImpact.visible = false;
    this.scene.add(this.predictedImpact);
  }

  _buildTarget() {
    const x = Config.TARGET.DEFAULT_X * this.S;
    const r = Config.TARGET.RADIUS_M * this.S;

    // Outer ring
    const ringGeo = new THREE.RingGeometry(r - 0.15, r, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: C.TARGET, side: THREE.DoubleSide, transparent: true, opacity: 0.7,
    });
    this.target = new THREE.Mesh(ringGeo, ringMat);
    this.target.rotation.x = -Math.PI / 2;
    this.target.position.set(x, 0.03, 0);
    this.scene.add(this.target);

    // Bullseye
    const bullGeo = new THREE.CircleGeometry(r * 0.25, 20);
    const bullMat = new THREE.MeshBasicMaterial({
      color: C.TARGET, side: THREE.DoubleSide, transparent: true, opacity: 0.4,
    });
    this.targetBull = new THREE.Mesh(bullGeo, bullMat);
    this.targetBull.rotation.x = -Math.PI / 2;
    this.targetBull.position.set(x, 0.035, 0);
    this.scene.add(this.targetBull);
  }

  _buildProjections() {
    const mat = new THREE.LineBasicMaterial({
      color: C.PROJ_X, transparent: true, opacity: 0.5,
    });
    const matY = new THREE.LineBasicMaterial({
      color: C.PROJ_Y, transparent: true, opacity: 0.5,
    });

    const pts2 = [new THREE.Vector3(), new THREE.Vector3()];

    this.projLineX = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), mat);
    this.projLineX.visible = false;
    this.scene.add(this.projLineX);

    this.projLineY = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), matY);
    this.projLineY.visible = false;
    this.scene.add(this.projLineY);
  }

  // ── Public API ────────────────────────────────────────

  /** Called once before simulation starts. */
  startSimulation() {
    this._trajCount = 0;
    this.trajectoryGroup.children.forEach(child => {
      child.geometry.dispose();
      child.material.dispose();
    });
    this.trajectoryGroup.clear();
    this.trajectoryTubeMesh = null;

    this.projectile.visible = true;
    this.apogeeMarker.visible = false;
    this.impactMarker.visible = false;
    this.predictedImpact.visible = false;
  }

  /**
   * Update all visuals to match current physics state.
   * @param {object} state  { x, y, vx, vy, speed, ymax }  (all in metres)
   */
  update(state) {
    const { x, y, vx, vy, speed, ymax } = state;
    const S = this.S;

    // Position
    this.projectile.position.set(x * S, y * S, 0);

    // Trajectory
    this._appendTrajPoint(x * S, y * S, 0);

    // Velocity vectors
    const VSCALE = 0.15 * S;

    if (this.vis.velocity) {
      const len = speed * VSCALE;
      if (len > 0.01) {
        const dir = new THREE.Vector3(vx, vy, 0).normalize();
        this.arrowV.position.copy(this.projectile.position);
        this.arrowV.setDirection(dir);
        this.arrowV.setLength(len, Math.min(0.5, len * 0.25), Math.min(0.3, len * 0.18));
      }
      this.arrowV.visible = true;
    } else {
      this.arrowV.visible = false;
    }

    if (this.vis.vx) {
      const lenX = Math.abs(vx) * VSCALE;
      if (lenX > 0.01) {
        this.arrowVx.position.copy(this.projectile.position);
        this.arrowVx.setDirection(new THREE.Vector3(Math.sign(vx) || 1, 0, 0));
        this.arrowVx.setLength(lenX, Math.min(0.4, lenX * 0.25), Math.min(0.25, lenX * 0.18));
      }
      this.arrowVx.visible = true;
    } else {
      this.arrowVx.visible = false;
    }

    if (this.vis.vy) {
      const lenY = Math.abs(vy) * VSCALE;
      if (lenY > 0.01) {
        this.arrowVy.position.copy(this.projectile.position);
        this.arrowVy.setDirection(new THREE.Vector3(0, Math.sign(vy) || 1, 0));
        this.arrowVy.setLength(lenY, Math.min(0.4, lenY * 0.25), Math.min(0.25, lenY * 0.18));
      }
      this.arrowVy.visible = true;
    } else {
      this.arrowVy.visible = false;
    }

    // Projections
    if (this.vis.projX) {
      const pts = [
        new THREE.Vector3(x * S, y * S, 0),
        new THREE.Vector3(x * S, 0, 0),
      ];
      this.projLineX.geometry.setFromPoints(pts);
      this.projLineX.visible = true;
    } else {
      this.projLineX.visible = false;
    }

    if (this.vis.projY) {
      const pts = [
        new THREE.Vector3(x * S, y * S, 0),
        new THREE.Vector3(0, y * S, 0),
      ];
      this.projLineY.geometry.setFromPoints(pts);
      this.projLineY.visible = true;
    } else {
      this.projLineY.visible = false;
    }

    // Apogee
    if (this.vis.apogee && ymax > 0.1) {
      this.apogeeMarker.position.set(x * S, ymax * S, 0);
      this.apogeeMarker.visible = true;
      const pts2 = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -ymax * S, 0)];
      this.apogeeLine.geometry.setFromPoints(pts2);
    }
  }

  /** Show impact marker. */
  showImpact(x) {
    if (!this.vis.impact) return;
    this.impactMarker.position.set(x * this.S, 0.02, 0);
    this.impactMarker.visible = true;
    this.projectile.visible = false;
  }

  /** Show predicted impact ring (ghost). */
  showPredictedImpact(rangeMetre) {
    if (!this.vis.impact) return;
    this.predictedImpact.position.set(rangeMetre * this.S, 0.015, 0);
    this.predictedImpact.visible = true;
  }

  /** Move the target to a new X position in metres. */
  setTargetX(xMetres) {
    const x = xMetres * this.S;
    this.target.position.set(x, 0.03, 0);
    this.targetBull.position.set(x, 0.035, 0);
  }

  /** Hide everything transient. */
  reset() {
    this.projectile.visible = false;
    this.apogeeMarker.visible = false;
    this.impactMarker.visible = false;
    this.predictedImpact.visible = false;
    this.arrowV.visible = false;
    this.arrowVx.visible = false;
    this.arrowVy.visible = false;
    this.projLineX.visible = false;
    this.projLineY.visible = false;
    this._trajCount = 0;
    this.trajectoryGroup.children.forEach(child => {
      child.geometry.dispose();
      child.material.dispose();
    });
    this.trajectoryGroup.clear();
    this.trajectoryTubeMesh = null;
  }

  /** Set a visibility flag and apply immediately. */
  setVis(key, value) {
    this.vis[key] = value;
    if (key === 'trajectory') this.trajectoryGroup.visible = value;
    // others are handled per-frame in update()
  }

  // ── Private ───────────────────────────────────────────

  _appendTrajPoint(x, y, z) {
    const maxPts = Config.RENDER.MAX_TRAJ_PTS;
    if (this._trajCount >= maxPts) return;

    const i = this._trajCount * 3;
    this._trajPositions[i]     = x;
    this._trajPositions[i + 1] = y;
    this._trajPositions[i + 2] = z;
    this._trajCount++;

    // Reconstruir tubo cada algunos puntos para mejor rendimiento
    if (this._trajCount % 5 === 0) {
      this._updateTrajectoryTube();
    }
  }
}
