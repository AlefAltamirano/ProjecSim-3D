/**
 * Scene3D.js
 * Manages the Three.js scene: renderer, camera, lights, ground, grid.
 * Does NOT handle projectile or trajectory — that's TargetSystem / VisualElements.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Config } from '../core/Config.js';

export class Scene3D {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.S = Config.SCALE.METER_TO_UNIT;

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this._initGround();
    this._initGrid();
    this._initControls();
    this._initResizeObserver();
  }

  // ── Init ────────────────────────────────────────────

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(Config.COLORS.BG, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(Config.COLORS.BG, Config.RENDER.FOG_NEAR, Config.RENDER.FOG_FAR);
  }

  _initCamera() {
    const c = this.canvas;
    this.camera = new THREE.PerspectiveCamera(
      Config.CAMERA.FOV,
      c.clientWidth / c.clientHeight,
      Config.CAMERA.NEAR,
      Config.CAMERA.FAR
    );
    const p = Config.CAMERA.INIT_POS;
    this.camera.position.set(p.x, p.y, p.z);
  }

  _initLights() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x334466, 2.0);
    this.scene.add(ambient);

    // Directional (sun)
    this.sunLight = new THREE.DirectionalLight(0xfff5e0, 3.5);
    this.sunLight.position.set(60, 80, 40);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(Config.RENDER.SHADOW_MAP, Config.RENDER.SHADOW_MAP);
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -150;
    this.sunLight.shadow.camera.right = 150;
    this.sunLight.shadow.camera.top = 150;
    this.sunLight.shadow.camera.bottom = -150;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);

    // Accent fill — subtle amber to match UI
    const fill = new THREE.DirectionalLight(0xF59E0B, 0.4);
    fill.position.set(-30, 10, -20);
    this.scene.add(fill);

    // Hemisphere sky/ground
    const hemi = new THREE.HemisphereLight(0x1a2a44, 0x060C18, 0.8);
    this.scene.add(hemi);
  }

  _initGround() {
    const geo = new THREE.PlaneGeometry(600, 600);
    const mat = new THREE.MeshLambertMaterial({
      color: 0x1A237E,
      side: THREE.FrontSide,
    });
    this.ground = new THREE.Mesh(geo, mat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  _initGrid() {
    // Main grid (science grid — dark teal lines)
    this.gridMain = new THREE.GridHelper(300, 60, Config.COLORS.GRID_MAIN, Config.COLORS.GRID_MAIN);
    this.gridMain.position.y = 0.01;
    this.gridMain.material.opacity = 0.6;
    this.gridMain.material.transparent = true;
    this.scene.add(this.gridMain);

    // Sub-grid (finer)
    this.gridSub = new THREE.GridHelper(300, 300, Config.COLORS.GRID_SEC, Config.COLORS.GRID_SEC);
    this.gridSub.position.y = 0.005;
    this.gridSub.material.opacity = 0.25;
    this.gridSub.material.transparent = true;
    this.scene.add(this.gridSub);
  }

  _initControls() {
    const t = Config.CAMERA.TARGET;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(t.x * this.S, t.y, t.z);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 500;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.update();
  }

  _initResizeObserver() {
    this._ro = new ResizeObserver(() => this._onResize());
    this._ro.observe(this.canvas.parentElement);
    this._onResize();
  }

  _onResize() {
    const container = this.canvas.parentElement;
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ── Public API ──────────────────────────────────────

  /** Set grid visibility. */
  setGridVisible(v) {
    this.gridMain.visible = v;
    this.gridSub.visible  = v;
  }

  /** Render one frame. */
  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /** Convert metres to scene units. */
  toUnits(m) { return m * this.S; }

  /** Dispose resources. */
  dispose() {
    this._ro.disconnect();
    this.renderer.dispose();
  }
}
