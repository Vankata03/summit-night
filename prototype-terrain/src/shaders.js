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
uniform bool uUseNormalTex;
uniform vec3 uSunDir;
uniform float uShadowLine;
uniform vec3 uFogColor;
uniform float uFogDensity;
varying vec2 vUv;
varying float vH;
varying vec3 vNormal;
varying vec3 vWorld;

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
