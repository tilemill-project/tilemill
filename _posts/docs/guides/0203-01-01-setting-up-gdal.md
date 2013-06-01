---
published: "true"
layout: docs
section: help
category: guides
tag: Guides
title: Setting up GDAL
permalink: /docs/guides/gdal
prereq: 
  - "[Installed TileMill](/tilemill/docs/install) on your computer."
nextup: 
  - "Run through [Crash Course](/tilemill/docs/crashcourse/introduction/)."
  - "[Working with GeoTIFFs](/tilemill/docs/guides/reprojecting-geotiff)."
  - "[Working with Terrain Data](/tilemill/docs/guides/terrain-data)."

---

{% include prereq.html %}

Some of the data processing tasks required for effective cartography in TileMill require the use of external tools. GDAL is a geographic library that provides a powerful set of tools for working with a wide variety of raster and vector geographic data.

## Max OS X

On Mac OS X you can install the "GDAL Complete" Framework from [kyngchaos.com](http://www.kyngchaos.com/software/frameworks).

GDAL applications are run through the [Mac OS X Terminal](http://blog.teamtreehouse.com/introduction-to-the-mac-os-x-command-line). The first time you install the GDAL package there is one additional step to make sure you can access these programs. Open the Terminal application and run the following commands:

    echo 'export PATH=/Library/Frameworks/GDAL.framework/Programs:$PATH' >> ~/.bash_profile
    source ~/.bash_profile

You should now be ready to go. To test your installation, run the Terminal command `gdalinfo --version`. A correct installation will output something like `GDAL 1.9.0, released 2011/12/29`.


## Linux

On Ubuntu simply install the __gdal-bin__ package with your package manager.

    sudo apt-get install gdal-bin

For other distributions, search your package repository for 'gdal'. See also OSGeo's [GDAL Binaries](http://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries) information.

GDAL applications are run through the [terminal](https://help.ubuntu.com/community/UsingTheTerminal). To test your installation, run the terminal command `gdalinfo --version`. A correct installation will output something like `GDAL 1.9.0, released 2011/12/29`.

{% include nextup.html %}
