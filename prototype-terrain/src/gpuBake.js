// PROTOTYPE — throwaway. Bakes cast shadow (R) and ambient occlusion (G) per DEM cell on the GPU,
// into a W×H render target, once per sun/exaggeration change. Replaces the CPU bake that blocked the main thread.
import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const frag = /* glsl */ `
uniform sampler2D uHeight;
uniform vec2 uSize;
uniform vec3 uSun;
uniform float uEx;
uniform float uCell;
uniform int uMode; // 0 = shadow + AO, 1 = shadow only, 2 = AO only
float H(vec2 c) { return texture2D(uHeight, (clamp(c, vec2(0.0), uSize - 1.0) + 0.5) / uSize).r * uEx; }
bool inside(vec2 c) { return all(greaterThanEqual(c, vec2(0.0))) && all(lessThan(c, uSize)); }
float horizon(vec2 c, float h0, vec2 dir, float maxD) {
  float maxT = -1.0, d = 1.0;
  for (int i = 0; i < 96; i++) {
    vec2 q = c + dir * d;
    if (!inside(q) || d > maxD) break;
    maxT = max(maxT, (H(q) - h0) / (d * uCell));
    d = max(d + 1.0, d * 1.1);
  }
  return maxT;
}
void main() {
  vec2 c = gl_FragCoord.xy - 0.5;           // (col, row): same orientation as the DEM textures
  float h0 = H(c);
  float len = length(uSun.xz);
  float tanSun = uSun.y / len;
  float shadow = 1.0;
  if (uMode != 2) shadow = clamp((tanSun - horizon(c, h0, uSun.xz / len, 21000.0 / uCell)) / 0.03 + 0.5, 0.0, 1.0);
  float occ = 0.0;
  if (uMode != 1) for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.7853982;
    float t = max(horizon(c, h0, vec2(cos(a), sin(a)), 3300.0 / uCell), 0.0);
    occ += t / sqrt(1.0 + t * t);
  }
  gl_FragColor = vec4(shadow, 1.0 - occ / 8.0, 0.0, 1.0);
}`;

function makeBaker(dem) {
  const { width: W, height: H, data, cell } = dem;
  const heightTex = new THREE.DataTexture(data, W, H, THREE.RedFormat, THREE.FloatType);
  heightTex.minFilter = heightTex.magFilter = THREE.NearestFilter;
  heightTex.needsUpdate = true;
  const rt = () => new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  const mat = new THREE.ShaderMaterial({
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: frag,
    uniforms: {
      uHeight: { value: heightTex }, uSize: { value: new THREE.Vector2(W, H) },
      uSun: { value: new THREE.Vector3(0, 1, 0) }, uEx: { value: 1 }, uCell: { value: cell }, uMode: { value: 0 },
    },
  });
  const scene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  scene.add(quad);
  return { shadowRT: rt(), aoRT: rt(), mat, scene, cam: new THREE.Camera(), heightTex };
}

function renderInto(gl, b, rt) {
  const prev = gl.getRenderTarget();
  gl.setRenderTarget(rt);
  gl.render(b.scene, b.cam);
  gl.setRenderTarget(prev);
}

// Returns { light, ao }: light.r = cast shadow (re-baked per sun change), ao.g = ambient occlusion (once per dem/ex).
export function useGpuLightBake(dem, ex, sun, enabled) {
  const gl = useThree((s) => s.gl);
  const b = useMemo(() => (enabled ? makeBaker(dem) : null), [dem, enabled]);
  useEffect(() => {
    if (!b) return;
    b.mat.uniforms.uEx.value = ex; b.mat.uniforms.uMode.value = 2;
    renderInto(gl, b, b.aoRT);
  }, [b, ex, gl]);
  useEffect(() => {
    if (!b) return;
    b.mat.uniforms.uSun.value.copy(sun); b.mat.uniforms.uEx.value = ex; b.mat.uniforms.uMode.value = 1;
    renderInto(gl, b, b.shadowRT);
  }, [b, ex, sun.x, sun.y, sun.z, gl]);
  useEffect(() => () => b && (b.shadowRT.dispose(), b.aoRT.dispose(), b.heightTex.dispose(), b.mat.dispose()), [b]);
  return b ? { light: b.shadowRT.texture, ao: b.aoRT.texture } : { light: null, ao: null };
}
