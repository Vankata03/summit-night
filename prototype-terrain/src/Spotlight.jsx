// PROTOTYPE — throwaway. Spotlight and info card interaction (wayfinder ticket #8).
// Three structurally different spotlights on the real terrain, switchable via ?variant=A|B|C and the bottom bar:
//   A Theatre      — orbit-in fly-to, rest of the mountain dims around a warm pool, docked side panel, list index.
//   B Field guide  — pan-and-dolly keeping heading, crisp pulsing ring, callout anchored to the spot, search palette.
//   C Documentary  — slow low hero shot from downhill, searchlight beam, lower-third card, filmstrip index.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { spotUniforms } from './spotUniforms.js';

export const SPOT_VARIANTS = [
  { key: 'A', name: 'Theatre' },
  { key: 'B', name: 'Field guide' },
  { key: 'C', name: 'Documentary' },
];

const ROUTE_NAMES = {
  'south-col': 'South Col', 'north-col': 'North Col / NE Ridge', 'west-ridge': 'West Ridge',
  'kangshung-face': 'Kangshung Face', 'hornbein-couloir': 'Hornbein Couloir', 'southwest-face': 'Southwest Face',
};
const KIND_NAMES = { waypoint: 'Waypoint', peak: 'Peak', glacier: 'Glacier' };
const GROUPS = [
  ['South Col route', (s) => s.kind === 'waypoint' && s.routes.includes('south-col')],
  ['North route', (s) => s.kind === 'waypoint' && s.routes.includes('north-col')],
  ['Faces and ridges', (s) => s.kind === 'waypoint' && !s.routes.includes('south-col') && !s.routes.includes('north-col')],
  ['Peaks', (s) => s.kind === 'peak'],
  ['Glaciers', (s) => s.kind === 'glacier'],
];

// ---------- terrain sampling (30 m grid, world km, y = m/1000 × ex) ----------
export function makeSampler(dem, ex) {
  const { width: W, height: H, cell, data } = dem;
  const hx = ((W - 1) * cell) / 2000, hz = ((H - 1) * cell) / 2000;
  const at = (c, r) => data[Math.min(H - 1, Math.max(0, r)) * W + Math.min(W - 1, Math.max(0, c))];
  const hAt = (col, row) => {
    const c0 = Math.floor(col), r0 = Math.floor(row), fc = col - c0, fr = row - r0;
    return (at(c0, r0) * (1 - fc) + at(c0 + 1, r0) * fc) * (1 - fr) + (at(c0, r0 + 1) * (1 - fc) + at(c0 + 1, r0 + 1) * fc) * fr;
  };
  const yAt = (x, z) => (hAt(((x + hx) * 1000) / cell, ((z + hz) * 1000) / cell) / 1000) * ex;
  const world = (col, row) => new THREE.Vector3((col * cell) / 1000 - hx, (hAt(col, row) / 1000) * ex, (row * cell) / 1000 - hz);
  return { yAt, world, hAt, W, H };
}

function useSpots(dem, ex) {
  const [raw, setRaw] = useState(null);
  useEffect(() => { fetch('/spots.json').then((r) => r.json()).then(setRaw); }, []);
  return useMemo(() => {
    if (!raw || !dem) return null;
    const S = makeSampler(dem, ex);
    return raw.map((s) => {
      const col = Math.min(S.W - 2, Math.max(1, s.col)), row = Math.min(S.H - 2, Math.max(1, s.row));
      const pos = S.world(col, row);
      return { ...s, pos, demAlt: Math.round(S.hAt(col, row)), radius: s.kind === 'waypoint' ? 0.18 : s.kind === 'peak' ? 0.9 : 1.2 };
    });
  }, [raw, dem, ex]);
}

// ---------- URL-backed selection ----------
function useSelection(spots) {
  const [id, setId] = useState(() => new URLSearchParams(location.search).get('s'));
  const select = (nid) => {
    const p = new URLSearchParams(location.search);
    nid ? p.set('s', nid) : p.delete('s');
    history.replaceState(null, '', `?${p}`);
    setId(nid);
  };
  const spot = spots?.find((s) => s.id === id) ?? null;
  return [spot, select];
}

// ---------- camera flights ----------
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function frameDistance(s) { return s.kind === 'waypoint' ? 1.6 : s.kind === 'peak' ? 6 : 6.5; }

// Searches azimuths (nearest the preferred one first) and elevations for a camera position with a clear line of sight.
function findView(t, dir0, dist, elevs, S) {
  const offs = [0, 30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180];
  const p = new THREE.Vector3();
  for (const elDeg of elevs)
    for (const o of offs) {
      const dir = dir0.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(o));
      const el = THREE.MathUtils.degToRad(elDeg);
      const pos = t.clone().addScaledVector(dir, dist * Math.cos(el)).add(new THREE.Vector3(0, dist * Math.sin(el), 0));
      if (S.yAt(pos.x, pos.z) + 0.1 > pos.y) continue;
      let clear = true;
      for (let i = 1; i < 40 && clear; i++) {
        p.lerpVectors(pos, t, (i / 40) * 0.94);
        if (S.yAt(p.x, p.z) > p.y - 0.01) clear = false;
      }
      if (clear) return { pos, dir };
    }
  const el = THREE.MathUtils.degToRad(60);
  return { pos: t.clone().addScaledVector(dir0, dist * Math.cos(el)).add(new THREE.Vector3(0, dist * Math.sin(el), 0)), dir: dir0 };
}

// Plans the destination (camera position + target) for a variant. Every shot keeps the spot in clear view.
function planShot(variant, spot, camera, target, summit, S) {
  const t = spot.pos.clone();
  const dist = frameDistance(spot);
  const cur = camera.position.clone().sub(target);
  const heading = new THREE.Vector3(cur.x, 0, cur.z).normalize();
  if (variant === 'C') {
    // Hero shot: low, from outward/downhill of the spot, looking back at the mountain; spot on the left third.
    let out = new THREE.Vector3(t.x - summit.x, 0, t.z - summit.z);
    out = out.lengthSq() < 0.01 ? heading : out.normalize();
    const { pos, dir } = findView(t, out, dist * 1.25, [10, 16, 24, 34], S);
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
    return { pos, tgt: t.clone().addScaledVector(right, dist * 0.3).add(new THREE.Vector3(0, dist * 0.05, 0)) };
  }
  if (variant === 'B') {
    // Keep heading and pitch, just pan and dolly; only turn if the spot would be hidden.
    const pitch = THREE.MathUtils.radToDeg(Math.max(THREE.MathUtils.degToRad(22), Math.asin(THREE.MathUtils.clamp(cur.y / cur.length(), -1, 1))));
    return { pos: findView(t, heading, dist, [pitch, pitch + 12, pitch + 24], S).pos, tgt: t };
  }
  // A: keep azimuth, settle to ~28° elevation.
  return { pos: findView(t, heading, dist, [28, 38, 50], S).pos, tgt: t };
}

function CameraRig({ variant, spot, summit, S }) {
  const { camera, controls } = useThree();
  const flight = useRef(null);
  const settle = useRef(false);
  useEffect(() => {
    if (!controls) return;
    controls.autoRotate = false;
    if (!spot) return;
    const shot = planShot(variant, spot, camera, controls.target, summit, S);
    const dur = { A: 2.4, B: 1.1, C: 3.6 }[variant];
    flight.current = { p0: camera.position.clone(), t0: controls.target.clone(), ...shot, start: performance.now(), dur, arc: variant === 'A' };
    settle.current = false;
    const cancel = () => { flight.current = null; controls.autoRotate = false; };
    controls.addEventListener('start', cancel);
    return () => controls.removeEventListener('start', cancel);
  }, [spot, variant, controls]);
  useFrame(() => {
    const f = flight.current;
    if (!f || !controls) return;
    const k = Math.min(1, (performance.now() - f.start) / 1000 / f.dur);
    const e = variant === 'B' ? easeOut(k) : ease(k);
    controls.target.lerpVectors(f.t0, f.tgt, e);
    camera.position.lerpVectors(f.p0, f.pos, e);
    if (f.arc) camera.position.y += Math.sin(Math.PI * e) * f.p0.distanceTo(f.pos) * 0.18; // lift over ridges mid-flight
    const g = S.yAt(camera.position.x, camera.position.z) + 0.08;
    if (camera.position.y < g) camera.position.y = g;
    if (k >= 1) {
      flight.current = null;
      if (variant === 'A') { controls.autoRotate = true; controls.autoRotateSpeed = 0.35; }
    }
  });
  return null;
}

// ---------- terrain light ----------
function TerrainLight({ variant, spot }) {
  const k = useRef(0);
  useFrame((_, dt) => {
    spotUniforms.uTime.value += dt;
    if (spot) spotUniforms.uSpot.value.set(spot.pos.x, spot.pos.y, spot.pos.z, spot.radius);
    spotUniforms.uSpotMode.value = { A: 1, B: 2, C: 3 }[variant];
    const goal = spot ? 1 : 0;
    k.current += (goal - k.current) * Math.min(1, dt * (variant === 'C' ? 1.6 : 4));
    spotUniforms.uSpotK.value = k.current;
  });
  if (variant !== 'C' || !spot) return null;
  return <Beam spot={spot} />;
}

// Searchlight beam: additive open cone from high above down to the spot.
function Beam({ spot }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uK: spotUniforms.uSpotK },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vec4 w = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-w.xyz); gl_Position = projectionMatrix*w; }',
    fragmentShader: 'uniform float uK; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float rim = pow(1.0-abs(dot(vN,vV)), 1.5); float a = pow(1.0-vY, 2.5)*0.22*(1.0-rim*0.8)*uK; gl_FragColor = vec4(vec3(1.0,0.85,0.6)*a, 1.0); }',
  }), []);
  const h = 1.4;
  return (
    <mesh position={[spot.pos.x, spot.pos.y + h / 2, spot.pos.z]} material={mat} renderOrder={5}>
      <cylinderGeometry args={[spot.radius * 0.3, spot.radius * 0.9, h, 40, 1, true]} />
    </mesh>
  );
}

// ---------- markers with heightfield occlusion ----------
function useOcclusion(spots, S) {
  const { camera } = useThree();
  const [hidden, setHidden] = useState({});
  const last = useRef(0);
  useFrame(() => {
    const now = performance.now();
    if (now - last.current < 120 || !spots) return;
    last.current = now;
    const out = {}, p = new THREE.Vector3();
    for (const s of spots) {
      let occ = false;
      for (let i = 1; i < 48; i++) {
        p.lerpVectors(camera.position, s.pos, i / 48);
        if (S.yAt(p.x, p.z) > p.y + 0.015) { occ = true; break; }
      }
      out[s.id] = occ;
    }
    setHidden((h) => (spots.some((s) => h[s.id] !== out[s.id]) ? out : h));
  });
  return hidden;
}

function Markers({ spots, spot, onSelect, hidden, variant }) {
  return spots.map((s) => {
    const active = spot?.id === s.id;
    return (
      <Html key={s.id} position={s.pos} center zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
        <button
          className={`sl-marker sl-marker-${variant} ${active ? 'is-active' : ''} ${hidden[s.id] ? 'is-hidden' : ''} sl-kind-${s.kind}`}
          onClick={() => onSelect(active ? null : s.id)}
          aria-label={s.name}
          aria-pressed={active}
          tabIndex={hidden[s.id] ? -1 : 0}
        >
          <span className="sl-dot" />
          {variant === 'B' && <span className="sl-hovername">{s.name}</span>}
        </button>
      </Html>
    );
  });
}

// ---------- shared bits of card content ----------
function altitude(s) {
  const m = s.alt_m ?? s.demAlt;
  return { m: Math.round(m).toLocaleString('en'), ft: Math.round(m * 3.28084).toLocaleString('en'), fromDem: s.alt_m == null };
}
function Photo({ s, className }) {
  if (!s.photo) return <div className={`sl-photo sl-photo-none ${className ?? ''}`}><span>No free photo yet</span></div>;
  return (
    <figure className={`sl-photo ${className ?? ''}`}>
      <img key={s.photo.src} src={s.photo.src} alt={s.match === 'proxy' ? `${s.photoNote ?? ''}` : s.name} loading="lazy" referrerPolicy="no-referrer" />
    </figure>
  );
}
function Credit({ s }) {
  if (!s.photo) return null;
  return (
    <div className="sl-credit">
      {s.match === 'proxy' && <div className="sl-proxy">Nearby view · {s.photoNote}</div>}
      Photo: <a href={s.photo.file_page} target="_blank" rel="noreferrer">{s.photo.author}</a>, {' '}
      <a href={s.photo.licence_url} target="_blank" rel="noreferrer">{s.photo.licence}</a>, Wikimedia Commons
    </div>
  );
}
function Caveats({ s }) {
  const notes = [];
  if (s.coord_confidence !== 'mapped') notes.push(s.coord_confidence === 'uncertain' ? 'Position uncertain: sources disagree' : 'Position approximate: hand-placed');
  if (!s.onMap) notes.push('Beyond the map edge: marker sits on the boundary');
  if (s.optional) notes.push('Optional spot (sensitive)');
  if (!notes.length) return null;
  return <div className="sl-caveats">{notes.map((n) => <div key={n}>{n}</div>)}</div>;
}
function Routes({ s }) {
  if (!s.routes?.length) return null;
  return <div className="sl-routes">{s.routes.map((r) => <span key={r} className="sl-chip">{ROUTE_NAMES[r] ?? r}</span>)}</div>;
}
function Alt({ s, big }) {
  const a = altitude(s);
  return (
    <div className={`sl-alt ${big ? 'sl-alt-big' : ''}`}>
      {a.fromDem && '≈ '}{a.m} m <span className="sl-ft">{a.ft} ft</span>{a.fromDem && <span className="sl-ft"> · from terrain</span>}
    </div>
  );
}

// ---------- Variant A: Theatre ----------
function IndexList({ spots, spot, onSelect }) {
  return (
    <nav className="sl-a-index" aria-label="Spots">
      {GROUPS.map(([g, f]) => (
        <section key={g}>
          <h3>{g}</h3>
          {spots.filter(f).map((s) => (
            <button key={s.id} className={spot?.id === s.id ? 'is-active' : ''} onClick={() => onSelect(s.id)}>
              <span>{s.name}</span><span className="sl-num">{s.alt_m ? Math.round(s.alt_m).toLocaleString('en') : '—'}</span>
            </button>
          ))}
        </section>
      ))}
    </nav>
  );
}
function CardA({ s, onClose, onStep }) {
  return (
    <aside className="sl-a-card" key={s.id} aria-label={`${s.name} info`}>
      <div className="sl-a-photo-wrap">
        <Photo s={s} />
        <button className="sl-icon-btn sl-a-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="sl-a-body">
        <div className="sl-kind">{KIND_NAMES[s.kind]}</div>
        <h2>{s.name}</h2>
        <Alt s={s} big />
        <Routes s={s} />
        <p className="sl-story">{s.story}</p>
        <Caveats s={s} />
        <Credit s={s} />
      </div>
      <div className="sl-a-foot">
        <button onClick={() => onStep(-1)}>← Previous</button>
        <button onClick={() => onStep(1)}>Next →</button>
      </div>
    </aside>
  );
}
function LabelA({ s }) {
  return (
    <Html position={s.pos} center zIndexRange={[4, 4]} style={{ pointerEvents: 'none' }}>
      <div className="sl-a-label" key={s.id}>{s.name}</div>
    </Html>
  );
}

// ---------- Variant B: Field guide ----------
function CalloutB({ s, onClose }) {
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [s.id]);
  return (
    <Html position={s.pos} zIndexRange={[60, 60]} style={{ pointerEvents: 'none' }}>
      <div className="sl-b-anchor">
        <div className="sl-b-leader" />
        <div className={`sl-b-card ${more ? 'is-open' : ''}`} key={s.id} style={{ pointerEvents: 'auto' }}>
          <div className="sl-b-head">
            <Photo s={s} className="sl-b-thumb" />
            <div>
              <div className="sl-b-name">{s.name}</div>
              <Alt s={s} />
            </div>
            <button className="sl-icon-btn" onClick={onClose} aria-label="Close">×</button>
          </div>
          {more && <Photo s={s} className="sl-b-big" />}
          <p className={`sl-story ${more ? '' : 'sl-clamp'}`}>{s.story}</p>
          {more && (<><Routes s={s} /><Caveats s={s} /><Credit s={s} /></>)}
          <button className="sl-b-more" onClick={() => setMore((m) => !m)}>{more ? 'Less' : 'More'}</button>
        </div>
      </div>
    </Html>
  );
}
function PaletteB({ spots, onSelect }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const list = spots.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  useEffect(() => {
    const k = (e) => { if (e.key === '/' && !e.target.closest?.('input')) { e.preventDefault(); setOpen(true); } };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, []);
  if (!open) return <button className="sl-b-search" onClick={() => setOpen(true)}>Find a spot <kbd>/</kbd></button>;
  return (
    <div className="sl-b-palette">
      <input autoFocus value={q} placeholder="Find a spot…" onChange={(e) => { setQ(e.target.value); setI(0); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(list.length - 1, x + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
          if (e.key === 'Enter' && list[i]) { onSelect(list[i].id); setOpen(false); setQ(''); }
          if (e.key === 'Escape') setOpen(false);
        }} />
      <div className="sl-b-results">
        {list.map((s, j) => (
          <button key={s.id} className={j === i ? 'is-active' : ''} onMouseDown={() => { onSelect(s.id); setOpen(false); setQ(''); }}>
            <span>{s.name}</span><span className="sl-kind">{KIND_NAMES[s.kind]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Variant C: Documentary ----------
function LabelC({ s }) {
  return (
    <Html position={s.pos} zIndexRange={[4, 4]} style={{ pointerEvents: 'none' }}>
      <div className="sl-c-label" key={s.id}><div className="sl-c-stem" /><div className="sl-c-name">{s.name}</div></div>
    </Html>
  );
}
function LowerThirdC({ s, onClose }) {
  return (
    <section className="sl-c-third" key={s.id} aria-label={`${s.name} info`}>
      <Photo s={s} className="sl-c-photo" />
      <div className="sl-c-title">
        <div className="sl-kind">{KIND_NAMES[s.kind]}{s.routes?.length ? ` · ${s.routes.map((r) => ROUTE_NAMES[r]).join(' · ')}` : ''}</div>
        <h2>{s.name}</h2>
        <Alt s={s} big />
      </div>
      <div className="sl-c-text">
        <p className="sl-story">{s.story}</p>
        <Caveats s={s} />
        <Credit s={s} />
      </div>
      <button className="sl-icon-btn sl-c-close" onClick={onClose} aria-label="Close">×</button>
    </section>
  );
}
function FilmstripC({ spots, spot, onSelect }) {
  const ref = useRef();
  useEffect(() => { ref.current?.querySelector('.is-active')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, [spot?.id]);
  return (
    <nav className="sl-c-strip" ref={ref} aria-label="Spots">
      {spots.map((s) => (
        <button key={s.id} className={spot?.id === s.id ? 'is-active' : ''} onClick={() => onSelect(s.id)}>
          {s.photo ? <img src={s.photo.src} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="sl-strip-none" />}
          <span>{s.name}</span>
        </button>
      ))}
    </nav>
  );
}

// ---------- scene + overlay entry points ----------
// Rendered inside <Canvas>.
export function SpotlightScene({ dem, ex, variant, state }) {
  const S = useMemo(() => makeSampler(dem, ex), [dem, ex]);
  const summit = useMemo(() => S.world(dem.peakCol, dem.peakRow), [S]);
  const { spots, spot, select } = state;
  const hidden = useOcclusion(spots, S);
  if (!spots) return null;
  return (
    <>
      <CameraRig variant={variant} spot={spot} summit={summit} S={S} />
      <TerrainLight variant={variant} spot={spot} />
      <Markers spots={spots} spot={spot} onSelect={select} hidden={hidden} variant={variant} />
      {spot && variant === 'A' && <LabelA s={spot} />}
      {spot && variant === 'B' && <CalloutB s={spot} onClose={() => select(null)} />}
      {spot && variant === 'C' && <LabelC s={spot} />}
    </>
  );
}

// Rendered as DOM next to the <Canvas>.
export function SpotlightOverlay({ variant, state }) {
  const { spots, spot, select } = state;
  const step = (d) => {
    const i = spots.findIndex((s) => s.id === spot?.id);
    select(spots[(i + d + spots.length) % spots.length].id);
  };
  useEffect(() => {
    const k = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      if (e.key === 'Escape') select(null);
      if (e.key === ']') step(1);
      if (e.key === '[') step(-1);
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  });
  if (!spots) return null;
  return (
    <div className={`sl-root sl-${variant}`}>
      {variant === 'A' && <IndexList spots={spots} spot={spot} onSelect={select} />}
      {variant === 'A' && spot && <CardA s={spot} onClose={() => select(null)} onStep={step} />}
      {variant === 'B' && <PaletteB spots={spots} onSelect={select} />}
      {variant === 'C' && spot && <LowerThirdC s={spot} onClose={() => select(null)} />}
      {variant === 'C' && <FilmstripC spots={spots} spot={spot} onSelect={select} />}
      <div className="sl-help">Click a marker · <kbd>[</kbd> <kbd>]</kbd> step · <kbd>Esc</kbd> close · <kbd>←</kbd> <kbd>→</kbd> variant</div>
    </div>
  );
}

export function useSpotlightState(dem, ex) {
  const spots = useSpots(dem, ex);
  const [spot, select] = useSelection(spots);
  return { spots, spot, select };
}
