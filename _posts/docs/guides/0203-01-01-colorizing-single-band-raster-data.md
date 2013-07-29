---
layout: docs
section: help
category: guides
tag: Guides
title: "Colorizing Single-band Raster Data"
permalink: /docs/guides/colorizing-single-band-raster-data
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
- "[Set up GDAL](/tilemill/docs/guides/gdal/) for processing raster data in the terminal."
---

{% include prereq.html %}

**Note:** This guide uses the rule `raster-colorizer` which is currently only in the [dev build of TileMill](http://www.mapbox.com/tilemill/docs/releases/#past_releases_and_development_builds)

Single band raster data traditionally rendered as black and white in TileMill, but it's no longer so black and white.

![TileMill Raster-Colorizer](http://farm9.staticflickr.com/8524/8518337247_8cbf2c48e3_o.png)


See our blog post on [processing DNB raster data from NASA and NOAA's Suomi NPP spacecraft](http://mapbox.com/blog/nighttime-lights-nasa-noaa/) to create a nighttime lights map, showing lights visible from space at night. Thanks to <code>raster-colorizer</code>, we can now generate the same map with half as many lines of code, in a fraction of the time, by performing all of the false color steps from within TileMill, rather than a [combination of command line tools and virtual rasters (VRT)](https://gist.github.com/hrwgc/4694661).

To take advantage of the `raster-colorizer` functionality in TileMill, be sure to set `band=1` in the `Advanced` input area of TileMill's "Add Layer" window.

## Lights of the Night ##

The source data is one band, but we can render it in TileMill as a three band raster using [CartoCSS](http://mapbox.com/tilemill/docs/manual/carto/) classes, resulting in three versions of the layer rendering on top of one another:

```#2010::1``` ```#2010::2```  ```#2010::3```

Next, use the ```raster-colorizer``` functionality to color each class a different color to achieve the desired RGB finished product:

![](http://farm9.staticflickr.com/8386/8518337209_51e27be3a5_z.jpg)

![](http://farm9.staticflickr.com/8507/8519450546_d6c5299ef4_o.png)

*2010 NightTime Lights*



    #2010::1  {
      raster-scaling:gaussian;
      raster-colorizer-default-mode:linear;
      raster-colorizer-default-color: transparent;
      raster-colorizer-epsilon:0.41;
      raster-colorizer-stops:
        stop(0,transparent,linear)
        stop(80,#fff)
        stop(100,#000)
    }
    #2010::2  {
      raster-scaling:gaussian;
      raster-colorizer-default-mode:linear;
      raster-colorizer-default-color: transparent;
      raster-colorizer-epsilon:0.41;
      raster-colorizer-stops:
        stop(0,transparent,linear)
        stop(50,#ffcc00)
        stop(60,#000)
    }
    #2010::3  {
      raster-scaling:gaussian;
      raster-colorizer-default-mode:linear;
      raster-colorizer-default-color: transparent;
      raster-colorizer-epsilon:0.41;
      raster-colorizer-stops:
        stop(0,transparent,linear)
        stop(90,#fa360b)
        stop(120,#000)
    }

### Finished Map

![](http://farm9.staticflickr.com/8107/8519450576_a2e35a1404_o.jpg)

{% include prereq.html %}

