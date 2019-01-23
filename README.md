# Latest Status - Jan 22, 2019

Tilemill has now been updated from the great work of [TileOven](https://github.com/florianf/tileoven), which was merged back into this project.  The current goal is to update TileMill's dependencies to current versions and bring back GUI apps for each platform using Electron.

Changes from [TileOven](https://github.com/florianf/tileoven) were pulled on Jan 20, 2019.

# General Info
TileMill is a modern map design studio powered by [Node.js](https://nodejs.org) and [Mapnik](https://mapnik.org).

- TileMill is tested on Linux with Node 8.11.3 LTS, and partially tested on MacOS 10.14 with Node 8.15.0 lts/carbon
- TileMill currently only works in server mode, there is no standalone GUI.  Your browser is used for the interface.
- There are no native packages provided. Installation requires cloning this repo. See details below under *Installation*.
- Tilemill should theoretically work on the Windows platform, but it isn't tested.


# Dependencies

- Mapnik v2.3.0 (initial tests have worked on Mapnik 3.6.2, you'll need to update package.json)
- Node.js v6.x, v4.x, v0.10.x or v0.8.x (initial tests have worked on Node 8.15 lts/carbon, but you'll need to update other packages as well)
- Protobuf: libprotobuf-lite and protoc


# Installation

Note: on Ubuntu make sure that you have the nodejs-legacy package installed!

To install from source just do:

    git clone https://github.com/tilemill-project/tilemill.git
    cd tilemill
    nvm install v6.14.3
    nvm use v6.14.3
    npm install

Then to start TileMill do:

    npm start # and then view http://localhost:20009 in your web browser

For more extended details follow:

- [Install packages](http://tilemill-project.github.io/tilemill/docs/mac-install/)
- [Build from source](https://tilemill-project.github.io/tilemill/docs/source/)

If you'd like to pull in OpenStreetMap data for map generation in TileMill, a good starting point is to follow the OSM Bright Quickstart guides:

- [OSM Bright Mac OSX Quickstart](http://tilemill-project.github.io/tilemill/docs/guides/osm-bright-mac-quickstart/)
- [OSM Bright Ubuntu Quickstart](http://tilemill-project.github.io/tilemill/docs/guides/osm-bright-ubuntu-quickstart/)


# Changes pulled from Tileoven, since original fork from Tilemill

## Features

- Forked millstone, tilelive, node-srs dependencies, Node 8 now supported
- Support for Node 8, thanks to patches and updated dependencies of @paulovieira
- Added layer selection to map panel for fast comparisons with OSM and to save render time for low zoom levels
- Added search field to layer panel
- Added search field to styles panel
- Added cloning of layers to layer panel
- Layer actions only shown on hover, ideal for long layer names and reduces visual noise
- Increased size of layer panel
- Updated carto and node-mapnik dependencies, new CartoCSS commands available
- Remember last selected folder in new layer dialog
- Better compatibility with kosmtik, TileMill mml project files should work out of the box with kosmtik (https://github.com/kosmtik)

## Bugfixes

- Removed topcube and other obsolete dependencies
- Removed windowed mode, only server mode is supported
- Fixed Tab indentation in editor window
- Fixed "Close" button bugs in Google Chrome (https://github.com/mapbox/tilemill/issues/2534)
- Fixed mbtiles preview map
- Removed Mapbox integration
- Fixed CartoCSS variable auto completion
- Fixed creation of job file in export if it doesn't exist
- Fixed multiple output of CartoCSS errors to update to latest version


# Build Status

TBD

### Key modules

- mapnik - [![Build Status](https://secure.travis-ci.org/mapnik/mapnik.png?branch=2.3.x)](https://travis-ci.org/mapnik/mapnik)
- node-mapnik - [![Build Status](https://secure.travis-ci.org/mapnik/node-mapnik.png)](https://travis-ci.org/mapnik/node-mapnik)
- carto - [![Build Status](https://secure.travis-ci.org/mapbox/carto.png)](http://travis-ci.org/mapbox/carto)
- tilelive - TBD
- tilelive-mapnik - [![Build Status](https://secure.travis-ci.org/mapbox/tilelive-mapnik.png)](https://travis-ci.org/mapbox/tilelive-mapnik)
- millstone - TBD
- node-mbtiles - [![Build Status](https://secure.travis-ci.org/mapbox/node-mbtiles.png)](http://travis-ci.org/mapbox/node-mbtiles)
- node-sqlite3 - [![Build Status](https://secure.travis-ci.org/mapbox/node-sqlite3.png)](http://travis-ci.org/mapbox/node-sqlite3)


# Running tests

Install mocha and run the tests

    npm install mocha
    npm test


Note: the tests require a running postgres server and a postgis enabled
database called `template_postgis`.

If you do not have a `template_postgis` create one like:

    createdb -E UTF8 template_postgis
    psql -c "CREATE EXTENSION postgis" template_postgis

If you experience failing tests here are two tips:

1. Debug the project data by running TileMill with

    ./index.js --files=./test/fixtures/files/

2. Try clearing the cache of test data:

    rm -rf ./test/fixtures/files/

For more info see: http://postgis.net/docs/manual-1.5/ch02.html


# Documentation

TileMill documentation is kept in the mb-pages branch, which is independently managed and not merged with master.

TileMill's in-app reference available as the "Manual" (see below for syncing details) is a very small subset of docs for offline usage and is manually sync'ed from the mb-pages branch.

To view all the TileMill documentation locally, first checkout the mb-pages branch:

    git checkout mb-pages

Then install Jekyll:

    sudo gem install jekyll

And run Jekyll:

    jekyll

Once Jekyll has started you should be able to view the docs in a browser at:

    http://localhost:4000/tilemill/


# Syncing manual

To sync the manual with mb-pages updates do:

    export TILEMILL_SOURCES=`pwd`
    cd ../
    git clone --depth=1 -b mb-pages https://github.com/mapbox/tilemill tilemill-mb-pages
    cd ${TILEMILL_SOURCES}
    export TILEMILL_GHPAGES=../tilemill-mb-pages
    rm -rf ${TILEMILL_SOURCES}/assets/manual
    mkdir -p ${TILEMILL_SOURCES}/assets/manual
    cp -r ${TILEMILL_GHPAGES}/assets/manual/* ${TILEMILL_SOURCES}/assets/manual/
    git add ${TILEMILL_SOURCES}/assets/manual/*
    rm -rf ${TILEMILL_SOURCES}/_posts/docs/reference
    mkdir -p ${TILEMILL_SOURCES}/_posts/docs/reference
    cp -r ${TILEMILL_GHPAGES}/_posts/docs/reference/* ${TILEMILL_SOURCES}/_posts/docs/reference/
    git add ${TILEMILL_SOURCES}/_posts/docs/reference/*
