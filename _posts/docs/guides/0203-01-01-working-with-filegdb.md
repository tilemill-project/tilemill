---
layout: docs
section: help
category: guides
tag: Guides
title: "Working with FileGDB"
permalink: /docs/guides/filegdb-work
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "You have installed TileMill > 0.10.1"
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
nextup:
- "[Using conditional styles](/tilemill/docs/guides/conditional-styles/) to control the appearance of points based on data."
- "[Using MapBox](http://mapbox.com/hosting/docs/) to upload and composite your map."
code1: "+proj=aea +lat_1=34 +lat_2=40.5 +lat_0=0 +lon_0=-120 +x_0=0 +y_0=-4000000 +ellps=GRS80 +datum=NAD83 +units=m +no_defs"
---

{% include prereq.html %}

TileMill supports directly reading layers inside of [Esri File Geodatabases](http://www.esri.com/software/arcgis/geodatabase/interoperability). This support is provided via the [OpenFileGDB Driver in OGR](http://www.gdal.org/ogr/drv_openfilegdb.html) and recent TileMill packages contain a bleeding edge version of GDAL inside to make this work.

A FileGDB is actually a folder consisting of various binary files named like `a00000049.gdbtable` that describe the database and its tables. Usually this folder has an extension like `.gdb` as if it were a file and depending on your operating system it may show up as a file or folder.

For this example, we'll cover the basics of loading a FileGDB, setting the projection, choosing a layer, and applying basic styling.

## Download the data
1. To begin, download the [CAL FIRE Administrative Boundaries ](http://frap.cdf.ca.gov/data/statewide/cdfadmin13_1.zip) from the CAL FIRE [Fire and Resource Assessment Program](http://frap.cdf.ca.gov/data/frapgisdata-sw-cdfadmin13_1_download.php). A zipped FileGDB will be downloaded.
2. Unzip the FileGDB and you should see the folder `cdfadmin13_1.gdb` inside. Extract this.

## Learning the projection (aka SRS) of the data

1. Note that the projection of the `cdfadmin13_1.gdb` is listed by name at the bottom of the [download page](http://frap.cdf.ca.gov/data/frapgisdata-sw-cdfadmin13_1_download.php) as `California Teale Albers - NAD83`. TileMill does yet support auto-detecting the projection of layers inside of a FileGDB so making sure you know the exact projection is important.
2. We now need to find the Proj4 representation for this data. We can find this via [spatialreference.org](http://spatialreference.org/) by searching for [California Albers](http://spatialreference.org/ref/?search=california+albers). This leads us to the [page for EPSG:3310](http://spatialreference.org/ref/epsg/3310/) where we can find the [proj4 link](http://spatialreference.org/ref/epsg/3310/proj4/) which gives us this string:
<pre>{{page.code1}}</pre>
An alternative resource for referencing Proj4 representations is [EPSG.io](http://epsg.io/). The Proj4 string can be discovered by scrolling down the [page for EPSG:3310](http://epsg.io/3310).

## Adding .gdb as a new TileMill layer

1. Create a new TileMill project called `gdb-cal-fire`.
2. Click to add a new layer and choose the "File" tab
3. In the `Datasource` browse navigate to the location of `cdfadmin13_1.gdb` and choose it.
4. Give the layer an `ID` of `cal-fire-admin`.
5. Paste the custom `proj4` projection string from [spatialreference.org](http://spatialreference.org/ref/sr-org/10/proj4/) into the SRS input:
<pre>{{page.code1}}</pre>

![](/tilemill/assets/pages/loading_filegdb.png) 
4. Then press `Save`.
5. Because this database has more than one layer you will be presented with a new `Layer` dropdown. Choose the layer named `cdfadmin13_1_unit`.
![](/tilemill/assets/pages/choosing_filegdb_layer.png) 
6. Then press `Save` again which should now forward you back to the style editor.

## Styling your map

1. Now you can add some CartoCSS to style the `cal-fire-admin`.
2. Add a very simple style:

<pre>
    #cal-fire-admin {
        polygon-fill:red;
    }
</pre>

3. Press save anf confirm you see the data show up. If you don't see the data show up click the magnifying class in the layer list to zoom to it. If the data seems like it is in the wrong place then you likely declared the wrong SRS value and you'll need to return to fix that.
4. A more sophisticated style might color each region differently like:


<pre>
    #cal-fire-admin {
      polygon-gamma:.5;
      [REGION=1] {
        polygon-fill:#ae8;
      }
      [REGION=2] {
        polygon-fill:blue;
      }
    }
</pre>

![](/tilemill/assets/pages/filegdb_styled.png) 

<small class='note' markdown='1'>
<h3>Note: Optimizing reading of FileGDB data</h3>
To achieve the best performance when reading large FileGDB it is important that the source data either be in `EPSG:4326` or `EPSG:900913`. Other projections should work, but will render slower particularly for large or complex shapes.
</small>


<small class='note' markdown='1'>
<h3>Note: FileGDB data and spatial indexes</h3>
Spatial indexes can help speed up viewing of FileGDB when you are zoomed into just a subsection of the data. TileMill supports reading spatial indexes that you can generate in ArcGIS for FileGDB. However this support is currently disabled due to [this bug](https://github.com/mapbox/tilemill/issues/2275).
</small>

{% include nextup.html %}
