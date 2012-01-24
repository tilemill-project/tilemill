---
layout: book
section: documentation
category: TileMill
tag: Guides
title: Using Mapnik XML
permalink: /docs/guides/mapnik-xml
---
Under the hood TileMill handles rendering your maps using [Mapnik](http://mapnik.org). The way this works is TileMill uses [Carto](https://github.com/mapbox/carto) to compile your CSS styles and layer definitions down to the XML format that Mapnik can read, each time you save your project.

Most users will not need to directly use this underlying Mapnik XML, but it is easy to leverage if you want to move your raw map styles out of TileMill to set up for rendering directly with Mapnik, or other tools that work with Mapnik like [TileStache](http://tilestache.org/) and [Invar](https://github.com/onyxfish/invar/).

In TileMill >= 0.4.x you can access the Mapnik XML for each project within the advanced section:

![](/tilemill/assets/pages/mapnikxml.png)

You can also script this using the carto command line tool.

You can install carto with [npm](http://npmjs.org/), which depends on nodejs, by doing:

<pre>
npm install -g millstone carto
</pre>

Then you can pass the path to your project mml like:

<pre>
carto ~/Documents/MapBox/project/mymap/mymap.mml > mapnik.xml
</pre>

You can then open the "mapnik.xml" document in a text editor and see the many lines of XML that TileMill and Carto so nicely authored for you.

