// PROTOTYPE — throwaway. Not production code: no tests, no error handling.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ChunkTerrain from './ChunkTerrain.jsx';
import { loadDem10, loadDem, buildGeometry, buildNormalTexture, buildBakedTexture, worldPos } from './terrain.js';
import { useGpuLightBake } from './gpuBake.js';
import { SPOT_VARIANTS, SpotlightScene, SpotlightOverlay, useSpotlightState } from './Spotlight.jsx';
import './spotlight.css';
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
  const { light: lightTex, ao: aoTex } = useGpuLightBake(dem, ex, sunFromDusk(dusk), variant === 3);
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
          uAOTex: { value: aoTex },
          uUseNormalTex: { value: useNormalTex },
          uSunDir: { value: new THREE.Vector3() },
          uShadowLine: { value: 0 },
          uFogColor: { value: new THREE.Color('#5a4a72') },
          uFogDensity: { value: 0.012 },
        },
      }),
    [variant, normalTex, baked, lightTex, aoTex],
  );
  mat.uniforms.uEx.value = ex;
  mat.uniforms.uUseNormalTex.value = useNormalTex || variant === 3;
  mat.uniforms.uSunDir.value.copy(sunFromDusk(dusk));
  mat.uniforms.uShadowLine.value = THREE.MathUtils.lerp(2500, 8650, dusk);
  useEffect(() => () => geom.dispose(), [geom]);
  return <mesh geometry={geom} material={mat} />;
}

function ChunkTerrainLit({ dem, dem10, variant, ex, dusk, lodScale }) {
  const sun = sunFromDusk(dusk);
  const lightTex = useGpuLightBake(dem10, ex, sun, true); // shadows + AO baked at 10 m
  return (
    <ChunkTerrain dem10={dem10} dem30={dem} variant={variant} ex={ex} sunDir={sun} lodScale={lodScale}
      shadowLine={THREE.MathUtils.lerp(2500, 8650, dusk)} lightTex={lightTex}
      onLodStats={(c) => { window.__lod = c; }} />
  );
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
        (window.__lod ? `chunks per level 10/20/40/80/160 m: ${window.__lod.join(' / ')}\n` : '') +
        `dpr ${gl.getPixelRatio()}  ·  ${gl.domElement.width}×${gl.domElement.height} px`;
      st.frames = 0; st.gpu = []; st.cpu = []; st.t0 = now;
    }
  }, 1);
  return null;
}

function Switcher({ current, onChange }) {
  const i = SPOT_VARIANTS.findIndex((v) => v.key === current);
  const go = (d) => onChange(SPOT_VARIANTS[(i + d + SPOT_VARIANTS.length) % SPOT_VARIANTS.length].key);
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
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', background: '#ffe14d', color: '#111', borderRadius: 999, boxShadow: '0 4px 16px rgba(0,0,0,.5)', fontWeight: 600, zIndex: 100, whiteSpace: 'nowrap' }}>
      <button style={btn} onClick={() => go(-1)} aria-label="Previous variant">←</button>
      <span>{current} ({SPOT_VARIANTS[i].name})</span>
      <button style={btn} onClick={() => go(1)} aria-label="Next variant">→</button>
    </div>
  );
}

export default function App() {
  // Spotlight prototype (#8): terrain look fixed to the chosen "Lit snow + detail" on the 10 m chunked LOD (#7).
  const [dem, setDem] = useState(null);
  const [dem10, setDem10] = useState(null);
  const [variantKey, setVariant] = useParam('variant', 'A');
  const ex = 1, dusk = 0.35;
  useEffect(() => { loadDem().then(setDem); loadDem10().then(setDem10); }, []);
  const statsRef = useRef();
  const variant = SPOT_VARIANTS.some((v) => v.key === variantKey) ? variantKey : 'A';
  const target = useMemo(() => (dem ? worldPos(dem, dem.peakRow, dem.peakCol, ex) : null), [dem]);
  const spotState = useSpotlightState(dem, ex);
  if (!dem || !dem10) return <div style={{ padding: 24 }}>Loading DEM…</div>;
  return (
    <>
      <Canvas dpr={[1, 2]} camera={{ fov: 45, near: 0.05, far: 1000, position: [target.x - 9, target.y - 0.6, target.z + 12] }} gl={{ antialias: true }}>
        <Sky dusk={dusk} />
        <ChunkTerrainLit dem={dem} dem10={dem10} variant={3} ex={ex} dusk={dusk} lodScale={1} />
        <OrbitControls makeDefault target={target} enableDamping maxPolarAngle={Math.PI * 0.49} minDistance={0.3} maxDistance={60} />
        <SpotlightScene dem={dem} ex={ex} variant={variant} state={spotState} />
        <Stats outRef={statsRef} />
      </Canvas>
      <SpotlightOverlay variant={variant} state={spotState} />
      <pre ref={statsRef} style={{ position: 'fixed', left: 12, bottom: 4, margin: 0, fontSize: 10, opacity: 0.45, pointerEvents: 'none', zIndex: 1 }} />
      <Switcher current={variant} onChange={setVariant} />
    </>
  );
}
