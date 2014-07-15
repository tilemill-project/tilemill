---
layout: docs
section: help
category: guides
tag: Guides
title: "OSM Bright Ubuntu quickstart"
permalink: /docs/guides/osm-bright-ubuntu-quickstart
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
nextup:
- "[Exporting](/tilemill/docs/crashcourse/exporting/) your map."
---

{% include prereq.html %}

[OSM Bright](https://github.com/mapbox/osm-bright) is a sensible starting point for quickly making beautiful maps in TileMill based on an OpenStreetMap database. This guide aims get you quickly set up with this template and rendering a exporting a customized version of it in under 30 minutes.

## Step 0: Download & install required software

In order to use OSM Bright on Ubuntu you'll need to install a number of packages in addition to TileMill (unless you know you have already installed them).

### PostgreSQL and PostGIS

Open up a terminal and run the following command to install PostGIS and all of its dependencies, including PostgreSQL. 

For Ubuntu 11.10 'Oneiric Ocelot':

    sudo apt-get install postgresql postgresql-9.1-postgis

For Ubuntu 11.04 'Natty Narwhal':

    sudo apt-get install postgresql postgresql-8.4-postgis

### Imposm

First install Imposm's dependencies with this command:

    sudo aptitude install build-essential python-dev protobuf-compiler \
        libprotobuf-dev libtokyocabinet-dev python-psycopg2 libgeos-c1

Imposm can now be installed via `pip` or `easy_install`. If you're not sure what that means, run the following commands:

    sudo apt-get install python-pip
    sudo pip install imposm

Note: OSM Bright can also be used with `osm2pgsql` instead of Imposm if you prefer. Install it with `sudo apt-get install osm2pgsql` and refer to the proper import command in the OSM Bright README for step 2.

### OSM Bright

Download a zip archive of the latest version of OSM Bright from <https://github.com/mapbox/osm-bright/zipball/master> and extract it somewhere on your system, for example in `~/Documents/`.

## Step 1: Set up a database for your OSM data

You need to create a database with PostGIS enabled for the OpenStreetMap data, but first you'll need to adjust PostgreSQL's access permissions.

For Ubuntu 11.10:

    sudo nano /etc/postgresql/9.1/main/pg_hba.conf

For Ubuntu 11.04:

    sudo nano /etc/postgresql/8.4/main/pg_hba.conf

Page down to the bottom section of the file and adjust all local access permissions to 'trust'. This will allow you to access the PostgreSQL database from the same machine without a password. Your configuration should contain something like this:

<pre>
local   all             postgres                                trust

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
# IPv6 local connections:
host    all             all             ::1/128                 trust
</pre>

Save and exit from `nano` with Ctrl-O then Ctrl-X. In order for this new configuration to take effect you need to restart the PostgreSQL process:

    sudo /etc/init.d/postgresql restart

You should now be able to set up your PostGIS database. Run the following commands in the Terminal.

For Ubuntu 11.10:

    psql -U postgres -c "create database osm;"
    psql -U postgres -d osm -f /usr/share/postgresql/9.1/contrib/postgis-1.5/postgis.sql
    psql -U postgres -d osm -f /usr/share/postgresql/9.1/contrib/postgis-1.5/spatial_ref_sys.sql

For Ubuntu 11.04:

    psql -U postgres -c "create database osm;"
    psql -U postgres -d osm -c "create language plpgsql;"
    psql -U postgres -d osm -f /usr/share/postgresql/8.4/contrib/postgis-1.5/postgis.sql
    psql -U postgres -d osm -f /usr/share/postgresql/8.4/contrib/postgis-1.5/spatial_ref_sys.sql

## Step 2: Download & import OSM data

Go to <http://metro.teczno.com> and look for your city. If it's available, download the **.osm.pbf** version of the extract.

If your city is not available here then head to <http://download.geofabrik.de/osm/> and look for a region that would contain your city (for example, there are individual states and provinces available for many countries). Download the **.osm.pbf** version of the file.

With a PBF file downloaded, you can import it with Imposm. Assuming you downloaded the PBF to your Downloads folder, run the following command in the Terminal:

    imposm -U postgres -d osm -m /path/to/osm-bright/imposm-mapping.py \
        --read --write --optimize --deploy-production-tables <data.osm.pbf>

This will take something like 1 to 10 minutes, depending on the size of extract you downloaded. (If you downloaded a particularly large extract it may take much longer.) It will output a series of messages explaining the steps it is taking, the last of which will be something like "imposm took 1 m 11s".

## Step 3: Set up OSM Bright

OSM Bright depends on two large shapefiles. You will need to download and extract them before continuing.

Download them to the shp directory in the osm-bright folder. You can do this with wget like:

    wget http://data.openstreetmapdata.com/simplified-land-polygons-complete-3857.zip
    wget http://data.openstreetmapdata.com/land-polygons-split-3857.zip

Once downloaded, extract them from their zip files.

You'll need to adjust some settings for things like your PostgreSQL connection information. To do this, open the folder where you've extracted OSM Bright to in your file manager and run through the following steps.

1. Make a copy of configure.sample.py and name it configure.py.
2. Open the new configure.py in a text editor.
3. Change `config["importer"] = "osm2pgsql"` to `config["importer"] = "imposm"`, unless you prefer to use osm2pgsql and have that set up.
4. Optionally change the name of your project from the default, 'OSM Bright'.
5. Adjust the path to point to your MapBox project folder. If your Ubuntu username is 'mary', it should likely be `/home/mary/Documents/MapBox/project/`.
6. change the line that says `config["postgis"]["user"]     = ""` to `config["postgis"]["user"]     = "postgres"`
7. Save & close the file.

If you've set up PostgreSQL as described in Step 0 this should be all you need to change. (If you've set things up differently you may need to specify a password or different user name.)

**Note:** At this point if you've never run TileMill before you should do that - search for it in the Dash Home and click on the icon. The first time it runs it will set up some folders we need for the next step.

Now you can build and install a copy of the project with this new configuration to your MapBox projects directory. In a terminal, `cd` to the directory where you extracted the project, then run the make program. For example:

    cd ~/Downloads/mapbox-osm-bright-*
    ./make.py

If you open TileMill and the Projects view should show you a new map. It will take a bit of time to load at first - the project needs to download about 350 MB of additional data. After some waiting you should see the continents appear on the map. Zoom into the area that your imported data covers and you should see streets and cities appear.

## Step 4: Customize your map

If you want, you can render the OSM Bright template without modifications - however it's really simple to change basic aspects of the map like colors and fonts.

The first stylesheet, palette.mss, contains many of the basic color definitions for the map. Here you can easily change the colors of things like roads, land areas, buildings.

For further customizations dig into the remaining stylesheets and refer to the comments and TileMill's built-in CartoCSS guide for and [the CartoCSS section of the manual](/tilemill/docs/manual/carto/) for guidance. When you're done with your customizations, you're ready to export a map. 

{% include nextup.html %}
