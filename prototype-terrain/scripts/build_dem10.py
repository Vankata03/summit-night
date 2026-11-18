"""PROTOTYPE — throwaway. Build a 10 m heightfield: HMA 8 m (Shean 2017) blended over Copernicus GLO-30.

Inputs : HMA tile path as argv[1] (HMA_DEM8m_MOS_20170716_tile-677.tif, needs an Earthdata login to download).
         GLO-30 is read anonymously over HTTPS.
Outputs: public/dem10.u16 (+ .json) — heights * 4 as uint16 (0.25 m steps), 10 m cells, UTM 45N.
         public/dem.f32  (+ .json) — 3x3 block mean of the above (30 m), used for shadow/AO baking.

Steps: reproject both to one 10 m grid -> fit HMA's vertical offset (ellipsoid vs geoid + bias) as a plane
against GLO-30 -> reject HMA blunders (>120 m off) -> feather HMA holes over 150 m -> blend.
Run: python -I scripts/build_dem10.py /path/to/tile-677.tif   (needs rasterio, numpy, scipy, pyproj)
"""
import json, os, sys
import numpy as np, rasterio
from pyproj import Transformer
from rasterio.merge import merge
from rasterio.transform import from_origin
from rasterio.warp import reproject, Resampling
from scipy.ndimage import distance_transform_edt, binary_dilation

W, S, E, N = 86.80, 27.93, 87.02, 28.17
OUT = os.path.join(os.path.dirname(__file__), "..", "public")
CRS = "EPSG:32645"
os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")

# Grid: largest 30 m-aligned rectangle inside the bbox, inset by one 30 m cell so no edge cell touches nodata.
T = Transformer.from_crs("EPSG:4326", CRS, always_xy=True)
(xa, ya), (xb, yb), (xc, yc), (xd, yd) = [T.transform(*p) for p in ((W, S), (W, N), (E, S), (E, N))]
x0 = float(np.ceil(max(xa, xb) / 30) * 30) + 30; x1 = float(np.floor(min(xc, xd) / 30) * 30) - 30
y0 = float(np.floor(min(yb, yd) / 30) * 30) - 30; y1 = float(np.ceil(max(ya, yc) / 30) * 30) + 30
W30, H30 = int((x1 - x0) / 30), int((y0 - y1) / 30)
W10, H10 = W30 * 3, H30 * 3
tr10 = from_origin(x0, y0, 10, 10)
print(f"grid 10 m: {W10}x{H10}   30 m: {W30}x{H30}")

# GLO-30 -> 10 m (cubic)
names = [f"Copernicus_DSM_COG_10_N{lat:02d}_00_E{lon:03d}_00_DEM" for lat in (27, 28) for lon in (86, 87)]
srcs = [rasterio.open(f"/vsicurl/https://copernicus-dem-30m.s3.amazonaws.com/{n}/{n}.tif") for n in names]
mosaic, mtr = merge(srcs, bounds=(W - 0.01, S - 0.01, E + 0.01, N + 0.01))
g10 = np.full((H10, W10), np.nan, np.float32)
reproject(mosaic[0].astype(np.float32), g10, src_transform=mtr, src_crs=srcs[0].crs,
          dst_transform=tr10, dst_crs=CRS, resampling=Resampling.cubic, dst_nodata=np.nan)
assert not np.isnan(g10).any(), "GLO-30 does not cover the grid"

# HMA -> 10 m (bilinear), nodata -> NaN
h10 = np.full((H10, W10), np.nan, np.float32)
with rasterio.open(sys.argv[1]) as s:
    reproject(rasterio.band(s, 1), h10, dst_transform=tr10, dst_crs=CRS, resampling=Resampling.bilinear,
              src_nodata=s.nodata, dst_nodata=np.nan)

# Vertical offset: fit plane a + b*x + c*y to (HMA - GLO) on agreeing cells, subtract.
d = h10 - g10
ok = ~np.isnan(d)
ok &= np.abs(d - np.nanmedian(d)) < 60
yy, xx = np.mgrid[0:H10, 0:W10].astype(np.float32) / 1000
A = np.stack([np.ones(ok.sum()), xx[ok], yy[ok]], 1)
coef, *_ = np.linalg.lstsq(A, d[ok], rcond=None)
h10 -= (coef[0] + coef[1] * xx + coef[2] * yy).astype(np.float32)
print("offset plane (m, m/km-cell):", np.round(coef, 3))

# Blunders and holes
bad = np.isnan(h10) | (np.abs(h10 - g10) > 120)
bad = binary_dilation(bad, iterations=2)
valid = ~bad
print(f"HMA valid after cleaning: {100 * valid.mean():.2f}%")
w = np.clip(distance_transform_edt(valid) / 15.0, 0, 1).astype(np.float32)  # 150 m feather
out = np.where(valid, w * np.nan_to_num(h10) + (1 - w) * g10, g10).astype(np.float32)

# Write 10 m
q = np.clip(np.round(out * 4), 0, 65535).astype(np.uint16)
q.tofile(os.path.join(OUT, "dem10.u16"))
credit = ("Produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 "
          "provided under COPERNICUS by the European Union and ESA; all rights reserved. "
          "HMA 8 m DEM: Shean, D. 2017. High Mountain Asia 8-meter DEM Mosaics Derived from Optical Imagery, "
          "Version 1. NASA NSIDC DAAC. doi:10.5067/KXOVQ9L172S2.")
iy, ix = np.unravel_index(np.argmax(out), out.shape)
json.dump(dict(width=W10, height=H10, cell=10, crs=CRS, originX=x0, originY=y0, scale=0.25,
               min=float(out.min()), max=float(out.max()), peakRow=int(iy), peakCol=int(ix), credit=credit),
          open(os.path.join(OUT, "dem10.json"), "w"), indent=1)

# Write 30 m as block mean of the 10 m result
o30 = out.reshape(H30, 3, W30, 3).mean(axis=(1, 3)).astype(np.float32)
o30.tofile(os.path.join(OUT, "dem.f32"))
iy, ix = np.unravel_index(np.argmax(o30), o30.shape)
json.dump(dict(width=W30, height=H30, cell=30, crs=CRS, originX=x0, originY=y0,
               min=float(o30.min()), max=float(o30.max()), peakRow=int(iy), peakCol=int(ix), credit=credit),
          open(os.path.join(OUT, "dem.json"), "w"), indent=1)
print(f"10 m range {out.min():.0f}-{out.max():.0f} m, 30 m range {o30.min():.0f}-{o30.max():.0f} m")
