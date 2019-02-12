---
layout: docs
category: installation
tag: Installation
title: Installing on Mac OS X
permalink: /docs/mac-install/
hidden: true
nextup:
- "Make your first map with [CSV data](/tilemill/docs/tutorials/point-data/)."
- "Read the [TileMill manual](/tilemill/docs/manual/)."
---
This page is for installing on **Mac OS X**.

We also have instructions for [Ubuntu](/tilemill/docs/linux-install), [Windows](/tilemill/docs/win-install), and [other platforms](/tilemill/docs/source).

### Requirements
<ul class='checklist'>
  <li class='check'>Mac OS X 10.6+</li>
  <li class='check'>2 GB memory</li>
  <li class='check'>64-bit processor</li>
  <li class='check'>Internet connection for remote datasources</li>
</ul>

## Installation Options

In TileMille v0.10.1 and prior (when TileMill was being maintained by MapBox), there were installation packages available for MacOS. Since it has been moved to be maintained by the general community, we have not yet upgraded all dependencies to the point where we can create an installation package. As part of this shift, TileMill has also been modified to run from the browser rather than as a stand-alone app. To get version v1.0.0 and later (with the latest functionality and utilities for managing OSM data in your projects), you will need to install from source.

### To install v0.10.1:
1. [Download TileMill for Mac OS X](/tilemill/index.html).
2. Extract the zip archive.
3. Drag the TileMill icon to your **Applications** folder and double-click the TileMill icon to start.

### To install v1.0.0 or later:

To follow these installation instructions, you will need to use your Terminal app, which is usually found in your Applications/Utilities folder. When you run Terminal, you will get a window with a command prompt. In the instructions below, where there are lines in gray boxes, you can simply copy and paste those lines into your terminal app one entire line at a time. In these instructions, we start each set of commands with “cd ~”. This assumes that you want to install the related software in your home folder. If you want to install it somewhere else, then you will need to replace the “~” with a different file path wherever you see it.

If you are starting with a pre-v1.0.0 version of TileMill, you may want to figure out where your MapBox and MapData directories are and back them up. Later, you will want to move the contents of those direcotries to to ~/MapBox and ~/MapData which will be created during this installtion process if they do not already exist. You should then remove your current version of TileMill.

## Prepare to Install TileMill

Start by installing some packages that you will need to get the TileMill source and then do an initial download of the TileMill code.

### Package Manager (Homebrew)

We recommend installing Homebrew because it is the easiest tool to use to install some of the following software packages. To install Homebrew, open your Terminal app and type:

    cd ~
    ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

Note: After you type this command, you may be prompted to hit enter and then later be prompted with a key icon which means that it wants you to enter your Mac password.

### Version Control System (git)

Now you can use Homebrew to install other packages that are needed by TileMill. Open your Terminal app and type:

    cd ~
    brew install git

### Download TileMill for the First Time

Now, download TileMill source to your Mac. The following “git clone” command will install v1.0.0. If you want to install a different version, replace “v1.0.0” in the command below with a different version number. To download TileMill, open your Terminal app and type:

    cd ~
    git clone –b v1.0.0 https://github.com/tilemill-project/tilemill.git tilemill

## Install or Update TileMill

In the utils directory of TileMill, you will find a helper script that will install TileMill for you (if it has never been installed), including installing Node, the framework that TileMill runs on. If you have already installed TileMill, then this script will update TileMill instead. The script will require you to enter the version of TileMill that you want to install or update to. These instructions only work for TileMill v1.0.0 or later. If you want to install a different version than in the example below, just replace the “v1.0.0” with a different version number. To run this script, open your Terminal app and type:

    cd ~/tilemill/utils
    ./installtilemill.sh v1.0.0
    source ~/.bash_profile

<a name="runtilemill"></a>
## Run TileMill

To run TileMill, you will need to first start the server and then run the client in your browser. To start the server, open your Terminal app and type:

    cd ~/tilemill/utils
    ./runtilemill.sh

The above command should automatically start the tilemill client in your default browser after a 10-15 second pause to let the server startup. If the browser does not pop up, or if you want to use a different browser, you can juse use this link: <a href="http://localhost:20009" target="_blank">http://localhost:20009</a>.
Note: TileMill can be a little slow in rendering the maps depending on how much data it needs to process, so be patient.

When you are finished using TileMill, you can either leave the server running and your Terminal app open, or you can just close the Terminal app window and restart it the next time with these instructions.

<a name="useosm"></a>
## Using Open Street Map (OSM) Data in TileMill

If you want to use [OSM](https://wiki.openstreetmap.org/wiki/Main_Page) data in your TileMill projects, then you will need a Postgres database. If you do not need OSM data, then you are done with the installation.

In addition to Postgres, you will need the PostGIS database extension. You will need to initialize the database for use with OSM data. Finally, you will need the osm2pgsql database-loading tool. In the utils directory of TileMill, you will find a helper script that will take care of these steps for you. This script is only tested for installing from scratch. If you already have a Postgres database, then it is recommended that you remove before using this script (if you don't want to use your existing Postgres database). Before continuing, make sure that TileMill is shutdown (see previous section). Then, to run this script, open your Terminal app and type:

    cd ~/tilemill/utils
    ./installdb.sh
    source ~/.bash_profile

After following these instructions, when you restart TileMill, you can use OSM data from your Postgres database into your TileMill projects.

## Downloading OSM Data

Your database is now setup and ready for you to load OSM data for use in your TileMill projects.  There is a utility script in the tilemill/utils directory called osmload.sh that you can use to do this. This script takes advantage of the <a href="http://download.geofabrik.de" target="_blank">geofabrik</a> OSM data extracts. Geofabrik does these extracts from OSM daily. So, if you make OSM updates, it may take a while before they show up in the geofabrik data. Geofabrik has chopped the world up into many different areas of different sizes. In general, we recommend that you download the smallest area possible that still has the data that you need, otherwise your download will take a very long time and use a lot of memory. To see the areas that you can download, open your Terminal app and type:

    cd ~/tilemill/utils
    ./osmload.sh -a

This will list out all of the areas that you can load into your database. Just use the osm-area value from the right hand column that matches the data that you want when you run the script. This script will create a MapData/OSM directory (if you don’t already have one) in your HOME directory and will store all downloaded osm-files there. For example, to download and load OSM data for Washington State in the US into your database, open your Terminal app and type:

    cd ~/tilemill/utils
    ./osmload.sh washington

Now you are ready to use the OSM data in your projects. If you are looking for a sample of how to use OSM data in your TileMill projects, you can check out the [OSM Bright project](https://github.com/mapbox/osm-bright). Just skip to step 3 (ealier steps have already been taken care of with these instructions) of one of these guides: [OSM Bright for Mac OS X](/tilemill/docs/guides/osm-bright-mac-quickstart/) or [OSM Bright for Unbuntu](/tilemill/docs/guides/osm-bright-ubuntu-quickstart/)

{% include nextup.html %}
