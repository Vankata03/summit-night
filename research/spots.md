# What is the spot catalogue?

Research for [issue #4](https://github.com/Vankata03/summit-night/issues/4). Checked 2026-11-18. Machine-readable version: [`spots.json`](spots.json).

## Answer

The catalogue has 34 spots: 24 route waypoints, 4 neighbouring peaks and 6 glaciers. Two of them are marked optional: Mallory's resting place and the West Rongbuk Glacier. Route ids follow issue #3: `south-col` and `north-col` are the hero routes, and `west-ridge`, `kangshung-face`, `hornbein-couloir` and `southwest-face` are the secondary routes.

Positions come from OpenStreetMap nodes and ways (ODbL), the same source as the hero route lines, so the spots line up with the routes. Wikidata fills the two gaps, the Western Cwm and Makalu. Three spots have no mapped feature and are hand-placed: Southwest Face, Kangshung Face and the West Ridge label. Two are marked uncertain because the sources disagree: the Hillary Step and Mallory's resting place.

Altitudes are the values the sources give. Camp heights differ by 50 to 400 m between OSM and the Alan Arnette route guides, so the build should sample the Copernicus GLO-30 DEM at each position and keep the source altitude for the info card. Use the sourced figure on the card and the DEM height to place the marker.

| Spot | Kind | Lat, lon | Alt (m) | Routes | Position | Coordinate source |
|---|---|---|---|---|---|---|
| Everest Base Camp (South) | waypoint | 27.99966, 86.84879 | 5364 | south-col, southwest-face, west-ridge | mapped | [OSM node 5225912921](https://www.openstreetmap.org/node/5225912921) |
| Khumbu Icefall | waypoint | 28.00220, 86.86951 | 5486 | south-col, southwest-face, west-ridge | mapped | [OSM node 4880806687](https://www.openstreetmap.org/node/4880806687) |
| Camp 1 | waypoint | 27.98642, 86.87652 | 6060 | south-col, southwest-face, west-ridge | mapped | [OSM node 4880806686](https://www.openstreetmap.org/node/4880806686) |
| Camp 2 | waypoint | 27.98156, 86.89914 | 6400 | south-col, southwest-face, west-ridge | mapped | [OSM node 4880806685](https://www.openstreetmap.org/node/4880806685) |
| Camp 3 (Lhotse Face) | waypoint | 27.96889, 86.91781 | 7100 | south-col | mapped | [OSM node 5058632244](https://www.openstreetmap.org/node/5058632244) |
| South Col (Camp 4) | waypoint | 27.97337, 86.93025 | 7920 | south-col | mapped | [OSM node 576713400](https://www.openstreetmap.org/node/576713400) |
| The Balcony | waypoint | 27.98234, 86.92902 | 8400 | south-col | mapped | [OSM node 11956009420](https://www.openstreetmap.org/node/11956009420) |
| South Summit | waypoint | 27.98498, 86.92540 | 8749 | south-col, southwest-face, kangshung-face | mapped | [OSM node 1326607409](https://www.openstreetmap.org/node/1326607409) |
| Hillary Step | waypoint | 27.98573, 86.92533 | 8790 | south-col, southwest-face, kangshung-face | uncertain | [OSM node 8692283570](https://www.openstreetmap.org/node/8692283570) |
| Mount Everest summit | waypoint | 27.98806, 86.92521 | 8848.86 | south-col, north-col, west-ridge, kangshung-face, hornbein-couloir, southwest-face | mapped | [OSM node 164979149](https://www.openstreetmap.org/node/164979149) |
| Western Cwm | glacier | 27.98083, 86.89806 | 6000 | south-col, southwest-face, west-ridge | mapped | [Wikidata Q2389798](https://www.wikidata.org/wiki/Q2389798) |
| Everest Base Camp (North) | waypoint | 28.13653, 86.85547 | 5200 | north-col | mapped | [OSM node 11956009447](https://www.openstreetmap.org/node/11956009447) |
| Intermediate Camp | waypoint | 28.08227, 86.91936 | 5800 | north-col | mapped | [OSM node 11956078353](https://www.openstreetmap.org/node/11956078353) |
| Advanced Base Camp | waypoint | 28.03046, 86.94036 | 6500 | north-col | mapped | [OSM node 1348498380](https://www.openstreetmap.org/node/1348498380) |
| North Col (Camp 1) | waypoint | 28.01637, 86.92332 | 7028 | north-col | mapped | [OSM node 1348498379](https://www.openstreetmap.org/node/1348498379) |
| Camp 2 (North Ridge) | waypoint | 28.00624, 86.92990 | 7790 | north-col | mapped | [OSM node 1348498378](https://www.openstreetmap.org/node/1348498378) |
| Camp 3 (North Ridge) | waypoint | 27.99902, 86.93219 | 8300 | north-col | mapped | [OSM node 11956078759](https://www.openstreetmap.org/node/11956078759) |
| First Step | waypoint | 27.99324, 86.92996 | 8500 | north-col | mapped | [OSM node 1326607401](https://www.openstreetmap.org/node/1326607401) |
| Second Step | waypoint | 27.99169, 86.92882 | 8610 | north-col | mapped | [OSM node 1326607406](https://www.openstreetmap.org/node/1326607406) |
| Third Step | waypoint | 27.99037, 86.92723 | 8690 | north-col | mapped | [OSM node 2315316716](https://www.openstreetmap.org/node/2315316716) |
| Mallory's resting place (optional) | waypoint | 27.99756, 86.93028 | 8160 | north-col | uncertain | [OSM node 2315315450](https://www.openstreetmap.org/node/2315315450) |
| Rongbuk Glacier | glacier | 28.06668, 86.87756 | DEM | north-col | mapped | [OSM way 262484602](https://www.openstreetmap.org/way/262484602) |
| East Rongbuk Glacier | glacier | 28.05452, 86.93090 | DEM | north-col | mapped | [OSM relation 3869827](https://www.openstreetmap.org/relation/3869827) |
| West Rongbuk Glacier (optional) | glacier | 28.05718, 86.80563 | DEM | - | mapped | [OSM relation 3776706](https://www.openstreetmap.org/relation/3776706) |
| West Ridge | waypoint | 27.99241, 86.90711 | DEM | west-ridge, hornbein-couloir | approx | [OSM way 496364344](https://www.openstreetmap.org/way/496364344) |
| Hornbein Couloir | waypoint | 27.99212, 86.92080 | DEM | hornbein-couloir, west-ridge | mapped | [OSM way 1239349882](https://www.openstreetmap.org/way/1239349882) |
| Southwest Face | waypoint | 27.98400, 86.91300 | DEM | southwest-face | approx | hand-placed |
| Kangshung Face | waypoint | 27.98500, 86.95500 | DEM | kangshung-face | approx | hand-placed |
| Kangshung Glacier | glacier | 27.99223, 87.03391 | DEM | kangshung-face | mapped | [OSM way 291527981](https://www.openstreetmap.org/way/291527981) |
| Lhotse | peak | 27.96199, 86.93250 | 8516 | - | mapped | [OSM node 335376854](https://www.openstreetmap.org/node/335376854) |
| Nuptse | peak | 27.96737, 86.88696 | 7861 | - | mapped | [OSM node 3696097628](https://www.openstreetmap.org/node/3696097628) |
| Changtse | peak | 28.02433, 86.91519 | 7543 | - | mapped | [OSM node 2677892526](https://www.openstreetmap.org/node/2677892526) |
| Makalu | peak | 27.88917, 87.08861 | 8485 | - | mapped | [Wikidata Q169986](https://www.wikidata.org/wiki/Q169986) |
| Khumbu Glacier | glacier | 27.96974, 86.83593 | DEM | south-col, southwest-face, west-ridge | mapped | [OSM relation 3793352](https://www.openstreetmap.org/relation/3793352) |

Position values: **mapped** means an OSM or Wikidata feature sits at that point. **approx** means hand-placed for this catalogue, so snap it to the DEM. **uncertain** means the sources disagree; see the note under the spot. "DEM" in the altitude column means no source altitude; sample the DEM.

## Gaps and coordinate uncertainties

- **Hillary Step.** The OSM node (27.98573, 86.92533) is only about 85 m north of the South Summit node. Wikidata puts the Step at 27.987468, 86.924828, about 200 m further north and about 75 m from the summit. Check both against the ridge on the DEM before choosing. My inference, not a sourced fact: the Wikidata position fits better, because the Step is the last obstacle before the summit slopes.
- **Camp altitudes.** OSM and the Arnette guides differ for Camp 1 (6060 vs 5943 m), Camp 3 (7100 vs 7162 m), Camp 4 (7920 vs 8016 m), Camp 2 North (7790 vs 7500 m) and Intermediate Camp (5800 vs 6187 m). These camps spread over hundreds of metres, so both figures are defensible. Sample the DEM.
- **South Col vs Camp 4, North Col vs Camp 1.** OSM maps each saddle and each camp as separate nodes, 152 m and 24 m apart. The catalogue uses the camp nodes because they sit on the route lines.
- **Hand-placed spots.** Southwest Face (27.984, 86.913) and Kangshung Face (27.985, 86.955) have no mapped feature. West Ridge uses the centre of the OSM arete way. Snap all three to the DEM and check them against the hand-traced secondary routes.
- **Outside the terrain bbox.** Makalu sits about 7 km east of the bbox's E87.02 edge, which fits the decision to show it as a silhouette only. The Kangshung Glacier polygon's centroid (87.034) also falls outside, so place its label at about 27.985, 87.00.
- **Glacier label points.** Glacier coordinates are polygon centroids or Wikidata points, not hand-picked label positions. The Khumbu has two OSM relations: 3793352 for the lower glacier and 17497467 for the upper. The Rongbuk entry uses the Central Rongbuk way.
- **Not in the catalogue.** Mushroom Rock (8549 m, north route), the Yellow Band, the Geneva Spur, the Lhotse Face as its own spot, the Exit Cracks, the Great (Norton) Couloir and the Lho La have no OSM nodes, or no verified story. They can be added later as hand-placed spots. Pumori (OSM node 2677892533, 7138 m) is in the bbox and above Everest Base Camp, but the ticket does not ask for it.
- **Mallory's resting place.** This is a grave. It is marked optional so that including it is a deliberate choice. The OSM node's position is not independently confirmed.
- **West Rongbuk Glacier** has no verified story and is a label only.

## Source quality

- **Positions.** OpenStreetMap, queried through Overpass on 2026-11-18, and Wikidata. These are the primary sources for coordinates. OSM elevations on peaks match Wikidata wherever both exist.
- **History.** The stories cite expedition reports in the American Alpine Journal, the Alpine Journal and the Himalayan Journal, plus the Himalayan Database. The Everest height comes from the Nepal-China joint announcement (8 Dec 2020), as reported by the Nepali Times.
- **Secondary sources.** Route logistics (camp positions, the Balcony as the oxygen swap point, terrain angles) come from Alan Arnette's route guides. These are secondary sources, but they are the standard reference for the modern routes. The 2014 and 2015 avalanche figures come from National Geographic, the Hillary Step collapse report from the Kathmandu Post, the Makalu first ascent from Guinness World Records, and Wheeler's 1921 survey from the RMC Club's e-Veritas. Project Gutenberg was down, so the 1921 reconnaissance book could not be checked directly.
- **Licence.** OSM data needs "© OpenStreetMap contributors" on the credits page. That credit is already needed for the routes in #3.

## Spot stories

### Everest Base Camp (South)

The Nepal-side base camp sits on the moving Khumbu Glacier, so tent platforms shift and melt through the season. On 25 April 2015 the Gorkha earthquake sent an avalanche into the camp, the deadliest disaster in Everest's history.

- Altitude: OSM 5364 m; Arnette gives 5334 m.
- Sources: [Alan Arnette, "Mt. Everest Southeast Ridge" route guide](https://www.alanarnette.com/everest/everestsouthroutes.php); [National Geographic, 25 Apr 2015, earthquake avalanche at Everest Base Camp](https://www.nationalgeographic.com/science/article/150425-everest-earthquake-basecamp-nepal-himalaya-climbing-sherpa).

### Khumbu Icefall

About 600 m of broken, moving ice where the Khumbu Glacier drops out of the Western Cwm; seracs and crevasses shift up to a metre a day. On 18 April 2014 an ice avalanche off the West Shoulder killed 16 Sherpas carrying loads through it.

- Altitude: OSM and Wikidata agree on 5486 m (a point value for a ~600 m tall feature).
- Sources: [Alan Arnette, "Mt. Everest Southeast Ridge" route guide](https://www.alanarnette.com/everest/everestsouthroutes.php); [National Geographic, 24 Apr 2014, Everest closes after avalanche](https://www.nationalgeographic.com/adventure/article/140424-everest-closes-avalanche-sherpas-nepal-climbing-expedition).

### Camp 1

The first camp above the Icefall, at the mouth of the Western Cwm, four to six hours from base camp.

- Altitude: OSM 6060 m; Arnette 5943 m.
- Sources: [Alan Arnette, "Mt. Everest Southeast Ridge" route guide](https://www.alanarnette.com/everest/everestsouthroutes.php).

### Camp 2

Set at the head of the Western Cwm under the Southwest Face, two to three hours above Camp 1. Avalanches can reach it from the West Shoulder and Nuptse's north flank, and on still days the Cwm traps fierce heat.

- Altitude: OSM and Arnette agree on 6400 m.
- Sources: [Alan Arnette, "Mt. Everest Southeast Ridge" route guide](https://www.alanarnette.com/everest/everestsouthroutes.php).

### Camp 3 (Lhotse Face)

Tents cut into ledges on the Lhotse Face, a wall of hard ice angled 20 to 45 degrees and climbed on fixed rope. Many teams start bottled oxygen here or at Camp 2.

- Altitude: OSM 7100 m; Arnette 7162 m.
- Sources: [Alan Arnette, "Mt. Everest Southeast Ridge" route guide](https://www.alanarnette.com/everest/everestsouthroutes.php).

### South Col (Camp 4)

A flat, wind-scoured saddle of loose rock between Everest and Lhotse, and the staging camp for summit bids. Teams leave from here at night for the summit (see issue #5).

- Altitude: Camp 4 node 7920 m; the saddle node 2540248530 is 7907 m at 27.9742, 86.93191 (152 m away); Arnette 8016 m.
- Sources: [Alan Arnette, "Mt. Everest Southeast Ridge" route guide](https://www.alanarnette.com/everest/everestsouthroutes.php).

### The Balcony

A small platform on the Southeast Ridge, reached after four to five hours up the Triangular Face from the South Col. It is the first rest of summit night, where climbers swap to a fresh oxygen bottle.

- Altitude: OSM and Arnette agree on 8400 m.
- Sources: [Alan Arnette, "Mt. Everest Southeast Ridge" route guide](https://www.alanarnette.com/everest/everestsouthroutes.php).

### South Summit

A snow dome on the ridge below the true summit. Tom Bourdillon and Charles Evans of the 1953 British expedition made its first ascent before Hillary and Tenzing's summit day. In 1975 Doug Scott and Dougal Haston bivouacked at the South Summit on their way down from the Southwest Face.

- Altitude: OSM and Wikidata agree on 8749 m; Arnette 8690 m.
- Sources: [Graham Brown, "Everest", Alpine Journal 59 (1953) 102-106](https://www.alpinejournal.org.uk/Contents/Contents_1953_files/AJ59%201953%20102-106%20Graham%20Brown%20Everest.pdf); [Scott, "Everest South-West Face Climbed", Himalayan Journal 34](https://www.himalayanclub.org/hj/34/1/everest-south-west-face-climbed/).

### Hillary Step

A rock step of about 12 m on the summit ridge, climbed by Hillary and Tenzing on 29 May 1953. In May 2017 climbers reported that it had collapsed, probably in the 2015 earthquake; Nepali officials disputed this, saying it was covered by snow.

- Altitude: OSM 8790 m. Wikidata Q15114831 places it at 27.987468, 86.924828, about 190 m north of the OSM node.
- Sources: [Hillary, "Everest 1953 (4): The Last Lap", Alpine Journal 59 (1954) 235-238](https://www.alpinejournal.org.uk/Contents/Contents_1954_files/AJ59%201954%20235-238%20Hillary%20Everest%20(4).pdf); [Kathmandu Post, 22 May 2017, "Mt Everest's famous Hillary Step no more, reports BBC"](https://kathmandupost.com/national/2017/05/22/mt-everests-famous-hillary-step-no-more-reports-bbc).

### Mount Everest summit

The highest point on Earth, 8848.86 m by the Nepal-China survey announced in December 2020. Edmund Hillary and Tenzing Norgay first stood here on 29 May 1953, having come up the South Col route.

- Altitude: 8848.86 m: Nepal-China joint survey, announced 8 Dec 2020.
- Sources: [Nepali Times, "Mt Everest grows by 86cm" (Nepal-China joint announcement, 8 Dec 2020)](https://nepalitimes.com/mt-everest-grows-by-86cm); [Hillary, "Everest 1953 (4): The Last Lap", Alpine Journal 59 (1954) 235-238](https://www.alpinejournal.org.uk/Contents/Contents_1954_files/AJ59%201954%20235-238%20Hillary%20Everest%20(4).pdf).

### Western Cwm

The enclosed glacier valley between Everest's West Shoulder, Nuptse and the Lhotse Face, with Camps 1 and 2 on its floor. Camps 1 and 2 sit on its floor, and on still days it traps intense heat.

- Altitude: Wikidata 6000 m (valley floor, nominal); OSM maps it as natural=valley, way 761066483.
- Sources: [Alan Arnette, "Mt. Everest Southeast Ridge" route guide](https://www.alanarnette.com/everest/everestsouthroutes.php).

### Everest Base Camp (North)

A windy gravel plain near Rongbuk Monastery at the snout of the Rongbuk Glacier, at the end of the road. Vehicles can reach it, but as of 2026 there is no helicopter rescue on the north side.

- Altitude: OSM 5200 m; Arnette 5182 m.
- Sources: [Alan Arnette, "Mt. Everest North Ridge" route guide](https://www.alanarnette.com/everest/everestnorthroutes.php).

### Intermediate Camp

A small camp on the moraine of the East Rongbuk Glacier, used to break the walk-in to Advanced Base Camp during acclimatisation.

- Altitude: OSM 5800 m; Arnette 6187 m (large discrepancy; sample the DEM).
- Sources: [Alan Arnette, "Mt. Everest North Ridge" route guide](https://www.alanarnette.com/everest/everestnorthroutes.php).

### Advanced Base Camp

The real home camp of the north side, at the head of the East Rongbuk Glacier with a direct view of the North Col. Yaks carry loads up to it from base camp.

- Altitude: OSM 6500 m; Arnette 6492 m.
- Sources: [Alan Arnette, "Mt. Everest North Ridge" route guide](https://www.alanarnette.com/everest/everestnorthroutes.php).

### North Col (Camp 1)

The saddle between Everest and Changtse, reached by steep fixed ropes up to 60 degrees from the East Rongbuk Glacier. In September 1921 Mallory, Bullock and Wheeler climbed to just below its lip before wind turned them back.

- Altitude: Camp 1N node 7028 m; the saddle node 2681946526 is 7042 m at 28.01616, 86.92336; Wikidata 7020 m.
- Sources: [Alan Arnette, "Mt. Everest North Ridge" route guide](https://www.alanarnette.com/everest/everestnorthroutes.php); [e-Veritas (RMC Club), "Major E. Oliver Wheeler and the 1921 Everest Reconnaissance Expedition"](https://everitas.rmcalumni.ca/758-major-e-oliver-wheeler-and-the-1921-everest-reconnaissance-expedition/).

### Camp 2 (North Ridge)

Tents on the North Ridge above the North Col, where the snow ridge turns to rock. The site is exposed and bitterly cold in high wind.

- Altitude: OSM 7790 m; Arnette 7500 m.
- Sources: [Alan Arnette, "Mt. Everest North Ridge" route guide](https://www.alanarnette.com/everest/everestnorthroutes.php).

### Camp 3 (North Ridge)

Tents pitched on sloping rock ledges, often battered by wind, and the launch point for summit night on the north side.

- Altitude: OSM and Arnette agree on 8300 m.
- Sources: [Alan Arnette, "Mt. Everest North Ridge" route guide](https://www.alanarnette.com/everest/everestnorthroutes.php).

### First Step

The first of three rock steps on the Northeast Ridge, climbed with careful footwork and a fixed rope up a final gully.

- Altitude: OSM node has no elevation; 8500 m from Arnette.
- Sources: [Alan Arnette, "Mt. Everest North Ridge" route guide](https://www.alanarnette.com/everest/everestnorthroutes.php).

### Second Step

The crux of the north route: a rock slab and a near-vertical headwall. The 1960 Chinese team reported climbing it with one man standing on another's shoulders; a 1975 Chinese expedition fixed a ladder, which almost every summiter on this route has used since.

- Altitude: OSM 8610 m; Arnette's schedule gives 8577 m.
- Sources: ["Second Step History", American Alpine Journal 2008](https://publications.americanalpineclub.org/articles/12200844901/Second-Step-History); [Himalayan Database, expedition EVER60102 (Everest 1960, N Col-NE Ridge)](https://himalayan-database.climbing-history.org/expedition/EVER60102/1960); [Alan Arnette, "Mt. Everest North Ridge" route guide](https://www.alanarnette.com/everest/everestnorthroutes.php).

### Third Step

About 10 m of rock, the easiest of the three steps, below the snow of the summit pyramid.

- Altitude: OSM node has no elevation; 8690 m from Arnette.
- Sources: [Alan Arnette, "Mt. Everest North Ridge" route guide](https://www.alanarnette.com/everest/everestnorthroutes.php).

### Mallory's resting place

George Mallory and Andrew Irvine disappeared high on the Northeast Ridge in June 1924. The 1999 Mallory and Irvine Research Expedition found Mallory's body on the north face below the ridge, at about 8160 m, and buried it there.

- Altitude: AAJ gives 8160 m; other reports 8155-8156 m. The OSM node (no elevation) is labelled George Mallory; its exact position is not independently confirmed.
- Sources: ["Mallory and Irvine Research Expedition", American Alpine Journal 2000](https://publications.americanalpineclub.org/articles/12200037502/Asia-Tibet-Mount-Everest-Mallory-and-Irvine-Research-Expedition).

### Rongbuk Glacier

The main glacier draining Everest's north side toward the Rongbuk valley and the north base camp. In 1921 the British reconnaissance found that the way to the North Col lay not up the main glacier but up its eastern branch.

- Altitude: Polygon centroid; sample the DEM for altitude.
- Sources: [e-Veritas (RMC Club), "Major E. Oliver Wheeler and the 1921 Everest Reconnaissance Expedition"](https://everitas.rmcalumni.ca/758-major-e-oliver-wheeler-and-the-1921-everest-reconnaissance-expedition/).

### East Rongbuk Glacier

The side glacier that carries the north route from Intermediate Camp to Advanced Base Camp and the foot of the North Col. Surveyor Oliver Wheeler mapped it in August 1921 and showed it was the way to the col.

- Altitude: Polygon centroid; sample the DEM for altitude.
- Sources: [e-Veritas (RMC Club), "Major E. Oliver Wheeler and the 1921 Everest Reconnaissance Expedition"](https://everitas.rmcalumni.ca/758-major-e-oliver-wheeler-and-the-1921-everest-reconnaissance-expedition/); [Alan Arnette, "Mt. Everest North Ridge" route guide](https://www.alanarnette.com/everest/everestnorthroutes.php).

### West Rongbuk Glacier

The western branch of the Rongbuk system, draining the slopes between Pumori, Lingtren and Khumbutse. No story source verified yet; label only.

- Altitude: Polygon centroid; near the western edge of the terrain bbox.
- Sources: none verified.

### West Ridge

The ridge running west from the summit above the Western Cwm. On 22 May 1963 Tom Hornbein and Willi Unsoeld climbed its upper part, traversed the mountain and came down the Southeast Ridge, surviving a bivouac above 28,000 ft.

- Altitude: Centre of the OSM arete way (3.8 km); place the marker on the ridge crest and sample the DEM.
- Sources: [Webster, "1963. Everest West Ridge Traverse", American Alpine Journal 2002](https://publications.americanalpineclub.org/articles/12200202700/1963-Everest-West-Ridge-Traverse).

### Hornbein Couloir

The gully on the north face that Hornbein and Unsoeld followed in 1963, crossing the Yellow Band to reach the summit ridge. It now carries Hornbein's name.

- Altitude: Centre of the 0.36 km OSM couloir way; sample the DEM.
- Sources: [Webster, "1963. Everest West Ridge Traverse", American Alpine Journal 2002](https://publications.americanalpineclub.org/articles/12200202700/1963-Everest-West-Ridge-Traverse).

### Southwest Face

The steep face rising from the Western Cwm to the South Summit, cut by a 300 m Rock Band. Doug Scott and Dougal Haston made its first ascent on 24 September 1975; Mick Burke went for the summit alone two days later and was never seen again.

- Altitude: Hand-placed on the face above the Western Cwm; no mapped feature. Snap to the DEM.
- Sources: [Scott, "Everest South-West Face Climbed", Himalayan Journal 34](https://www.himalayanclub.org/hj/34/1/everest-south-west-face-climbed/).

### Kangshung Face

Everest's broad east face above the Kangshung Glacier, the last of its faces to be climbed. An American team climbed a 1200 m buttress and an overhanging headwall, and Carlos Buhler, Kim Momb and Louis Reichardt reached the summit on 8 October 1983.

- Altitude: Hand-placed on the east face; no mapped feature. Snap to the DEM.
- Sources: [Morrissey, "Kangshung Face of Everest", American Alpine Journal 1984](https://publications.americanalpineclub.org/articles/12198400100/Kangshung-Face-of-Everest).

### Kangshung Glacier

The glacier under Everest's east face, reached from the Kama valley in Tibet. The 1983 American Kangshung expedition put its base camp on it at about 17,000 ft.

- Altitude: Polygon centroid lies just east of the DEM bbox (E87.02); place the label on the glacier inside the bbox, about 27.985, 87.00.
- Sources: [Morrissey, "Kangshung Face of Everest", American Alpine Journal 1984](https://publications.americanalpineclub.org/articles/12198400100/Kangshung-Face-of-Everest).

### Lhotse

The world's fourth-highest mountain, joined to Everest by the South Col. Swiss climbers Ernst Reiss and Fritz Luchsinger made the first ascent on 18 May 1956 by a steep couloir on the northwest face.

- Altitude: OSM and Wikidata agree on 8516 m.
- Sources: ["Everest - Lhotse, 1956", American Alpine Journal 1957](https://publications.americanalpineclub.org/articles/12195712100).

### Nuptse

The long ridge that walls the Western Cwm on the south and looms over Everest Base Camp. Dennis Davis and Tashi Sherpa of a British expedition led by Joe Walmsley reached its main summit in May 1961.

- Altitude: OSM main summit (Nuptse I) 7864 m; Wikidata 7861 m.
- Sources: [Himalayan Database, expedition NUPT61101 (Nuptse 1961)](https://himalayan-database.climbing-history.org/expedition/NUPT61101/1961).

### Changtse

Everest's northern neighbour, linked to it by the North Col. Udo Zehetleitner of a West German expedition made the first official ascent on 14 October 1982 by the northeast ridge.

- Altitude: OSM and Wikidata agree on 7543 m.
- Sources: ["Asia, China, Changtse", American Alpine Journal 1983](https://publications.americanalpineclub.org/articles/12198329401).

### Makalu

The world's fifth-highest mountain, 19 km southeast of Everest. Jean Couzy and Lionel Terray of Jean Franco's French expedition made the first ascent on 15 May 1955.

- Altitude: Wikidata 8485 m. Outside the DEM bbox (about 7 km east of its E87.02 edge): silhouette and label only.
- Sources: [Guinness World Records, "First ascent of Makalu"](https://www.guinnessworldrecords.com/world-records/first-ascent-of-makalu).

### Khumbu Glacier

The glacier that flows out of the Western Cwm, tumbles through the Icefall and carries Everest Base Camp on its surface. Climbers walk on it from base camp to Camp 2.

- Altitude: Centroid of the lower-glacier relation; relation 17497467 covers the upper glacier (centroid 27.98394, 86.88787).
- Sources: [Alan Arnette, "Mt. Everest Southeast Ridge" route guide](https://www.alanarnette.com/everest/everestsouthroutes.php).
