// PROTOTYPE — throwaway. Route drawing, climber marker and chase camera (wayfinder ticket #9).
// South Col hero route (OSM relation 17822898, © OpenStreetMap contributors, ODbL) draped on the 10 m terrain.
// Three structurally different takes, switchable via ?variant=A|B|C and the bottom bar:
//   A Comet trail   — line is the climber's own trail, a glowing comet head; over-the-shoulder chase cam
//                     the viewer can orbit; slows into each camp and pops a pill label.
//   B Survey        — whole route sweeps in first as a dashed survey line (x-ray through ridges); a pin climbs it
//                     at constant pace; side-on rail camera; elevation profile HUD with camp ticks.
//   C Expedition    — climbed leg by leg: next leg previews as a ghost dash, climber walks it, past legs dim;
//                     scripted drone move per leg, pull-back reveal and lower-third card at each camp.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { makeSampler } from './Spotlight.jsx';

export const ROUTE_VARIANTS = [
  { key: 'A', name: 'Comet trail' },
  { key: 'B', name: 'Survey' },
  { key: 'C', name: 'Expedition' },
];

// ?debug=cam: fixed 1/60 s timestep and a per-frame camera log; prints a smoothness report to the console.
if (new URLSearchParams(location.search).get('debug') === 'cam') {
  window.__fixedDt = 1 / 60; window.__camlog = [];
  setInterval(() => {
    const L = window.__camlog.slice(5); if (L.length < 10) return;
    const v = [], a = [];
    for (let i = 1; i < L.length; i++) v.push([0, 1, 2].map((k) => L[i][k] - L[i - 1][k]));
    for (let i = 1; i < v.length; i++) a.push(Math.hypot(...[0, 1, 2].map((k) => v[i][k] - v[i - 1][k])) * 1000);
    const sp = v.map((d) => Math.hypot(...d) * 1000).sort((x, y) => x - y);
    const as = [...a].sort((x, y) => x - y);
    const big = a.map((x, i) => [x, i]).filter(([x]) => x > 2).length;
    const top = a.map((x, i) => [x, i + 1]).sort((p, q) => q[0] - p[0]).slice(0, 6).map(([x, i]) => `${x.toFixed(1)}@t${L[i][9]?.toFixed(2)} s${L[i][8]?.toFixed(0)} lift${(L[i][6] * 1000).toFixed(0)}/${(L[i][7] * 1000).toFixed(0)} dTgt${(Math.hypot(L[i][3] - L[i - 1][3], L[i][4] - L[i - 1][4], L[i][5] - L[i - 1][5]) * 1000).toFixed(1)}`).join(' | ');
    console.log(`CAMTOP ${top}`);
    console.log(`CAMREPORT frames=${L.length} speed_med=${sp[sp.length >> 1].toFixed(2)}m/f accel_p50=${as[as.length >> 1].toFixed(3)} p99=${as[Math.floor(as.length * 0.99)].toFixed(3)} max=${as[as.length - 1].toFixed(3)}m/f2 spikes>2m=${big} t=${window.__clockT?.toFixed(1)}`);
  }, 3000);
}

const LIFT = 0.004; // 4 m above the terrain, plus a view-space pull in the shader
const STEP = 10; // resample spacing, m

// ---------- route geometry ----------
function useRoute(dem10) {
  const [raw, setRaw] = useState(null);
  useEffect(() => { fetch('/route-south-col.json').then((r) => r.json()).then(setRaw); }, []);
  return useMemo(() => {
    if (!raw || !dem10) return null;
    const S = makeSampler(dem10, 1);
    // 30 m grid → 10 m grid: col10 = 3·col30 + 1 (both are cell-centre grids on one origin).
    const flat = raw.points.map(([c, r]) => new THREE.Vector3(3 * c + 1, 0, 3 * r + 1));
    const curve = new THREE.CatmullRomCurve3(flat, false, 'centripetal', 0.5);
    const len10 = curve.getLength(); // in 10 m cells
    const n = Math.round((len10 * 10) / STEP);
    const g = curve.getSpacedPoints(n);
    const pts = g.map((p) => S.world(p.x, p.z));
    // Light smoothing of heights so the line doesn't saw up and down across 10 m bumps.
    const y = pts.map((p) => p.y);
    for (let i = 0; i < pts.length; i++) {
      let m = -1;
      for (let k = -2; k <= 2; k++) m = Math.max(m, y[Math.min(pts.length - 1, Math.max(0, i + k))]);
      pts[i].y = m + LIFT;
    }
    const s = [0];
    for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + pts[i].distanceTo(pts[i - 1]) * 1000);
    const L = s[s.length - 1];
    const alt = pts.map((p) => (p.y - LIFT) * 1000);
    // Stops: marks deduped where they sit within 40 m along the line (South Summit + Hillary Step).
    const marks = [...raw.marks].sort((a, b) => a.s - b.s || a.alt_m - b.alt_m).map((m) => ({ ...m, s: Math.min(L, (m.s / raw.length_m) * L) }));
    const stops = [];
    for (const m of marks) {
      const last = stops[stops.length - 1];
      if (last && m.s - last.s < 40) last.marks.push(m);
      else stops.push({ s: m.s, marks: [m] });
    }
    for (const st of stops) {
      st.name = st.marks.map((m) => m.name).join(' · ');
      st.alt = Math.max(...st.marks.map((m) => m.alt_m));
      st.pos = posAtS(pts, s, st.s);
    }
    return { pts, s, L, alt, stops, credit: raw.credit, S };
  }, [raw, dem10]);
}

function idxAtS(s, v) {
  let lo = 0, hi = s.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m] <= v) lo = m; else hi = m; }
  return lo;
}
function posAtS(pts, s, v, out = new THREE.Vector3()) {
  v = THREE.MathUtils.clamp(v, 0, s[s.length - 1]);
  const i = idxAtS(s, v), j = Math.min(i + 1, pts.length - 1);
  const f = s[j] > s[i] ? (v - s[i]) / (s[j] - s[i]) : 0;
  return out.lerpVectors(pts[i], pts[j], f);
}
function altAtS(route, v) {
  const i = idxAtS(route.s, THREE.MathUtils.clamp(v, 0, route.L));
  return route.alt[i];
}
// Horizontal heading of the route averaged over a window (m) ahead/behind.
function headingAt(route, v, back, ahead) {
  const a = posAtS(route.pts, route.s, v - back), b = posAtS(route.pts, route.s, v + ahead);
  const d = new THREE.Vector3(b.x - a.x, 0, b.z - a.z);
  return d.lengthSq() < 1e-8 ? new THREE.Vector3(0, 0, -1) : d.normalize();
}

// ---------- timeline: time (s) → arc length (m) ----------
const inOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function buildTimeline(variant, route) {
  const segs = [];
  let t = 0;
  const push = (seg) => { segs.push({ ...seg, t0: t, t1: t + seg.dur }); t += seg.dur; };
  const { stops, L } = route;
  if (variant === 'B') {
    push({ type: 'sweep', dur: 2.5, s0: 0, s1: 0 });
    push({ type: 'move', dur: 34, s0: 0, s1: L, ease: (x) => x });
  } else {
    const ends = [...stops.map((st) => st.s)];
    if (ends[ends.length - 1] < L - 1) ends.push(L);
    let prev = 0, si = 0;
    if (stops[0] && stops[0].s < 1) { push({ type: 'dwell', dur: variant === 'A' ? 1.2 : 2.6, s0: 0, s1: 0, stop: stops[0], leg: -1 }); si = 1; }
    for (let k = si; k < stops.length; k++) {
      const st = stops[k], km = (st.s - prev) / 1000;
      if (variant === 'A') push({ type: 'move', dur: 0.8 + km * 2.2, s0: prev, s1: st.s, ease: inOutSine, leg: k });
      else push({ type: 'move', dur: 5, s0: prev, s1: st.s, ease: inOutCubic, leg: k });
      push({ type: 'dwell', dur: variant === 'A' ? (k === stops.length - 1 ? 3 : 1.0) : 2.6, s0: st.s, s1: st.s, stop: st, leg: k });
      prev = st.s;
    }
  }
  const T = t;
  const at = (time) => {
    const tt = THREE.MathUtils.clamp(time, 0, T);
    const seg = segs.find((g) => tt <= g.t1) ?? segs[segs.length - 1];
    const u = seg.dur ? (tt - seg.t0) / seg.dur : 1;
    const s = seg.type === 'move' ? seg.s0 + (seg.s1 - seg.s0) * seg.ease(u) : seg.s0;
    return { s, seg, u };
  };
  return { segs, T, at };
}

// ---------- shared playback clock (mutable; HUD polls it) ----------
export function useClock() {
  return useRef({ t: 0, playing: true, speed: +(new URLSearchParams(location.search).get('speed') ?? 1), T: 1, scrubbing: false }).current;
}

// ---------- ribbon line with screen-space width and arc-length attribute ----------
const ribbonVertex = /* glsl */ `
  attribute vec3 aNext; attribute float aSide; attribute float aS;
  uniform vec2 uRes; uniform float uPx; uniform float uWorldW;
  varying float vS; varying float vSide;
  vec4 pulled(vec3 p) {
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float d = length(mv.xyz);
    mv.xyz -= normalize(mv.xyz) * min(d * 0.015, 0.06);
    return mv;
  }
  void main() {
    vS = aS; vSide = aSide;
    vec4 c = projectionMatrix * pulled(position);
    vec4 cn = projectionMatrix * pulled(aNext);
    vec2 h = uRes * 0.5;
    if (cn.w < 0.05) cn = c + (c - cn); // next point behind the camera: mirror it so the tangent stays sane
    vec2 sc = c.xy / c.w * h, sn = cn.xy / max(cn.w, 1e-4) * h;
    vec2 dir = sn - sc; dir = length(dir) < 1e-5 ? vec2(1.0, 0.0) : normalize(dir);
    vec2 nrm = vec2(-dir.y, dir.x);
    float px = max(uPx, uWorldW * projectionMatrix[1][1] * h.y / c.w);
    c.xy += nrm * aSide * px * 0.5 / h * c.w;
    gl_Position = c;
  }`;
const ribbonFragment = /* glsl */ `
  uniform int uMode; uniform float uProg; uniform float uDraw; uniform float uLeg0; uniform float uLeg1; uniform float uOpacity;
  uniform vec3 uColor; uniform vec3 uHead; uniform float uTime;
  varying float vS; varying float vSide;
  void main() {
    float edge = 1.0 - smoothstep(0.55, 1.0, abs(vSide));
    vec3 col = uColor; float a = edge;
    if (uMode == 0) {               // A: comet trail
      if (vS > uProg) discard;
      float head = exp(-(uProg - vS) / 120.0);
      col = mix(uColor, uHead, head);
      a *= mix(0.85, 1.0, head);
    } else if (uMode == 1) {        // B: dashed survey line, warmer where climbed
      if (vS > uDraw) discard;
      if (fract(vS / 60.0) > 0.62) discard;
      col = vS < uProg ? uHead : uColor;
    } else {                        // C: past legs dim, current leg solid to the climber, ghost dash ahead
      if (vS > uLeg1) discard;
      if (vS < uLeg0) { col = uColor * 0.75; a *= 0.45; }
      else if (vS <= uProg) { col = uHead; }
      else { if (fract((vS - uTime * 40.0) / 50.0) > 0.5) discard; col = uHead; a *= 0.55; }
    }
    gl_FragColor = vec4(col, a * uOpacity);
  }`;

function buildRibbon(route) {
  const { pts, s } = route, n = pts.length;
  const pos = new Float32Array(n * 2 * 3), nxt = new Float32Array(n * 2 * 3), side = new Float32Array(n * 2), sa = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = i < n - 1 ? pts[i + 1] : p.clone().multiplyScalar(2).sub(pts[i - 1]);
    for (let k = 0; k < 2; k++) {
      const o = i * 2 + k;
      pos.set([p.x, p.y, p.z], o * 3); nxt.set([q.x, q.y, q.z], o * 3);
      side[o] = k ? 1 : -1; sa[o] = s[i];
    }
  }
  const idx = [];
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aNext', new THREE.BufferAttribute(nxt, 3));
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  g.setAttribute('aS', new THREE.BufferAttribute(sa, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

function Ribbon({ route, geom, mode, px, worldW, color, head, opacity = 1, xray = false, uniformsRef }) {
  const { size } = useThree();
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ribbonVertex, fragmentShader: ribbonFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide, // screen-space strip winds clockwise
    depthTest: !xray,
    uniforms: {
      uRes: { value: new THREE.Vector2() }, uPx: { value: px }, uWorldW: { value: worldW },
      uMode: { value: mode }, uProg: { value: 0 }, uDraw: { value: 0 }, uLeg0: { value: 0 }, uLeg1: { value: 0 },
      uOpacity: { value: opacity }, uColor: { value: new THREE.Color(color) }, uHead: { value: new THREE.Color(head) }, uTime: { value: 0 },
    },
  }), [mode, px, worldW, color, head, opacity, xray]);
  useFrame((st) => {
    mat.uniforms.uRes.value.set(size.width, size.height);
    mat.uniforms.uTime.value = st.clock.elapsedTime;
    mat.uniforms.uProg.value = uniformsRef.current.prog;
    mat.uniforms.uDraw.value = uniformsRef.current.draw;
    mat.uniforms.uLeg0.value = uniformsRef.current.leg0;
    mat.uniforms.uLeg1.value = uniformsRef.current.leg1;
  });
  return <mesh geometry={geom} material={mat} frustumCulled={false} renderOrder={xray ? 2 : 3} />;
}

// ---------- climber markers ----------
function useScreenScale(ref, px) {
  const { camera, size } = useThree();
  useFrame(() => {
    if (!ref.current) return;
    const d = camera.position.distanceTo(ref.current.position);
    const k = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * d) / size.height;
    ref.current.scale.setScalar(k * px); // geometry is authored in pixels
  });
}

const haloTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,240,220,1)'); gr.addColorStop(0.25, 'rgba(255,190,120,0.55)'); gr.addColorStop(1, 'rgba(255,150,80,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); return t;
})();

function CometClimber({ posRef }) {
  const ref = useRef();
  useScreenScale(ref, 1);
  useFrame(() => ref.current?.position.copy(posRef.current));
  return (
    <group ref={ref}>
      <mesh renderOrder={5}><sphereGeometry args={[4, 16, 12]} /><meshBasicMaterial color="#fff6ea" depthTest={false} /></mesh>
      <sprite scale={[26, 26, 1]} renderOrder={4}><spriteMaterial map={haloTex} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    </group>
  );
}

function PinClimber({ posRef, altRef }) {
  const ref = useRef(), label = useRef();
  useScreenScale(ref, 1);
  useFrame(() => {
    ref.current?.position.copy(posRef.current);
    if (label.current) label.current.textContent = `${Math.round(altRef.current).toLocaleString('en')} m`;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 22, 0]} renderOrder={5}><cylinderGeometry args={[0.6, 0.6, 44, 6]} /><meshBasicMaterial color="#ffffff" depthTest={false} /></mesh>
      <mesh position={[0, 46, 0]} renderOrder={5}><sphereGeometry args={[4.5, 16, 12]} /><meshBasicMaterial color="#ff7a3d" depthTest={false} /></mesh>
      <Html position={[0, 58, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
        <div className="rt-pinlabel" ref={label} />
      </Html>
    </group>
  );
}

function FigureClimber({ posRef, headingRef }) {
  const ref = useRef();
  useScreenScale(ref, 2.2);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.copy(posRef.current);
    const h = headingRef.current;
    ref.current.rotation.y = Math.atan2(h.x, h.z);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 7, 0]} renderOrder={5}><coneGeometry args={[4, 12, 10]} /><meshBasicMaterial color="#e5462e" depthTest={false} /></mesh>
      <mesh position={[0, 15.5, 0]} renderOrder={5}><sphereGeometry args={[2.6, 12, 10]} /><meshBasicMaterial color="#ffd8b8" depthTest={false} /></mesh>
      <mesh position={[0, 8, -3.4]} renderOrder={5}><boxGeometry args={[4.4, 6, 2.4]} /><meshBasicMaterial color="#2b3a66" depthTest={false} /></mesh>
      <sprite position={[0, 9, 0]} scale={[30, 30, 1]} renderOrder={4}><spriteMaterial map={haloTex} transparent opacity={0.45} depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    </group>
  );
}

// ---------- camp markers ----------
function StopMarkers({ variant, route, progRef }) {
  const [reached, setReached] = useState(0);
  useFrame(() => {
    const p = progRef.current.prog;
    let n = 0;
    for (const st of route.stops) if (st.s <= p + 1) n++;
    if (n !== reached) setReached(n);
  });
  return route.stops.map((st, i) => {
    const on = i < reached;
    if (variant === 'A') {
      if (!on) return null;
      return (
        <Html key={i} position={[st.pos.x, st.pos.y + 0.02, st.pos.z]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
          <div className="rt-pill"><b>{st.name}</b><span>{st.alt.toLocaleString('en')} m</span></div>
        </Html>
      );
    }
    if (variant === 'B') {
      return (
        <Html key={i} position={[st.pos.x, st.pos.y, st.pos.z]} zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
          <div className={`rt-tag ${on ? 'on' : ''}`}><i />{st.name} <span>{st.alt.toLocaleString('en')}</span></div>
        </Html>
      );
    }
    if (!on) return null;
    return <Beacon key={i} pos={st.pos} />;
  });
}

function Beacon({ pos }) {
  const ref = useRef();
  const born = useRef(performance.now());
  useScreenScale(ref, 1);
  useFrame(() => {
    if (!ref.current) return;
    const k = Math.min(1, (performance.now() - born.current) / 600);
    ref.current.children[0].scale.y = 1 - Math.pow(1 - k, 3);
  });
  return (
    <group ref={ref} position={pos}>
      <mesh position={[0, 0, 0]} renderOrder={4}>
        <cylinderGeometry args={[1.2, 1.2, 160, 8, 1, true]} />
        <meshBasicMaterial color="#ffb070" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// ---------- cameras ----------
function useUserIdle() {
  const { controls } = useThree();
  const st = useRef({ active: false, last: -1e9 });
  useEffect(() => {
    if (!controls) return;
    const on = () => { st.current.active = true; };
    const off = () => { st.current.active = false; st.current.last = performance.now(); };
    controls.addEventListener('start', on); controls.addEventListener('end', off);
    return () => { controls.removeEventListener('start', on); controls.removeEventListener('end', off); };
  }, [controls]);
  return () => !st.current.active && performance.now() - st.current.last > 2500;
}

// Continuous terrain avoidance: how far the camera must rise to clear the ground and see the target.
// Raising the camera by d raises a sight-line sample at fraction f (from camera) by d·(1−f).
function liftNeeded(S, cam, tgt) {
  let need = S.yAt(cam.x, cam.z) + 0.06 - cam.y;
  const p = new THREE.Vector3();
  for (let i = 1; i < 40; i++) {
    const f = (i / 40) * 0.93;
    p.lerpVectors(cam, tgt, f);
    need = Math.max(need, (S.yAt(p.x, p.z) + 0.012 - p.y) / (1 - f));
  }
  return Math.max(0, need);
}

function damp(rate, dt) { return 1 - Math.exp(-rate * dt); }

// Eases an offset toward a goal by swinging around the subject (azimuth, elevation, distance) rather than
// cutting straight through it; a side flip becomes an orbit. Angular step is capped at 40°/s.
const _sa = new THREE.Spherical(), _sb = new THREE.Spherical();
function swingOffset(off, goal, k, dt) {
  _sa.setFromVector3(off); _sb.setFromVector3(goal);
  let dth = _sb.theta - _sa.theta;
  dth = Math.atan2(Math.sin(dth), Math.cos(dth));
  const cap = THREE.MathUtils.degToRad(40) * dt;
  _sa.theta += THREE.MathUtils.clamp(dth * k, -cap, cap);
  _sa.phi += THREE.MathUtils.clamp((_sb.phi - _sa.phi) * k, -cap, cap);
  _sa.radius += (_sb.radius - _sa.radius) * k;
  off.setFromSpherical(_sa);
}

// Rig: owns the camera offset from the subject. While the viewer drags (and for 2.5 s after, so orbit inertia
// plays out) the offset is read back from the camera; when idle it eases to the variant's framing.
// Heading and the terrain lift are damped separately so switchbacks and ridges never snap the camera.
function CameraRig({ variant, route, stateRef }) {
  const { camera, controls } = useThree();
  const idle = useUserIdle();
  const S = route.S;
  const sm = useRef(null);
  useFrame((_, dtRaw) => {
    if (!controls) return;
    const dt = window.__fixedDt ?? Math.min(dtRaw, 0.05);
    const st = stateRef.current;
    if (!st.pos) return;
    const subject = st.pos;
    if (!sm.current) {
      sm.current = { tgt: controls.target.clone(), off: camera.position.clone().sub(controls.target), lift: 0,
        h: headingAt(route, st.s, 150, 350), side: 1, az: null };
    }
    const m = sm.current;
    let desired, tgtGoal = subject.clone(), rate, hRate, tgtRate = 4;

    if (variant === 'A') {
      // Over the shoulder: 550 m behind on the route's (heavily smoothed) heading, 220 m up, looking a little ahead.
      hRate = 0.5;
      m.h.lerp(headingAt(route, st.s, 400, 600), damp(hRate, dt)).setY(0).normalize();
      desired = m.h.clone().multiplyScalar(-0.55).add(new THREE.Vector3(0, 0.22, 0));
      tgtGoal.addScaledVector(m.h, 0.12);
      rate = 0.8;
    } else if (variant === 'B') {
      // Side-on rail: 2.4 km off the route, perpendicular to a 2 km-window heading, 500 m above the climber.
      hRate = 0.3;
      m.h.lerp(headingAt(route, st.s, 1000, 1000), damp(hRate, dt)).setY(0).normalize();
      const n = new THREE.Vector3(-m.h.z, 0, m.h.x);
      const cost = (sgn) => liftNeeded(S, subject.clone().addScaledVector(n, 2.4 * sgn).add(new THREE.Vector3(0, 0.5, 0)), subject);
      if (performance.now() - (m.flipAt ?? 0) > 6000 && cost(m.side) > 0.3 && cost(-m.side) < cost(m.side) * 0.5) { m.side = -m.side; m.flipAt = performance.now(); } // hysteresis: only flip for a much clearer side
      desired = n.multiplyScalar(2.4 * m.side).add(new THREE.Vector3(0, 0.5, 0));
      rate = 0.5; tgtRate = 2;
    } else {
      // Drone: per-leg arc from behind to the side, then a pull-back reveal while dwelling at a camp.
      hRate = 0.6;
      m.h.lerp(headingAt(route, st.s, 300, 500), damp(hRate, dt)).setY(0).normalize();
      const seg = st.seg;
      let az, dist, el;
      if (seg?.type === 'dwell') {
        az = 110 + seg.u * 25; dist = 1.5; el = 32;
      } else {
        const u = seg ? seg.u : 0;
        az = 160 - u * 60; dist = THREE.MathUtils.lerp(0.9, 0.65, u); el = THREE.MathUtils.lerp(16, 24, u);
      }
      // damp the angles themselves so leg boundaries (az 100 → 160) swing rather than cut
      m.az ??= { az, dist, el };
      const k = damp(0.9, dt);
      m.az.az += (az - m.az.az) * k; m.az.dist += (dist - m.az.dist) * k; m.az.el += (el - m.az.el) * k;
      const dir = m.h.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(m.az.az));
      const elr = THREE.MathUtils.degToRad(m.az.el);
      desired = dir.multiplyScalar(m.az.dist * Math.cos(elr)).add(new THREE.Vector3(0, m.az.dist * Math.sin(elr), 0));
      rate = 2;
    }

    // Two cascaded swings (goal follows desired, offset follows goal) keep the camera's velocity continuous,
    // so framing changes and side flips start and stop gently instead of kicking.
    if (!m.started) { m.started = true; m.off.copy(desired); m.goal = desired.clone(); m.tgt.copy(tgtGoal); } // snap on mount
    else if (idle()) { swingOffset(m.goal, desired, damp(rate, dt), dt); swingOffset(m.off, m.goal, damp(rate * 2.5, dt), dt); }
    else { m.off.copy(camera.position).sub(controls.target).y -= m.lift; m.goal.copy(m.off); } // viewer owns the offset
    m.tgt.lerp(tgtGoal, damp(tgtRate, dt));
    const cam = m.tgt.clone().add(m.off);
    const need = liftNeeded(S, cam, m.tgt);
    m.lift += (need - m.lift) * damp(need > m.lift ? 5 : 0.6, dt); // rise quickly, settle slowly
    cam.y += m.lift;
    controls.target.copy(m.tgt);
    camera.position.copy(cam);
    if (window.__camlog) window.__camlog.push([cam.x, cam.y, cam.z, m.tgt.x, m.tgt.y, m.tgt.z, m.lift, need, st.s, window.__clockT]);
  });
  return null;
}

// ---------- scene ----------
export function RouteScene({ variant, route, clock, stateRef }) {
  const geom = useMemo(() => buildRibbon(route), [route]);
  const tl = useMemo(() => buildTimeline(variant, route), [variant, route]);
  const posRef = useRef(new THREE.Vector3()), altRef = useRef(0), headingRef = useRef(new THREE.Vector3(0, 0, -1));
  const uni = useRef({ prog: 0, draw: 0, leg0: 0, leg1: 0 });
  useEffect(() => { clock.T = tl.T; clock.t = 0; clock.playing = true; }, [tl]);
  useFrame((_, dt) => {
    if (clock.playing && !clock.scrubbing) clock.t = Math.min(tl.T, clock.t + (window.__fixedDt ?? Math.min(dt, 0.05)) * clock.speed);
    if (clock.t >= tl.T) clock.playing = false;
    window.__clockT = clock.t;
    const { s, seg, u } = tl.at(clock.t);
    posAtS(route.pts, route.s, s, posRef.current);
    altRef.current = altAtS(route, s);
    headingRef.current.copy(headingAt(route, s, 30, 60));
    const U = uni.current;
    U.prog = s;
    U.draw = seg.type === 'sweep' ? route.L * inOutCubic(u) : route.L;
    if (variant === 'C') {
      const legStart = seg.type === 'move' ? seg.s0 : s;
      const nextStop = route.stops.find((st) => st.s > s + 1);
      U.leg0 = legStart;
      U.leg1 = seg.type === 'move' ? seg.s1 : seg.type === 'dwell' && u > 0.55 && nextStop ? nextStop.s : s;
    }
    Object.assign(stateRef.current, { s, seg: { ...seg, u }, pos: posRef.current, alt: altRef.current, T: tl.T });
  });

  return (
    <>
      {variant === 'A' && <Ribbon route={route} geom={geom} mode={0} px={4} worldW={0.008} color="#ff9a52" head="#fff3d6" opacity={0.3} xray uniformsRef={uni} />}
      {variant === 'A' && <Ribbon route={route} geom={geom} mode={0} px={4} worldW={0.008} color="#ff9a52" head="#fff3d6" uniformsRef={uni} />}
      {variant === 'B' && (
        <>
          <Ribbon route={route} geom={geom} mode={1} px={2.5} worldW={0} color="#ffffff" head="#ffc27a" opacity={0.18} xray uniformsRef={uni} />
          <Ribbon route={route} geom={geom} mode={1} px={2.5} worldW={0} color="#ffffff" head="#ffc27a" uniformsRef={uni} />
        </>
      )}
      {variant === 'C' && <Ribbon route={route} geom={geom} mode={2} px={3.5} worldW={0.006} color="#c9c2d8" head="#ffb36b" opacity={0.3} xray uniformsRef={uni} />}
      {variant === 'C' && <Ribbon route={route} geom={geom} mode={2} px={3.5} worldW={0.006} color="#c9c2d8" head="#ffb36b" uniformsRef={uni} />}
      {variant === 'A' && <CometClimber posRef={posRef} />}
      {variant === 'B' && <PinClimber posRef={posRef} altRef={altRef} />}
      {variant === 'C' && <FigureClimber posRef={posRef} headingRef={headingRef} />}
      <StopMarkers variant={variant} route={route} progRef={uni} />
      <CameraRig variant={variant} route={route} stateRef={stateRef} />
    </>
  );
}

export { useRoute };

// ---------- DOM overlays ----------
function useTicker() {
  const [, set] = useState(0);
  useEffect(() => { let id; const f = () => { set((x) => x + 1); id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => cancelAnimationFrame(id); }, []);
}

function Transport({ clock }) {
  useTicker();
  const T = clock.T || 1;
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      if (e.code === 'Space') { e.preventDefault(); if (clock.t >= clock.T) clock.t = 0; clock.playing = !clock.playing; }
    };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, [clock]);
  return (
    <div className="rt-transport">
      <button onClick={() => { if (clock.t >= clock.T) clock.t = 0; clock.playing = !clock.playing; }} aria-label={clock.playing ? 'Pause' : 'Play'}>
        {clock.playing ? '❚❚' : '▶'}
      </button>
      <button onClick={() => { clock.t = 0; clock.playing = true; }} aria-label="Restart">↺</button>
      <input type="range" min={0} max={T} step={0.01} value={clock.t}
        onPointerDown={() => { clock.scrubbing = true; }} onPointerUp={() => { clock.scrubbing = false; }}
        onChange={(e) => { clock.t = +e.target.value; }} />
      <span className="rt-time">{clock.t.toFixed(1)} / {T.toFixed(0)} s</span>
      <select value={clock.speed} onChange={(e) => { clock.speed = +e.target.value; }}>
        {[0.5, 1, 2, 4].map((v) => <option key={v} value={v}>{v}×</option>)}
      </select>
    </div>
  );
}

function Profile({ route, stateRef }) {
  useTicker();
  const W = 640, H = 90, pad = 8;
  const min = Math.min(...route.alt), max = Math.max(...route.alt);
  const x = (s) => pad + (s / route.L) * (W - 2 * pad), y = (a) => H - 18 - ((a - min) / (max - min)) * (H - 34);
  const d = useMemo(() => {
    let p = '';
    for (let i = 0; i < route.s.length; i += 4) p += `${i ? 'L' : 'M'}${x(route.s[i]).toFixed(1)},${y(route.alt[i]).toFixed(1)}`;
    return p;
  }, [route]);
  const s = stateRef.current.s ?? 0;
  return (
    <svg className="rt-profile" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Elevation profile">
      <defs><clipPath id="rtdone"><rect x="0" y="0" width={x(s)} height={H} /></clipPath></defs>
      <path d={`${d}L${x(route.L)},${H - 18}L${x(0)},${H - 18}Z`} fill="rgba(255,255,255,.08)" />
      <path d={d} stroke="rgba(255,255,255,.45)" strokeWidth="1.2" fill="none" />
      <path d={`${d}L${x(route.L)},${H - 18}L${x(0)},${H - 18}Z`} fill="rgba(255,160,90,.35)" clipPath="url(#rtdone)" />
      <path d={d} stroke="#ffc27a" strokeWidth="2" fill="none" clipPath="url(#rtdone)" />
      {route.stops.map((st, i) => (
        <g key={i} opacity={st.s <= s + 1 ? 1 : 0.45}>
          <line x1={x(st.s)} x2={x(st.s)} y1={y(st.alt) - 4} y2={H - 18} stroke="#fff" strokeWidth=".8" strokeDasharray="2 2" />
          <text x={x(st.s)} y={H - 6} fontSize="8" fill="#fff" textAnchor="middle">{short(st.name)}</text>
        </g>
      ))}
      <circle cx={x(s)} cy={y(stateRef.current.alt ?? min)} r="4" fill="#ff7a3d" stroke="#fff" />
      <text x={W - pad} y={12} fontSize="10" fill="#fff" textAnchor="end">{Math.round(stateRef.current.alt ?? 0).toLocaleString('en')} m · {(s / 1000).toFixed(1)} / {(route.L / 1000).toFixed(1)} km</text>
    </svg>
  );
}
const short = (n) => n.replace('Everest Base Camp (South)', 'EBC').replace('Mount Everest summit', 'Summit').replace(/ \(.*\)/, '').replace('South Summit · Hillary Step', 'S.Summit');

function LowerThird({ route, stateRef }) {
  useTicker();
  const seg = stateRef.current.seg;
  const stop = seg?.type === 'dwell' ? seg.stop : null;
  const legs = route.stops.length - 1;
  const [shown, setShown] = useState(null);
  useEffect(() => { if (stop) setShown(stop); }, [stop?.s]);
  const visible = !!stop;
  const i = shown ? route.stops.indexOf(shown) : 0;
  const next = route.stops[i + 1];
  return (
    <div className={`rt-third ${visible ? 'in' : ''}`}>
      {shown && (
        <>
          <div className="rt-third-k">{i === 0 ? 'Start' : i === legs ? 'Summit' : `Leg ${i} of ${legs}`}</div>
          <div className="rt-third-n">{shown.name}</div>
          <div className="rt-third-a">{shown.alt.toLocaleString('en')} m · {Math.round(shown.alt * 3.28084).toLocaleString('en')} ft</div>
          {next && <div className="rt-third-next">Next: {next.name} · +{(next.alt - shown.alt).toLocaleString('en')} m over {((next.s - shown.s) / 1000).toFixed(1)} km</div>}
        </>
      )}
    </div>
  );
}

export function RouteOverlay({ variant, route, clock, stateRef }) {
  if (!route) return null;
  return (
    <>
      <div className="rt-title">
        <b>South Col route</b>
        <span>{(route.L / 1000).toFixed(1)} km · {route.stops.length} stops · {route.credit}</span>
        <span className="rt-hint">{variant === 'C' ? 'Drag to look around; the drone takes over again after 2.5 s.' : 'Drag to orbit around the climber; framing eases back after 2.5 s.'} Space: play/pause.</span>
      </div>
      {variant === 'B' && <Profile route={route} stateRef={stateRef} />}
      {variant === 'C' && <LowerThird route={route} stateRef={stateRef} />}
      <Transport clock={clock} />
    </>
  );
}
