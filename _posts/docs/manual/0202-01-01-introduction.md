---
layout: book
section: documentation
category: manual
title: Introduction
permalink: /docs/manual
---
## Introduction

TileMill is a tool for cartographers to quickly and easily design maps for the web using custom data. It is built on the powerful open-source map rendering library [Mapnik](http://www.mapnik.org) - the same software [OpenStreetMap](http://www.openstreetmap.org/) and [MapQuest](http://www.mapquest.com) use to make some of their maps. TileMill is not intended to be a general-purpose cartography tool, but rather focuses on streamlining and simplifying a narrow set of use cases.

For anyone coming from a GIS or cartography background, the biggest assumption TileMill makes is the final projection - TileMill maps are always projected to "Web Mercator". As the name suggests, this projection is popular with web mapping applications, thus maps created with TileMill can be displayed using the Google Maps API, OpenLayers, and a number of other projects.

TileMill can also export directly to the SQLite-based [MBTiles](http://www.mbtiles.org) file format. This format was designed to make traditional web maps available offline and is used by tools like the [MapBox Hosting](http://mapbox.com/hosting), [TileStream](https://github.com/mapbox/tilestream) and [MapBox for iPad](http://mapbox.com/ipad).

TileMill is a project of [Development Seed](http://www.developmentseed.org) and the source code is [available on GitHub](http://github.com/mapbox/tilemill).

## Further resources

Learn more about designing maps with TileMill at support.mapbox.com.

- [Preparing your data](http://support.mapbox.com/kb/preparing-your-geographic-data)
- [TileMill knowledge base](http://support.mapbox.com/kb/tilemill)

