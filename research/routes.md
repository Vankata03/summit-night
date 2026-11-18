# Where can route geometry come from?

Research for [issue #3](https://github.com/Vankata03/summit-night/issues/3). Checked 2026-11-18.

## Answer

| Route | Best source | Format | Licence | Accuracy | Hand-trace on the DEM? |
|---|---|---|---|---|---|
| South Col (hero) | OSM relation [17822898](https://www.openstreetmap.org/relation/17822898) "Everest South Col" | OSM ways (lat/lon, no elevation) | ODbL 1.0 | Traced from the Strava heatmap; passes within 8 to 56 m of the mapped Camp 1S to Camp 4S nodes | No. Drape on the DEM |
| North Col / NE Ridge (hero) | OSM relation [17675930](https://www.openstreetmap.org/relation/17675930) "Everest North Col" | OSM ways plus tagged camp and step nodes | ODbL 1.0 | Traced from 2bulu GPS tracks (2022-04-06) and the Strava heatmap | No. Drape on the DEM |
| West Ridge | OSM arete way [496364344](https://www.openstreetmap.org/way/496364344) "West Ridge" (ridge crest, not a climbing line) | OSM way, 24 nodes | ODbL 1.0 | Ridge crest copied from a boundary dataset (`source=LSIB3`); coarse | Partly. Use the crest as a guide, hand-trace the approach from the Western Cwm or Lho La |
| Hornbein Couloir | OSM couloir way [1239349882](https://www.openstreetmap.org/way/1239349882): only a 0.36 km stretch of the couloir | OSM way, 7 nodes | ODbL 1.0 | Covers a fragment only | Yes, everything except that fragment |
| Kangshung Face | Nothing in OSM beyond the Kangshung Glacier polygon | — | — | — | Yes, entirely |
| Southwest Face | Nothing in OSM. Commons topo diagram of the 1975 route as visual reference | SVG diagram, no coordinates | CC BY-SA 4.0 | Schematic only | Yes, entirely |

The two hero routes can come straight from OpenStreetMap. The four secondary routes need hand-tracing on the DEM, guided by OSM's ridge and couloir features and by openly licensed route diagrams, and they carry the "approximate" disclaimer. No public GPS track was found that is both downloadable and openly licensed for any route.

## OpenStreetMap (primary source for both hero routes)

Data was pulled from the OSM API on 2026-11-18 (`/api/0.6/map.json` over two bounding boxes around the massif, then `/api/0.6/relation/<id>/full.json`). The public Overpass endpoint was at capacity, so the main API was used instead. The main API is fine for a one-off pull at this size, about 2 MB per box.

### South Col: relation 17822898

- Tags: `route=hiking`, `network=nwn`, `name:en=Everest South Col`. Version 11, last edited 2026-11-08, so it is still actively maintained.
- Five ways, 12.4 km in total, from Everest Base Camp (28.0026, 86.8553) to the summit node (27.98806, 86.92521). Average node spacing is about 20 m.
- Member ways carry `note="No 'path'. Main route according to Strava heatmap 2022-2023."`, `surface=ice` and `sac_scale=difficult_alpine_hiking`. One way carries `source=strava`.
- Closest approach of the line to the separately mapped camp nodes: Camp 1S 56 m, Camp 2S 15 m, Camp 3S 18 m, Camp 4S 8 m. It passes 152 m from the `natural=saddle` "South Col" node.
- The relation has no camp or waypoint members, but these nodes are mapped nearby and can be used as spots: Everest Base Camp (5364 m), Khumbu Icefall (5486 m), Camp 1S (6060 m), Camp 2S (6400 m), Camp 3S (7100 m), Camp 4S South Col (7920 m), South Col saddle (7907 m), The Balcony (8400 m), Hillary Step (8790 m).

### North Col / NE Ridge: relation 17675930

- Tags: `route=hiking`, `network=nwn`, `name:en=Everest North Col`. Version 3, last edited 2025-11-24.
- Seven ways, 24.6 km in total, from a start node at about 28.141, 86.853 near the Rongbuk (Chinese) Everest Base Camp node (28.1365, 86.8555, 5200 m) to the summit node. Average node spacing is about 24 m.
- Most ways carry `source=2bulu`, `source:date=2022-04-06` and `note=main path`. 2bulu is a Chinese GPS-track sharing site. Some ways carry `source:geometry=Strava`.
- One member way (556603374, 0.43 km) is tagged `note=alternative path` and should be dropped when building a single line.
- The relation includes waypoint members with roles `camp`, `marker` and `end`: Intermediate Camp (5800 m), ABC (6500 m), Camp 1N at the North Col (7028 m), Camp 2N (7790 m), Camp 3N (8300 m), First Step, Second Step (8610 m), Third Step, and the summit. These cover the spot catalogue for the North route.

### Other OSM features useful for hand-tracing

- Aretes: West Ridge (496364344, 3.83 km, from the summit to 27.9968, 86.8890), Southeast Ridge (262529816), Northeast Ridge (518627785 and 262529815), North-Northwest Ridge (262530631), Fantasy Ridge (263341719).
- Hornbein Couloir (1239349882, `natural=couloir`, 7 nodes, 0.36 km).
- Saddles: North Col, South Col, Lho La, Rapu La, Lhakpa La.
- Kangshung Glacier (291527981) and Western Cwm (761066483) polygons.

### Format, accuracy and licence

- **Format.** OSM ways are 2D lat/lon polylines with no elevation. Convert them to GeoJSON, for example with `osmtogeojson` or a short script over `full.json`, then sample heights from the DEM. Lift the line a few metres so it does not clip into the terrain.
- **Accuracy.** The lines are traced from aggregated GPS activity (the Strava heatmap) and from individual GPS tracks (2bulu). That puts them within tens of metres of where people actually climb, which is finer than any plausible web DEM cell at this zoom. Vertical error therefore comes from the DEM, not from the route. Expect the draped line to look wrong on steep faces, such as the Lhotse Face and the Second Step, where a few metres of horizontal error mean large vertical jumps. A small amount of smoothing or a vertical offset fixes this.
- **Licence.** OSM data is under the Open Database License 1.0. A rendered visual is a "Produced Work" and needs the attribution "© OpenStreetMap contributors" ([openstreetmap.org/copyright](https://www.openstreetmap.org/copyright)). The extracted GeoJSON shipped in the repo is a derivative database, so it stays under ODbL. That is compatible with a public demo. Add the attribution to the credits page.
- **Strava provenance.** OSM contributors may trace the Strava heatmap into OSM only ([OSM wiki: Strava](https://wiki.openstreetmap.org/wiki/Strava)). Using OSM's traced ways is fine, because they are now OSM data. Tracing the heatmap directly into this project is not allowed without a Strava Metro agreement.

## Public GPS tracks

- **Wikiloc.** Search requests returned HTTP 403, so no downloadable, licensed Everest summit track was confirmed. Wikiloc tracks are user content under the site's terms, not an open licence. Not recommended.
- **Strava.** Heatmap and activity data are commercial. See above.
- **2bulu.** Used as an OSM source for the North route. The project gets its benefit through OSM, under ODbL.
- Climbers are reported to carry mandatory GPS trackers (a secondary source, not verified), but no public dataset of those tracks was found.

Conclusion: OSM is the only openly licensed GPS-derived geometry, and it covers the two hero routes.

## Published topos and diagrams (references for hand-tracing)

These have no coordinates. They show where a line goes relative to features you can see on the DEM: ridges, couloirs, bands and cols.

- [File:Mount Everest Climbing Routes 1924-1996 photomap-fr.svg](https://commons.wikimedia.org/wiki/File:Mount_Everest_Climbing_Routes_1924-1996_photomap-fr.svg), by Sémhur. Free Art License or CC BY-SA 4.0/3.0/2.5/2.0/1.0. Two 3D views, from 215° and 110°, rendered in NASA World Wind, showing routes opened from 1924 to 1996. Based on National Geographic's *Mount Everest 50th Anniversary* map. It covers the north and east (Kangshung) sides, so it is the main reference for the Kangshung Face and the West Ridge and Hornbein lines.
- [File:Mount Everest,1975 climbing route on Southwest Face.svg](https://commons.wikimedia.org/wiki/File:Mount_Everest,1975_climbing_route_on_Southwest_Face.svg), by Thincat. CC BY-SA 4.0. Topo of the 1975 Bonington route and camps, based on Bonington's *Everest the Hard Way* (1976, p. 92) and Unsworth's *Everest* (1981, p. 444). [Category:Diagrams of Mount Everest](https://commons.wikimedia.org/wiki/Category:Diagrams_of_Mount_Everest) also has pre-1975 and pre-1976 Southwest Face route diagrams.
- [File:1963 American Everest expedition.svg](https://commons.wikimedia.org/wiki/File:1963_American_Everest_expedition.svg). CC0, on Tom Patterson's 3D relief view from the west-northwest. The file page does not list which lines are annotated. Open the SVG to confirm before relying on it for the West Ridge and Hornbein Couloir.
- National Geographic and Bradford Washburn maps, and expedition books: route lines are copyrighted. Use them only to check a hand-traced line by eye. Do not copy them.

## Hand-tracing plan for the secondary routes

1. Use the DEM as the canvas and OSM aretes, couloirs, saddles and camps as anchors. Snap trace points to features you can see in the shaded DEM.
2. **West Ridge.** Start from the OSM West Ridge arete for the crest above the West Shoulder. Hand-trace the lower approach from the Western Cwm, the 1963 line, or from the Lho La, the 1979 Yugoslav full-ridge line. Decide in the spot or tour ticket which variant to show.
3. **Hornbein Couloir.** From the West Shoulder, hand-trace across the north face into the OSM couloir segment, then continue up to the summit.
4. **Kangshung Face.** Hand-trace from the Kangshung Glacier up the face to the South Col (1988) or the Southeast Ridge (1983), using the 1924–1996 photomap.
5. **Southwest Face.** Hand-trace from the Western Cwm up the central gully and the Rock Band to the South Summit, following the 1975 topo.
6. Store each route as GeoJSON with a `source` property (`osm` or `hand-traced`), and show the "approximate" disclaimer for `hand-traced`.

## Notes for other tickets

- **Spot catalogue.** OSM already has tagged nodes with elevations for every South Col and North route camp, the First, Second and Third Steps, the Hillary Step, the Balcony, the Khumbu Icefall, saddles and nearby peaks, including Makalu at 27.8914, 87.0884, 8485 m. The North relation even links its waypoints by role.
- **Credits page.** It must include "© OpenStreetMap contributors (ODbL)", plus credits for any CC BY-SA diagrams used as tracing references if they appear in the app.
- **Data preprocessing tooling.** Add a script that pulls the two relations, drops way 556603374, orders and stitches the member ways, and drapes the line on the DEM.

## Sources

- OSM API: [relation 17822898](https://www.openstreetmap.org/relation/17822898), [relation 17675930](https://www.openstreetmap.org/relation/17675930), [way 496364344](https://www.openstreetmap.org/way/496364344), [way 1239349882](https://www.openstreetmap.org/way/1239349882). Fetched 2026-11-18 through `https://api.openstreetmap.org/api/0.6/`.
- [OpenStreetMap copyright and licence](https://www.openstreetmap.org/copyright)
- [OSM wiki: Strava](https://wiki.openstreetmap.org/wiki/Strava)
- Wikimedia Commons file pages linked above.
