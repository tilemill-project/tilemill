---
layout: book
section: documentation
category: TileMill
tag: Crash&nbsp;course
title: "TileMill and GIS"
permalink: /docs/crashcourse/tilemill-gis
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "[Reviewed](/tilemill/docs/crashcourse/introduction/) the Crash Course introduction."
nextup:
- "[Import data](/tilemill/docs/crashcourse/point-data) into a TileMill project."
- "[Style](/tilemill/docs/crashcourse/styling/) your point data."
- "[Add tooltips and a legend](/tilemill/docs/crashcourse/tooltips/) to your map."
- "[Export your map](/tilemill/docs/crashcourse/exporting/) to MBTiles format"
---

{% include prereq.html %}
TileMill is a desktop application for creating beautiful web maps. It was designed to easily integrate into existing GIS workflows to enhance design capabilities and flexibility. 

## Designing maps
Map design is the core of TileMill. To manipulate geospatial data to be used on TileMill maps, you may need to look outside of tool or integrate it with other GIS software. Some spatial data can be worked with in Google Docs and Microsoft Excel, and for others GIS software like [QuantumGIS](http://www.qgis.org/) or [ESRI ArcGIS](http://www.esri.com/software/arcgis/index.html) may be needed. Spatial database software like [PostGIS](http://postgis.refractions.net/) and [SQLite](http://sqlite.org) can also be used to work with large spatial datasets and integrated into TileMill.  

The main output of TileMill is tiled maps - millions of 256 px by 256 px images that can be loaded quickly in interactive maps - exported in MBTiles format. Tiled maps are the basic technology behind the best panning and zooming maps on the web. You can also export PNG and PDF files from TileMill for static output or use in presentations - using the same map styles that power your highly interactive maps.

## MBTiles
These map tiles are stored in a package file, called an [MBTiles file](http://mapbox.com/mbtiles-spec). This allows them to be compressed, copied, and transferred easily from place to place. Unlike most tiled maps, the maps you make in TileMill can be interactive - hovering and clicking on map tiles can trigger popups and even site navigation. The interactivity data is also compressed and stored in MBTiles files.

Unlike static maps, tiled maps tend to have many layers of detail - you’ll want to choose what features to show and hide at each zoom level. TileMill’s styling language Carto makes this easy, and it's fast to learn how to use it with a built-in reference, autocomplete, and error highlighting - and even easier if you’re already comfortable with CSS.

{% include nextup.html %}
