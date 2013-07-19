---
layout: docs
section: help
category: guides
tag: Guides
title: "Color Correction of RGB Imagery"
permalink: /docs/guides/color-correction-rgb-imagery
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
- "[Set up GDAL](/tilemill/docs/guides/gdal/) for processing raster data in the terminal."
nextup:
- "[Pansharpening](/tilemill/docs/guides/pansharpening)"
---

{% include prereq.html %}

**Note:** This guide uses the rule `raster-colorizer` which is currently only in the [dev build of TileMill](http://www.mapbox.com/tilemill/docs/releases/#past_releases_and_development_builds)


Following a similar process to [Single-band colorizing](/docs/guides/single-band-colorizing), we can perform color correction for 3-band natural-color RGB aerial or satellite imagery from within TileMill. Performing the color modifications from within TileMill is much easier and offers greater customization than my previous methods offered.


![](http://farm9.staticflickr.com/8111/8519450602_a3b26c2685_o.jpg)

### RGB Imagery

Normally, when you load an RGB image as a layer in TileMill the layer displays as natural color. To take advantage of the ```raster-colorizer``` functionality, we need to add the layer three times, including in the advanced option of <code>band=1</code> for the red layer, <code>band=2</code> for the green layer, and <code>band=3</code> for the blue layer. The <code>band=</code> advanced option has TileMill load only the indicated band.

To turn the three layers back into an RGB image, you'll want to use <code>raster-comp-op: plus;</code> and <code>raster-colorizer-default-mode: linear;</code> for each layer.

![Raster-Colorizer | RGB color correction before](http://farm9.staticflickr.com/8379/8496556690_54a513891e_o.png)

*Before color correction*

    #red {
      raster-scaling:gaussian;
      raster-comp-op:plus;
      raster-colorizer-default-mode:linear;
      raster-colorizer-default-color: transparent;
      raster-colorizer-epsilon:0.1;
      raster-colorizer-stops:
        stop(0,#000)
        stop(255,rgb(255,0,0))
    }
    #green {
      raster-scaling:gaussian;
      raster-comp-op:plus;
      raster-colorizer-default-mode:linear;
      raster-colorizer-default-color: transparent;
      raster-colorizer-epsilon:0.1;
      raster-colorizer-stops:
        stop(0,#000)
        stop(255,rgb(0,255,0))
    }
    #blue {
      raster-scaling:gaussian;
      raster-comp-op:plus;
      raster-colorizer-default-mode:linear;
      raster-colorizer-default-color: transparent;
      raster-colorizer-epsilon:0.1;
      raster-colorizer-stops:
        stop(0,#000)
        stop(255,rgb(0,0,255))
    }

With the layer rendering as an RGB image in TileMill, you can now apply color corrections to each band, simply by modifying the <code>raster-colorizer-stops</code>.

A good starting place for color correcting in this manner is to adjust the min, max, and mean values. We found red and green bands looked best when we set the minimum to 20 and maximum to 200; for the blue band I set the minimum value to 40. For the red layer, pixels with values less than or equal to 20 are all registered as the darkest dark elements of the band, and all pixels with values greater than or equal to 200 are registered as the brightest red.

![](http://farm9.staticflickr.com/8248/8518337589_8552d1e37b_z.jpg)

![Raster-Colorizer | RGB color correction after](http://farm9.staticflickr.com/8368/8495452361_4462b93770_o.png)

*After color correction*

    #blue {
      raster-scaling:gaussian;
      raster-comp-op:plus;
      raster-colorizer-default-mode:linear;
      raster-colorizer-default-color: transparent;
      raster-colorizer-epsilon:0.1;
      raster-colorizer-stops:
        stop(20,#000)
        stop(200,rgb(0,0,255))
    }
    #green {
      raster-scaling:gaussian;
      raster-comp-op:plus;
      raster-colorizer-default-mode:linear;
      raster-colorizer-default-color: transparent;
      raster-colorizer-epsilon:0.1;
      raster-colorizer-stops:
        stop(20,#000)
        stop(200,rgb(0,255,0))
    }
    #red {
      raster-scaling:gaussian;
      raster-comp-op:plus;
      raster-colorizer-default-mode:linear;
      raster-colorizer-default-color: transparent;
      raster-colorizer-epsilon:0.1;
      raster-colorizer-stops:
        stop(40,#000)
        stop(200,rgb(255,0,0))
    }

{% include prereq.html %}

