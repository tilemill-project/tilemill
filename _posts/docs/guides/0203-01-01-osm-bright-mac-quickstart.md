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

### Postgres.app

[Download it here](http://postgresapp.com/). Unzip the download and drag the app into your Applications folder.

After installation you'll want to make sure that the command line tools that come with Postgres.app are available. Run these two commands in the Terminal:

    echo 'export PATH="/Applications/Postgres.app/Contents/MacOS/bin:$PATH"' >> ~/.profile
    source ~/.profile

You should make sure that the app works correctly by running it. When it's running there will be an elephant icon visible on your menu bar. You might want to select the option to have this start automatically every time you start your computer.

### osm2pgsql

[Get it here](http://dbsgeo.com/downloads/#osm2pgsql). Follow any instructions that come with the installer.

After installation you'll want to make sure that the `osm2pgsql` command is available without having to type the full path to where you installed it. If just typing `osm2pgsql` in a terminal gives the error `-bash: osm2pgsql: command not found` then you can run these commands in the Terminal:

    echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.profile
    source ~/.profile

Note: OSM Bright can also be used with Imposm, but this is slightly more complicated to install on Mac OS X. Feel free to use it as an alternative if you already have it or if you are comfortable with installation systems like Homebrew and easy\_install. Refer to the import command in the OSM Bright README. 

## Step 1: Set up a database for your OSM data

You need to create a database with PostGIS enabled for the OpenStreetMap data. First, make sure Postgres is running and open `psql` by clicking on the Postgres.app menu bar icon and selecting 'psql' (if you do not see this option then upgrade your Postgres.app). This will open a PostgreSQL terminal. Run these commands:

    create database osm;
    \connect osm
    create extension postgis;

If at this point you get an error about a missing JPEG library, open a new tab (**⌘t**) and type this command:

    sudo ln -s /Applications/Postgres.app/Contents/MacOS/lib/libjpeg.8.dylib /usr/lib/

Switch back to your other tab and try the `create extension postgis;` command again.

## Step 2: Download & import OSM data

Go to <http://metro.teczno.com> and look for your city. If it's available, download the **.osm.pbf** version of the extract.

If your city is not available here then head to <http://download.geofabrik.de/osm/> and look for a region that would contain your city (for example, there are individual states and provinces available for many countries). Download the **.osm.pbf** version of the file.

With a PBF file downloaded, you can import it with osm2pgsql. Assuming you downloaded the PBF to your Downloads folder, run the following command in the Terminal (making sure to replace `your_file.osm.pbf` with the actual name of your file):

    osm2pgsql -c -G -d osm -S /usr/local/share/osm2pgsql/default.style ~/Downloads/your_file.osm.pbf

This will take something like 1 to 10 minutes, depending on the size of extract you downloaded. (If you downloaded a particularly large extract it may take much longer.) When its finished it will tell you something like "Osm2pgsql took 71s overall".

## Step 3: Download & set up OSM Bright

Download a zip archive of the latest version of OSM Bright from <https://github.com/mapbox/osm-bright/zipball/master> and extract it.

You'll need to adjust some settings for things like your PostgreSQL connection information. To do this, open the folder where you've extracted OSM Bright to in Finder and run through the following steps.

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
