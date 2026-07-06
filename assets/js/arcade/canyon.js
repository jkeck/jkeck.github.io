/**
 * Canyon Run — Three.js endless canyon flyer for the arcade.
 *
 * Loaded on demand (dynamic import) so the arcade lobby ships zero 3D bytes.
 * `three` is a bare specifier resolved by the import map in arcade.html,
 * pinned to an exact version on jsdelivr.
 *
 * All game rules live in canyon-core.js (unit tested); this module is the
 * renderer/input/lifecycle shell around them.
 */
import * as THREE from 'three';
import {
  BOUNDS_HALF_W,
  SHIP_HALF_W,
  makeRng,
  speedAt,
  rowSpacingAt,
  generateRow,
  collides,
} from './canyon-core.js';

const COLORS = {
  bg: 0x080604,
  amber: 0xd4a574,
  amberDeep: 0xc4904a,
  bone: 0xe8e1d4,
  rock: 0x14100c,
  rockLit: 0x1e1813,
};

const SPAWN_DEPTH = 420;      // how far ahead rows materialize
const DESPAWN_Z = 40;         // recycle once safely behind the camera
const GRACE_DISTANCE = 90;    // obstacle-free runway at the start
const SHIP_HALF_L = 2.4;
const OBSTACLE_HALF_L = 1.6;
const WALL_SEGMENTS = 36;     // per side
const WALL_SEG_DEPTH = 16;
const DUST_COUNT = 260;
const CRASH_PARTICLES = 140;

/**
 * @param {{ canvas: HTMLCanvasElement, container: HTMLElement,
 *           onHud: (hud: {score: number, speed: number}) => void,
 *           onGameOver: (score: number) => void }} opts
 */
export function createCanyonGame(opts) {
  const { canvas, container, onHud, onGameOver } = opts;

  /* ── Renderer / scene / camera ─────────────── */

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(COLORS.bg);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLORS.bg, 70, SPAWN_DEPTH * 0.92);

  const camera = new THREE.PerspectiveCamera(68, 1, 0.1, SPAWN_DEPTH + 100);

  scene.add(new THREE.AmbientLight(0x554433, 0.9));
  const keyLight = new THREE.DirectionalLight(0xd4a574, 1.1);
  keyLight.position.set(-6, 18, 10);
  scene.add(keyLight);
  const shipGlow = new THREE.PointLight(COLORS.amber, 26, 30, 2);
  scene.add(shipGlow);

  /* ── Floor grid ────────────────────────────── */

  const GRID_CELL = 8;
  const grid = new THREE.GridHelper(
    SPAWN_DEPTH * 2, (SPAWN_DEPTH * 2) / GRID_CELL, COLORS.amberDeep, 0x241c12
  );
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  grid.position.y = 0;
  scene.add(grid);

  /* ── Canyon walls (instanced jagged blocks) ── */

  const wallGeo = new THREE.BoxGeometry(1, 1, 1);
  const wallMat = new THREE.MeshStandardMaterial({
    color: COLORS.rockLit, roughness: 0.95, metalness: 0,
    emissive: COLORS.amberDeep, emissiveIntensity: 0.045, flatShading: true,
  });
  const walls = new THREE.InstancedMesh(wallGeo, wallMat, WALL_SEGMENTS * 2);
  scene.add(walls);
  /** @type {Array<{z: number, h: number, w: number, x: number}>} */
  const wallSegs = [];
  const wallSpan = WALL_SEGMENTS * WALL_SEG_DEPTH;

  function rollWallSeg(side, z) {
    const h = 7 + Math.random() * 11;
    const w = 4 + Math.random() * 3;
    return { z, h, w, x: side * (BOUNDS_HALF_W + 1.6 + w / 2) };
  }

  for (let i = 0; i < WALL_SEGMENTS; i++) {
    const z = DESPAWN_Z - i * WALL_SEG_DEPTH;
    wallSegs.push(rollWallSeg(-1, z), rollWallSeg(1, z));
  }

  const m4 = new THREE.Matrix4();
  function writeWallMatrices() {
    for (let i = 0; i < wallSegs.length; i++) {
      const s = wallSegs[i];
      m4.makeScale(s.w, s.h, WALL_SEG_DEPTH * 1.04);
      m4.setPosition(s.x, s.h / 2, s.z);
      walls.setMatrixAt(i, m4);
    }
    walls.instanceMatrix.needsUpdate = true;
  }

  /* ── Ship ──────────────────────────────────── */

  const ship = buildShip();
  scene.add(ship.group);

  function buildShip() {
    // Low-poly dart: nose, two wingtips, dorsal ridge, keel.
    const v = {
      nose: [0, 0.25, -3.1],
      wingL: [-1.55, 0, 1.7],
      wingR: [1.55, 0, 1.7],
      top: [0, 1.0, 1.3],
      keel: [0, -0.4, 1.4],
    };
    const faces = [
      v.nose, v.wingL, v.top,
      v.nose, v.top, v.wingR,
      v.nose, v.keel, v.wingL,
      v.nose, v.wingR, v.keel,
      v.top, v.wingL, v.wingR,
      v.keel, v.wingR, v.wingL,
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(faces.flat(), 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a2018, roughness: 0.55, metalness: 0.25,
      emissive: COLORS.amber, emissiveIntensity: 0.16, flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 12),
      new THREE.LineBasicMaterial({ color: COLORS.amber, transparent: true, opacity: 0.85 })
    );
    mesh.add(edges);

    // Engine glow — additive sprite at the tail.
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(), color: COLORS.amber,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    glow.position.set(0, 0.15, 1.9);
    glow.scale.set(2.2, 2.2, 1);
    mesh.add(glow);

    const group = new THREE.Group();
    group.add(mesh);
    group.position.set(0, 1.6, 0);
    return { group, mesh, glow };
  }

  function makeGlowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,235,200,1)');
    grad.addColorStop(0.35, 'rgba(212,165,116,0.55)');
    grad.addColorStop(1, 'rgba(212,165,116,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  /* ── Obstacle pool ─────────────────────────── */

  const obstacleGeo = new THREE.BoxGeometry(1, 1, 1);
  const obstacleMat = new THREE.MeshStandardMaterial({
    color: COLORS.rock, roughness: 0.9, metalness: 0,
    emissive: COLORS.amber, emissiveIntensity: 0.05, flatShading: true,
  });
  const obstacleEdgeMat = new THREE.LineBasicMaterial({
    color: COLORS.amber, transparent: true, opacity: 0.55,
  });
  const obstacleEdges = new THREE.EdgesGeometry(obstacleGeo);

  /** @type {Array<{group: THREE.Group, x: number, z: number, halfW: number, active: boolean}>} */
  const obstaclePool = [];

  function acquireObstacle(x, z, halfW, height) {
    let o = obstaclePool.find((p) => !p.active);
    if (!o) {
      const mesh = new THREE.Mesh(obstacleGeo, obstacleMat);
      mesh.add(new THREE.LineSegments(obstacleEdges, obstacleEdgeMat));
      const group = new THREE.Group();
      group.add(mesh);
      scene.add(group);
      o = { group, x: 0, z: 0, halfW: 0, active: false };
      obstaclePool.push(o);
    }
    o.x = x; o.z = z; o.halfW = halfW; o.active = true;
    o.group.visible = true;
    o.group.scale.set(halfW * 2, height, OBSTACLE_HALF_L * 2);
    o.group.position.set(x, height / 2, z);
    return o;
  }

  /* ── Speed dust (sense of velocity) ────────── */

  const dustPositions = new Float32Array(DUST_COUNT * 3);
  for (let i = 0; i < DUST_COUNT; i++) resetDust(i, true);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: COLORS.bone, size: 0.28, transparent: true, opacity: 0.5,
    depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(dust);

  function resetDust(i, anywhere) {
    dustPositions[i * 3] = (Math.random() * 2 - 1) * (BOUNDS_HALF_W + 4);
    dustPositions[i * 3 + 1] = Math.random() * 12;
    dustPositions[i * 3 + 2] = anywhere
      ? -Math.random() * SPAWN_DEPTH
      : -SPAWN_DEPTH * (0.6 + Math.random() * 0.4);
  }

  /* ── Crash particles ───────────────────────── */

  const crashPositions = new Float32Array(CRASH_PARTICLES * 3);
  const crashVel = new Float32Array(CRASH_PARTICLES * 3);
  const crashGeo = new THREE.BufferGeometry();
  crashGeo.setAttribute('position', new THREE.BufferAttribute(crashPositions, 3));
  const crash = new THREE.Points(crashGeo, new THREE.PointsMaterial({
    color: COLORS.amber, size: 0.5, transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  crash.visible = false;
  scene.add(crash);

  /* ── Game state ────────────────────────────── */

  let state = 'waiting'; // waiting | playing | crashing | done
  let rng = makeRng(Date.now() & 0xffffffff);
  let distance = 0;
  let nextRowAt = GRACE_DISTANCE;
  let shipX = 0;
  let steer = 0;               // -1..1 keyboard steer
  let pointerX = null;         // canyon-space target from mouse/touch
  let keyL = false, keyR = false;
  let crashTimer = 0;
  let shake = 0;
  let rafId = null;
  let lastT = 0;
  let hudScore = -1;
  let destroyed = false;

  const shipBox = { x: 0, z: 0, halfW: SHIP_HALF_W, halfL: SHIP_HALF_L };

  /* ── Input ─────────────────────────────────── */

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') { keyL = true; pointerX = null; e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'd') { keyR = true; pointerX = null; e.preventDefault(); }
    if ((e.key === ' ' || e.key === 'Enter') && state === 'waiting') { e.preventDefault(); launch(); }
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keyL = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keyR = false;
  }
  function clientToCanyonX(clientX) {
    const r = canvas.getBoundingClientRect();
    const t = (clientX - r.left) / r.width;   // 0..1
    return (t * 2 - 1) * BOUNDS_HALF_W;
  }
  function onMouseMove(e) { pointerX = clientToCanyonX(e.clientX); }
  function onClick() { if (state === 'waiting') launch(); }
  function onTouchStart(e) {
    e.preventDefault();
    pointerX = clientToCanyonX(e.touches[0].clientX);
    if (state === 'waiting') launch();
  }
  function onTouchMove(e) {
    e.preventDefault();
    pointerX = clientToCanyonX(e.touches[0].clientX);
  }
  function onVisibility() { if (document.hidden) lastT = 0; }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('visibilitychange', onVisibility);

  /* ── Resize ────────────────────────────────── */

  function fit() {
    const r = container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(r.width));
    const h = Math.max(1, Math.floor(r.height));
    renderer.setSize(w, h, true);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', fit);
  fit();

  /* ── Simulation ────────────────────────────── */

  function launch() {
    state = 'playing';
    container.classList.add('canyon-running');
  }

  function spawnDueRows() {
    while (nextRowAt - distance < SPAWN_DEPTH) {
      const row = generateRow(rng, nextRowAt);
      const z = -(nextRowAt - distance);
      for (const ob of row.obstacles) {
        acquireObstacle(ob.x, z, ob.halfW, ob.height);
      }
      nextRowAt += rowSpacingAt(nextRowAt);
    }
  }

  function startCrash() {
    state = 'crashing';
    crashTimer = 1.1;
    shake = 1;
    crash.visible = true;
    for (let i = 0; i < CRASH_PARTICLES; i++) {
      crashPositions[i * 3] = ship.group.position.x;
      crashPositions[i * 3 + 1] = ship.group.position.y;
      crashPositions[i * 3 + 2] = 0;
      const a = Math.random() * Math.PI * 2;
      const b = Math.random() * Math.PI - Math.PI / 2;
      const s = 6 + Math.random() * 22;
      crashVel[i * 3] = Math.cos(a) * Math.cos(b) * s;
      crashVel[i * 3 + 1] = Math.abs(Math.sin(b)) * s * 0.9;
      crashVel[i * 3 + 2] = Math.sin(a) * Math.cos(b) * s;
    }
    ship.group.visible = false;
    shipGlow.intensity = 60;
  }

  function step(dt) {
    const speed = state === 'playing' ? speedAt(distance) : 0;

    // Steering
    if (state === 'playing' || state === 'waiting') {
      let target;
      if (pointerX !== null) {
        target = pointerX;
      } else {
        steer = (keyR ? 1 : 0) - (keyL ? 1 : 0);
        target = shipX + steer * 34 * dt;
      }
      const maxX = BOUNDS_HALF_W - SHIP_HALF_W - 0.2;
      target = Math.max(-maxX, Math.min(maxX, target));
      const prevX = shipX;
      shipX += (target - shipX) * Math.min(1, dt * 9);
      const vx = (shipX - prevX) / Math.max(dt, 1e-4);
      ship.group.position.x = shipX;
      const bank = THREE.MathUtils.clamp(-vx * 0.028, -0.6, 0.6);
      ship.group.rotation.z = THREE.MathUtils.lerp(ship.group.rotation.z, bank, 0.25);
      ship.group.position.y = 1.6 + Math.sin(performance.now() / 620) * 0.14;
    }

    if (state === 'playing') {
      distance += speed * dt;
      spawnDueRows();

      // Move world toward the camera
      for (const o of obstaclePool) {
        if (!o.active) continue;
        o.z += speed * dt;
        o.group.position.z = o.z;
        if (o.z > DESPAWN_Z) { o.active = false; o.group.visible = false; }
      }
      for (const s of wallSegs) {
        s.z += speed * dt;
        if (s.z > DESPAWN_Z) {
          const side = s.x > 0 ? 1 : -1;
          Object.assign(s, rollWallSeg(side, s.z - wallSpan));
        }
      }
      writeWallMatrices();
      grid.position.z = (grid.position.z + speed * dt) % GRID_CELL;

      // Dust streams past
      for (let i = 0; i < DUST_COUNT; i++) {
        dustPositions[i * 3 + 2] += speed * dt * 1.15;
        if (dustPositions[i * 3 + 2] > 10) resetDust(i, false);
      }
      dustGeo.attributes.position.needsUpdate = true;

      // Collision
      shipBox.x = shipX;
      for (const o of obstaclePool) {
        if (!o.active || Math.abs(o.z) > SHIP_HALF_L + OBSTACLE_HALF_L + 1) continue;
        if (collides(shipBox, { x: o.x, z: o.z, halfW: o.halfW, halfL: OBSTACLE_HALF_L })) {
          startCrash();
          break;
        }
      }

      // Sell the speed: FOV creeps up as you accelerate
      camera.fov = 68 + (speed - 42) * 0.11;
      camera.updateProjectionMatrix();

      const score = Math.floor(distance);
      if (score !== hudScore) {
        hudScore = score;
        onHud({ score, speed: Math.round(speed * 2.4) });
      }
    }

    if (state === 'crashing') {
      for (let i = 0; i < CRASH_PARTICLES; i++) {
        crashPositions[i * 3] += crashVel[i * 3] * dt;
        crashPositions[i * 3 + 1] += crashVel[i * 3 + 1] * dt;
        crashPositions[i * 3 + 2] += crashVel[i * 3 + 2] * dt;
        crashVel[i * 3 + 1] -= 26 * dt;
      }
      crashGeo.attributes.position.needsUpdate = true;
      crash.material.opacity = Math.max(0, crashTimer / 1.1);
      shipGlow.intensity = Math.max(0, shipGlow.intensity - 90 * dt);
      crashTimer -= dt;
      if (crashTimer <= 0) {
        state = 'done';
        onGameOver(Math.floor(distance));
        return;
      }
    }

    // Camera follows with a slight lag; shake decays after a crash
    shake = Math.max(0, shake - dt * 1.6);
    const jx = (Math.random() - 0.5) * shake * 1.4;
    const jy = (Math.random() - 0.5) * shake * 1.4;
    camera.position.set(shipX * 0.55 + jx, 6.6 + jy, 15);
    camera.lookAt(shipX * 0.85, 2.2, -40);

    shipGlow.position.set(shipX, 2.2, 2.5);
    renderer.render(scene, camera);
  }

  function loop(t) {
    if (destroyed || state === 'done') return;
    rafId = requestAnimationFrame(loop);
    if (!lastT) { lastT = t; return; }
    const dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;
    step(dt);
  }

  /* ── Public API ────────────────────────────── */

  return {
    start() {
      state = 'waiting';
      hudScore = -1;
      onHud({ score: 0, speed: 0 });
      fit();
      rafId = requestAnimationFrame(loop);
    },
    destroy() {
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', fit);
      container.classList.remove('canyon-running');
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      });
      renderer.dispose();
    },
  };
}
