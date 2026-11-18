"""PROTOTYPE — throwaway. Fetch Copernicus GLO-30 over the Summit Night bbox,
reproject to UTM 45N (EPSG:32645) at 30 m, write raw float32 heightmap + meta.

Run: python -I prototype-terrain/scripts/fetch_dem.py  (needs rasterio, numpy)
"""
import json, os, numpy as np, rasterio
from rasterio.merge import merge
from rasterio.warp import calculate_default_transform, reproject, Resampling, transform_bounds

W, S, E, N = 86.80, 27.93, 87.02, 28.17
OUT = os.path.join(os.path.dirname(__file__), "..", "public")
URL = "/vsicurl/https://copernicus-dem-30m.s3.amazonaws.com/{n}/{n}.tif"
names = [f"Copernicus_DSM_COG_10_N{lat:02d}_00_E{lon:03d}_00_DEM" for lat in (27, 28) for lon in (86, 87)]

os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")
srcs = [rasterio.open(URL.format(n=n)) for n in names]
mosaic, mtr = merge(srcs, bounds=(W, S, E, N))
src_crs = srcs[0].crs
dst_crs = "EPSG:32645"
from pyproj import Transformer
from rasterio.transform import from_origin
T = Transformer.from_crs(src_crs, dst_crs, always_xy=True)
(xa, ya), (xb, yb), (xc, yc), (xd, yd) = [T.transform(*p) for p in ((W, S), (W, N), (E, S), (E, N))]
x0 = float(np.ceil(max(xa, xb) / 30) * 30); x1 = float(np.floor(min(xc, xd) / 30) * 30)
y0 = float(np.floor(min(yb, yd) / 30) * 30); y1 = float(np.ceil(max(ya, yc) / 30) * 30)
dw, dh = int((x1 - x0) / 30), int((y0 - y1) / 30)
tr = from_origin(x0, y0, 30, 30)
dst = np.full((dh, dw), np.nan, dtype=np.float32)
reproject(mosaic[0].astype(np.float32), dst, src_transform=mtr, src_crs=src_crs,
          dst_transform=tr, dst_crs=dst_crs, resampling=Resampling.bilinear, dst_nodata=np.nan)
assert not np.isnan(dst).any(), "voids/edge NaN in crop"
dst = np.ascontiguousarray(dst)
dst.tofile(os.path.join(OUT, "dem.f32"))
iy, ix = np.unravel_index(np.argmax(dst), dst.shape)
meta = dict(width=dst.shape[1], height=dst.shape[0], cell=30, crs=dst_crs, originX=x0, originY=y0,
            min=float(dst.min()), max=float(dst.max()), peakRow=int(iy), peakCol=int(ix),
            credit="Produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.")
json.dump(meta, open(os.path.join(OUT, "dem.json"), "w"), indent=1)
print(meta)
