# PROTOTYPE — throwaway. Stitch OSM relation 17822898 (South Col) into one ordered line on the DEM grid.
# Output public/route-south-col.json: points as [col, row] on the 30 m grid (same frame as spots.json),
# plus each South Col spot's arc-length position along the line. © OpenStreetMap contributors, ODbL.
import json, math, importlib.util
spec = importlib.util.spec_from_file_location('bs', 'scripts/build_spots.py')
src = open('scripts/build_spots.py').read().split('def thumb')[0]  # reuse utm45 only
ns = {}; exec(src.split("spots = json.load")[0] + 'def utm45' + src.split('def utm45')[1], ns)
utm45 = ns['utm45']
d = json.load(open('research-in/osm-south-col.json'))
nodes = {e['id']: (e['lat'], e['lon']) for e in d['elements'] if e['type'] == 'node'}
ways = [e['nodes'] for e in d['elements'] if e['type'] == 'way']
dem = json.load(open('public/dem.json'))
# Start at the way endpoint closest to base camp, then chain by shared endpoints.
bc = (28.0026, 86.8553)
dist = lambda a, b: math.hypot(a[0] - b[0], a[1] - b[1])
ends = [(w, 0) for w in ways] + [(w, -1) for w in ways]
w, i = min(ends, key=lambda e: dist(nodes[e[0][e[1]]], bc))
line = list(w if i == 0 else reversed(w)); left = [x for x in ways if x is not w]
while left:
    tail = line[-1]
    nxt = next(x for x in left if tail in (x[0], x[-1]))
    line += (nxt if nxt[0] == tail else list(reversed(nxt)))[1:]
    left.remove(nxt)
pts = []
for n in line:
    E, N = utm45(*nodes[n])
    pts.append([round((E - dem['originX']) / dem['cell'], 2), round((dem['originY'] - N) / dem['cell'], 2)])
spots = [s for s in json.load(open('public/spots.json')) if 'south-col' in s['routes'] and s['onMap']]
cum = [0.0]
for a, b in zip(pts, pts[1:]): cum.append(cum[-1] + math.dist(a, b) * dem['cell'])
marks = []
for s in spots:
    j = min(range(len(pts)), key=lambda k: math.dist(pts[k], (s['col'], s['row'])))
    off = math.dist(pts[j], (s['col'], s['row'])) * dem['cell']
    if off < 900: marks.append({'id': s['id'], 'name': s['name'], 'kind': s['kind'], 'alt_m': s['alt_m'], 's': round(cum[j]), 'offset_m': round(off)})
marks.sort(key=lambda m: m['s'])
json.dump({'id': 'south-col', 'name': 'South Col', 'source': 'osm', 'credit': '© OpenStreetMap contributors (ODbL)',
           'length_m': round(cum[-1]), 'points': pts, 'marks': marks}, open('public/route-south-col.json', 'w'))
print(len(pts), 'points', round(cum[-1]), 'm;', [(m['name'], m['s'], m['offset_m']) for m in marks])
print('first', pts[0], 'last', pts[-1])
