---
layout: docs
section: help
category: guides
tag: Guides
title: "Discrete Raster Data"
subtitle: "Land Cover Example"
permalink: /docs/guides/discrete-raster-data
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
- "[Set up GDAL](/tilemill/docs/guides/gdal/) for processing raster data in the terminal."
nextup:
- "[Pansharpening](/tilemill/docs/guides/gdal)"
---

{% include prereq.html %}

## Discrete Raster Data: Land Cover

Contextually styling a discrete raster data set -- a task once completed over several steps across different applications --  can be completed within TileMill, our open source design studio. When you contextually style raster data, you bind a color value to particular pixel values, which is great for highlighting urban areas using a bright color, making no-data pixels appear transparent, and grouping similar categories, like types of tree cover, into larger categories and making them all green.


Here we will make a custom land cover map layer from a raster dataset. This guide uses [this one available from the Japan Aerospace Exploration Agency](http://www.eorc.jaxa.jp/ALOS/lulc/lulc_jindex.htm).

The only pre-processing required is to reproject the dataset to Google Mercator projection, using an application like <code>gdalwarp</code>. All styling of the raster data can be accomplished from within TileMill using [CartoCSS](http://mapbox.com/tilemill/docs/manual/carto/).

## Pre-processing ##

After downloading and uncompressing the GeoTiff data, warp each image to the proper projection as we did to the [Natural Earth GeoTiff](http://www.mapbox.com/tilemill/docs/guides/reprojecting-geotiff/#reproject_and_add_a_geotiff_raster).

## Build a Virtual Dataset ##

This section is useful for when wanting to create a mosaic. If we are in the directory with all the TIF files we can make a [virtual mosaic](http://www.gdal.org/gdalbuildvrt.html) by running:

	gdalbuildvrt example.vrt *.tif

## Importing and Styling in TileMill ##


Since we're using a land cover geotiff with specific pixel values mapping directly to land cover classifications we want to use ```raster-colorizer-default-mode: exact``` meaning stops will map to exact pixel values, and no other color values will be assigned through interpolation.

Now all that remains is to translate the land use data key into cartocss style rules, using the raster-colorizer stop syntax:

```stop(``` +  pixel value + ```,``` + color to assign + ```)```

[![Japan Land Use | Mapnik raster-colorizer by MapBox](http://farm9.staticflickr.com/8385/8495388263_1a2c4eceb4_o.png)](http://a.tiles.mapbox.com/v3/herwig.japan-land,herwig.map-behmiof5.html#7.00/42.832/141.993)




    @blank:            transparent;
    @snow:             #ffffff;
    @unused:           #9a9a9a;
    @urban:            #e2bf58;
    @agriculture:      #91a487;
    @grass:            #6b7e60;
    @forest:           #46533f;
    @water:            #37526d;
    Map { background-color:@water;}

    #japan {
      raster-opacity:1;
      raster-scaling:gaussian;
      raster-colorizer-default-mode:exact;
      raster-colorizer-default-color: transparent;
      raster-colorizer-epsilon:0.41;
      raster-colorizer-stops:
        stop(0, transparent)
        stop(1, @water)
        stop(2, @urban)
        stop(3, @agriculture)
        stop(4, @agriculture)
        stop(5, @grass)
        stop(6, @forest)
        stop(7, @forest)
        stop(8, @forest)
        stop(9, @forest)
        stop(10, @unused)
        stop(11, @snow)
        stop(253, @unused)
        stop(255, @blank);
    }


### Finished Map


[![Japan Land Cover | Mapnik raster-colorizer by MapBox](http://farm9.staticflickr.com/8094/8495387917_8425ce6b97_o.jpg)](http://a.tiles.mapbox.com/v3/herwig.japan-land,herwig.map-behmiof5.html#7.00/42.832/141.993)

*[Japan Land Cover Finished map](http://a.tiles.mapbox.com/v3/herwig.japan-land,herwig.map-behmiof5.html#7.00/42.832/141.993)*

{% include nextup.html %}