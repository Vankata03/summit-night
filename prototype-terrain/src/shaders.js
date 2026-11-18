// PROTOTYPE — throwaway. One terrain shader, three looks selected by #define VARIANT.
export const terrainVertex = /* glsl */ `
uniform float uEx;
varying vec2 vUv;
varying float vH;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vUv = uv;
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
uniform bool uUseNormalTex;
uniform vec3 uSunDir;
uniform float uShadowLine;
uniform vec3 uFogColor;
uniform float uFogDensity;
varying vec2 vUv;
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
  vec2 lt = texture2D(uLightTex, vUv).rg;
  float shadow = lt.r, ao = lt.g;
  vec2 p = vWorld.xz * 4.0;                      // 1 unit = 250 m
  float px = length(fwidth(p));
  float e = 0.02;
  float n0 = fbm(p, px);
  vec2 grad = vec2(fbm(p + vec2(e, 0.0), px) - n0, fbm(p + vec2(0.0, e), px) - n0) / e;
  float slope30 = 1.0 - n.y;
  float snowN = fbm(p * 0.7 + 13.1, px * 0.7);
  float snow = smoothstep(5000.0, 5700.0, vH + snowN * 900.0)
             * (1.0 - smoothstep(0.30 + snowN * 0.25, 0.44 + snowN * 0.25, slope30));
  snow = max(snow, smoothstep(0.75, 0.9, ao) * smoothstep(5600.0, 6200.0, vH) * 0.6); // snow gathers in hollows up high
  float glacier = (1.0 - smoothstep(0.06, 0.14, slope30)) * smoothstep(4700.0, 5000.0, vH) * (1.0 - snow);
  vec3 dn = normalize(n + vec3(-grad.x, 0.0, -grad.y) * mix(0.35, 0.08, snow));
  float ndlD = max(dot(dn, uSunDir), 0.0);
  float strata = fbm(vec2(vH / 60.0, p.x * 0.3 + p.y * 0.3), 0.0);
  vec3 rock = mix(vec3(0.17, 0.14, 0.14), vec3(0.32, 0.27, 0.25), smoothstep(-0.2, 0.25, strata + n0));
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
