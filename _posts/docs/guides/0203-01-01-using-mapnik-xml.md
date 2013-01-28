---
layout: docs
section: help
category: guides
tag: Guides
title: Using Mapnik XML
permalink: /docs/guides/mapnik-xml
---
Under the hood TileMill handles rendering your maps using [Mapnik](http://mapnik.org). The way this works is TileMill uses [CartoCSS](https://github.com/mapbox/carto) to compile your CSS styles and layer definitions down to the XML format that Mapnik can read, each time you save your project.

Most users will not need to directly use this underlying Mapnik XML, but it is easy to leverage if you want to move your raw map styles out of TileMill to set up for rendering directly with Mapnik, or other tools that work with Mapnik like [TileStache](http://tilestache.org/) and [Invar](https://github.com/onyxfish/invar/).

<small class='note' markdown='1'>
__Note:__ If you export a Mapnik XML file into a TileMill project directory, this XML style will __override__ all of the layers and stylesheets for that project. Any changes you make to the project in TileMill will not be visible until the XML file is moved.
</small>

## Export from TileMill

In TileMill the Mapnik XML for each project can be saved from the export menu.

![](/tilemill/assets/pages/mapnikxml.png)

## Generate from the terminal

You can also script this using the CartoCSS command line tool. Install CartoCSS with [npm](http://npmjs.org/), which depends on nodejs, by doing:

    npm install -g millstone carto

Then you can pass the path to your project mml like:

    carto ~/Documents/MapBox/project/mymap/mymap.mml > mapnik.xml

You can then open the "mapnik.xml" document in a text editor and see the many lines of XML that TileMill and CartoCSS so nicely authored for you.

