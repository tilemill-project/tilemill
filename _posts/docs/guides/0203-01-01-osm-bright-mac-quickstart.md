---
layout: docs
section: help
category: guides
tag: Guides
title: "OSM Bright Mac OS X quickstart"
permalink: /docs/guides/osm-bright-mac-quickstart
prereq:
    - "[Installed](/tilemill/docs/install) TileMill on your computer."
nextup:
    - "[Exporting](/tilemill/docs/crashcourse/exporting/) your map."
---

{% include prereq.html %}

[OSM Bright](https://github.com/mapbox/osm-bright) is a starting point for quickly making street-level maps in TileMill based on an OpenStreetMap database. This guide aims get you quickly set up with this template and rendering a exporting a customized version of it in under 30 minutes.

## Step 0: Download & install required software

In order to use OSM Bright on OS X you will need to download & install a number of packages in addition to TileMill (unless you know you have already installed them).

### PostGIS

There are a several ways to install PostGIS on OS X, including using the pre-built packages from <http://postgresapp.com> or <http://www.kyngchaos.com/software:postgres> and building from scratch with [homebrew](http://brew.sh).

We prefer <http://postgresapp.com> since its standalone `.app` based package and graphical tools make it the most approachable for those new to postgres. However if you are familiar with `homebrew` and prefer source compiles then `brew install postgis` can work great. Consider the `KyngChaos` approach an excellent fallback if the other methods do not work.

#### Installing Postgres.app

[Download it here](http://postgresapp.com/). Unzip the download and drag the app into your Applications folder.

After installation you'll want to make sure that the command line tools that come with Postgres.app are available. Run these two commands in the Terminal:

    echo 'export PATH="/Applications/Postgres.app/Contents/Versions/9.3/bin:$PATH"' >> ~/.bash_profile
    source ~/.bash_profile

Note: your path may be different so consult the [documentation](http://postgresapp.com/documentation/) for up to date path references.

#### Installing PostgreSQL/PostGIS with homebrew

Skip this step if you already installed `Postgres.app`.

First make sure your homebrew install is up to date:

    brew update

Then install postgis like:

    brew install postgis

After installation you'll need to override the OS X system 'psql' command with the new version you just installed. Run this in the Terminal:

    alias psql=/usr/local/opt/postgresql/bin/psql

To make this alias persistent across Terminal sessions you should include it in your `.bash_profile` by running this command:

    echo "alias psql=/usr/local/opt/postgresql/bin/psql" >> ~/.bash_profile


#### Installing PostgreSQL/PostGIS from KyngChaos

Skip this step if you already installed `Postgres.app`.

##### The GDAL 'complete' framework

This is a requirement of PostGIS from KyngChaos. [Get the package here](http://www.kyngchaos.com/software/frameworks#gdal_complete). Open the DMG and run the "GDAL Complete.pkg" installer. There is no need to install the included NumPy package.

##### PostgreSQL and PostGIS

[Get the KyngChaos 'Postgres 9.2' packages here](http://www.kyngchaos.com/software:postgres). Open the DMGs and run the "PostgreSQL.pkg" and "PostGIS.pkg" installers. Note - you need the full 'PostgreSQL' package, not the 'Client-only' package. You can also ignore the WKTRaster and pgRouting packages.

After installation you'll need to override the OS X system 'psql' command with the new version you just installed. Run this in the Terminal:

    alias psql=/usr/local/pgsql-9.2/bin/psql

To make this alias persistent across Terminal sessions you should include it in your `.bash_profile` by running this command:

    echo "alias psql=/usr/local/pgsql-9.2/bin/psql" >> ~/.bash_profile

### osm2pgsql

[Get it here](http://cl.ly/0j0E0N1J3z0z). Follow any instructions that come with the installer.

After installation you'll want to make sure that the `osm2pgsql` command is available without having to type the full path to where you installed it. If just typing `osm2pgsql` in a terminal gives the error `-bash: osm2pgsql: command not found` then you can run these commands in the Terminal:

    echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bash_profile
    source ~/.bash_profile

Note: OSM Bright can also be used with Imposm, but this is slightly more complicated to install on Mac OS X. Feel free to use it as an alternative if you already have it or if you are comfortable with installation systems like Homebrew and easy\_install. Refer to the import command in the OSM Bright README. 

## Step 1: Set up a database for your OSM data

You need to create a database with PostGIS enabled for the OpenStreetMap data. First, make sure Postgres is running and open `psql` by clicking on the Postgres.app menu bar icon and selecting 'psql' (if you do not see this option then upgrade your Postgres.app). This will open a PostgreSQL terminal. Run these commands:

    create database osm;
    \connect osm
    create extension postgis;
    \quit

If at this point you get an error about a missing JPEG library, open a new tab (**⌘t**) and type this command:

    sudo ln -s /Applications/Postgres.app/Contents/MacOS/lib/libjpeg.8.dylib /usr/lib/

Switch back to your other tab and try the `create extension postgis;` command again.

## Step 2: Download & import OSM data

Go to <http://metro.teczno.com> and look for your city. If it's available, download the **.osm.pbf** version of the extract.

If your city is not available here then head to <http://download.geofabrik.de/osm/> and look for a region that would contain your city (for example, there are individual states and provinces available for many countries). Download the **.osm.pbf** version of the file.

With a PBF file downloaded, you can import it with osm2pgsql. Assuming you downloaded the PBF to your Downloads folder, run the following command in the Terminal (making sure to replace `your_file.osm.pbf` with the actual name of your file):

    osm2pgsql -cGs -d osm -S /usr/local/share/osm2pgsql/default.style ~/Downloads/your_file.osm.pbf

This will take something like 1 to 10 minutes, depending on the size of extract you downloaded. (If you downloaded a particularly large extract it may take much longer.) When its finished it will tell you something like "Osm2pgsql took 71s overall".

## Step 3: Download & set up OSM Bright

Download a zip archive of the latest version of OSM Bright from <https://github.com/mapbox/osm-bright/zipball/master> and extract it.

OSM Bright depends on two large shapefiles. You will need to download and extract them before continuing.

Download them to the shp directory in the osm-bright folder. You can do this with wget like:

    wget http://data.openstreetmapdata.com/simplified-land-polygons-complete-3857.zip
    wget http://data.openstreetmapdata.com/land-polygons-split-3857.zip

Once downloaded, extract them from their zip files.

Next you'll need to adjust some settings for things like your PostgreSQL connection information. To do this, open the folder where you've extracted OSM Bright to and run through the following steps.

1. Make a copy of configure.sample.py and name it configure.py.
2. Optionally change the name of your project or any other settings by editing 'configure.py' (but the defaults should be fine).
3. Save & close the file.

**Note:** At this point if you've never run TileMill before you should find it in your Applications folder and run it - the first time it runs it will set up some folders we need for the next step.

Now you can build and install a copy of the project with this new configuration to your MapBox projects directory. In a terminal, `cd` to the directory where you extracted the project, then run the make program. For example:

    cd ~/Downloads/mapbox-osm-bright-*
    ./make.py

If you open TileMill, the Projects view should show you a new map. It will take a bit of time to load at first - the project needs to download about 350 MB of additional data. After some waiting you should see the continents appear on the map. Zoom into the area that your imported data covers and you should see streets and cities appear.

## Step 4: Customize your map

If you want, you can render the OSM Bright template without modifications - however it's really simple to change basic aspects of the map like colors and fonts.

The first stylesheet, palette.mss, contains many of the basic color definitions for the map. Here you can easily change the colors of things like roads, land areas, buildings.

For further customizations dig into the remaining stylesheets and refer to the comments and TileMill's built-in CartoCSS guide for and [the CartoCSS section of the manual](/tilemill/docs/manual/carto/) for guidance. When you're done with your customizations, you're ready to export a map. 

{% include nextup.html %}
