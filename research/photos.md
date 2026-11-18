# Which Creative Commons photos illustrate each spot?

Research for [issue #6](https://github.com/Vankata03/summit-night/issues/6). Checked 2026-11-18. Machine-readable version: [`photos.json`](photos.json). The spot list is the 34-spot catalogue from issue #4 (`research/spots.json` on branch `research/spots`).

## Answer

All 34 spots can show a freely licensed picture, but only 22 show the spot itself. The other 12 split into 10 proxies and 2 gaps.

- **Direct (22):** the photo shows the spot. Two of these, the West Rongbuk Glacier and the Kangshung Face, use public-domain ISS crew photos because no Creative Commons photo exists.
- **Proxy (10):** the photo shows the spot's surroundings, the view from it, or an annotated diagram. Camp 2 (South) uses a Western Cwm view, the Balcony a view down the Southeast Ridge, and Advanced Base Camp the North Col as seen from ABC. Seven spots share one annotated north-face diagram: Camps 2 and 3 on the North Ridge, the First, Second and Third Steps, Mallory's resting place and the Hornbein Couloir.
- **None (2):** Camp 1 (South) and Intermediate Camp have no usable photo. The fallback for each is to reuse a neighbouring spot's photo, as given below.

Every chosen file is on Wikimedia Commons. None is NonCommercial, so the NC allowance was not needed. Among the 25 distinct primary files the licences are: CC BY-SA 4.0 (9), CC BY-SA 3.0 (4), CC BY 4.0 (3), CC BY 2.0 (2), CC BY-SA 2.5 (2), public domain (2), CC BY-SA 3.0 US (1), CC BY-SA 2.0 (1) and CC0 (1). Seventeen are ShareAlike. Showing the picture unmodified on a card with credit meets every licence. A crop or colour grade makes it an adaptation, which must keep the same licence and say it was changed.

## What the build needs to know

- **Credit line.** Each card and the credits page need the author, the licence name linked to its deed, and a link to the file page. Commons' own attribution line is the safe default. CC0 and public-domain files need no credit, but give one anyway so the credits page stays consistent.
- **Hotlink or bundle.** The `image_url` values point to the full-size originals on `upload.wikimedia.org`, and some are 5000+ px. Use `thumb_url` (a Commons thumbnail about 1920 px wide) or resize at build time. Do not hotlink the originals. Downloading and bundling the files belongs to the data preprocessing step and was not done here.
- **One uploader carries six spots.** AngeliSherpa's May 2026 uploads cover Khumbu Icefall, Camp 3, South Col, Balcony, Western Cwm and the South Col alternate. They are recent own-work uploads that nobody has reviewed yet. Re-check that the file pages still exist before the build bundles them, and fall back to the listed alternates if they do not.
- **Hillary Step photo is pre-2016.** It was taken on 17 May 2010, before the rock step changed shape. The card should say "photo 2010".
- **Low-resolution picks.** Camp 2 (South) is 800x600, the north-face diagram 720x540, Kangshung Glacier 756x1008 and East Rongbuk Glacier 600x331. For the East Rongbuk Glacier, the public-domain ISS alternate is the better card image.
- **Diagram for the North Ridge.** The annotated diagram ([North face marked.png](https://commons.wikimedia.org/wiki/File:North_face_marked.png)) marks the high camps, the First Step, Mallory's 1999 find and the Hornbein Couloir. The Third Step is unlabelled. The diagram is derived from Luca Galuzzi's photo, so credit him and the labeller (Kassander der Minoer).
- **Mallory's resting place.** Use the diagram. Photos of bodies on the north side (for example "Green Boots") exist on Commons but are not suitable for a card.

## Method

Searched Wikimedia Commons with the MediaWiki API: full-text file search, category search, and the members of the relevant categories (`Mount Everest`, `Khumbu Icefall`, `Western Cwm`, `Hillary Step`, `North Col (Everest)`, `Changtse`, `Rongbuk Glacier`, `East Rongbuk Glacier`, `Kangshung Glacier`, `Everest Base Camp - North (Tibet)`). For every chosen file and alternate, `prop=imageinfo&iiprop=url|size|extmetadata` returned the licence (`LicenseShortName`, `LicenseUrl`), author (`Artist`), dimensions and description. Where the metadata was vague, the file page wikitext was read: the north-face diagrams' legends and the Kangshung diagram's GFDL-to-CC-BY-SA relicence. No restrictions templates were set on any chosen file. Other sites (Flickr, Unsplash) were not searched separately. The Flickr- and Unsplash-sourced files below were found through their Commons copies, and the licence recorded is the Commons one.

Spots where searching found no on-subject Creative Commons photo: Camp 1 (South), Camp 2 (South), Intermediate Camp, Advanced Base Camp, Camps 2 and 3 on the North Ridge, the First, Second and Third Steps, the Balcony, the West Rongbuk Glacier and the Kangshung Face (ground level). Climbers' own photos of these spots are mostly on Flickr or expedition blogs under all-rights-reserved terms. A later pass could ask the Commons uploaders named here, or search Flickr's CC filter, for the Camp 1 and Second Step gaps.

## Per spot

### Everest Base Camp (South) (`everest-base-camp-south`, waypoint)

Match: **direct**

- File page: [Everest Base Camp sits on top of melting glacier.jpg](https://commons.wikimedia.org/wiki/File:Everest_Base_Camp_sits_on_top_of_melting_glacier.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/c/ce/Everest_Base_Camp_sits_on_top_of_melting_glacier.jpg>
- Author: Nirojsedhai
- Licence: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Resolution: 5665 x 3783
- Alternate: [Everest Base Camp on a Stormy Day.jpg](https://commons.wikimedia.org/wiki/File:Everest_Base_Camp_on_a_Stormy_Day.jpg), Daniel Oberhaus, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), 4608 x 3072
- Notes: Tents on the Khumbu Glacier, April 2024; matches the melting-glacier story.

### Khumbu Icefall (`khumbu-icefall`, waypoint)

Match: **direct**

- File page: [Climbers crossing ladders in the Khumbu Icefall.jpg](https://commons.wikimedia.org/wiki/File:Climbers_crossing_ladders_in_the_Khumbu_Icefall.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/3/37/Climbers_crossing_ladders_in_the_Khumbu_Icefall.jpg>
- Author: AngeliSherpa
- Licence: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Resolution: 4608 x 3072
- Alternate: [Nepal - Sagamartha Trek - 186 - Khumbu Icefall (plus climbers) (497684556).jpg](https://commons.wikimedia.org/wiki/File:Nepal_-_Sagamartha_Trek_-_186_-_Khumbu_Icefall_(plus_climbers)_(497684556).jpg), McKay Savage from London, UK, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0), 2592 x 1944
- Notes: Ladder crossing with a queue of climbers, May 2026. The alternate is a wider view from base camp under CC BY 2.0.

### Camp 1 (`camp-1-south`, waypoint)

Match: **none**

- Notes: No Commons photo of Camp 1 itself. Fallback: reuse the Western Cwm photo, which was taken at about 6300 m between Camp 1 and Camp 2.

### Camp 2 (`camp-2-south`, waypoint)

Match: **proxy**

- File page: [Lenticular over everest summit.jpg](https://commons.wikimedia.org/wiki/File:Lenticular_over_everest_summit.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/9/9d/Lenticular_over_everest_summit.jpg>
- Author: Moving Mountains Trust (Flickr)
- Licence: [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)
- Resolution: 800 x 600
- Notes: Everest and Lhotse seen from the Western Cwm (the Camp 2 view), not the camp itself. Only 800x600.

### Camp 3 (Lhotse Face) (`camp-3-south`, waypoint)

Match: **direct**

- File page: [Mount Everest Camp 3.jpg](https://commons.wikimedia.org/wiki/File:Mount_Everest_Camp_3.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/2/26/Mount_Everest_Camp_3.jpg>
- Author: AngeliSherpa
- Licence: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Resolution: 4608 x 3072
- Alternate: [Climbers above 7300m.jpg](https://commons.wikimedia.org/wiki/File:Climbers_above_7300m.jpg), AngeliSherpa, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), 4608 x 3072
- Notes: Tents on the Lhotse Face; the description gives 7400 m.

### South Col (Camp 4) (`south-col`, waypoint)

Match: **direct**

- File page: [South Cole.jpg](https://commons.wikimedia.org/wiki/File:South_Cole.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/a/a3/South_Cole.jpg>
- Author: AngeliSherpa
- Licence: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Resolution: 4608 x 3072
- Alternate: [Cloud inversion viewed from Everest Camp IV (South Col), Mount Everest.jpg](https://commons.wikimedia.org/wiki/File:Cloud_inversion_viewed_from_Everest_Camp_IV_(South_Col),_Mount_Everest.jpg), AngeliSherpa, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), 4608 x 3072
- Notes: Camp IV tents. The alternate is a sunset cloud inversion seen from Camp IV, a good fit for the alpenglow mood.

### The Balcony (`balcony`, waypoint)

Match: **proxy**

- File page: [Mt Lhotse and Mt. Everest South Cole.jpg](https://commons.wikimedia.org/wiki/File:Mt_Lhotse_and_Mt._Everest_South_Cole.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/5/53/Mt_Lhotse_and_Mt._Everest_South_Cole.jpg>
- Author: AngeliSherpa
- Licence: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Resolution: 4608 x 3072
- Alternate: [Mt. Lhotse and Mt. Everest Camp 4.jpg](https://commons.wikimedia.org/wiki/File:Mt._Lhotse_and_Mt._Everest_Camp_4.jpg), AngeliSherpa, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), 4608 x 3072
- Notes: View down the Southeast Ridge to the South Col and Lhotse from above 8500 m, the outlook climbers get near the Balcony. The alternate is a second upload with the same timestamp.

### South Summit (`south-summit`, waypoint)

Match: **direct**

- File page: [Mount Everest a close view with south summit and yellow band.jpg](https://commons.wikimedia.org/wiki/File:Mount_Everest_a_close_view_with_south_summit_and_yellow_band.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/1/16/Mount_Everest_a_close_view_with_south_summit_and_yellow_band.jpg>
- Author: Goutam1962
- Licence: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Resolution: 3648 x 2736
- Notes: Telephoto of the summit pyramid showing the South Summit and the Yellow Band, taken from the trek side.

### Hillary Step (`hillary-step`, waypoint)

Match: **direct**

- File page: [Hillary Step near Everest top.jpg](https://commons.wikimedia.org/wiki/File:Hillary_Step_near_Everest_top.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/2/23/Hillary_Step_near_Everest_top.jpg>
- Author: Debasish biswas kolkata
- Licence: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Resolution: 2816 x 1776
- Alternate: [Hillary Step near Everest top (retouched).jpg](https://commons.wikimedia.org/wiki/File:Hillary_Step_near_Everest_top_(retouched).jpg), Debasish biswas kolkata Derivative work MagentaGreen, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), 2816 x 2112
- Notes: Taken 17 May 2010, before the rock step changed (reported 2016-2017). Say so on the card. The retouched alternate credits Debasish biswas kolkata plus MagentaGreen.

### Mount Everest summit (`everest-summit`, waypoint)

Match: **direct**

- File page: [Everest Summit.jpg](https://commons.wikimedia.org/wiki/File:Everest_Summit.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/a/ac/Everest_Summit.jpg>
- Author: Alfonso.mnr
- Licence: [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en)
- Resolution: 4096 x 3072
- Alternate: [Kami Rita Sherpa Mt Everest Summit May 2010.jpg](https://commons.wikimedia.org/wiki/File:Kami_Rita_Sherpa_Mt_Everest_Summit_May_2010.jpg), Vlvescovo, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), 3234 x 2387
- Notes: Climber Viridiana Alvarez on the summit, 16 May 2017. CC0, so no credit is required, but credit the uploader anyway.

### Western Cwm (`western-cwm`, glacier)

Match: **direct**

- File page: [Mount Everest and Mount Lhotse.jpg](https://commons.wikimedia.org/wiki/File:Mount_Everest_and_Mount_Lhotse.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/3/32/Mount_Everest_and_Mount_Lhotse.jpg>
- Author: AngeliSherpa
- Licence: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Resolution: 4608 x 3072
- Alternate: [ISS022-E-37302 - View of Earth - Mount Everest - Lhotse - Nuptse - Western Cwm - Everest West Shoulder (cropped).jpg](https://commons.wikimedia.org/wiki/File:ISS022-E-37302_-_View_of_Earth_-_Mount_Everest_-_Lhotse_-_Nuptse_-_Western_Cwm_-_Everest_West_Shoulder_(cropped).jpg), NASA Johnson Space Center, Earth Science and Remote Sensing Unit (ISS crew photo), Public domain, 3983 x 2813
- Notes: Climbers in the Cwm at about 6300 m below Everest and Lhotse. The alternate is a public-domain ISS view from above.

### Everest Base Camp (North) (`everest-base-camp-north`, waypoint)

Match: **direct**

- File page: [Mount Everest Base Camp (7318553136).jpg](https://commons.wikimedia.org/wiki/File:Mount_Everest_Base_Camp_(7318553136).jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/e/ed/Mount_Everest_Base_Camp_%287318553136%29.jpg>
- Author: Gunther Hagleitner
- Licence: [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)
- Resolution: 3872 x 2592
- Alternate: [Everest Base Camp, Xigaze, China (Unsplash).jpg](https://commons.wikimedia.org/wiki/File:Everest_Base_Camp,_Xigaze,_China_(Unsplash).jpg), Yuriy Rzhemovskiy yuriyr, [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en), 5461 x 3641
- Notes: Tibet-side base camp, May 2012. The alternate is CC0 (via Unsplash).

### Intermediate Camp (`intermediate-camp`, waypoint)

Match: **none**

- Notes: No Commons photo found. Fallback: reuse the East Rongbuk Glacier photo, since the camp sits on that glacier route.

### Advanced Base Camp (`advanced-base-camp-north`, waypoint)

Match: **proxy**

- File page: [Everest North Col.jpg](https://commons.wikimedia.org/wiki/File:Everest_North_Col.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/7/79/Everest_North_Col.jpg>
- Author: Chris Searl (Csearl at English Wikipedia)
- Licence: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- Resolution: 2048 x 1536
- Notes: Taken at Advanced Base Camp in April 2005, looking at the North Col. It shows the view from ABC rather than the camp. It is the same file as the North Col spot.

### North Col (Camp 1) (`north-col`, waypoint)

Match: **direct**

- File page: [Everest North Col.jpg](https://commons.wikimedia.org/wiki/File:Everest_North_Col.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/7/79/Everest_North_Col.jpg>
- Author: Chris Searl (Csearl at English Wikipedia)
- Licence: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- Resolution: 2048 x 1536
- Alternate: [Everest Peace Project - Climbing ladder northcol everest.jpg](https://commons.wikimedia.org/wiki/File:Everest_Peace_Project_-_Climbing_ladder_northcol_everest.jpg), Lance Trumbull, EverestPeaceProject.org, [CC BY-SA 3.0 us](https://creativecommons.org/licenses/by-sa/3.0/us/deed.en), 427 x 600
- Notes: North Col wall seen from ABC. The alternate shows climbers on the North Col ladder but is only 427x600.

### Camp 2 (North Ridge) (`camp-2-north`, waypoint)

Match: **proxy**

- File page: [North face marked.png](https://commons.wikimedia.org/wiki/File:North_face_marked.png)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/4/43/North_face_marked.png>
- Author: Luca Galuzzi; route labels by Kassander der Minoer
- Licence: [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5)
- Resolution: 720 x 540
- Notes: Annotated north-face diagram. The green line marks the standard route with high camps at about 7700 m and 8300 m (triangles).

### Camp 3 (North Ridge) (`camp-3-north`, waypoint)

Match: **proxy**

- File page: [North face marked.png](https://commons.wikimedia.org/wiki/File:North_face_marked.png)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/4/43/North_face_marked.png>
- Author: Luca Galuzzi; route labels by Kassander der Minoer
- Licence: [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5)
- Resolution: 720 x 540
- Notes: Same annotated diagram; the 8300 m camp is marked.

### First Step (`first-step`, waypoint)

Match: **proxy**

- File page: [North face marked.png](https://commons.wikimedia.org/wiki/File:North_face_marked.png)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/4/43/North_face_marked.png>
- Author: Luca Galuzzi; route labels by Kassander der Minoer
- Licence: [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5)
- Resolution: 720 x 540
- Notes: Same annotated diagram; the First Step is marked (dagger 2).

### Second Step (`second-step`, waypoint)

Match: **proxy**

- File page: [North face marked.png](https://commons.wikimedia.org/wiki/File:North_face_marked.png)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/4/43/North_face_marked.png>
- Author: Luca Galuzzi; route labels by Kassander der Minoer
- Licence: [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5)
- Resolution: 720 x 540
- Notes: Same annotated diagram; no Commons photo of the Second Step or its ladder exists.

### Third Step (`third-step`, waypoint)

Match: **proxy**

- File page: [North face marked.png](https://commons.wikimedia.org/wiki/File:North_face_marked.png)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/4/43/North_face_marked.png>
- Author: Luca Galuzzi; route labels by Kassander der Minoer
- Licence: [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5)
- Resolution: 720 x 540
- Notes: Same annotated diagram. The Third Step is not labelled; it lies on the green line above the Second Step.

### Mallory's resting place (`mallory-1999`, waypoint)

Match: **proxy**

- File page: [North face marked.png](https://commons.wikimedia.org/wiki/File:North_face_marked.png)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/4/43/North_face_marked.png>
- Author: Luca Galuzzi; route labels by Kassander der Minoer
- Licence: [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5)
- Resolution: 720 x 540
- Notes: Same annotated diagram; Mallory's 1999 find is marked (dagger 1). Do not use a photo of the body.

### Rongbuk Glacier (`rongbuk-glacier`, glacier)

Match: **direct**

- File page: [Everest North Face toward Base Camp Tibet Luca Galuzzi 2006.jpg](https://commons.wikimedia.org/wiki/File:Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/e/e7/Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg>
- Author: Luca Galuzzi (Lucag)
- Licence: [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5)
- Resolution: 2000 x 1333
- Alternate: [Mount Everest from Rongbuk may 2005.JPG](https://commons.wikimedia.org/wiki/File:Mount_Everest_from_Rongbuk_may_2005.JPG), Ocrambo (assumed by Commons; no machine-readable author), Public domain, 3008 x 2000
- Notes: North face above the Rongbuk valley at 5160 m. The public-domain alternate shows the glacier terminus but its author is unknown.

### East Rongbuk Glacier (`east-rongbuk-glacier`, glacier)

Match: **direct**

- File page: [Everest Peace Project - Ice serac everest tibet2.jpg](https://commons.wikimedia.org/wiki/File:Everest_Peace_Project_-_Ice_serac_everest_tibet2.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/c/cf/Everest_Peace_Project_-_Ice_serac_everest_tibet2.jpg>
- Author: Lance Trumbull, EverestPeaceProject.org
- Licence: [CC BY-SA 3.0 us](https://creativecommons.org/licenses/by-sa/3.0/us/deed.en)
- Resolution: 600 x 331
- Alternate: [ISS022-E-37306 - View of China - Everest Northeast Ridge - East Rongbuk Glacier - Lhakpa Ri - Kangshung Glacier (cropped).jpg](https://commons.wikimedia.org/wiki/File:ISS022-E-37306_-_View_of_China_-_Everest_Northeast_Ridge_-_East_Rongbuk_Glacier_-_Lhakpa_Ri_-_Kangshung_Glacier_(cropped).jpg), NASA Johnson Space Center, Earth Science and Remote Sensing Unit (ISS crew photo), Public domain, 2402 x 2641
- Notes: Ice seracs on the Tibet approach, but only 600x331 and the description does not name the glacier. The public-domain ISS alternate (2402x2641) is the better card image.

### West Rongbuk Glacier (`west-rongbuk-glacier`, glacier)

Match: **direct**

- File page: [ISS066-E-86253 - View of China - West Rongbuk (Rongpu) Glacier - Tongqiang Ri - Hongxing Ri - Hongxing Glacier - Shuguang (cropped).jpg](https://commons.wikimedia.org/wiki/File:ISS066-E-86253_-_View_of_China_-_West_Rongbuk_(Rongpu)_Glacier_-_Tongqiang_Ri_-_Hongxing_Ri_-_Hongxing_Glacier_-_Shuguang_(cropped).jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/d/da/ISS066-E-86253_-_View_of_China_-_West_Rongbuk_%28Rongpu%29_Glacier_-_Tongqiang_Ri_-_Hongxing_Ri_-_Hongxing_Glacier_-_Shuguang_%28cropped%29.jpg>
- Author: NASA Johnson Space Center, Earth Science and Remote Sensing Unit (ISS crew photo)
- Licence: Public domain
- Resolution: 1077 x 1245
- Notes: No Creative Commons photo exists; only public-domain ISS crew photos. Usable, but credit NASA.

### West Ridge (`west-ridge`, waypoint)

Match: **direct**

- File page: [Everest West Ridge, Mount Everest, Himalayas.jpg](https://commons.wikimedia.org/wiki/File:Everest_West_Ridge,_Mount_Everest,_Himalayas.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/3/33/Everest_West_Ridge%2C_Mount_Everest%2C_Himalayas.jpg>
- Author: Vyacheslav Argenberg
- Licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0)
- Resolution: 3409 x 2688
- Notes: West Ridge from the Kala Patthar side, October 2009. The file description is generic, but the title and composition match.

### Hornbein Couloir (`hornbein-couloir`, waypoint)

Match: **proxy**

- File page: [North face marked.png](https://commons.wikimedia.org/wiki/File:North_face_marked.png)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/4/43/North_face_marked.png>
- Author: Luca Galuzzi; route labels by Kassander der Minoer
- Licence: [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5)
- Resolution: 720 x 540
- Alternate: [Everest North Face toward Base Camp Tibet Luca Galuzzi 2006.jpg](https://commons.wikimedia.org/wiki/File:Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg), Luca Galuzzi (Lucag), [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5), 2000 x 1333
- Notes: The couloir is marked (dark blue line) on the annotated diagram. The unannotated Galuzzi photo shows it too and is 2000x1333.

### Southwest Face (`southwest-face`, waypoint)

Match: **direct**

- File page: [Mount Everest Southwest Face, November 2012.jpg](https://commons.wikimedia.org/wiki/File:Mount_Everest_Southwest_Face,_November_2012.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/9/96/Mount_Everest_Southwest_Face%2C_November_2012.jpg>
- Author: Rdevany
- Licence: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- Resolution: 1232 x 1723
- Alternate: [Mount Everest, upper Southwest face.jpg](https://commons.wikimedia.org/wiki/File:Mount_Everest,_upper_Southwest_face.jpg), Pavel Novak, [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5), 737 x 847
- Notes: Taken from Gokyo Ri at 5300 m. Portrait orientation.

### Kangshung Face (`kangshung-face`, waypoint)

Match: **direct**

- File page: [ISS066-E-86246 - View of Earth - Mount Everest Kangshung (East) Face - Kangshung Glacier - Lhotse - Shartse - Makalu - Ganma Zangbo (river Karma Chu) - Lhamalangcho Glacier - Karda Co - Ragarsanba Glacier (cropped).jpg](https://commons.wikimedia.org/wiki/File:ISS066-E-86246_-_View_of_Earth_-_Mount_Everest_Kangshung_(East)_Face_-_Kangshung_Glacier_-_Lhotse_-_Shartse_-_Makalu_-_Ganma_Zangbo_(river_Karma_Chu)_-_Lhamalangcho_Glacier_-_Karda_Co_-_Ragarsanba_Glacier_(cropped).jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/6/6d/ISS066-E-86246_-_View_of_Earth_-_Mount_Everest_Kangshung_%28East%29_Face_-_Kangshung_Glacier_-_Lhotse_-_Shartse_-_Makalu_-_Ganma_Zangbo_%28river_Karma_Chu%29_-_Lhamalangcho_Glacier_-_Karda_Co_-_Ragarsanba_Glacier_%28cropped%29.jpg>
- Author: NASA Johnson Space Center, Earth Science and Remote Sensing Unit (ISS crew photo)
- Licence: Public domain
- Resolution: 3178 x 2624
- Alternate: [The East (Kangshung) Face of Everest from above the Kama Valley · 15400' 4670m · 2007.jpg](https://commons.wikimedia.org/wiki/File:The_East_(Kangshung)_Face_of_Everest_from_above_the_Kama_Valley_%C2%B7_15400%27_4670m_%C2%B7_2007.jpg), Tony Foster, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0), 800 x 753
- Notes: No Creative Commons ground photo exists. The primary is a public-domain ISS oblique. The CC BY 4.0 alternate is a Tony Foster watercolour, not a photo.

### Kangshung Glacier (`kangshung-glacier`, glacier)

Match: **direct**

- File page: [Kangshung-07.png](https://commons.wikimedia.org/wiki/File:Kangshung-07.png)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/a/a5/Kangshung-07.png>
- Author: NASA; route lines by Kassander der Minoer
- Licence: [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/)
- Resolution: 756 x 1008
- Alternate: [ISS066-E-86246 - View of Earth - Mount Everest Kangshung (East) Face - Kangshung Glacier - Lhotse - Shartse - Makalu - Ganma Zangbo (river Karma Chu) - Lhamalangcho Glacier - Karda Co - Ragarsanba Glacier (cropped).jpg](https://commons.wikimedia.org/wiki/File:ISS066-E-86246_-_View_of_Earth_-_Mount_Everest_Kangshung_(East)_Face_-_Kangshung_Glacier_-_Lhotse_-_Shartse_-_Makalu_-_Ganma_Zangbo_(river_Karma_Chu)_-_Lhamalangcho_Glacier_-_Karda_Co_-_Ragarsanba_Glacier_(cropped).jpg), NASA Johnson Space Center, Earth Science and Remote Sensing Unit (ISS crew photo), Public domain, 3178 x 2624
- Notes: NASA image with route lines added. It was relicensed from GFDL to CC BY-SA 3.0. Only 756x1008.

### Lhotse (`lhotse`, peak)

Match: **direct**

- File page: [Sunset Over Mount Lhotse, Nepal.jpg](https://commons.wikimedia.org/wiki/File:Sunset_Over_Mount_Lhotse,_Nepal.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/6/66/Sunset_Over_Mount_Lhotse%2C_Nepal.jpg>
- Author: Rohit Sharma
- Licence: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- Resolution: 4000 x 2847
- Alternate: [Lhotse-fromChukhungRi.jpg](https://commons.wikimedia.org/wiki/File:Lhotse-fromChukhungRi.jpg), Uwe Gille, [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/), 1778 x 1157
- Notes: Golden-hour Lhotse, a good fit for the alpenglow mood. The alternate shows the south face from Chukhung Ri.

### Nuptse (`nuptse`, peak)

Match: **direct**

- File page: [Nuptse, Nepal, Himalayas.jpg](https://commons.wikimedia.org/wiki/File:Nuptse,_Nepal,_Himalayas.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/d/d0/Nuptse%2C_Nepal%2C_Himalayas.jpg>
- Author: Vyacheslav Argenberg
- Licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0)
- Resolution: 4032 x 2688
- Notes: Nuptse west face ice walls, October 2009.

### Changtse (`changtse`, peak)

Match: **direct**

- File page: [Changtse-from-KalaPattar.jpg](https://commons.wikimedia.org/wiki/File:Changtse-from-KalaPattar.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/3/34/Changtse-from-KalaPattar.jpg>
- Author: Uwe Gille
- Licence: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- Resolution: 1772 x 1154
- Notes: Changtse seen over the Lho La from Kala Patthar.

### Makalu (`makalu`, peak)

Match: **direct**

- File page: [Makalu CU.jpg](https://commons.wikimedia.org/wiki/File:Makalu_CU.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/3/3d/Makalu_CU.jpg>
- Author: Craig Taylor
- Licence: [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0)
- Resolution: 4320 x 3240
- Alternate: [Makalu.jpg](https://commons.wikimedia.org/wiki/File:Makalu.jpg), Ben Tubby, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0), 1600 x 1063
- Notes: Close-up showing the west pillar. The alternate is CC BY 2.0 and 1600x1063.

### Khumbu Glacier (`khumbu-glacier`, glacier)

Match: **direct**

- File page: [Khumbu Glacier, Everest Zone, Nepal, Asia.jpg](https://commons.wikimedia.org/wiki/File:Khumbu_Glacier,_Everest_Zone,_Nepal,_Asia.jpg)
- Direct image: <https://upload.wikimedia.org/wikipedia/commons/9/9c/Khumbu_Glacier%2C_Everest_Zone%2C_Nepal%2C_Asia.jpg>
- Author: Vyacheslav Argenberg
- Licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0)
- Resolution: 3549 x 2688
- Alternate: [120410 Khumbu Glacier Pano.jpg](https://commons.wikimedia.org/wiki/File:120410_Khumbu_Glacier_Pano.jpg), Faj2323, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), 5693 x 2531
- Notes: Lower Khumbu Glacier and the surrounding peaks.
