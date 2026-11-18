// PROTOTYPE — throwaway. Chunked LOD terrain over the 10 m heightfield.
// The grid is split into 64-cell (640 m) chunks. Each frame every chunk is frustum-tested and given a level:
// step 1/2/4/8/16 cells (10/20/40/80/160 m) by camera distance. One instanced draw per level; skirts hide cracks.
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildNormalTexture } from './terrain.js';
import { chunkVertex, terrainFragment } from './shaders.js';

const CHUNK = 64;
const STEPS = [1, 2, 4, 8, 16];

function levelGeometry(step) {
  const n = CHUNK / step + 1;
  const local = [], skirt = [], idx = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { local.push(c * step, r * step); skirt.push(0); }
  // skirt ring: duplicate edge vertices, pushed down in the shader
  const ring = [];
  for (let c = 0; c < n; c++) ring.push([0, c]);
  for (let r = 1; r < n; r++) ring.push([r, n - 1]);
  for (let c = n - 2; c >= 0; c--) ring.push([n - 1, c]);
  for (let r = n - 2; r > 0; r--) ring.push([r, 0]);
  const base = n * n;
  ring.forEach(([r, c]) => { local.push(c * step, r * step); skirt.push(1); });
  for (let r = 0; r < n - 1; r++)
    for (let c = 0; c < n - 1; c++) {
      const a = r * n + c, b = a + 1, d = a + n, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    const [r0, c0] = ring[i], [r1, c1] = ring[j];
    const t0 = r0 * n + c0, t1 = r1 * n + c1, s0 = base + i, s1 = base + j;
    idx.push(t0, s0, t1, t1, s0, s1, t0, t1, s0, t1, s1, s0); // both windings: skirt visible from either side
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(local.length / 2 * 3), 3));
  g.setAttribute('aLocal', new THREE.Float32BufferAttribute(local, 2));
  g.setAttribute('aSkirt', new THREE.Float32BufferAttribute(skirt, 1));
  g.setIndex(idx);
  return g;
}

export default function ChunkTerrain({ dem10, dem30, variant, ex, sunDir, shadowLine, lightTex, lodScale, onLodStats }) {
  const { width: W, height: H, data } = dem10;
  const cols = Math.ceil((W - 1) / CHUNK), rows = Math.ceil((H - 1) / CHUNK);

  const heightTex = useMemo(() => {
    const t = new THREE.DataTexture(data, W, H, THREE.RedFormat, THREE.FloatType);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  }, [dem10]);
  const normalTex = useMemo(() => buildNormalTexture(dem10, ex), [dem10, ex]);

  // Per-chunk bounding boxes (world km) from the 10 m data.
  const boxes = useMemo(() => {
    const out = [];
    for (let cr = 0; cr < rows; cr++)
      for (let cc = 0; cc < cols; cc++) {
        let lo = Infinity, hi = -Infinity;
        for (let r = cr * CHUNK; r <= Math.min(H - 1, (cr + 1) * CHUNK); r += 4)
          for (let c = cc * CHUNK; c <= Math.min(W - 1, (cc + 1) * CHUNK); c += 4) {
            const h = data[r * W + c]; if (h < lo) lo = h; if (h > hi) hi = h;
          }
        const x0 = (cc * CHUNK - (W - 1) / 2) * 0.01, z0 = (cr * CHUNK - (H - 1) / 2) * 0.01;
        out.push({
          cc, cr,
          box: new THREE.Box3(new THREE.Vector3(x0, lo / 1000 - 0.2, z0), new THREE.Vector3(x0 + CHUNK * 0.01, hi / 1000 + 0.05, z0 + CHUNK * 0.01)),
        });
      }
    return out;
  }, [dem10]);

  const levels = useMemo(() => STEPS.map((step) => {
    const geom = levelGeometry(step);
    const attr = new THREE.InstancedBufferAttribute(new Float32Array(boxes.length * 2), 2);
    attr.setUsage(THREE.DynamicDrawUsage);
    geom.setAttribute('aChunk', attr);
    geom.instanceCount = 0;
    return { step, geom, attr };
  }), [boxes]);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: chunkVertex,
    fragmentShader: terrainFragment,
    defines: { VARIANT: variant },
    uniforms: {
      uHeight: { value: heightTex },
      uSize10: { value: new THREE.Vector2(W, H) },
      uSize30: { value: new THREE.Vector2(dem30.width, dem30.height) },
      uEx: { value: ex },
      uNormalTex: { value: normalTex },
      uBaked: { value: null },
      uLightTex: { value: lightTex.light },
      uAOTex: { value: lightTex.ao },
      uUseNormalTex: { value: true },
      uSunDir: { value: new THREE.Vector3() },
      uShadowLine: { value: 0 },
      uFogColor: { value: new THREE.Color('#5a4a72') },
      uFogDensity: { value: 0.012 },
    },
  }), [variant, heightTex, normalTex, lightTex]);
  mat.uniforms.uEx.value = ex;
  mat.uniforms.uSunDir.value.copy(sunDir);
  mat.uniforms.uShadowLine.value = shadowLine;

  useEffect(() => () => { levels.forEach((l) => l.geom.dispose()); }, [levels]);

  const frustum = useMemo(() => new THREE.Frustum(), []);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    m4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(m4);
    const counts = levels.map(() => 0);
    const base = 8 * lodScale; // km: 10 m level under base/2, then doubling per octave of distance (~2-3 px triangles at 1400 px, 45° fov)
    for (const { cc, cr, box } of boxes) {
      // scale box Y by exaggeration for culling
      if (ex !== 1) { box.min.y *= ex; box.max.y *= ex; }
      const visible = frustum.intersectsBox(box);
      const d = box.distanceToPoint(camera.position);
      if (ex !== 1) { box.min.y /= ex; box.max.y /= ex; }
      if (!visible) continue;
      const li = Math.min(STEPS.length - 1, Math.max(0, Math.floor(Math.log2(Math.max(d, 0.001) / base) + 1)));
      const l = levels[li], i = counts[li]++;
      l.attr.array[i * 2] = cc * CHUNK; l.attr.array[i * 2 + 1] = cr * CHUNK;
    }
    levels.forEach((l, i) => { l.geom.instanceCount = counts[i]; l.attr.needsUpdate = true; });
    onLodStats?.(counts);
  });

  return levels.map((l) => <mesh key={l.step} geometry={l.geom} material={mat} frustumCulled={false} />);
}
