---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "OSM Bright Mac OS X quickstart"
permalink: /docs/guides/osm-bright-mac-quickstart
prereq:
    - "[Installed](/tilemill/docs/install) TileMill on your computer."
nextup:
    - "[Exporting](/tilemill/docs/crashcourse/exporting/) your map."
---

{% include prereq.html %}

[OSM Bright](https://github.com/mapbox/osm-bright) is a sensible starting point for quickly making beautiful maps in TileMill based on an OpenStreetMap database. This guide aims get you quickly set up with this template and rendering a exporting a customized version of it in under 30 minutes.

## Step 0: Download & install required software

In order to use OSM Bright on OS X you will need to download & install a number of packages in addition to TileMill (unless you know you have already installed them).

### The GDAL 'complete' framework

This is a requirement of PostGIS. [Get the package here](http://www.kyngchaos.com/software/frameworks#gdal_complete). Open the DMG and run the "GDAL Complete.pkg" installer. There is no need to install the included NumPy package.

### PostgreSQL and PostGIS

[Get the packages here](http://www.kyngchaos.com/software:postgres). Open the DMGs and run the "PostgreSQL.pkg" and "PostGIS.pkg" installers. Note - you need the full 'PostgreSQL' package, not the 'Client-only' package. You can also ignore the WKTRaster and pgRouting packages.

After installation you'll need to override the OS X system 'psql' command with the new version you just installed. Run this in the Terminal:

    alias psql=/usr/local/pgsql-9.1/bin/psql

To make this alias persistent across Terminal sessions you should include it in your `.bash_profile` by running this command:

    echo "alias psql=/usr/local/pgsql-9.1/bin/psql" >> ~/.bash_profile

### osm2pgsql

[Get it here](http://dbsgeo.com/downloads/#osm2pgsql). Open the DMG and run the pkg installer. There is no need to install the included GEOS and PROJ frameworks.

Note: OSM Bright can also be used with Imposm, but this is slightly more complicated to install on Mac OS X. Feel free to use it as an alternative if you already have it or if you are comfortable with installation systems like Homebrew and easy\_install. Refer to the import command in the OSM Bright README. 

## Step 1: Set up a database for your OSM data

You need to create a database with PostGIS enabled for the OpenStreetMap data. Run the following commands in the Terminal:

    psql -U postgres -c "create database osm;"
    psql -U postgres -d osm -f /usr/local/pgsql-9.1/share/contrib/postgis-1.5/postgis.sql
    psql -U postgres -d osm -f /usr/local/pgsql-9.1/share/contrib/postgis-1.5/spatial_ref_sys.sql

## Step 2: Download & import OSM data

Go to <http://metro.teczno.com> and look for your city. If it's available, download the **.osm.pbf** version of the extract.

If your city is not available here then head to <http://download.geofabrik.de/osm/> and look for a region that would contain your city (for example, there are individual states and provinces available for many countries). Download the **.osm.pbf** version of the file.

With a PBF file downloaded, you can import it with osm2pgsql. Assuming you downloaded the PBF to your Downloads folder, run the following command in the Terminal:

    osm2pgsql -c -G -U postgres -d osm -S /usr/local/share/osm2pgsql/default.style your_file.osm.pbf

This will take something like 1 to 10 minutes, depending on the size of extract you downloaded. (If you downloaded a particularly large extract it may take much longer.) When its finished it will tell you something like "Osm2pgsql took 71s overall".

## Step 3: Download & set up OSM Bright

Download a zip archive of the latest version of OSM Bright from <https://github.com/mapbox/osm-bright/zipball/master> and extract it.

You'll need to adjust some settings for things like your PostgreSQL connection information. To do this, open the folder where you've extracted OSM Bright to in Finder and run through the following steps.

1. Make a copy of configure.sample.py and name it configure.py.
2. Open the new configure.py in a text editor.
3. Optionally change the name of your project from the default, 'OSM Bright'.
4. Adjust the path to point to your MapBox project folder. If your Mac OS X username is 'mary', it should likely be `/Users/mary/Documents/MapBox/project/`.
5. change the line that says `config["postgis"]["user"]     = ""` to `config["postgis"]["user"]     = "postgres"`
6. Save & close the file.

If you've set up PostgreSQL as described in Step 0 this should be all you need to change. Save & quit. (If you've set things up differently you may need to specify a password or different user name.)

**Note:** At this point if you've never run TileMill before you should find it in your Applications folder and run it - the first time it runs it will set up some folders we need for the next step.

Now you can build and install a copy of the project with this new configuration to your MapBox projects directory. In a terminal, `cd` to the directory where you extracted the project, then run the make program. For example:

    cd ~/Downloads/mapbox-osm-bright-*
    ./make.py

If you open TileMill and the Projects view should show you a new map. It will take a bit of time to load at first - the project needs to download about 350 MB of additional data. After some waiting you should see the continents appear on the map. Zoom into the area that your imported data covers and you should see streets and cities appear.

## Step 4: Customize your map

If you want, you can render the OSM Bright template without modifications - however it's really simple to change basic aspects of the map like colors and fonts.

The first stylesheet, palette.mss, contains many of the basic color definitions for the map. Here you can easily change the colors of things like roads, land areas, buildings.

For further customizations dig into the remaining stylesheets and refer to the comments and TileMill's built-in Carto guide for and [the Carto section of the manual](/tilemill/docs/manual/carto/) for guidance. When you're done with your customizations, you're ready to export a map. 

{% include nextup.html %}
