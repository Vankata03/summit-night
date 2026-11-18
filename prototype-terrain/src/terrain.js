// PROTOTYPE — throwaway. DEM loading, mesh building, CPU-baked textures.
import * as THREE from 'three';

export async function loadDem() {
  const [meta, buf] = await Promise.all([
    fetch('/dem.json').then((r) => r.json()),
    fetch('/dem.f32').then((r) => r.arrayBuffer()),
  ]);
  return { ...meta, data: new Float32Array(buf) };
}

// World units: km. x east, y up, z south. Origin at the DEM's centre, y = metres / 1000.
export function buildGeometry(dem, step, exaggeration) {
  const { width: W, height: H, data, cell } = dem;
  const cols = Math.floor((W - 1) / step) + 1;
  const rows = Math.floor((H - 1) / step) + 1;
  const pos = new Float32Array(cols * rows * 3);
  const uv = new Float32Array(cols * rows * 2);
  const cx = ((W - 1) * cell) / 2000, cz = ((H - 1) * cell) / 2000;
  let p = 0, u = 0;
  for (let r = 0; r < rows; r++) {
    const row = r * step;
    for (let c = 0; c < cols; c++) {
      const col = c * step;
      pos[p++] = (col * cell) / 1000 - cx;
      pos[p++] = (data[row * W + col] / 1000) * exaggeration;
      pos[p++] = (row * cell) / 1000 - cz;
      uv[u++] = col / (W - 1);
      uv[u++] = row / (H - 1);
    }
  }
  const idx = new Uint32Array((cols - 1) * (rows - 1) * 6);
  let i = 0;
  for (let r = 0; r < rows - 1; r++)
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      idx[i++] = a; idx[i++] = d; idx[i++] = b;
      idx[i++] = b; idx[i++] = d; idx[i++] = e;
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

export function worldPos(dem, row, col, exaggeration) {
  const { width: W, height: H, cell, data } = dem;
  return new THREE.Vector3(
    (col * cell) / 1000 - ((W - 1) * cell) / 2000,
    (data[row * W + col] / 1000) * exaggeration,
    (row * cell) / 1000 - ((H - 1) * cell) / 2000,
  );
}

function normalAt(dem, r, c, ex) {
  const { width: W, height: H, data, cell } = dem;
  const h = (rr, cc) => data[Math.min(H - 1, Math.max(0, rr)) * W + Math.min(W - 1, Math.max(0, cc))] * ex;
  const dx = (h(r, c + 1) - h(r, c - 1)) / (2 * cell);
  const dz = (h(r + 1, c) - h(r - 1, c)) / (2 * cell);
  const n = new THREE.Vector3(-dx, 1, -dz).normalize();
  return n;
}

// Full-resolution normals packed into RGBA8: lets a decimated mesh keep 30 m relief in shading.
export function buildNormalTexture(dem, ex) {
  const { width: W, height: H } = dem;
  const px = new Uint8Array(W * H * 4);
  for (let r = 0; r < H; r++)
    for (let c = 0; c < W; c++) {
      const n = normalAt(dem, r, c, ex), o = (r * W + c) * 4;
      px[o] = (n.x * 0.5 + 0.5) * 255; px[o + 1] = (n.y * 0.5 + 0.5) * 255; px[o + 2] = (n.z * 0.5 + 0.5) * 255; px[o + 3] = 255;
    }
  const t = new THREE.DataTexture(px, W, H, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

// Variant A: everything baked on the CPU once — hypsometric tint × multi-directional hillshade, dusk palette.
const ramp = [
  [1300, [0.20, 0.17, 0.26]],
  [3500, [0.33, 0.27, 0.33]],
  [4800, [0.52, 0.42, 0.44]],
  [5400, [0.80, 0.70, 0.72]],
  [6500, [0.96, 0.86, 0.84]],
  [8800, [1.00, 0.93, 0.88]],
];
function rampColor(h) {
  for (let i = 1; i < ramp.length; i++)
    if (h <= ramp[i][0]) {
      const [h0, c0] = ramp[i - 1], [h1, c1] = ramp[i], t = (h - h0) / (h1 - h0);
      return c0.map((v, k) => v + (c1[k] - v) * t);
    }
  return ramp[ramp.length - 1][1];
}
export function buildBakedTexture(dem, ex) {
  const { width: W, height: H, data } = dem;
  const px = new Uint8Array(W * H * 4);
  const suns = [
    [new THREE.Vector3(-1, 0.35, 0.15).normalize(), [1.0, 0.62, 0.48], 0.9], // warm low sun from the west
    [new THREE.Vector3(0.4, 0.8, -0.4).normalize(), [0.55, 0.6, 0.9], 0.35], // cool sky fill
  ];
  for (let r = 0; r < H; r++)
    for (let c = 0; c < W; c++) {
      const n = normalAt(dem, r, c, ex), h = data[r * W + c];
      const base = rampColor(h);
      let lr = 0.12, lg = 0.1, lb = 0.18;
      for (const [d, col, k] of suns) {
        const l = Math.max(0, n.dot(d)) * k;
        lr += l * col[0]; lg += l * col[1]; lb += l * col[2];
      }
      const o = (r * W + c) * 4;
      px[o] = Math.min(255, base[0] * lr * 255 * 1.4);
      px[o + 1] = Math.min(255, base[1] * lg * 255 * 1.4);
      px[o + 2] = Math.min(255, base[2] * lb * 255 * 1.4);
      px[o + 3] = 255;
    }
  const t = new THREE.DataTexture(px, W, H, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

// Variant D: ambient occlusion from the heightmap (horizon angle in 8 directions). Run once per exaggeration.
export function bakeAO(dem, ex) {
  const { width: W, height: H, data, cell } = dem;
  const ao = new Float32Array(W * H);
  const dists = [];
  for (let d = 1; d < 110; d = Math.max(d + 1, Math.round(d * 1.35))) dists.push(d);
  const dirs = [];
  for (let k = 0; k < 8; k++) dirs.push([Math.cos((k * Math.PI) / 4), Math.sin((k * Math.PI) / 4)]);
  for (let r = 0; r < H; r++)
    for (let c = 0; c < W; c++) {
      const h0 = data[r * W + c];
      let occ = 0;
      for (const [dx, dz] of dirs) {
        let maxT = 0;
        for (const d of dists) {
          const cc = Math.round(c + dx * d), rr = Math.round(r + dz * d);
          if (cc < 0 || rr < 0 || cc >= W || rr >= H) break;
          const t = ((data[rr * W + cc] - h0) * ex) / (d * cell);
          if (t > maxT) maxT = t;
        }
        occ += maxT / Math.sqrt(1 + maxT * maxT); // sin(horizon angle)
      }
      ao[r * W + c] = 1 - occ / 8;
    }
  return ao;
}

// Variant D: cast shadows toward the sun by marching the heightmap; soft edge from the angular margin.
export function bakeShadow(dem, ex, sun) {
  const { width: W, height: H, data, cell } = dem;
  const out = new Float32Array(W * H);
  const len = Math.hypot(sun.x, sun.z);
  const dx = sun.x / len, dz = sun.z / len, tanSun = sun.y / len;
  const dists = [];
  for (let d = 1; d < 700; d = Math.max(d + 1, Math.round(d * 1.12))) dists.push(d);
  for (let r = 0; r < H; r++)
    for (let c = 0; c < W; c++) {
      const h0 = data[r * W + c];
      let maxT = -1;
      for (const d of dists) {
        const cc = Math.round(c + dx * d), rr = Math.round(r + dz * d);
        if (cc < 0 || rr < 0 || cc >= W || rr >= H) break;
        const t = ((data[rr * W + cc] - h0) * ex) / (d * cell);
        if (t > maxT) maxT = t;
      }
      out[r * W + c] = Math.min(1, Math.max(0, (tanSun - maxT) / 0.03 + 0.5));
    }
  return out;
}

export function packLight(dem, shadow, ao, tex) {
  const { width: W, height: H } = dem;
  const px = tex ? tex.image.data : new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    px[i * 4] = shadow[i] * 255; px[i * 4 + 1] = ao[i] * 255; px[i * 4 + 2] = 0; px[i * 4 + 3] = 255;
  }
  if (tex) { tex.needsUpdate = true; return tex; }
  const t = new THREE.DataTexture(px, W, H, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}
