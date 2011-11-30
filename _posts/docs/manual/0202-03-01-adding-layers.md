---
layout: book
section: documentation
category: TileMill
tag: manual
title: Adding layers
permalink: /docs/manual/adding-layers
---
Layers are how sets of data are added to a map in TileMill. Each  layer references a single shapefile, geoJSON file, KML file, geoTIFF, or PostGIS database query. Multiple layers are combined over top of each other to create the final map - if you are familiar with layers in Photoshop or other graphics software the concept is very similar. TileMill currently supports creating maps with several formats.

## CSV

TileMill can plot points using comma separated value (CSV) files if they contain columns for latitude and longitude. The file's first row must contain headings for the columns that contain the coordinates. Any of the following column headings are acceptable: `latitude`, `longitude`, `lat`, `long`,`lon`, `x`, `y`.

## ESRI Shapefile
Usually referred to simply as ‘shapefile’, this is de facto standard file format for portable GIS data storage and is supported by most GIS software applications. The tricky part is that a single 'shapefile' is actually a collection of at least three files (possibly more). The required components are:

1. `file.shp` contains the geographical point, line, or polygon information
2. `file.dbf` a database of information describing objects in the .shp file
3. `file.shx` an index file

Because TileMill is designed to handle files across the Internet and dealing with collections of files complicates that somewhat, shapefiles must be stored in a zip file before they can be added to a TileMill project.

## GeoJSON

GeoJSON is a specification for storing spatial data in [JavaScript Object Notation](http://en.wikipedia.org/wiki/JSON), a compact plain-text format. The format can store points, lines, and polygons.

## KML

KML is a standard geospatial data format that was originally developed for and popularized by Google Earth. TileMill has limited support of this format–point and polygon styles will be ignored, and other features such as images and 3D models are not supported. There is also no support for the compressed KMZ format at this time.

## GeoTIFF

GeoTIFF is a popular format for storing geospatial raster imagery such as satellite photography, remote sensing imagery, and digital elevation models.

Since Mapnik is currently unable to reproject raster data sources, to load them in TileMill you must ensure they are in Web Mercator projection. This can be done using the `gdalwarp` tool. For example, to reproject a Natural Earth world geotiff from its native WGS84, you would use a command such as

    gdalwarp -s_srs EPSG:4326 -t_srs "+proj=merc +a=6378137 +b=6378137 \
      +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null \
      +wktext +no_defs" -r cubic \
      -te -20037508.34 -20037508.34 20037508.34 20037508.34 \
      input_file.tif output_file.tif


## SQLite

[SQLite](http://sqlite.org/) is a compact database format with spatial types - and [Spatialite](http://www.gaia-gis.it/spatialite/) is an extension to SQLite that provides PostGIS-like functionality, including reprojection. TileMill supports both formats through the 'SQLite' panel of the Add Layer dialog.


## PostGIS

[PostGIS](http://postgis.refractions.net/) is an extension for the general-purpose [PostgreSQL](http://www.postgresql.org/) database that allows you to store geographical objects in a database. It provides special functions and indexes for querying and manipulating spatial data and can be used as a powerful storage/analysis tool. From TileMill you can connect to a PostGIS supported database and run queries from the application directly.

When adding a PostGIS layer to your project you will need to supply a connection string. The following options are available:

- `dbname` **Required.** The database that containing geodata for your layer.
- `user` Your PostGIS username.
- `password` Your PostGIS password.
- `host` The hostname to use when connecting to your server.
- `port` The port to use when connecting to your server.

Here are some example connection strings:

    dbname=gis
    dbname=gis user=mapbox
    dbname=gis user=mapbox password=foo host=localhost port=5984

In the **Table or subquery** field, you can either specify the of the table that contains your data or, for more advanced uses, specify a subquery in SQL. The subquery must be wrapped in parentheses and be given an alias using the `AS` statement. For example:

    (SELECT * FROM geodata WHERE type = 'birdhouse') AS data;

If you plan to use the tooltip feature in TileMill, your PostGIS table must provide a column that contains a [unique key](http://en.wikipedia.org/wiki/Unique_key). Specify the name of that column in **Unique key field** box. Otherwise, you may see incorrect tooltips after exporting to MBTiles.
