---
layout: docs
section: help
category: reference
tag: Reference
title: Mapbox geodata
permalink: /docs/manual/mapbox-geodata
---
The Mapbox GeoData Library is a collection of free datasets that have been optimized
to work well with TileMill. The library is browsable from the TileMill interface through
the Add Layer dialog - click on the 'browse' button next to the file field,
then click the 'Mapbox' button with the cloud icon.

All text within the data has been converted to UTF-8 which is the preferred encoding for working with data in TileMill.

All the data has been reprojected to Google Mercator projection, and is properly
auto-detected as such by TileMill. All geometry data has also been cropped (where necessary)
to fit within the Google Mercator square Earth bounding box of 180.0° east/west and 85.05112877980659° north/south.

All shapefiles have been indexed using Mapnik's shapeindex tool. (The article
[Speed Optimization: Shapefile Indexes][1] explains the benefits of this and how you can make sure your own shapefiles are indexed.)

[1]: http://mapbox.com/tilemill/docs/guides/optimizing-shapefiles

## Natural Earth

Natural Earth is a public domain world-wide dataset available from [http://naturalearthdata.com](http://naturalearthdata.com).
It is designed to be consistent with itself across themes and appropriate at scales down to 1:10 million.
(In TileMill it works well from zoom level 0 up to about 7 or 8.)

Many Natural Earth files contain a "ScaleRank" column. The values in these columns can be taken as
hints about the approximate zoom-level at which it makes sense to start showing these features.
Similarly, some files contain a "LabelRank" column which hints an appropriate zoom level to show a label for that feature.

### Cultural themes

**Administrative Level 0**:

- 10m-admin-0-boundary-breakaway-disputed-areas.zip
- 10m-admin-0-boundary-lines-land.zip
- 10m-admin-0-boundary-lines-map-units.zip
- 10m-admin-0-boundary-lines-maritime-indicator.zip
- 10m-admin-0-breakaway-disputed-areas-scale-ranks.zip
- 10m-admin-0-breakaway-disputed-areas.zip
- 10m-admin-0-countries.zip
- 10m-admin-0-country-points.zip
- 10m-admin-0-map-subunits.zip
- 10m-admin-0-map-units.zip
- 10m-admin-0-pacific-groupings.zip
- 10m-admin-0-scale-ranks-with-minor-islands.zip
- 10m-admin-0-scale-ranks.zip
- 10m-admin-0-sovereignty.zip

The four 10m-admin0-boundary- files contain lines suitable for drawing borders. 

Natural Earth provides several versions of its administrative level 0 units to account for different mapping needs and different definitions of "country". See their [table of comparison][NEadm0] between sovereign states, countries, map units, and map subunits to help decide which one will best fit your project.

[NEadm0]: http://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-details/#ne_table

Also note the following disclaimer from Natural Earth regarding political boundaries:

*Natural Earth Vector draws boundaries of sovereign states according to defacto status. We show who actually controls the situation on the ground. For instance, we show China and Taiwan as two separate states. But we show Palestine as part of Israel. Please feel free to mashup our countries and disputed areas themes to match your particular political outlook.*

Border files contain a "Status" column that indicates several types of boundaries and can be used to for styling purposes (eg, making certain lines dashed or dotted).

- Treaty: established, agreed boundary
- Indefinite: boundaries that have not been surveyed, often in sparsely-populated regions.
- Diputed: the border is not fully recognize or agreed upon by both sides.
- Breakaway: indicate a region that has declared independence from a state but is not fully recognized.
- Claim boundary: indicates area claimed but not controlled by an outside state.

**Administrative Level 1**:

- 10m-admin-1-states-provinces-lakes-shp.zip
- 10m-admin-1-states-provinces-lines-shp.zip
- 10m-admin-1-states-provinces-shp.zip

Administrative level 1 units are sub-national administrative regions such as states, provinces, departments, communes, and territories. The three versions are a polygons layer with large inland water bodies cut out, a lines layer containing only land boundaries, and a polygons layer that does not include lake shapes. There are 3,565 administrative level 1 units in the 1.3.0 version of Natural Earth.

**Populated Places**:

- 10m-populated-places-simple.zip
- 10m-populated-places.zip

The two populated places layers are points of cities and towns around the world. The two files each contain the same 7,314 locations. The only difference is that the -simple version contains only a subset of the metadata - 34 database columns instead of the full 93.

**Transporation**:

- 10m-railroads.zip
- 10m-roads-north-america.zip
- 10m-roads.zip

The roads shapefile contains major road networks across the world. There is also a supplemental file with additional roads for North America. 

The railroads file contains major railroad lines throughout North America - data for other continents is not yet available from Natural Earth.

**Urban Areas**:

- 10m-urban-areas-landscan.zip
- 10m-urban-areas.zip

The urban data areas are polygons of "dense human habitation" derived from 1km-resolution MODIS imagery from 2002-2003. The -landscan version has fewer, more pixelated areas, but is separated and associated with metadata for each city. The main version has more coverage and more organic-looking geometries, but has no separation between adjacent connected cities and no specific metadata.

**US Parks**:

- 10m-us-parks-area.zip
- 10m-us-parks-line.zip
- 10m-us-parks-point.zip

As described by Natural Earth, the US parks files contain "the 392 authorized National Park Service units in the United States of America. The data does not include affiliated areas and unauthorized park units. Park units over 100,000 acres (~40,000 hectares) appear as areas, park units under 100,000 acres as points, and linear parks, including rivers, trails, and seashores, as lines. There are a few exceptions to this rule."

(Read the full description [on NaturalEarthData.com](http://www.naturalearthdata.com/downloads/10m-cultural-vectors/parks-and-protected-lands/).)

### Physical Themes

The Natural Earth Physical Themes contain physical features such as water bodies, glaciers, and mountain peaks, as well as more abstract geographical features such as latitude and longitude lines.

**Antarctic Ice Shelves**:

- 10m-antarctic-ice-shelves-lines.zip
- 10m-antarctic-ice-shelves-polys.zip

The Antarctic ice shelves files reflect the non-seasonal ice surrounding Antarctica. The lines file represents just the outer edge, which may be useful for styling purposes. 

**Bathymetry**

- 10m-bathymetry.zip

Bathymetry shows the depth of the oceans, here in 12 steps from 0 meters (coastline) down to a depth of 10,000 meters. The Natural Earth distributes bathymetry data as 12 separate shapefiles, one shapefile for each depth step. For ease of use with TileMill we have combined them into a single shapefile and added useful depth & class columns so you can still style each step individually.

**Land & Coastline**

- 10m-coastline.zip
- 10m-land.zip
- 10m-ocean.zip

The coastline and land files match up to the various country, province, and ocean layers. The coastline file contains only lines, and the land file is a polygon version of the same data. The ocean shapefile is an inverse version of the land polygons.

Some continents in the land file have been broken into smaller pieces to avoid polygons with many points. Use the land file for `polygon-fill` only and apply use the coastline to apply a stroke.

The Natural Earth coastline is based on data from the World Bank with a number of corrections and additions. The Antarctica coastline is based on data from NASA.

**Minor Islands & Reefs**

- 10m-minor-islands.zip
- 10m-minor-islands-coastline.zip
- 10m-reefs.zip

Minor islands are smaller than 2 square kilometers and have been assigned a ScaleRank of 6 or greater. They are drawn to less detail than the main coastlines and are not shown in the administrative, ocean, or bathymetry files. 

The reefs file contains lines indicating major coral reefs and atolls.

**Geographic Regions**

- 10m-geography-marine-polys.zip
- 10m-geography-regions-elevation-points.zip
- 10m-geography-regions-points.zip
- 10m-geography-regions-polys.zip

These are geographic features and regions such as oceans, gulfs, plains, mountain ranges, deserts, peaks, and valleys. Accuracy varies; these features are intended for large-scale labeling. Natural Earth notes that these files are considered 'beta' quality.

**Glaciated areas**

- 10m-glaciated-areas.zip

This file contains polygons of glaciers, some of which have shrunk or disappeared entirely in recent years (parts of the data are decades old).

**Geographic Lines & Graticules**

- 10m-900913-bounding-box.zip
- 10m-geographic-lines.zip
- 10m-graticules-1.zip
- 10m-graticules-10.zip
- 10m-graticules-15.zip
- 10m-graticules-20.zip
- 10m-graticules-30.zip
- 10m-graticules-5.zip

The different graticules files show latitude and longitude lines in various intervals of degrees. The geographic lines file highlights a few specific lines, such as the arctic/antarctic circles, the tropics of Cancer and Capricorn, the Equator, and the International Date Line. The 900913 bounding box file is a rectangle of the maximum extent of the Google Web Mercator projection (the equivalent area covered by the lone zoom-level-0 tile).

**Lakes**:

- 10m-lakes-europe.zip
- 10m-lakes-historic.zip
- 10m-lakes-north-america.zip
- 10m-lakes-pluvial.zip
- 10m-lakes.zip
- 10m-playas.zip

Large lakes and reservoirs are included in the main lakes file, with many more smaller lakes available in the supplemental files for North America and Europe only. 

Pluvial lakes are basins that fill with water during periods of glaciation. In general these have been dry since prehistoric times, but a few may still fill to some extent on rare occasions. The historic file contains three lakes that have dried up in relatively recent history. The playas file contains major dry lakes, ephemeral lakes, and salt pans.

**Rivers**:

- 10m-rivers-europe.zip
- 10m-rivers-lake-centerlines-scale-ranks.zip
- 10m-rivers-lake-centerlines.zip
- 10m-rivers-north-america.zip

Major rivers around the world, with many additional minor rivers as supplemental files for North America and Europe. Lake centerlines are also included which can be useful for labeling. The lines in the scale-ranks file are broken into more segments and contains a StrokeWeight column to facilitate tapered line styling.
