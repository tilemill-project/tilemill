---
layout: book
section: documentation
category: manual
title: Adding layers
permalink: /docs/manual/adding-layers
---
Layers are how sets of data are added to a map in TileMill. Each  layer references a single shapefile, geoJSON file, KML file, geoTIFF, SQLite database query, or PostGIS database query. Multiple layers are combined over top of each other to create the final map - if you are familiar with layers in Photoshop or other graphics software the concept is very similar. TileMill currently supports creating maps with several formats.

To add a new layer to a TileMill project, click on the 'Add Layer' button at the top of the layers list. A dialog will appear prompting you for details about your layer. For file-based datasources (CSV, Shapefile, GeoJSON, KML, and SQLite) the options are:

- **ID** *required*: This will be the name of the layer. It can be whatever you want, but must contain only letters, numbers, dashes, or underscores, and be unique within the project (two layers can't have the same ID, even if they are the same file). A good ID is a short, accurate description of the layer's purpose in a design, for example, 'major-roads', 'state-borders', or 'lakes'.
- **Class**: These can be thought of as tags with which to classify your layers. You may have 0 or more separated by spaces, and the same character limitations as IDs apply. Multiple layers may have the same class - in fact, their usefulness is in allowing you to select multiple layers at once using a single class reference in your stylesheet.
- **Datasource** *required*: This is a path to a geospatial file either on your local filesystem or as a public HTTP URL. Local files may be selected from the filesystem by clicking 'Browse'.
- **SRS**: this is the spatial reference system your datasource is stored in. TileMill can try to autodetect this value for certain types of files.


File types supported by TileMill
--------------------------------

### CSV

TileMill can plot points using comma separated value (CSV) files if they contain columns for latitude and longitude. The file's first row must contain headings for the columns that contain the coordinates. Any of the following column headings are acceptable: `latitude`, `longitude`, `lat`, `long`,`lon`, `x`, `y`.

### ESRI Shapefile

Usually referred to simply as ‘shapefile’, this is de facto standard file format for portable GIS data storage and is supported by most GIS software applications. The tricky part is that a single 'shapefile' is actually a collection of at least three files (possibly more). Common components are:

- `file.shp` (*required*) contains the geographical point, line, or polygon information
- `file.dbf` (*required*) a database of information describing objects in the .shp file
- `file.shx` (*required*) an index file
- `file.prj` (*recommended*) contains information about the projection the data is stored in. If this file is not present you cannot use 'autodetect' as your SRS choice.
- `file.index` (*recommended*) is an alternative index format for TileMill's renderer, Mapnik, that can speed up rendering significantly. Generate it with the command-line utility 'shapeindex'.

If your shapefile datasource is an HTTP URL, the various corresponding files must be stored together in a zip file before they can be added to a TileMill project. For local datasources you may select just the _.shp_ file and TileMill will find the appropriate corresponding files as long as they are in the same directory as the _.shp_.

### GeoJSON

GeoJSON is a specification for storing spatial data in [JavaScript Object Notation](http://en.wikipedia.org/wiki/JSON), a compact plain-text format. The format can store points, lines, and polygons.

### KML

KML is a standard geospatial data format that was popularized by Google with the Google Earth and Google Maps products. TileMill has limited support of KML – embedded styles will be ignored, and other features such as images, flythroughs, and 3D models are not supported. There is also no support for the compressed KMZ format at this time: to use a KMZ file, simply uncompress it as a zip file, and then use the resulting KML file.

### GeoTIFF

GeoTIFF is a popular format for storing geospatial raster imagery such as satellite photography, remote sensing imagery, and digital elevation models.

Since Mapnik is currently unable to reproject raster data sources, to load them in TileMill you must ensure they are in Web Mercator projection. This can be done using the `gdalwarp` tool. For example, to reproject a Natural Earth world geotiff from its native WGS84, you would use a command such as

    gdalwarp -s_srs EPSG:4326 -t_srs "+proj=merc +a=6378137 +b=6378137 \
      +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null \
      +wktext +no_defs" -r cubic \
      -te -20037508.34 -20037508.34 20037508.34 20037508.34 \
      input_file.tif output_file.tif


### SQLite

[SQLite](http://sqlite.org/) is a compact database format with spatial types - and [Spatialite](http://www.gaia-gis.it/spatialite/) is an extension to SQLite that provides PostGIS-like functionality, including reprojection. TileMill supports both formats through the 'SQLite' panel of the Add Layer dialog.


### PostGIS

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
