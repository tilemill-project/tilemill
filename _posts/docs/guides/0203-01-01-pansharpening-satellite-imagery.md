---
layout: docs
section: help
category: guides
tag: Guides
title: "Pansharpening Satellite Imagery"
permalink: /docs/guides/pansharpening-satellite-imagery
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
- "[Set up GDAL](/tilemill/docs/guides/gdal/) for processing raster data in the terminal."
nextup:
- "[Pansharpening](/tilemill/docs/guides/gdal)"
---

{% include prereq.html %}

## Pansharpening satellite images for better clarity ##

One way to take advantage of the higher resolution panchromatic image is to use it to pansharpen the lower resolution multispectral images, which generates a natural color RGB image with the spatial resolution of the panchromatic image. 

[Orfeo Toolbox](http://orfeo-toolbox.org/otb/) is an open source, geospatially enabled image processing library developed at the [French Space Agency](http://www.cnes.fr/web/CNES-fr/6919-cnes-tout-sur-l-espace.php) that supports satellite sensor calibration and raster operations not available in [GDAL](http://gdal.org). Orfeo Toolbox also has good support for [several image fusion functions](http://www.orfeo-toolbox.org/CookBook/CookBooksu27.html#x44-660003.2.2).

The [BundleToPerfectSensor application](http://www.orfeo-toolbox.org/CookBook/CookBooksu27.html#x44-660003.2.2), distributed as part of the OTB Applications, performs the two steps necessary to perform the pansharpening: image registration and pixel fusion. 

The main steps involved in the pansharpening are:

1. Create a natural color Virtual Raster (VRT) from the original red, green, and blue bands, which are separate geotiffs. 
2. Assign the correct color interpretation value for each band added to the virtual raster. 
3. Pansharpen the RGB virtual raster using the original panchromatic image, being careful to maintain the data type from before (UInt16)
4. Convert and scale pansharpened RGB image from UInt16 to Byte.
5. Warp the pansharpened RGB image from it's native projection to Google Mercator (EPSG:3785)
6. Add overviews to the reprojected pansharpened RGB GeoTIFF. 

Here's what the code looks like:
    
    DIR="" #change to the directory containing the GeoEye imagery
    ADDO="2 4 8 16 32 64 128 256 512 1024 2048 4096 8192"
    gdalbuildvrt \
	  $DIR/rgb.vrt \
      -separate \
      -q \
      -srcnodata "0 0 0"\
      -vrtnodata "0 0 0"\
      $DIR/*red*.tif $DIR/*grn*.tif  $DIR/*blu*.tif && \
    sed -i '6 i\
    <ColorInterp>Red</ColorInterp>' $DIR/rgb.vrt && \
    sed -i '18  i\
    <ColorInterp>Green</ColorInterp>' $DIR/rgb.vrt && \
    sed -i '30 i\
    <ColorInterp>Blue</ColorInterp>' $DIR/rgb.vrt && \
    otbcli_BundleToPerfectSensor \
      -ram 4096 \
      -inp $DIR/*_pan_*.tif \
      -inxs $DIR/rgb.vrt \
      -out $DIR/pan-${DIR}.tif uint16 && \
    gdal_translate \
       -ot Byte \
       -scale 0 3000 0 255 \
       -a_nodata "0 0 0" \
       $DIR/pan-${DIR}.tif $DIR/pan-${DIR}-scaled.tif && \
    gdalwarp \
      -r cubic \
      -wm 4096 \
      -multi \
      -srcnodata "0 0 0" \
      -dstnodata "0 0 0" \
      -dstalpha \
      -wo OPTIMIZE_SIZE=TRUE \
      -wo UNIFIED_SRC_NODATA=YES \
      -t_srs EPSG:3785 \
      -co TILED=YES\
      -co COMPRESS=LZW\
      $DIR/pan-${DIR}-scaled.tif $DIR/pansharp_${DIR}_3785.tif &&\
    gdaladdo \
      -r cubic \
      --config COMPRESS_OVERVIEW LZW \
      $DIR/pansharp_${DIR}_3785.tif $ADDO && \
    rm $DIR/pan-${DIR}.tif ${DIR}/pan-${DIR}-scaled.tif
    

### Before Pansharpening ###

![Salajar Island, Before Pansharpening](http://farm9.staticflickr.com/8350/8261731667_b8512eee98_b.jpg)

### After Pansharpening ###

![Salajar Island, After Pansharpening](http://farm9.staticflickr.com/8076/8262801140_438f6efa89_b.jpg) 

{% include prereq.html %}