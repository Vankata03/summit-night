// PROTOTYPE — throwaway. Not production code: no tests, no error handling.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { loadDem, buildGeometry, buildNormalTexture, buildBakedTexture, worldPos } from './terrain.js';
import { useGpuLightBake } from './gpuBake.js';
import { terrainVertex, terrainFragment, skyVertex, skyFragment } from './shaders.js';

const VARIANTS = [
  { key: 'A', name: 'Painted relief', note: 'CPU-baked hypsometric tint × hillshade; shader only samples a texture. Static light.' },
  { key: 'B', name: 'Lit snow', note: 'Real-time: snow by altitude + slope, warm low sun, cool sky fill, earth shadow rising.' },
  { key: 'D', name: 'Lit snow + detail', note: 'B plus ridge shadows + AO baked on the GPU on each dusk change, procedural detail normals below 30 m, broken snow line, strata, Yellow Band. Forces the 30 m normal texture.' },
  { key: 'C', name: 'Contour ink', note: 'Toon light bands + 100 m contours, 500 m index lines. Graphic, map-like.' },
];

const params = () => new URLSearchParams(location.search);
function useParam(name, fallback) {
  const [v, setV] = useState(() => params().get(name) ?? fallback);
  const set = (nv) => {
    const p = params();
    p.set(name, nv);
    history.replaceState(null, '', `?${p}`);
    setV(String(nv));
  };
  return [v, set];
}

// dusk 0 = sun just above horizon, whole mountain lit; 1 = sun set, only the summit catches light.
function sunFromDusk(dusk) {
  const az = THREE.MathUtils.degToRad(292); // mid/late-May sunset azimuth, WNW
  const el = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(7, 1.5, dusk));
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
}

function Terrain({ dem, variant, step, useNormalTex, ex, dusk }) {
  const geom = useMemo(() => buildGeometry(dem, step, ex), [dem, step, ex]);
  const normalTex = useMemo(() => buildNormalTexture(dem, ex), [dem, ex]);
  const baked = useMemo(() => (variant === 0 ? buildBakedTexture(dem, ex) : null), [dem, ex, variant]);
  const lightTex = useGpuLightBake(dem, ex, sunFromDusk(dusk), variant === 3);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: terrainVertex,
        fragmentShader: terrainFragment,
        defines: { VARIANT: variant },
        uniforms: {
          uEx: { value: ex },
          uNormalTex: { value: normalTex },
          uBaked: { value: baked },
          uLightTex: { value: lightTex },
          uUseNormalTex: { value: useNormalTex },
          uSunDir: { value: new THREE.Vector3() },
          uShadowLine: { value: 0 },
          uFogColor: { value: new THREE.Color('#5a4a72') },
          uFogDensity: { value: 0.012 },
        },
      }),
    [variant, normalTex, baked, lightTex],
  );
  mat.uniforms.uEx.value = ex;
  mat.uniforms.uUseNormalTex.value = useNormalTex || variant === 3;
  mat.uniforms.uSunDir.value.copy(sunFromDusk(dusk));
  mat.uniforms.uShadowLine.value = THREE.MathUtils.lerp(2500, 8650, dusk);
  useEffect(() => () => geom.dispose(), [geom]);
  return <mesh geometry={geom} material={mat} />;
}

function Sky({ dusk }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uSunDir: { value: new THREE.Vector3() },
          uHorizon: { value: new THREE.Color() },
          uZenith: { value: new THREE.Color() },
        },
      }),
    [],
  );
  mat.uniforms.uSunDir.value.copy(sunFromDusk(dusk));
  mat.uniforms.uHorizon.value.set('#e8a08a').lerp(new THREE.Color('#6a4f7a'), dusk);
  mat.uniforms.uZenith.value.set('#3a4a8a').lerp(new THREE.Color('#141433'), dusk);
  return (
    <mesh material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[400, 32, 16]} />
    </mesh>
  );
}

// Takes over the render loop so it can wrap each frame in a GPU timer query (WebGL2 + EXT_disjoint_timer_query_webgl2).
function Stats({ outRef }) {
  const { gl, scene, camera } = useThree();
  const s = useRef({ ext: null, queries: [], gpu: [], cpu: [], frames: 0, t0: performance.now() });
  useEffect(() => {
    s.current.ext = gl.getContext().getExtension('EXT_disjoint_timer_query_webgl2');
  }, [gl]);
  useFrame(() => {
    const st = s.current, ctx = gl.getContext();
    let q = null;
    if (st.ext) {
      q = ctx.createQuery();
      ctx.beginQuery(st.ext.TIME_ELAPSED_EXT, q);
    }
    const c0 = performance.now();
    gl.render(scene, camera);
    st.cpu.push(performance.now() - c0);
    if (q) {
      ctx.endQuery(st.ext.TIME_ELAPSED_EXT);
      st.queries.push(q);
    }
    while (st.queries.length && ctx.getQueryParameter(st.queries[0], ctx.QUERY_RESULT_AVAILABLE)) {
      const done = st.queries.shift();
      if (!ctx.getParameter(st.ext.GPU_DISJOINT_EXT)) st.gpu.push(ctx.getQueryParameter(done, ctx.QUERY_RESULT) / 1e6);
      ctx.deleteQuery(done);
    }
    st.frames++;
    const now = performance.now();
    if (now - st.t0 > 500 && outRef.current) {
      const avg = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : '—');
      const fps = (st.frames * 1000) / (now - st.t0);
      outRef.current.textContent =
        `fps ${fps.toFixed(0)}  ·  frame ${(1000 / fps).toFixed(1)} ms\n` +
        `gpu ${avg(st.gpu)} ms${st.ext ? '' : ' (no timer ext)'}  ·  cpu submit ${avg(st.cpu)} ms\n` +
        `triangles ${gl.info.render.triangles.toLocaleString()}  ·  draw calls ${gl.info.render.calls}\n` +
        `dpr ${gl.getPixelRatio()}  ·  ${gl.domElement.width}×${gl.domElement.height} px`;
      st.frames = 0; st.gpu = []; st.cpu = []; st.t0 = now;
    }
  }, 1);
  return null;
}

function Switcher({ current, onChange }) {
  const i = VARIANTS.findIndex((v) => v.key === current);
  const go = (d) => onChange(VARIANTS[(i + d + VARIANTS.length) % VARIANTS.length].key);
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t.closest?.('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });
  const btn = { background: 'none', border: 0, color: '#111', font: 'inherit', fontSize: 18, padding: '4px 12px', cursor: 'pointer' };
  return (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', background: '#ffe14d', color: '#111', borderRadius: 999, boxShadow: '0 4px 16px rgba(0,0,0,.5)', fontWeight: 600, zIndex: 10, whiteSpace: 'nowrap' }}>
      <button style={btn} onClick={() => go(-1)} aria-label="Previous variant">←</button>
      <span>{current} ({VARIANTS[i].name})</span>
      <button style={btn} onClick={() => go(1)} aria-label="Next variant">→</button>
    </div>
  );
}

export default function App() {
  const [dem, setDem] = useState(null);
  const [variantKey, setVariant] = useParam('variant', 'B');
  const [res, setRes] = useParam('res', '1');
  const [nmap, setNmap] = useParam('nmap', '0');
  const [ex, setEx] = useParam('ex', '1');
  const [dpr, setDpr] = useParam('dpr', 'native');
  const [dusk, setDusk] = useState(0.35);
  const statsRef = useRef();
  useEffect(() => { loadDem().then(setDem); }, []);

  const vIndex = Math.max(0, VARIANTS.findIndex((v) => v.key === variantKey));
  const define = { A: 0, B: 1, C: 2, D: 3 }[VARIANTS[vIndex].key];
  const target = useMemo(() => (dem ? worldPos(dem, dem.peakRow, dem.peakCol, +ex) : null), [dem, ex]);
  if (!dem) return <div style={{ padding: 24 }}>Loading DEM…</div>;

  const step = +res;
  const meshInfo = `${Math.floor((dem.width - 1) / step) + 1}×${Math.floor((dem.height - 1) / step) + 1} vertices · ${dem.cell * step} m spacing`;
  const panel = { position: 'fixed', top: 12, left: 12, width: 'min(320px, calc(100vw - 48px))', padding: 12, background: 'rgba(10,8,20,.78)', borderRadius: 10, zIndex: 10, backdropFilter: 'blur(6px)' };
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, margin: '6px 0' };

  return (
    <>
      <Canvas
        dpr={dpr === 'native' ? [1, 2] : 1}
        camera={{ fov: 45, near: 0.05, far: 1000, position: params().get('cam') === 'close' ? [target.x - 2.2, target.y + 0.3, target.z + 3] : [target.x - 9, target.y - 0.6, target.z + 12] }}
        gl={{ antialias: true }}
      >
        <Sky dusk={dusk} />
        <Terrain dem={dem} variant={define} step={step} useNormalTex={nmap === '1'} ex={+ex} dusk={dusk} />
        <OrbitControls target={target} enableDamping maxPolarAngle={Math.PI * 0.49} minDistance={1} maxDistance={60} />
        <Stats outRef={statsRef} />
      </Canvas>

      <div style={panel}>
        <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6 }}>PROTOTYPE · TERRAIN LOOK</div>
        <div style={{ fontWeight: 600, margin: '4px 0' }}>{variantKey} — {VARIANTS[vIndex].name}</div>
        <div style={{ opacity: 0.75, fontSize: 12 }}>{VARIANTS[vIndex].note}</div>
        <hr style={{ border: 0, borderTop: '1px solid #ffffff22' }} />
        <label style={row}>
          Mesh
          <select value={res} onChange={(e) => setRes(e.target.value)}>
            <option value="1">full (30 m)</option>
            <option value="2">half (60 m)</option>
            <option value="4">quarter (120 m)</option>
          </select>
        </label>
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: -4 }}>{meshInfo}</div>
        <label style={row}>
          30 m normal texture
          <input type="checkbox" checked={nmap === '1'} onChange={(e) => setNmap(e.target.checked ? '1' : '0')} />
        </label>
        <label style={row}>
          Vertical exaggeration
          <select value={ex} onChange={(e) => setEx(e.target.value)}>
            <option value="1">1.0×</option>
            <option value="1.25">1.25×</option>
            <option value="1.5">1.5×</option>
          </select>
        </label>
        <label style={row}>
          Pixel ratio
          <select value={dpr} onChange={(e) => setDpr(e.target.value)}>
            <option value="native">native (≤2)</option>
            <option value="1">1</option>
          </select>
        </label>
        <label style={row}>
          Dusk
          <input type="range" min="0" max="1" step="0.01" value={dusk} onChange={(e) => setDusk(+e.target.value)} />
        </label>
        <pre ref={statsRef} style={{ margin: '8px 0 0', fontSize: 11, whiteSpace: 'pre-wrap', opacity: 0.85 }} />
        <div style={{ fontSize: 9, opacity: 0.45, marginTop: 6 }}>{dem.credit}</div>
      </div>
      <Switcher current={VARIANTS[vIndex].key} onChange={setVariant} />
    </>
  );
}
