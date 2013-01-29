---
layout: docs
section: help
category: reference
tag: Reference
title: Exporting
permalink: /docs/manual/exporting
---
Once you've finished a map design, you can export your map for use in other applications. You can export the entire world or choose a smaller region by setting the bounding box. TileMill can export a variety of formats and each has different advantages.

With a TileMill project open, the export menu at the top-right of the window and presents a number of options.

![TileMill export menu](/tilemill/assets/pages/export.png)

## Interactive, multiscale exports

The __Upload__ and __MBTiles__ options will export pannable, zoomable maps just like the preview you see in TileMill. Any legends and interactive elements will be included. Depending on what you are exporting, this process can take up considerable time and disk space.

The MBTiles option creates a package of [tiles](http://mapbox.com/developers/guide/) that can be used in a variety of ways. You can upload them to a MapBox account, host them yourself with [TileStream](https://github.com/mapbox/tilestream) or transfer them to [MapBox for iPad](http://mapbox.com/ipad/) for offline access. Technical details about MBTiles files can be found in the [MapBox developers documentation](http://mapbox.com/developers/mbtiles/).

If you have a [MapBox account](http://mapbox.com/plans/) you can connect it with your TileMill installation and use the Upload export to streamline the process of creating an MBTiles file and uploading it to MapBox.

<!-- TODO: Export options -->

## Static image exports

The __PNG__, __PDF__, and __SVG__ export options allow you to export specific views of your map. If your project includes legends or interactive elements they will not be included for these types of exports.

Use PNG to export a static image of your map. This format is useful if you want to add a snapshot to a word processor.

PDF and SVG provide vector-based exports of your map, which are useful if you're designing maps for printed material or need to make further edits to the design or layout. Both PDF and SVG output should contain very similar content but SVG is often supported by drawing programs natively (does not require conversion upon import).

<!-- TODO: Export options -->

## Mapnik XML export

TileMill's __Mapnik XML__ export option is aimed at advanced users who are familiar with [Mapnik](http://mapnik.org/), the software that TileMill uses under the hood to handles rendering your maps using [Mapnik](http://mapnik.org).

TileMill uses [CartoCSS](https://github.com/mapbox/carto) to translate your CSS styles and layer definitions into the XML format that Mapnik can read each time you save your project. Most users will not need to directly use this underlying Mapnik XML, but it is easy to leverage if you want to move your raw map styles out of TileMill to set up for rendering directly with Mapnik, or other tools that work with Mapnik like [TileStache](http://tilestache.org/) and [Invar](https://github.com/onyxfish/invar/).

<small class='note' markdown='1'>
__Note:__ If you export a Mapnik XML file into a TileMill project directory, this XML style will __override__ all of the layers and stylesheets for that project. Any changes you make to the project in TileMill will not be visible until the XML file is moved.
</small>

<!-- TODO: Command-line exports? -->
