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
- "[Add a CSV layer](/tilemill/docs/crashcourse/point-data) to your TileMill project."
- "[Style](/tilemill/docs/crashcourse/styling/) your point data."
- "[Add tooltips and a legend](/tilemill/docs/crashcourse/tooltips/) to your map."
- "[Export your map](/tilemill/docs/crashcourse/exporting/) to MBTiles format"
---

{% include prereq.html %}
**TileMill** is a modern map design studio that integrates into your existing desktop GIS stack for creating beautiful maps. TileMill was designed to work with any GIS workflow to create custom maps for web mapping applications. TileMill serves as a fast and effective mapping engine to add to your current GIS software and workflow. 

## Designing maps

With TileMill, you have **full design control** of the maps you create. Since map design is the key function, to use TileMill effectively it is best to integrate GIS software to manipulate geospatial data. For some spatial data, you may need GIS software like [QuantumGIS](http://www.qgis.org/) or [ESRI ArcGIS](http://www.esri.com/software/arcgis/index.html). Other spatial data can be worked with in Google Docs or Microsoft Excel. Spatial database software like, [PostGIS](http://postgis.refractions.net/) or [SQLite](http://sqlite.org), can be used to work with large spatial datasets and integrated into TileMill.  

The main output of TileMill is **tiled maps** - millions of 256px by 256px images that can be loaded quickly in interactive maps. Tiled maps are the basic technology behind the best panning & zooming maps on the web. You can also export PNG and PDF files from TileMill for static output or use in presentations - using the same map styles that power your highly interactive maps.

## MBTiles
These tiles are stored in a package file, called an [MBTiles file](http://mapbox.com/mbtiles-spec). This allows them to be compressed, copied, and transferred easily from place to place.

**Unlike most tiled maps**, the maps you make in TileMill can be **richly interactive** - hovering and clicking on map tiles can trigger popups and even site navigation. The interactivity data is also compressed and stored in MBTiles files.

**Unlike static maps**, tiled maps tend to have many layers of detail - you’ll want to choose what features to show and hide at each zoom level. TileMill’s styling language, Carto, makes this easy. It’s easy to learn with a built-in reference, autocomplete, and error highlighting, and even easier if you’re already comfortable with CSS.

{% include nextup.html %}
