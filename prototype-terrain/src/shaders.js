// PROTOTYPE — throwaway. One terrain shader, three looks selected by #define VARIANT.
export const terrainVertex = /* glsl */ `
uniform float uEx;
varying vec2 vUv;
varying vec2 vUvL;
varying float vH;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vUvL = uv;
  vH = position.y / uEx * 1000.0;
  vNormal = normal;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const terrainFragment = /* glsl */ `
uniform sampler2D uNormalTex;
uniform sampler2D uBaked;
uniform sampler2D uLightTex;
uniform sampler2D uAOTex;
uniform bool uUseNormalTex;
uniform vec3 uSunDir;
uniform float uShadowLine;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec4 uSpot;       // spotlight: world xyz (km) + radius (km)
uniform float uSpotMode;  // 0 off, 1 theatre (dim rest + warm pool), 2 ring, 3 searchlight pool
uniform float uSpotK;     // 0..1 fade
uniform float uTime;
varying vec2 vUv;
varying vec2 vUvL;
varying float vH;
varying vec3 vNormal;
varying vec3 vWorld;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
// fbm whose octaves fade out once they get smaller than a pixel (no shimmer at distance)
float fbm(vec2 p, float px) {
  float s = 0.0, a = 0.5, f = 1.0;
  for (int i = 0; i < 5; i++) {
    float fade = 1.0 - smoothstep(0.25, 0.6, px * f);
    s += a * fade * (vnoise(p * f) - 0.5);
    f *= 2.07; a *= 0.5;
  }
  return s;
}

// Value noise with analytic derivative: returns (value, d/dx, d/dy) in one lookup.
vec3 noised(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
  float k = a - b - c + d;
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * (vec2(b - a, c - a) + k * u.yx));
}
// fbm (value, gradient), octaves fade below pixel size. 10 octaves: 100 m down to ~15 cm (only drawn up close).
vec3 fbmd(vec2 p, float px) {
  vec3 s = vec3(0.0); float a = 0.5, f = 1.0;
  for (int i = 0; i < 10; i++) {
    if (px * f > 0.6) break;
    float fade = 1.0 - smoothstep(0.25, 0.6, px * f);
    vec3 n = noised(p * f);
    s += a * fade * vec3(n.x - 0.5, n.yz * f);
    f *= 2.07; a *= 0.5;
  }
  return s;
}
// Triplanar: X plane uses (z, y), Y plane (x, z), Z plane (x, y). Returns (3D gradient, value). Skips weak planes.
vec4 triFbm(vec3 P, vec3 bw, float px) {
  vec4 r = vec4(0.0);
  if (bw.x > 0.02) { vec3 n = fbmd(P.zy, px);        r += vec4(0.0, n.z, n.y, n.x) * bw.x; }
  if (bw.y > 0.02) { vec3 n = fbmd(P.xz + 31.7, px); r += vec4(n.y, 0.0, n.z, n.x) * bw.y; }
  if (bw.z > 0.02) { vec3 n = fbmd(P.xy + 63.1, px); r += vec4(n.y, n.z, 0.0, n.x) * bw.z; }
  return r / max(bw.x * step(0.02, bw.x) + bw.y * step(0.02, bw.y) + bw.z * step(0.02, bw.z), 1e-3);
}

vec3 fogged(vec3 col) {
  float d = distance(vWorld, cameraPosition);
  float f = 1.0 - exp(-d * uFogDensity);
  float valley = smoothstep(4700.0, 3400.0, vH) * 0.75;   // valley fog pooled in the glaciers
  f = max(f, valley);
  return mix(col, uFogColor, f);
}

void main() {
  vec3 n = uUseNormalTex ? normalize(texture2D(uNormalTex, vUv).xyz * 2.0 - 1.0) : normalize(vNormal);
  float slope = 1.0 - n.y;
  float ndl = max(dot(n, uSunDir), 0.0);
  float lit = smoothstep(uShadowLine - 250.0, uShadowLine + 250.0, vH);  // earth's shadow rising up the mountain
  vec3 col;

#if VARIANT == 0
  // A — Painted relief: CPU-baked hypsometric tint × hillshade, sampled flat.
  col = texture2D(uBaked, vUv).rgb;
  col *= mix(0.55, 1.15, lit);
#elif VARIANT == 1
  // B — Lit snow: real-time alpenglow. Snow by altitude + slope, warm low sun, cool sky fill.
  float snow = smoothstep(5200.0, 5900.0, vH) * (1.0 - smoothstep(0.30, 0.45, slope));
  vec3 rock = mix(vec3(0.20, 0.16, 0.16), vec3(0.33, 0.28, 0.27), smoothstep(3000.0, 6500.0, vH));
  vec3 albedo = mix(rock, vec3(0.90, 0.92, 1.0), snow);
  vec3 sun = vec3(1.0, 0.42, 0.30) * 2.6 * ndl * lit;
  vec3 sky = mix(vec3(0.05, 0.05, 0.13), vec3(0.24, 0.23, 0.42), n.y * 0.5 + 0.5);
  col = albedo * (sun + sky);
#elif VARIANT == 3
  // D — Lit snow + detail: B plus baked cast shadows + AO, procedural detail normals, broken snow line, strata.
  float shadow = texture2D(uLightTex, vUvL).r, ao = texture2D(uAOTex, vUvL).g;
  vec3 P = vWorld * 10.0;                        // 1 unit = 100 m, true 3D (y includes exaggeration)
  float px = length(fwidth(P));
  vec3 bw = pow(abs(n), vec3(8.0)); bw /= bw.x + bw.y + bw.z;   // sharp blend keeps contrast
  vec4 tf = triFbm(P, bw, px);
  float n0 = tf.w;
  vec3 g3 = tf.xyz - n * dot(tf.xyz, n);         // keep only the tangential part of the detail gradient
  float slope30 = 1.0 - n.y;
  float snowN = fbm(P.xz * 0.6 + 13.1, px * 0.6);   // snow lies on gentle slopes: plan view is fine
  float sEdge = 0.03 + px * 0.02;                // crisp near, soft far (anti-aliased)
  float snow = smoothstep(5100.0 - sEdge * 4000.0, 5100.0 + sEdge * 4000.0, vH + snowN * 700.0)
             * (1.0 - smoothstep(0.36 + snowN * 0.2 - sEdge, 0.36 + snowN * 0.2 + sEdge, slope30));
  snow = max(snow, smoothstep(0.75, 0.9, ao) * smoothstep(5600.0, 6200.0, vH) * 0.6); // snow gathers in hollows up high
  float glacier = (1.0 - smoothstep(0.06, 0.14, slope30)) * smoothstep(4700.0, 5000.0, vH) * (1.0 - snow);
  // up close (< ~2 m per pixel) snow gets wind-packed ripples and keeps more of the micro relief
  float closeK = 1.0 - smoothstep(0.004, 0.03, px);
  vec2 wq = vec2(dot(P.xz, vec2(0.8, 0.6)) * 90.0, dot(P.xz, vec2(-0.6, 0.8)) * 22.0);
  vec3 rip = noised(wq + vec2(noised(wq * 0.3).x * 2.0, 0.0));
  vec3 g3r = vec3(0.8 * rip.y * 90.0 - 0.6 * rip.z * 22.0, 0.0, 0.6 * rip.y * 90.0 + 0.8 * rip.z * 22.0) * 0.0025 * closeK * snow; // chain rule back to P units
  vec3 dn = normalize(n - g3 * mix(0.6, 0.1 + 0.4 * closeK, snow) - g3r);
  float ndlD = max(dot(dn, uSunDir), 0.0);
  vec2 along = normalize(vec2(-n.z, n.x) + 1e-4);  // horizontal direction across the face
  vec2 sp = vec2(vH / 25.0, dot(P.xz, along) * 0.15);
  float strata = fbm(sp, length(fwidth(sp)));
  vec3 rock = mix(vec3(0.15, 0.12, 0.12), vec3(0.36, 0.30, 0.27), smoothstep(-0.12, 0.12, strata * 1.6 + n0));
  rock = mix(rock, vec3(0.50, 0.40, 0.24), smoothstep(8150.0, 8250.0, vH) * (1.0 - smoothstep(8450.0, 8550.0, vH))); // Yellow Band
  vec3 albedo = mix(rock, vec3(0.42, 0.40, 0.40), glacier);                 // debris-covered glacier
  albedo = mix(albedo, vec3(0.92, 0.94, 1.0) * (0.92 + n0 * 0.3), snow);
  vec3 sunC = vec3(1.0, 0.42, 0.30) * 3.0 * ndlD * lit * shadow;
  vec3 skyC = mix(vec3(0.04, 0.04, 0.11), vec3(0.24, 0.24, 0.45), dn.y * 0.5 + 0.5) * (0.35 + 0.65 * ao);
  col = albedo * (sunC + skyC);
#else
  // C — Contour ink: toon bands + 100 m contours, 500 m index lines. Graphic, map-like.
  float band = floor(ndl * lit * 3.0 + 0.5) / 3.0;
  vec3 shadowC = vec3(0.17, 0.13, 0.27);
  vec3 litC = mix(vec3(0.85, 0.48, 0.42), vec3(1.0, 0.86, 0.78), smoothstep(5000.0, 7500.0, vH));
  col = mix(shadowC, litC, band);
  col = mix(col, col * 1.25 + 0.05, smoothstep(0.55, 0.4, slope) * step(5200.0, vH)); // snowfields lighter
  float c1 = vH / 100.0, c5 = vH / 500.0;
  float l1 = 1.0 - smoothstep(0.0, fwidth(c1) * 1.0, abs(fract(c1 - 0.5) - 0.5));
  float l5 = 1.0 - smoothstep(0.0, fwidth(c5) * 1.6, abs(fract(c5 - 0.5) - 0.5));
  col = mix(col, vec3(0.10, 0.06, 0.16), max(l1 * 0.25, l5 * 0.6));
#endif

  if (uSpotMode > 0.5 && uSpotK > 0.001) {
    float d = length(vWorld.xz - uSpot.xz), r = uSpot.w;
    if (uSpotMode < 1.5) {
      float pool = exp(-(d * d) / (r * r) * 1.5);
      col *= mix(1.0, mix(0.32, 1.25, pool), uSpotK);
      col += vec3(1.0, 0.72, 0.42) * 0.10 * pool * uSpotK;
    } else if (uSpotMode < 2.5) {
      float w = fwidth(d) * 1.5 + r * 0.03;
      float ring = 1.0 - smoothstep(0.0, w, abs(d - r));
      float pr = mod(uTime * 0.6, 1.0);
      float pulse = (1.0 - smoothstep(0.0, w * 2.0, abs(d - r * (1.0 + pr * 1.5)))) * (1.0 - pr);
      float inside = 1.0 - smoothstep(r - w, r, d);
      col = mix(col, col * 1.15 + vec3(0.03, 0.025, 0.0), inside * uSpotK);
      col = mix(col, vec3(1.0, 0.86, 0.45), max(ring, pulse * 0.6) * uSpotK);
    } else {
      float edge = fwidth(d) * 2.0 + r * 0.06;
      float pool = 1.0 - smoothstep(r - edge, r, d);
      col = mix(col, col * 2.1 + vec3(0.06, 0.05, 0.035), pool * uSpotK);
      col *= mix(1.0, 0.8, (1.0 - pool) * uSpotK * exp(-d / (r * 6.0)));
    }
  }

  gl_FragColor = vec4(fogged(col), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

export const skyFragment = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uHorizon;
uniform vec3 uZenith;
varying vec3 vDir;
void main() {
  float y = max(vDir.y, 0.0);
  vec3 col = mix(uHorizon, uZenith, pow(y, 0.45));
  vec2 a = normalize(vDir.xz + 1e-5), s = normalize(uSunDir.xz + 1e-5);
  float glow = pow(max(dot(a, s), 0.0), 6.0) * (1.0 - smoothstep(0.0, 0.35, y));
  col += vec3(1.0, 0.45, 0.25) * glow * 0.55;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// Chunked LOD: one shared grid per level, instanced per chunk, heights fetched from the 10 m texture.
export const chunkVertex = /* glsl */ `
attribute vec2 aLocal;
attribute float aSkirt;
attribute vec2 aChunk;
uniform sampler2D uHeight;
uniform vec2 uSize10;
uniform vec2 uSize30;
uniform float uEx;
varying vec2 vUv;
varying vec2 vUvL;
varying float vH;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vec2 cf = min(aChunk + aLocal, uSize10 - 1.0);
  float h = texelFetch(uHeight, ivec2(cf), 0).r;
  vec3 pos = vec3((cf.x - (uSize10.x - 1.0) * 0.5) * 0.01, h / 1000.0 * uEx - aSkirt * 0.15, (cf.y - (uSize10.y - 1.0) * 0.5) * 0.01);
  vUv = (cf + 0.5) / uSize10;
  vUvL = vUv; // shadow/AO baked on the same 10 m grid
  vH = h;
  vNormal = vec3(0.0, 1.0, 0.0);
  vWorld = pos;
  gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
}`;
