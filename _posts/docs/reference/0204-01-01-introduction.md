---
layout: docs
section: help
category: reference
tag: Reference
title: Introduction
permalink: /docs/manual
---

TileMill is a tool for cartographers to quickly and easily design maps for the web using custom data. It is built on the powerful open-source map rendering library [Mapnik](http://www.mapnik.org) - the same software [OpenStreetMap](http://www.openstreetmap.org/) and [MapQuest](http://www.mapquest.com) use to make some of their maps. TileMill is not intended to be a general-purpose cartography tool, but rather focuses on streamlining and simplifying a narrow set of use cases.

For anyone coming from a GIS or cartography background, the biggest assumption TileMill makes is the final projection - TileMill maps are always projected to "Web Mercator". As the name suggests, this projection is popular with web mapping applications, thus maps created with TileMill can be displayed using [Leaflet](http://leafletjs.com/), the map APIs from Google and Apple, and many other projects.

TileMill can export directly to a [Mapbox account](http://mapbox.com), or to your computer using the SQLite-based [MBTiles](http://www.mbtiles.org) file format, which allows for easy transfer or use in offline-capable applications.

TileMill is an open-source project of Mapbox and the code is [available on GitHub](http://github.com/mapbox/tilemill).

## Further tools & resources

TileMill is a powerful design studio, but in order to use it effectively you will need to have several other types of applications installed alongside it:

- A **geospatial information system** (GIS) to view and manipulate geospatial data. [QuantumGIS](http://qgis.org) is an excellent free desktop GIS for Mac, Linux, and Windows that we recommend and refer to throughout the documentation.
- A **graphics editor** to create and edit icons, patterns, and textures. [Inkscape](http://inkscape.org) is an excellent free vector graphics editor for Mac, Linux, and Windows. Adobe Illustrator and Fireworks are other options. For bitmap graphics, [GIMP](http://www.gimp.org) is a good cross-platform option. Mac users may also be interested in [Seashore](http://seashore.sourceforge.net) as another free & open-source option.
- A **spatial database** - specifically, [PostgreSQL](http://postgresql.org) with [PostGIS](http://postgis.net). This is optional but recommended, especially if you wish to work with OpenStreetMap or other large datasets.

We cover some of the basics needed to use these programs with TileMill in this manual, but for full details you will need to refer to the documentation of each of these individual projects.

