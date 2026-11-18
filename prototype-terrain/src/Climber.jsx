// PROTOTYPE — throwaway. Life-size climber for the route prototype (wayfinder ticket #9).
// Body + walk/idle clips: Quaternius Universal Base Characters and Universal Animation Library (CC0 1.0); both
// share one 65-bone skeleton, so the clips drive the body directly. Everything that makes it a high-altitude
// climber is added here in code: a quilted down suit (vertex puff + baffles in the body's own shader), mitts,
// boots, hood with fur ruff, mirrored goggles, O2 mask, hose and bottle, pack, ice axe, harness sling clipped
// to a fixed rope on pickets, a blob shadow, breath vapour and blowing spindrift. World units are km; the
// climber group is authored in metres and scaled by 0.001.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const WALK_SPEED = 1.3 / 1.333; // m/s at timeScale 1 (Walk_Loop root motion: 1.30 m per 1.333 s loop)
export const WALK_SCALE = 0.45; // high-altitude pace

// ---------- terrain height that matches the rendered 10 m mesh exactly (same triangle split as ChunkTerrain) ----------
export function makeGround(dem10) {
  const { width: W, height: H, cell, data } = dem10;
  const hx = ((W - 1) * cell) / 2000, hz = ((H - 1) * cell) / 2000;
  const at = (c, r) => data[Math.min(H - 1, Math.max(0, r)) * W + Math.min(W - 1, Math.max(0, c))];
  return (x, z) => {
    const col = ((x + hx) * 1000) / cell, row = ((z + hz) * 1000) / cell;
    const c0 = Math.floor(col), r0 = Math.floor(row), fc = col - c0, fr = row - r0;
    const a = at(c0, r0), b = at(c0 + 1, r0), d = at(c0, r0 + 1), e = at(c0 + 1, r0 + 1);
    const h = fc + fr <= 1 ? a + (b - a) * fc + (d - a) * fr : e + (d - e) * (1 - fc) + (b - e) * (1 - fr);
    return h / 1000;
  };
}

function useClimberAssets() {
  const [assets, setAssets] = useState(null);
  useEffect(() => {
    const loader = new GLTFLoader();
    Promise.all([loader.loadAsync('/climber/climber-body.gltf'), loader.loadAsync('/climber/UAL1_Standard.glb')]).then(([body, anim]) => setAssets({ body, clips: anim.animations }));
  }, []);
  return assets;
}

// ---------- down suit ----------
const SUIT = '#d4371f', PANEL = '#1d1e26', BOOT = '#e8b51a', MITT = '#24252c';
const REGION = { torso: 0, arm: 1, leg: 2, mitt: 3, boot: 4, hood: 5, panel: 6, face: 7, toe: 8 };

function regionOf(bone) {
  if (/^(index|middle|ring|pinky|thumb)_|^hand_/.test(bone)) return REGION.mitt;
  if (/^foot_/.test(bone)) return REGION.boot;
  if (/^ball/.test(bone)) return REGION.toe;
  if (/^calf_/.test(bone)) return REGION.panel;
  if (/^thigh_/.test(bone)) return REGION.leg;
  if (/^(upperarm|lowerarm)_/.test(bone)) return REGION.arm;
  if (/^(Head|neck)/.test(bone)) return REGION.hood;
  return REGION.torso;
}

function dressBody(mesh, headPos) {
  const g = mesh.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, pos = g.attributes.position;
  const bones = mesh.skeleton.bones.map((b) => b.name);
  const n = pos.count, region = new Float32Array(n), puff = new Float32Array(n);
  const PUFF = [0.045, 0.034, 0.04, 0.028, 0.03, 0.03, 0.03, 0.0, 0.026];
  for (let i = 0; i < n; i++) {
    let best = 0, bw = -1;
    for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
    let r = regionOf(bones[best]);
    const y = pos.getY(i), z = pos.getZ(i);
    if (r === REGION.hood && z > headPos.z + 0.06 && y > 1.55 && y < 1.8) r = REGION.face; // the face opening
    if (r === REGION.torso && y < 1.0) r = REGION.panel; // seat / harness area
    region[i] = r; puff[i] = PUFF[r];
  }
  g.setAttribute('aRegion', new THREE.BufferAttribute(region, 1));
  g.setAttribute('aPuff', new THREE.BufferAttribute(puff, 1));
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.62, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSuit = { value: new THREE.Color(SUIT) }; sh.uniforms.uPanel = { value: new THREE.Color(PANEL) };
    sh.uniforms.uBoot = { value: new THREE.Color(BOOT) }; sh.uniforms.uMitt = { value: new THREE.Color(MITT) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aRegion; attribute float aPuff; varying float vRegion; varying vec3 vBind;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vRegion = aRegion; vBind = position;
        // baffles: arms are horizontal in the bind (T) pose, so quilt them along x; everything else along y
        float q = aRegion == 1.0 ? abs(position.x) / 0.085 : position.y / 0.075;
        float bulge = aRegion <= 2.0 || aRegion == 5.0 ? 0.72 + 0.28 * sin(3.14159 * fract(q)) : 1.0;
        transformed += normal * aPuff * bulge;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uSuit, uPanel, uBoot, uMitt; varying float vRegion; varying vec3 vBind;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float rg = floor(vRegion + 0.5);
        vec3 c = uSuit;
        if (rg == 6.0) c = uPanel; else if (rg == 3.0) c = uMitt; else if (rg == 4.0) c = uBoot; else if (rg == 8.0) c = uPanel;
        else if (rg == 7.0) c = vec3(0.07, 0.08, 0.11); // balaclava
        if (rg <= 2.0 || rg == 5.0) {
          float q = rg == 1.0 ? abs(vBind.x) / 0.085 : vBind.y / 0.075;
          float seam = smoothstep(0.0, 0.16, fract(q)) * smoothstep(1.0, 0.84, fract(q));
          c *= 0.62 + 0.38 * seam;
          if (rg == 0.0 && vBind.y > 1.36 && abs(vBind.x) > 0.12) c = mix(c, uPanel, 0.85); // shoulder yokes
        }
        if (rg == 4.0 && vBind.y < 0.06) c = uPanel; // sole
        diffuseColor.rgb = c;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        if (rg <= 2.0 || rg == 5.0) roughnessFactor = 0.42; // nylon shell has a soft sheen`);
  };
  mesh.material = mat;
  mesh.castShadow = false;
}

// ---------- props (authored in bind-pose model space, then re-parented to bones) ----------
const M = {
  pack: new THREE.MeshStandardMaterial({ color: '#2a3552', roughness: 0.7 }),
  packDark: new THREE.MeshStandardMaterial({ color: '#151a28', roughness: 0.8 }),
  bottle: new THREE.MeshStandardMaterial({ color: '#d6dbe2', roughness: 0.35, metalness: 0.4 }),
  band: new THREE.MeshStandardMaterial({ color: '#e0622a', roughness: 0.5 }),
  metal: new THREE.MeshStandardMaterial({ color: '#c9ced6', roughness: 0.3, metalness: 0.85 }),
  rubber: new THREE.MeshStandardMaterial({ color: '#16171b', roughness: 0.55 }),
  lens: new THREE.MeshStandardMaterial({ color: '#ff9440', roughness: 0.05, metalness: 0.9, envMapIntensity: 1.6 }),
  fur: new THREE.MeshStandardMaterial({ color: '#7a6650', roughness: 1 }),
  shaft: new THREE.MeshStandardMaterial({ color: '#2b5fa8', roughness: 0.4, metalness: 0.3 }),
  hose: new THREE.MeshStandardMaterial({ color: '#2a2b30', roughness: 0.6 }),
  sling: new THREE.MeshStandardMaterial({ color: '#f2c94c', roughness: 0.6 }),
};

function attach(bone, obj, worldPos, worldQuat = new THREE.Quaternion()) {
  // obj given in bind-pose model space; convert to the bone's local frame
  bone.updateWorldMatrix(true, false);
  const inv = bone.matrixWorld.clone().invert();
  const m = new THREE.Matrix4().compose(worldPos, worldQuat, new THREE.Vector3(1, 1, 1)).premultiply(inv);
  m.decompose(obj.position, obj.quaternion, obj.scale);
  bone.add(obj);
  return obj;
}

function furGeometry() {
  // shaggy torus: radial noise on a dense torus
  const g = new THREE.TorusGeometry(0.118, 0.034, 14, 48);
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const k = 0.006 * (Math.sin(i * 12.9898) * 43758.5453 % 1);
    p.setXYZ(i, p.getX(i) + n.getX(i) * k, p.getY(i) + n.getY(i) * k, p.getZ(i) + n.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

function buildGear(bones) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const E = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
  const B = (name) => bones[name];
  const anchors = {};
  // pack, lid, bottle, straps on the upper spine
  const pack = new THREE.Group();
  pack.add(new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.5, 0.21, 4, 0.06), M.pack));
  const lid = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.09, 0.22, 3, 0.035), M.packDark); lid.position.set(0, 0.27, 0.005); pack.add(lid);
  const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.2, 0.06, 3, 0.025), M.packDark); pocket.position.set(0, -0.1, -0.12); pack.add(pocket);
  attach(B('spine_03'), pack, V(0, 1.2, -0.23));
  const bottle = new THREE.Group();
  bottle.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.34, 6, 20), M.bottle));
  const bnd = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.05, 20), M.band); bnd.position.y = 0.12; bottle.add(bnd);
  const reg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.06, 12), M.metal); reg.position.y = 0.26; bottle.add(reg);
  attach(B('spine_03'), bottle, V(0.1, 1.42, -0.27), E(0, 0, -0.12));
  anchors.bottleTop = attach(B('spine_03'), new THREE.Object3D(), V(0.135, 1.69, -0.26));
  for (const sx of [-1, 1]) {
    const strap = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.42, 0.018, 2, 0.008), M.packDark);
    attach(B('spine_03'), strap, V(0.1 * sx, 1.3, 0.165), E(0.12, 0, 0.1 * sx));
  }
  // head: hood fur ruff, goggles, mask
  attach(B('Head'), new THREE.Mesh(furGeometry(), M.fur), V(0, 1.7, 0.075), E(-0.12, 0, 0));
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.112, 32, 12, THREE.MathUtils.degToRad(38), THREE.MathUtils.degToRad(104), THREE.MathUtils.degToRad(72), THREE.MathUtils.degToRad(20)), M.lens);
  attach(B('Head'), lens, V(0, 1.7, 0.012));
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.113, 0.009, 6, 40, Math.PI * 1.15), M.rubber);
  attach(B('Head'), frame, V(0, 1.725, 0.012), E(Math.PI / 2, 0, -Math.PI * 0.075 + Math.PI));
  const mask = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), M.rubber); mask.scale.set(1, 0.95, 0.8);
  attach(B('Head'), mask, V(0, 1.615, 0.1));
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.03, 0.05, 14), M.metal);
  attach(B('Head'), valve, V(0, 1.585, 0.15), E(0.9, 0, 0));
  anchors.mask = attach(B('Head'), new THREE.Object3D(), V(0, 1.565, 0.16));
  anchors.neckSide = attach(B('neck_01'), new THREE.Object3D(), V(0.12, 1.52, 0.06));
  anchors.shoulder = attach(B('spine_03'), new THREE.Object3D(), V(0.17, 1.55, -0.12));
  // ice axe as a cane in the right hand: shaft continues the arm's line beyond the fist (T-pose arm points −x)
  const axe = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.66, 10), M.shaft); shaft.rotation.z = Math.PI / 2; shaft.position.x = -0.33; axe.add(shaft);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.06, 8), M.metal); spike.rotation.z = Math.PI / 2; spike.position.x = -0.69; axe.add(spike);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.02, 0.2), M.metal); head.position.set(0.0, 0, -0.02); axe.add(head);
  const pick = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.09, 6), M.metal); pick.rotation.x = Math.PI / 2; pick.position.set(0.0, 0, 0.12); axe.add(pick);
  attach(B('hand_r'), axe, V(-0.79, 1.45, -0.04));
  // harness: belay loop anchor at the pelvis front
  anchors.harness = attach(B('pelvis'), new THREE.Object3D(), V(0, 0.98, 0.17));
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 6, 32), M.sling); belt.scale.set(1, 1, 0.8);
  attach(B('pelvis'), belt, V(0, 0.99, -0.01), E(Math.PI / 2, 0, 0));
  return anchors;
}

// ---------- small textures ----------
function radialTex(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
// Reflection map: the dusk sky over snow, so metal, goggles and the nylon shell pick up the right colours.
function skyEnv(gl) {
  const sc = new THREE.Scene();
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vD; void main(){
      float y = vD.y;
      vec3 zen = vec3(0.22,0.26,0.55), hor = vec3(0.95,0.62,0.55), snow = vec3(0.75,0.74,0.9);
      vec3 c = y > 0.0 ? mix(hor, zen, pow(y, 0.6)) : mix(hor * 0.9, snow, min(1.0, -y * 4.0));
      float sun = pow(max(dot(vD, normalize(vec3(-0.92, 0.11, -0.37))), 0.0), 64.0);
      gl_FragColor = vec4(c + vec3(1.0,0.7,0.5) * sun * 4.0, 1.0); }`,
  })));
  const pm = new THREE.PMREMGenerator(gl);
  const t = pm.fromScene(sc, 0.02).texture; pm.dispose();
  return t;
}

const blobTex = radialTex([[0, 'rgba(20,16,40,0.55)'], [0.5, 'rgba(20,16,40,0.25)'], [1, 'rgba(20,16,40,0)']]);
const puffTex = radialTex([[0, 'rgba(255,255,255,0.7)'], [0.4, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]);
const flakeTex = radialTex([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);

// ---------- trodden trail: a compacted trench with boot prints, draped on the rendered ground ----------
const trailMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide,
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  vertexShader: `attribute float aU; attribute float aV; varying float vU; varying float vV;
    void main() { vU = aU; vV = aV; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `varying float vU; varying float vV;
    float h(float x) { return fract(sin(x * 91.7) * 43758.5); }
    void main() {
      float stride = 0.62, idx = floor(vU / stride), u = vU - idx * stride;
      float side = mod(idx, 2.0) * 2.0 - 1.0;
      float jit = (h(idx) - 0.5) * 0.06;                       // nobody walks a perfect line
      vec2 q = vec2((u - 0.31) / 0.15, (vV * 0.45 - side * 0.11 - jit) / 0.06);
      float print = 1.0 - smoothstep(0.75, 1.0, length(q));
      float older = 1.0 - smoothstep(0.75, 1.0, length(vec2(fract(vU / 0.47 + 0.3) - 0.5, (vV * 0.45 + side * 0.07) / 0.05 * 0.5)));
      float trench = 1.0 - smoothstep(0.55, 1.0, abs(vV));
      float a = trench * 0.16 + print * 0.24 + older * trench * 0.07;
      gl_FragColor = vec4(0.30, 0.31, 0.55, a);
    }`,
});

// ---------- the climber ----------
// stateRef supplies: s (m along route), walkW (0..1 gait weight), mode. route supplies pts/s/L.
export function Climber({ route, dem10, stateRef, sunDir, posAtS }) {
  const assets = useClimberAssets();
  const ground = useMemo(() => makeGround(dem10), [dem10]);
  const { camera, gl } = useThree();
  const ropeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c8312c', roughness: 0.7 }), []);
  const root = useRef(), ropeRef = useRef(), slingRef = useRef(), hoseRef = useRef(), blobRef = useRef(), snowRef = useRef(), puffRef = useRef();
  const rig = useMemo(() => {
    if (!assets) return null;
    const scene = assets.body.scene;
    let body = null;
    scene.traverse((o) => {
      if (o.isSkinnedMesh && /SuperHero/i.test(o.name)) body = o;
      else if (o.isSkinnedMesh) o.visible = false; // eyes, brows: under goggles and hood
      if (o.isMesh) o.frustumCulled = false;
    });
    const bones = {};
    scene.traverse((o) => { if (o.isBone) bones[o.name] = o; });
    scene.updateMatrixWorld(true);
    dressBody(body, new THREE.Vector3().setFromMatrixPosition(bones.Head.matrixWorld));
    const anchors = buildGear(bones);
    const env = skyEnv(gl);
    scene.traverse((o) => { if (o.isMesh && o.material?.isMeshStandardMaterial) o.material.envMap = env; });
    Object.values(M).forEach((mt) => { mt.envMap = env; mt.needsUpdate = true; });
    ropeMat.envMap = env;
    const mixer = new THREE.AnimationMixer(scene);
    const clip = (n) => assets.clips.find((c) => c.name === n);
    const walk = mixer.clipAction(clip('Walk_Loop')), idle = mixer.clipAction(clip('Idle_Loop'));
    walk.play(); idle.play(); idle.setEffectiveWeight(0);
    return { scene, bones, anchors, mixer, walk, idle };
  }, [assets, gl, ropeMat]);

  const sm = useRef({ yaw: null, ropeAt: -1e9, origin: new THREE.Vector3(), puffs: [], lastW: 1 });
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(), p: new THREE.Vector3() }), []);

  // spindrift: points in a 50 m box that follows the climber, blown across the slope
  const snow = useMemo(() => {
    const n = 1800, p = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * 50; p[i * 3 + 1] = Math.random() * 18 - 2; p[i * 3 + 2] = (Math.random() - 0.5) * 50; seed[i] = Math.random(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  useFrame((_, dtRaw) => {
    if (!rig || !root.current) return;
    const dt = window.__fixedDt ?? Math.min(dtRaw, 0.05);
    const st = stateRef.current, m = sm.current;
    if (st.s == null) return;
    // position: on the rendered ground under the route line; facing: route heading over ±3 m, damped
    const P = posAtS(route.pts, route.s, st.s, tmp.a), A = posAtS(route.pts, route.s, st.s - 3, tmp.b), Bp = posAtS(route.pts, route.s, st.s + 3, tmp.c);
    const yawGoal = Math.atan2(Bp.x - A.x, Bp.z - A.z);
    if (m.yaw == null) m.yaw = yawGoal;
    let dy = yawGoal - m.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); m.yaw += dy * (1 - Math.exp(-3 * dt));
    root.current.position.set(P.x, ground(P.x, P.z), P.z);
    root.current.rotation.y = m.yaw;
    const near = camera.position.distanceTo(root.current.position) < (st.mode === 'walk' ? 2.5 : 0.3);
    root.current.visible = near;
    for (const g of [ropeRef, hoseRef, slingRef]) if (g.current) g.current.parent.visible = near;
    if (!near) return;
    // gait: walk clip speed and weight follow walkW (rest-step pauses blend toward idle)
    const w = st.walkW ?? 1;
    rig.walk.setEffectiveWeight(w); rig.idle.setEffectiveWeight(1 - w);
    rig.walk.timeScale = WALK_SCALE * (0.25 + 0.75 * w) * (st.mode === 'walk' ? 1 : 3);
    rig.mixer.update(dt);
    rig.scene.updateMatrixWorld(true);

    // fixed rope: rebuilt every 2 m, in local metres around an origin for float precision
    if (Math.abs(st.s - m.ropeAt) > 2 || !ropeRef.current.geometry.attributes.position) {
      m.ropeAt = st.s; m.origin.copy(root.current.position);
      const pts = [], stakes = [];
      const s0 = Math.max(0, st.s - 45), s1 = Math.min(route.L, st.s + 70), span = 14;
      const side = (s, out) => { // 0.75 m to the climber's left of the line
        const a = posAtS(route.pts, route.s, s - 1, tmp.p).clone(), b = posAtS(route.pts, route.s, s + 1, tmp.d);
        const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
        const c = posAtS(route.pts, route.s, s, out);
        c.x += (dz / l) * 0.00075; c.z -= (dx / l) * 0.00075;
        return c;
      };
      const first = Math.ceil(s0 / span) * span;
      for (let s = s0; s <= s1; s += 0.5) {
        const k = (s - first) / span, u = k - Math.floor(k);
        const c = side(s, new THREE.Vector3());
        const g = ground(c.x, c.z) * 1000;
        const h = 1.05 - 0.38 * Math.sin(Math.PI * u); // sags between pickets
        pts.push(new THREE.Vector3((c.x - m.origin.x) * 1000, Math.max(g + 0.25, g + h) - m.origin.y * 1000, (c.z - m.origin.z) * 1000));
      }
      for (let s = first; s <= s1; s += span) {
        const c = side(s, new THREE.Vector3());
        stakes.push(new THREE.Vector3((c.x - m.origin.x) * 1000, ground(c.x, c.z) * 1000 - m.origin.y * 1000, (c.z - m.origin.z) * 1000));
      }
      // trail strip ±0.45 m around the route line itself, 2.5 cm above the ground
      {
        const pos = [], au = [], av = [], idx = [];
        let k = 0;
        for (let s = s0; s <= s1; s += 0.4, k++) {
          const a = posAtS(route.pts, route.s, s - 0.6, new THREE.Vector3()), b = posAtS(route.pts, route.s, s + 0.6, new THREE.Vector3());
          const c = posAtS(route.pts, route.s, s, new THREE.Vector3());
          const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
          for (const v of [-1, 1]) {
            const x = c.x + (dz / l) * 0.00045 * v, z = c.z - (dx / l) * 0.00045 * v;
            pos.push((x - m.origin.x) * 1000, ground(x, z) * 1000 + 0.025 - m.origin.y * 1000, (z - m.origin.z) * 1000);
            au.push(s); av.push(v);
          }
          if (k) { const i = (k - 1) * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
        }
        const tg = new THREE.BufferGeometry();
        tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        tg.setAttribute('aU', new THREE.Float32BufferAttribute(au, 1));
        tg.setAttribute('aV', new THREE.Float32BufferAttribute(av, 1));
        tg.setIndex(idx);
        ropeRef.current.parent.children[4].geometry.dispose();
        ropeRef.current.parent.children[4].geometry = tg;
      }
      m.rope = new THREE.CatmullRomCurve3(pts);
      ropeRef.current.geometry.dispose();
      ropeRef.current.geometry = new THREE.TubeGeometry(m.rope, pts.length * 2, 0.0065, 6, false);
      ropeRef.current.parent.position.copy(m.origin);
      const inst = ropeRef.current.parent.children[1];
      stakes.forEach((p, i) => { if (i < 12) inst.setMatrixAt(i, new THREE.Matrix4().compose(p.clone().add(new THREE.Vector3(0, 0.55, 0)), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1))); });
      inst.count = Math.min(12, stakes.length); inst.instanceMatrix.needsUpdate = true;
    }
    const toRope = (v) => v.sub(m.origin).multiplyScalar(1000);
    // sling: harness → a point on the rope ~1 m ahead (jumar)
    if (m.rope) {
      const h = toRope(rig.anchors.harness.getWorldPosition(tmp.a));
      let best = null, bd = 1e9;
      for (let i = 0; i <= 120; i++) { const q = m.rope.getPoint(i / 120); const d = q.distanceTo(h); if (d < bd) { bd = d; best = q; } }
      const fwd = new THREE.Vector3(Math.sin(m.yaw), 0, Math.cos(m.yaw));
      const clip = best.clone().addScaledVector(fwd, 0.8);
      const mid = h.clone().lerp(clip, 0.5); mid.y -= 0.12;
      slingRef.current.geometry.dispose();
      slingRef.current.geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(h, mid, clip), 12, 0.009, 5, false);
      slingRef.current.children[0].position.copy(clip);
    }
    // O2 hose: mask → neck side → shoulder → bottle, in rope-local space too
    {
      const pts = ['mask', 'neckSide', 'shoulder', 'bottleTop'].map((k) => toRope(rig.anchors[k].getWorldPosition(new THREE.Vector3())));
      hoseRef.current.geometry.dispose();
      hoseRef.current.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.011, 6, false);
    }
    // blob shadow on the ground, oriented to the local slope
    {
      const x = root.current.position.x, z = root.current.position.z, e = 0.001;
      const nrm = new THREE.Vector3(-(ground(x + e, z) - ground(x - e, z)) / (2 * e), 1, -(ground(x, z + e) - ground(x, z - e)) / (2 * e)).normalize();
      blobRef.current.position.set(0, 0.03, 0);
      blobRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrm).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -m.yaw));
    }
    // breath vapour: a puff at the end of each rest-step pause
    if (m.lastW < 0.3 && w >= 0.3 && st.mode === 'walk') {
      const sp = puffRef.current.children.find((c) => !c.userData.t || c.userData.t > 2.2);
      if (sp) { sp.userData.t = 0; toRope(rig.anchors.mask.getWorldPosition(sp.position)); }
    }
    m.lastW = w;
    for (const sp of puffRef.current.children) {
      const t = sp.userData.t ?? 9;
      sp.visible = t < 2.2;
      if (sp.visible) { sp.userData.t = t + dt; sp.position.y += dt * 0.12; sp.position.x += dt * 0.25; sp.scale.setScalar(0.15 + t * 0.35); sp.material.opacity = 0.5 * (1 - t / 2.2); }
    }
    puffRef.current.parent.position.copy(m.origin);
    // spindrift: drift + wrap inside a box centred on the climber
    if (snowRef.current) {
      snowRef.current.visible = st.mode === 'walk';
      const p = snow.attributes.position, seed = snow.attributes.seed, time = performance.now() / 1000;
      for (let i = 0; i < p.count; i++) {
        const sd = seed.getX(i);
        let x = p.getX(i) + dt * (6 + 5 * sd), y = p.getY(i) - dt * (0.6 + sd), z = p.getZ(i) + dt * Math.sin(time * 0.7 + sd * 40) * 1.5;
        if (x > 25) x -= 50; if (y < -2) y += 18; if (z > 25) z -= 50; if (z < -25) z += 50;
        p.setXYZ(i, x, y, z);
      }
      p.needsUpdate = true;
      snowRef.current.position.copy(root.current.position);
    }
  });

  if (!rig) return null;
  return (
    <>
      <directionalLight position={sunDir.clone().multiplyScalar(10)} intensity={2.4} color="#ffd6b8" />
      <hemisphereLight args={['#9aa8e0', '#f2dcd8', 1.1]} />
      <group ref={root} scale={0.001}>
        <primitive object={rig.scene} />
        <mesh ref={blobRef} renderOrder={1}>
          <planeGeometry args={[1.3, 1.6]} />
          <meshBasicMaterial map={blobTex} transparent depthWrite={false} />
        </mesh>
      </group>
      <group scale={0.001}>
        <mesh ref={ropeRef} material={ropeMat} />
        <instancedMesh args={[new THREE.CylinderGeometry(0.018, 0.012, 1.1, 6), M.metal, 12]} />
        <mesh ref={slingRef} material={M.sling}><mesh material={M.metal}><torusGeometry args={[0.03, 0.006, 6, 16]} /></mesh></mesh>
        <mesh ref={hoseRef} material={M.hose} />
        <mesh material={trailMat} renderOrder={1} frustumCulled={false} />
      </group>
      <group scale={0.001}>
        <group ref={puffRef}>
          {[0, 1, 2, 3].map((i) => (
            <sprite key={i} visible={false}><spriteMaterial map={puffTex} transparent depthWrite={false} opacity={0} /></sprite>
          ))}
        </group>
      </group>
      <points ref={snowRef} geometry={snow} scale={0.001} frustumCulled={false}>
        <pointsMaterial map={flakeTex} size={0.00004} sizeAttenuation transparent depthWrite={false} opacity={0.85} color="#ffffff" />
      </points>
    </>
  );
}
