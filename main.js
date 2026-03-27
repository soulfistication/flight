import * as THREE from "three";

const canvas = document.getElementById("c");

const PALETTE = {
  skyTop: 0x1a3a6e,
  skyBot: 0x6ba3c4,
  ground: 0x4a6b3a,
  groundDry: 0x6b5a3a,
  asphalt: 0x2a2a2a,
  building: 0x8a7a6a,
  buildingAlt: 0x6a5a4a,
  wing: 0xf5f0e0,
  fuselage: 0xe8e0d0,
  accent: 0xc41e3a,
  mountain: 0x5a5a55,
  mountainSnow: 0xd8e8f0,
  tree: 0x2d4a2d,
  torreGreen: 0x4a6058,
  torreSteel: 0x5c6d66,
  runway: 0x252520,
  runwayMark: 0xe8e8e0,
};

/** World runway: group origin at surface; top of asphalt ≈ surfaceY + 0.4 */
const RUNWAY = {
  cx: 450,
  cz: -280,
  length: 720,
  width: 52,
  heading: 0.12,
  surfaceY: 11,
};

function isOnRunway(px, pz) {
  const dx = px - RUNWAY.cx;
  const dz = pz - RUNWAY.cz;
  const c = Math.cos(-RUNWAY.heading);
  const s = Math.sin(-RUNWAY.heading);
  const along = dx * c - dz * s;
  const across = dx * s + dz * c;
  return (
    Math.abs(along) < RUNWAY.length / 2 && Math.abs(across) < RUNWAY.width / 2
  );
}

function runwayDistanceAlong(px, pz) {
  const dx = px - RUNWAY.cx;
  const dz = pz - RUNWAY.cz;
  const c = Math.cos(-RUNWAY.heading);
  const s = Math.sin(-RUNWAY.heading);
  return dx * c - dz * s;
}

function addTorreLatino(scene) {
  const tx = 42;
  const tz = 54;
  const steel = new THREE.MeshLambertMaterial({
    color: PALETTE.torreSteel,
    flatShading: true,
  });
  const green = new THREE.MeshLambertMaterial({
    color: PALETTE.torreGreen,
    flatShading: true,
  });
  const dark = new THREE.MeshLambertMaterial({
    color: 0x3d4844,
    flatShading: true,
  });

  const g = new THREE.Group();
  g.position.set(tx, 1.2, tz);

  function tier(w, h, y0, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
    m.position.set(0, y0 + h / 2, 0);
    g.add(m);
  }

  tier(26, 14, 0, dark);
  tier(22, 18, 14, steel);
  tier(18, 22, 32, steel);
  tier(15, 26, 54, steel);
  tier(12, 28, 80, green);
  tier(9, 22, 108, green);
  tier(5.5, 16, 130, green);
  const spire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.8, 24, 6),
    green
  );
  spire.position.set(0, 146 + 12, 0);
  g.add(spire);
  const needle = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 8, 4),
    new THREE.MeshLambertMaterial({ color: 0x2a3530, flatShading: true })
  );
  needle.position.set(0, 146 + 24 + 4, 0);
  g.add(needle);

  scene.add(g);
}

function addRunway(scene) {
  const rwMat = new THREE.MeshLambertMaterial({
    color: PALETTE.runway,
    flatShading: true,
  });
  const white = new THREE.MeshLambertMaterial({
    color: PALETTE.runwayMark,
    flatShading: true,
  });
  const yellow = new THREE.MeshLambertMaterial({
    color: 0xc4a020,
    flatShading: true,
  });

  const rg = new THREE.Group();
  rg.position.set(RUNWAY.cx, RUNWAY.surfaceY - 0.2, RUNWAY.cz);
  rg.rotation.y = RUNWAY.heading;

  const L = RUNWAY.length;
  const W = RUNWAY.width;

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(L, 0.45, W),
    rwMat
  );
  pad.position.y = 0.225;
  rg.add(pad);

  const shoulderL = new THREE.Mesh(
    new THREE.BoxGeometry(L, 0.22, 3.2),
    new THREE.MeshLambertMaterial({ color: 0x1a1a18, flatShading: true })
  );
  shoulderL.position.set(0, 0.35, -(W / 2 - 2));
  rg.add(shoulderL);
  const shoulderR = shoulderL.clone();
  shoulderR.position.z = W / 2 - 2;
  rg.add(shoulderR);

  for (let x = -L / 2 + 55; x < L / 2 - 55; x += 48) {
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.1, 2.4),
      white
    );
    dash.position.set(x, 0.48, 0);
    rg.add(dash);
  }

  const threshL = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.1, W * 0.88),
    white
  );
  threshL.position.set(-L / 2 + 14, 0.48, 0);
  rg.add(threshL);
  const threshR = threshL.clone();
  threshR.position.set(L / 2 - 14, 0.48, 0);
  rg.add(threshR);

  const centerEnd = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 3), yellow);
  centerEnd.position.set(-L / 2 + 38, 0.48, 0);
  rg.add(centerEnd);
  const centerEnd2 = centerEnd.clone();
  centerEnd2.position.set(L / 2 - 38, 0.48, 0);
  rg.add(centerEnd2);

  const mkRwyLight = (lz) => {
    const pl = new THREE.PointLight(0xfff4dd, 0.35, 120);
    pl.position.set(-L / 2 + 30, 2, lz);
    return pl;
  };
  rg.add(mkRwyLight(-W / 2 + 4));
  rg.add(mkRwyLight(W / 2 - 4));

  scene.add(rg);
}

function setSceneWireframe(enabled) {
  scene.traverse((obj) => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material)
      ? obj.material
      : [obj.material];
    for (const m of mats) {
      if (m && "wireframe" in m) m.wireframe = enabled;
    }
  });
}

function makeCessnaLike() {
  const group = new THREE.Group();
  const flat = (color) =>
    new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
    });

  const fuselage = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.55, 2.4),
    flat(PALETTE.fuselage)
  );
  fuselage.position.set(0, 0, 0);
  group.add(fuselage);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.9, 6),
    flat(PALETTE.fuselage)
  );
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.05, 1.45);
  group.add(nose);

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.08, 0.85),
    flat(PALETTE.wing)
  );
  wing.position.set(0, 0.35, 0.15);
  group.add(wing);

  const strutL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.55, 4),
    flat(0x333333)
  );
  strutL.position.set(-1.1, 0.1, 0.1);
  strutL.rotation.z = 0.35;
  group.add(strutL);
  const strutR = strutL.clone();
  strutR.position.x = 1.1;
  strutR.rotation.z = -0.35;
  group.add(strutR);

  const tailBoom = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.4, 1.2),
    flat(PALETTE.fuselage)
  );
  tailBoom.position.set(0, 0.15, -1.35);
  group.add(tailBoom);

  const vertTail = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.95, 0.55),
    flat(PALETTE.accent)
  );
  vertTail.position.set(0, 0.55, -1.85);
  group.add(vertTail);

  const horizTail = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.06, 0.45),
    flat(PALETTE.wing)
  );
  horizTail.position.set(0, 0.12, -1.95);
  group.add(horizTail);

  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.08, 6),
    flat(0x222222)
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, -0.42, 0.4);
  group.add(wheel);

  const prop = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 1.35, 0.12),
    flat(0x3a3a30)
  );
  prop.position.set(0, 0.05, 1.95);
  prop.name = "prop";
  group.add(prop);

  group.rotation.order = "YXZ";
  return group;
}

function addCity(scene) {
  const matBuilding = new THREE.MeshLambertMaterial({
    color: PALETTE.building,
    flatShading: true,
  });
  const matBuilding2 = new THREE.MeshLambertMaterial({
    color: PALETTE.buildingAlt,
    flatShading: true,
  });
  const matRoad = new THREE.MeshLambertMaterial({
    color: PALETTE.asphalt,
    flatShading: true,
  });

  function box(w, h, d, x, z, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, h / 2, z);
    scene.add(m);
    return m;
  }

  // Zócalo / centro — dense blocks (keep clear around Torre Latinoamericana)
  const torreEx2 = 38 * 38;
  for (let i = 0; i < 80; i++) {
    const w = 8 + Math.random() * 25;
    const d = 8 + Math.random() * 25;
    const h = 15 + Math.random() * 120;
    const x = (Math.random() - 0.5) * 400;
    const z = (Math.random() - 0.5) * 400;
    if (x * x + z * z > 160 * 160) continue;
    const ox = x - 42;
    const oz = z - 54;
    if (ox * ox + oz * oz < torreEx2) continue;
    box(w, h, d, x, z, Math.random() > 0.5 ? matBuilding : matBuilding2);
  }

  // Paseo de la Reforma-ish strip (NW–SE diagonal in XZ)
  for (let t = -600; t < 600; t += 35) {
    const x = t * 0.85 + 80;
    const z = t * 0.35 - 40;
    const h = 25 + Math.abs(t % 100);
    box(12 + (t % 40), h, 14, x, z, matBuilding);
  }

  // Chapultepec — large low green blocks (trees/park mass)
  const parkMat = new THREE.MeshLambertMaterial({
    color: PALETTE.tree,
    flatShading: true,
  });
  for (let i = 0; i < 120; i++) {
    const px = -280 + Math.random() * 320;
    const pz = -120 + Math.random() * 280;
    const s = 6 + Math.random() * 18;
    box(s, 4 + Math.random() * 12, s, px, pz, parkMat);
  }

  // Peripheral ring — shorter sprawl
  for (let i = 0; i < 100; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = 350 + Math.random() * 500;
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad;
    box(10 + Math.random() * 20, 8 + Math.random() * 35, 10 + Math.random() * 20, x, z, matBuilding2);
  }

  // Ground plane roads (cross)
  const roadW = 4000;
  const roadT = 18;
  box(roadW, 0.4, roadT, 0, 0, matRoad);
  box(roadT, 0.4, roadW, 0, 0, matRoad);
}

function addTerrain(scene) {
  const seg = 80;
  const size = 5000;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  const pos = geo.attributes.position;
  const cx = size / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const d = Math.sqrt(x * x + y * y) / (size * 0.35);
    let h = Math.pow(Math.min(d, 1.2), 2) * 420;
    h += Math.sin(x * 0.008) * Math.cos(y * 0.008) * 25;
    if (d < 0.45) h *= 0.15;
    pos.setZ(i, h);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({
    color: PALETTE.ground,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -2;
  scene.add(mesh);

  const dry = new THREE.MeshLambertMaterial({
    color: PALETTE.groundDry,
    flatShading: true,
  });
  const ringGeo = new THREE.RingGeometry(size * 0.42, size * 0.55, 32);
  const ring = new THREE.Mesh(ringGeo, dry);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -1.5;
  scene.add(ring);
}

function addMountains(scene) {
  const mat = new THREE.MeshLambertMaterial({
    color: PALETTE.mountain,
    flatShading: true,
  });
  const snow = new THREE.MeshLambertMaterial({
    color: PALETTE.mountainSnow,
    flatShading: true,
  });

  const peaks = [
    { x: 2200, z: 800, r: 380, h: 520 },
    { x: -1900, z: 1200, r: 420, h: 580 },
    { x: 800, z: -2100, r: 350, h: 480 },
    { x: -1400, z: -1600, r: 400, h: 500 },
    { x: 2600, z: -600, r: 300, h: 440 },
  ];

  for (const p of peaks) {
    const geo = new THREE.ConeGeometry(p.r, p.h, 7);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(p.x, p.h / 2 - 2, p.z);
    scene.add(m);
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(p.r * 0.35, p.h * 0.22, 7),
      snow
    );
    cap.position.set(p.x, p.h * 0.88, p.z);
    scene.add(cap);
  }
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.skyBot);
scene.fog = new THREE.Fog(PALETTE.skyBot, 400, 3200);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(PALETTE.skyBot);

const hemi = new THREE.HemisphereLight(0xb0c4de, 0x3a4a2a, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff5e0, 0.85);
sun.position.set(400, 900, 200);
scene.add(sun);

addTerrain(scene);
addMountains(scene);
addCity(scene);
addTorreLatino(scene);
addRunway(scene);

const plane = makeCessnaLike();
plane.position.set(0, 180, 0);
plane.rotation.y = 0;
plane.rotation.x = 0.05;
plane.rotation.z = 0;
scene.add(plane);

const chaseCam = new THREE.PerspectiveCamera(55, 1, 0.5, 15000);
const cockpitDummy = new THREE.Object3D();
cockpitDummy.position.set(0, 0.25, 0.35);
plane.add(cockpitDummy);

let cameraMode = "chase";
let wireframeMode = false;
let landed = false;

const keys = new Set();
window.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === "KeyC") {
    cameraMode = cameraMode === "chase" ? "cockpit" : "chase";
  }
  if (e.code === "KeyF") {
    wireframeMode = !wireframeMode;
    setSceneWireframe(wireframeMode);
  }
  if (e.code === "KeyR") {
    plane.position.set(0, 180, 0);
    plane.rotation.set(0.05, 0, 0);
    airspeed = 38;
    throttle = 0.65;
    landed = false;
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code));

let airspeed = 38;
let throttle = 0.65;
const maxSpeed = 95;
const minSpeed = 18;
const stallSpeed = 22;

const clock = new THREE.Clock();
const tmpFwd = new THREE.Vector3(0, 0, 1);
const tmpUp = new THREE.Vector3(0, 1, 0);
const cockpitQuat = new THREE.Quaternion();
const cockpitPitch = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -0.15
);

const prop = plane.getObjectByName("prop");
const GEAR_Y = 3.6;

function updateFlight(dt) {
  const pitchRate = (keys.has("ArrowUp") ? -1 : 0) + (keys.has("ArrowDown") ? 1 : 0);
  const rollRate = (keys.has("ArrowLeft") ? 1 : 0) + (keys.has("ArrowRight") ? -1 : 0);
  const yawRate = (keys.has("KeyA") ? -1 : 0) + (keys.has("KeyD") ? 1 : 0);
  const throttleInput = (keys.has("KeyW") ? 1 : 0) + (keys.has("KeyS") ? -1 : 0);
  throttle += throttleInput * dt * 0.35;
  throttle = THREE.MathUtils.clamp(throttle, 0, 1);
  const thr = throttle;

  const pitchMul = airspeed < stallSpeed ? 0.35 : 1;
  plane.rotation.x += pitchRate * dt * 0.9 * pitchMul;
  plane.rotation.x = THREE.MathUtils.clamp(plane.rotation.x, -0.55, 0.5);
  plane.rotation.z += rollRate * dt * 1.35;
  plane.rotation.z = THREE.MathUtils.clamp(plane.rotation.z, -0.85, 0.85);
  plane.rotation.y += yawRate * dt * 0.45;

  plane.rotation.z *= 1 - dt * 0.25;

  const drag = 0.12 + thr * 0.02;
  airspeed += (thr * 42 - airspeed * drag) * dt;
  const pitch = plane.rotation.x;
  airspeed -= Math.sin(pitch) * 12 * dt;
  if (airspeed < stallSpeed) {
    airspeed -= dt * 3;
    plane.rotation.x += dt * 0.08;
  }
  airspeed = THREE.MathUtils.clamp(airspeed, minSpeed * 0.5, maxSpeed);

  tmpFwd.set(0, 0, 1).applyQuaternion(plane.quaternion);
  plane.position.addScaledVector(tmpFwd, airspeed * dt * 0.95);

  const px = plane.position.x;
  const pz = plane.position.z;
  const onRwy = isOnRunway(px, pz);
  const groundY = onRwy ? RUNWAY.surfaceY + GEAR_Y : 12;

  if (plane.position.y <= groundY + 0.15) {
    plane.position.y = groundY;
    if (onRwy && airspeed < 46 && Math.abs(plane.rotation.x) < 0.42) {
      landed = true;
    }
    if (!onRwy) landed = false;
    const rollFric = onRwy ? 0.88 : 0.92;
    airspeed *= rollFric;
    if (onRwy && throttle < 0.22) {
      airspeed *= 1 - dt * 0.85;
    }
  } else if (plane.position.y > groundY + 12) {
    landed = false;
  }

  if (landed && onRwy) {
    plane.rotation.x *= 1 - dt * 1.8;
    plane.rotation.z *= 1 - dt * 2.2;
    if (throttle > 0.72 && airspeed > 22) {
      landed = false;
    }
  }

  if (plane.position.y < groundY) {
    plane.position.y = groundY;
    airspeed *= 0.9;
  }

  if (prop) {
    prop.rotation.y += dt * (25 + thr * 40);
  }
}

function updateCamera() {
  if (cameraMode === "chase") {
    tmpFwd.set(0, 0, 1).applyQuaternion(plane.quaternion);
    const back = tmpFwd.clone().multiplyScalar(-42);
    const up = tmpUp.clone().multiplyScalar(10);
    chaseCam.position.copy(plane.position).add(back).add(up);
    chaseCam.lookAt(
      plane.position.clone().add(tmpFwd.clone().multiplyScalar(25))
    );
  } else {
    cockpitDummy.getWorldPosition(chaseCam.position);
    cockpitDummy.getWorldQuaternion(cockpitQuat);
    chaseCam.quaternion.copy(cockpitQuat).multiply(cockpitPitch);
  }
  chaseCam.aspect = window.innerWidth / window.innerHeight;
  chaseCam.updateProjectionMatrix();
}

function hud() {
  const kts = Math.round(airspeed * 1.94);
  document.getElementById("airspeed").textContent = String(kts);
  document.getElementById("altitude").textContent = String(
    Math.round(plane.position.y * 3.28)
  );
  const hdg = ((plane.rotation.y * 180) / Math.PI) % 360;
  document.getElementById("heading").textContent = String(
    Math.round(hdg < 0 ? hdg + 360 : hdg)
  );
  document.getElementById("pitch").textContent = String(
    Math.round((-plane.rotation.x * 180) / Math.PI)
  );
  document.getElementById("throttle").textContent = String(
    Math.round(throttle * 100)
  );

  const onRwy = isOnRunway(plane.position.x, plane.position.z);
  const along = runwayDistanceAlong(plane.position.x, plane.position.z);
  let rwyText = "—";
  if (onRwy) {
    const pct = Math.round(
      ((along + RUNWAY.length / 2) / RUNWAY.length) * 100
    );
    rwyText = landed ? `LDG ${pct}%` : `ON ${pct}%`;
  } else if (
    Math.hypot(plane.position.x - RUNWAY.cx, plane.position.z - RUNWAY.cz) <
    900
  ) {
    rwyText = "NEAR";
  }
  document.getElementById("runway-hud").textContent = rwyText;
  document.getElementById("wire-hud").textContent = wireframeMode
    ? "WIRE"
    : "SOLID";
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  updateFlight(dt);
  updateCamera();
  hud();
  renderer.render(scene, chaseCam);
  requestAnimationFrame(tick);
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

tick();
