Introduction
------------

### What is TileMill?

TileMill is a tool for cartographers to quickly and easily design maps
for the web using custom data. It is built on the map renderer Mapnik
and the styling language Mess, which is a wrapper for Mapnik’s XML
styling syntax.

TileMill is not intended to be a general-purpose cartography tool, but
is instead designed around a particular workflow and type of output. A
number of assumptions are made about the intentions of the user, the
biggest of which is that your final map will be rendered with a ‘Web
Mercator’ projection (like Google Maps or OpenStreetMap).

Maps designed using TileMill can be easily embedded on a website using
JavaScript map libraries like OpenLayers, PolyMaps, or Google Maps. They
can also be made into MBTiles files for use with Maps on a Stick and the
MapBox iPad App.

TileMill is an open-source (BSD-style licensed) project developed by
Development Seed.

### Basic terminology

There are a number of terms and concepts that you should should be
familiar with before you start working with TileMill. This section will
briefly review them, and provide links to further resources if you need
them.

**Tile(s)** — many maps on the Web are not displayed as a single image,
but as a matrix of smaller images positioned seamlessly to give the
impression of a single image. Each of these images is called a tile.
Tiles can be any size, but 256x256 pixels is by far the most common
choice for web maps (OpenStreetMap, Google, Bing, Mapquest, and Yahoo
all use this size).

**Zoom level** — this is a predefined scale at which a map is rendered.
OpenStreetMap, Google Maps, and most other online maps zoom levels are
scaled such that the entire world fills a 256x256 pixel tile at zoom
level 0, and doubles in width & height at each subsequent zoom level. 

For example: at zoom level 6 you get a full view of a medium-sized 
country.  At zoom level 11 you’re looking at a metropolitan-region-sized
area. At Zoom level 16 you’re down to a neighborhood scale.

**Shapefile** — the de facto standard file format for GIS data storage.
It was developed by ESRI but is supported by most GIS software
applications. Despite being referred to as a 'shapefile', the format is
actually a collection of at least three files, possibly more.

TileMill currently requires shapefiles to be contained in a zip file in
order to use them. The required components are:

- file.shp: contains the geographical point, line, or polygon 
  information
- file.dbf: a database of information describing objects in the .shp 
  file
- file.shx: an index file @TODO: more info

For more detailed information, see 
<http://en.wikipedia.org/wiki/Shapefile>.

Installation & Setup
--------------------

See the README.

