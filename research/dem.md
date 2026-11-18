# Elevation data source for the terrain

Research for [#2](https://github.com/Vankata03/summit-night/issues/2): which DEM to build the Everest terrain from, for the tight extent (Everest, Lhotse, Nuptse, Changtse, upper Khumbu and Rongbuk glaciers, both base camps).

Researched 2026-11-18.

## Recommendation

Use **Copernicus DEM GLO-30** (the 2021 release, distributed as Cloud Optimized GeoTIFFs).

Bounding box (WGS84, EPSG:4326):

| Edge | Value |
| --- | --- |
| West | 86.80° E |
| South | 27.93° N |
| East | 87.02° E |
| North | 28.17° N |

The box is about 21.6 km east–west by 26.6 km north–south. It contains both base camps (south 28.003° N, 86.853° E; north 28.141° N, 86.851° E), the Lhotse–Nuptse wall, Changtse, the Khumbu icefall and upper Khumbu glacier, the Rongbuk glaciers, and the foot of the Kangshung Face to the east. It spans four 1° tiles: `N27_00_E086_00`, `N28_00_E086_00`, `N27_00_E087_00` and `N28_00_E087_00`.

GLO-30 is the only candidate that is gap-free over this box, carries an explicit licence for public redistribution of modified data, needs no account and fits in under 3 MB once cropped. The 8 m HMA mosaic is the only real higher-resolution option, but it is not void-filled, needs an Earthdata login and a reprojection, and its void coverage on Everest's faces could not be checked without that login. If a later terrain prototype finds 30 m too soft on the hero faces, HMA 8 m can be blended in over the summit pyramid with GLO-30 filling its voids. Treat that as an optional upgrade, not the baseline.

## Comparison

| | Copernicus GLO-30 | NASA HMA 8 m mosaic | ALOS AW3D30 v4.1 | NASADEM / SRTM |
| --- | --- | --- | --- | --- |
| Grid | 1 arcsec (≈27 m E–W × 31 m N–S at 28° N) | 8 m, custom Albers projection | 1 arcsec | 1 arcsec |
| Source | TanDEM-X radar, 2011–2015 | WorldView/GeoEye stereo, 2008–2017, multi-year weighted average | ALOS PRISM optical stereo (ALOS flew 2006–2011; not from a cited source) | Shuttle radar, February 2000 |
| Voids | None in the box (checked) | Not filled by design; extent unverified | Filled, with a per-pixel fill-source mask | Filled from ASTER GDEM, AW3D30 and interpolation |
| Heights | EGM2008 geoid | WGS84 ellipsoid | EGM96 geoid | EGM96 geoid |
| Licence for a public demo | Explicit right to redistribute and modify; fixed credit and disclaimer text | Citation required; NASA data openly shared | Free incl. commercial; credit JAXA, notify JAXA for commercial use | Openly shared without restriction; citation requested |
| Access | Anonymous S3/HTTPS | Free Earthdata login | Registration with JAXA | Free Earthdata login |
| Download for the box | 4 tiles, ≈160 MB (or windowed COG reads) | 1 tile, ≈370 MB | 4 tiles | 4 tiles |
| Cropped size (float32) | ≈2.7 MB (863 × 791 px) | ≈36 MB (≈2700 × 3330 px) | ≈2.7 MB | ≈2.7 MB |

### Copernicus DEM GLO-30

- 30 m Digital Surface Model at 1.0 arcsec latitude spacing, from TanDEM-X data acquired 2011–2015. Absolute vertical accuracy is under 4 m (LE90). Relative accuracy is under 2 m on slopes up to 20% and under 4 m on steeper slopes. Absolute horizontal accuracy is under 6 m (CE90). ([Copernicus Data Space, COP-DEM collection](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM))
- Voids in the WorldDEM source were infilled locally from ASTER, SRTM, GMTED2010, AW3D30 and other DEMs. For the Himalaya, a water-body-mask update replaced low-resolution infill with AW3D30. ([same page](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM))
- The data are published on the AWS Open Data registry as COGs in `s3://copernicus-dem-30m/` (eu-central-1), readable with `--no-sign-request` or over plain HTTPS. Some country tiles are withheld from GLO-30, but all four tiles this box needs are present (verified with HTTP 200 responses). ([AWS registry](https://registry.opendata.aws/copernicus-dem/))
- **Licence** ([ESA licence PDF, issue 21/02/2025](https://dataspace.copernicus.eu/sites/default/files/media/files/2025-06/copernicus_contributing_mission_data_access_v2_cop_dem_licenses.pdf), "Licence for Copernicus DEM instance COP-DEM-GLO-30-F"). Article 4 grants reproduction, distribution, communication to the general public, and adaptation, modification and combination, free of charge (Article 5), worldwide and without time limit (Article 3). Article 6 obligations that the credits page must meet:
  - Modified data notice: "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved".
  - Liability sentence: "The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30".
  - Do not imply endorsement by the provider, ESA or Copernicus.

**Checks run on the data.** The four tiles were merged and cropped to the box above with rasterio, reading the COGs directly from the public bucket.

- 863 × 791 pixels, no nodata, elevation range 4,761–8,738 m.
- No spikes or pits: no pixel differs from the mean of its four neighbours by more than 50 m, and only 11 by more than 30 m.
- 2.1% of pixels are steeper than 60°, and 0.06% steeper than 75°. The steep faces are present and continuous rather than smeared out.
- Spot heights (maximum within a 7 × 7 pixel window): Everest 8,737 m, Lhotse 8,416 m, Nuptse 7,798 m, Changtse 7,459 m, South Col ≈7,913 m, south base camp ≈5,296 m, north base camp ≈5,161 m.
- The highest pixel sits about 130 m from Everest's surveyed summit position.
- Peaks read about 110 m low (8,737 m against the official 8,848.86 m). That is expected at 30 m posting: a pixel averages the summit with the slopes around it. The 8 m data would sit much closer. For the demo, labels should state the official height rather than reading it off the mesh. The summit can also be nudged up in preprocessing if the silhouette looks too blunt.

### NASA HMA 8 m DEM mosaic (HMA_DEM8m_MOS v1)

- 8 m posting. Mosaics of over 4,000 DEM strips generated with the NASA Ames Stereo Pipeline from WorldView-1/2/3 and GeoEye-1 stereo imagery, mostly 2013–2016. Each pixel is a weighted average of all valid DEMs, regardless of date. ([NSIDC user guide](https://nsidc.org/sites/default/files/hma_dem8m_mos-v001-userguide_1.pdf), [dataset page](https://nsidc.org/data/hma_dem8m_mos/versions/1))
- **Voids are not filled**: "the investigators elected to preserve only 'valid' DEM pixels, and did not perform any additional interpolation or filling to remove voids." The fill value is -9999. Optical stereo matching tends to fail on shadowed faces and featureless fresh snow (general knowledge, not from a cited source), so voids on the summit pyramid and the big faces are likely. That could not be verified, because the download needs an Earthdata login and none was available. (user guide §1, §3.4)
- Heights are above the WGS84 ellipsoid, not a geoid, and the projection is a custom Albers Equal-Area (`+proj=aea +lat_1=25 +lat_2=47 +lat_0=36 +lon_0=85`). Both mean extra preprocessing steps. Tiles are 100 × 100 km, 12,500 × 12,500 px, LZW-compressed Float32. (user guide §1.4)
- A NASA CMR granule search over the box returns a single tile, `HMA_DEM8m_MOS_20170716_tile-677.tif` (≈370 MB), whose footprint (27.47–28.38° N, 86.49–87.54° E) covers the whole box. The user guide's sample figure is itself the Everest region. ([CMR query](https://cmr.earthdata.nasa.gov/search/granules.json?short_name=HMA_DEM8m_MOS&bounding_box=86.80,27.93,87.00,28.16))
- Licence: no named licence. Citation is "a condition of using these data" (Shean, D. 2017, doi:10.5067/KXOVQ9L172S2). NSIDC states that most of its holdings are government-funded and in the public domain, and the dataset page lists no non-commercial restriction. ([NSIDC data policies](https://nsidc.org/data/data-policies))
- Access: free NASA Earthdata Login, then HTTPS, `earthaccess` or Earthdata Search.

### ALOS AW3D30 v4.1

- 1 arcsec (≈30 m) DSM from ALOS PRISM. Version 4.1 (April 2024) added new void-fill sources and re-filled voids. A per-pixel mask records the fill source: SRTM, ASTER GDEM, TanDEM-X 90 m, Copernicus GLO-30, IDW interpolation and others. ([Earth Engine catalog entry](https://developers.google.com/earth-engine/datasets/catalog/JAXA_ALOS_AW3D30_V4_1))
- Terms: JAXA research data can be used, modified and redistributed free of charge. JAXA must be credited ("Credit: AW3D30 (JAXA)"), commercial use needs advance notice to JAXA, and the terms "are subject to change without notice". ([JAXA data policy](https://earth.jaxa.jp/en/data/policy/))
- Not chosen. It has no resolution advantage over GLO-30. PRISM optical stereo shares the HMA weakness on snow and shadow, which is why AW3D30 relies on fill sources in high mountains. Download needs JAXA registration. JAXA's EORC site (product pages and terms) was down during this research, so the AW3D30 specifics come from the Earth Engine catalog and the general JAXA policy page.

### NASADEM / SRTM

- 1 arcsec SRTM data from February 2000, reprocessed into NASADEM with ASTER GDEM v2, ICESat control points, AW3D30 and interpolation used for improvement and void filling. Openly shared without restriction, citation requested. Needs an Earthdata login. ([Earthdata catalog](https://www.earthdata.nasa.gov/data/catalog/lpcloud-nasadem-hgt-001))
- Not chosen. SRTM's C-band radar is known to leave voids from radar shadow and layover on steep Himalayan faces, which NASADEM fills from other sources (general knowledge, not from a cited source). The data are 11 or more years older than GLO-30, and the glaciers have thinned since.

### Higher-resolution options

- HMA 8 m is the only free, openly licensed sub-30 m DEM found for this area.
- Copernicus WorldDEM-10 exists, but the GLO-30 licence states that "distribution to the general public of these higher resolution DEMs is expressly excluded" ([licence PDF](https://dataspace.copernicus.eu/sites/default/files/media/files/2025-06/copernicus_contributing_mission_data_access_v2_cop_dem_licenses.pdf), Preamble).
- Commercial AW3D at 2.5 m and 5 m is paid. Neither commercial option fits a free public demo.

## Implications for other tickets

- **Credits page.** It must carry the Copernicus "produced using Copernicus WorldDEM-30 …" notice, the liability sentence, and no endorsement wording, per Article 6 above.
- **Preprocessing.** Fetch the four COG tiles over HTTPS (or read windows with `/vsicurl/`, no account), merge, crop to the box, then reproject to a local metric grid such as UTM 45N (EPSG:32645) so pixels are square before meshing. GLO-30 heights are relative to the EGM2008 geoid, close enough to sea level for labels.
- **Route and spot tracing.** Coordinates work directly against this box.
- **Summit height.** The mesh peaks about 110 m low. Use official heights in spot info cards, and decide during the terrain prototype whether to sharpen the summits.
- **Detail on hero faces.** 30 m gives about 790 × 860 vertices over the box, which is light for the performance budget. Close-up camera shots of the South Col and Hillary Step will look soft, so shading and normal detail may have to carry the fine relief.
