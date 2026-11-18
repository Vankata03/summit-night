# PROTOTYPE — throwaway. Merge research spots + photos into public/spots.json with DEM grid positions.
import json, math, sys
spots = json.load(open('research-in/spots.json'))
photos = {p['spot_id']: p for p in json.load(open('research-in/photos.json'))['spots']}
dem = json.load(open('public/dem.json'))

def utm45(lat, lon):  # WGS84 -> UTM zone 45N (EPSG:32645)
    a, f, k0 = 6378137.0, 1 / 298.257223563, 0.9996
    e2 = f * (2 - f); ep2 = e2 / (1 - e2)
    phi, lam, lam0 = math.radians(lat), math.radians(lon), math.radians(87)
    N = a / math.sqrt(1 - e2 * math.sin(phi) ** 2)
    T, C = math.tan(phi) ** 2, ep2 * math.cos(phi) ** 2
    A = math.cos(phi) * (lam - lam0)
    M = a * ((1 - e2 / 4 - 3 * e2**2 / 64 - 5 * e2**3 / 256) * phi - (3 * e2 / 8 + 3 * e2**2 / 32 + 45 * e2**3 / 1024) * math.sin(2 * phi)
             + (15 * e2**2 / 256 + 45 * e2**3 / 1024) * math.sin(4 * phi) - (35 * e2**3 / 3072) * math.sin(6 * phi))
    E = k0 * N * (A + (1 - T + C) * A**3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A**5 / 120) + 500000
    Nn = k0 * (M + N * math.tan(phi) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A**4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A**6 / 720))
    return E, Nn

def thumb(p):
    if not p: return None
    u = p['image_url']
    if '/commons/' in u and p['width'] > 960 and not u.lower().endswith(('.svg', '.tif', '.tiff')):
        name = u.rsplit('/', 1)[1]
        return u.replace('/commons/', '/commons/thumb/') + f'/960px-{name}'
    return u

out = []
for s in spots['spots']:
    E, N = utm45(s['lat'], s['lon'])
    col, row = (E - dem['originX']) / dem['cell'], (dem['originY'] - N) / dem['cell']
    ph = photos.get(s['id'], {})
    p = ph.get('photo')
    out.append({**{k: s[k] for k in ('id', 'name', 'kind', 'alt_m', 'routes', 'story', 'coord_confidence', 'optional')},
                'col': round(col, 2), 'row': round(row, 2),
                'onMap': 0 <= col < dem['width'] and 0 <= row < dem['height'],
                'photo': p and {**{k: p[k] for k in ('file', 'file_page', 'author', 'licence', 'licence_url', 'width', 'height')}, 'src': thumb(p)},
                'match': ph.get('match'), 'photoNote': ph.get('notes')})
json.dump(out, open('public/spots.json', 'w'), indent=1)
print(len(out), 'spots;', [s['id'] for s in out if not s['onMap']], 'off map')
