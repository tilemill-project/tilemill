---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "Working with GeoTIFFs"
permalink: /docs/guides/reprojecting-geotiff
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/overview/)"
nextup:
- "[Exporting](/tilemill/docs/crashcourse/exporting/) your map."
- "[Using MapBox](http://mapbox.com/hosting/docs/) to upload and composite your map."
code1: | gdalwarp -s_srs EPSG:4326 -t_srs EPSG:3785 -r bilinear -te -20037508.34 -20037508.34 20037508.34 20037508.34 NE2_LR_LC_SR_W.tif natural-earth-2-mercator.tif

---
{% include prereq.html %}

## Reproject and add a GeoTIFF raster  

TileMill's renderer does not support reprojecting raster data sources on-the-fly, so you will need to ensure the file is warped to the proper projection before importing it into your TileMill project. This can be done with the `gdalwarp` command that comes with the [GDAL](http://www.gdal.org/) library (which is installed with TileMill).

The projection we need to warp is Google Web Mercator, which can be referenced by the code 'EPSG:3785'. You will also need to know the original projection of the geotiff you are converting. As an example, we'll work with the medium-sized 'Natural Earth II with Shaded Relief and Water' geotiff [available from Natural Earth](http://www.naturalearthdata.com/downloads/10m-natural-earth-2/10m-natural-earth-ii-with-shaded-relief-and-water/), which is projected to WGS 84 (aka 'EPSG:4326').

1. In your terminal, navigate to the directory where the geotiff is stored.  
2. Run the following command:  
><pre>{{page.code1}}</pre>
>You will see this output:
>
>![output](/tilemill/assets/pages/geotiff-process-2.png)
>Let's go through what each piece of that command means. A full description of the `gdalwarp` command options can be found [here](http://www.gdal.org/gdalwarp.html).  
> 
>`-s_srs` means "source spatial reference system" - this is the projection that the flle you are starting with is stored in, which in the case of Natural Earth is `EPSG:4326`.  
>
>`-t_srs` means "target spatial reference system" - this is the projection that you want to convert the datasource to. For any raster file you want to use with TileMill this should be `EPSG:3785`.  
>
>`-r bilinear` is telling the program what resampling interpolation method to use. If you want the command to run faster and don't mind a rougher-looking output, choose `near` instead of `bilinear`. If you don't mind waiting longer for very high-quality output, choose `lanczos`.  
>
>`-te -20037508.34 -20037508.34 20037508.34 20037508.34` is telling the program the desired "target extent" of our output file. This is necessary because the Natural Earth geotiff contains data outside the bounds that the web mercator projection is intended to display. The WGS 84 projection can safely contain data all the way to 90&deg; North & South, while web mercator is really only intended to display data up to about 85.05&deg; North & South. The four big numbers after `-te` represent the western, southern, eastern and northern limits (respectively) of a web mercator map.  
>
>If you are working with raster data of a smaller area you will need to make sure that these numbers are adjusted to reflect the area it represents. If that area that does not go too far north or south, you can safely omit this entire option.  
>
>`LR_LC_SR_W.tif` is our original file, and `natural-earth-2-mercator.tif` is the name of the new file the program will create.  
>
>Depending on the size of your file and the resampling method you choose, `gdalwarp` can take a few seconds to a few hours to do its job. With the cubic resampling method on the medium Natural Earth will should a few minutes.  
3. Once it is complete, you can load it into your TileMill project. Click **Add Layer** and browse to find the location where you stored `natural-earth-2-mercator.tif`. Select **900913** as the SRS projection. 
4. Select the file and click **Save and Style**. 
5. To further adjust the resampling interpolation of the image, add the following Carto to your geotiff layer: `raster-scaling: bilinear;`. See the Carto reference manual for additional raster-scaling values. 
![geotiff](/tilemill/assets/pages/geotiff-process-5.png)
6. Select **Save** and preview your map in the map preview pane. 

{% include nextup.html %}