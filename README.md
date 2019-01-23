# General Info

Tilemill has now been updated on the great work of Tileoven.  The current goal is to bring back apps for each platform, using Electron.
Changes from Tileoven were pulled on Jan 20, 2019.

If you're looking for the pre-Tileoven versions:

## Binaries
The previous binaries for OSX and Windows based upon the v0.10.1 version can be found on AWS:
https://tilemill-project.github.io/tilemill/

There are also dev versions found here:
http://tilemill.s3.amazonaws.com/index.html?path=dev/

## Source code
The previous code can be found under the tag v0.11-deprecated.

<<<<<<< HEAD
Tilemill is a maintained fork of TileMill, tested on Linux with Node 8.11.3 LTS
Tilemill works only in server mode, no native packages are provided.
Platforms other than Linux should theoretically work, but aren't tested.

Changes from upstream are cherry-picked, last time on Apr 22, 2016.


# Changelog since forking

## Features

- Forked millstone, tilelive, node-srs dependencies, Node 8 now supported
- Support for Node 8, thanks to patches and updated dependencies of paulovieira
- Added layer selection to map panel for fast comparisons with OSM and to save render time for low zoom levels
- Added search field to layer panel
- Added search field to styles panel
- Added cloning of layers to layer panel
- Layer actions only shown on hover, ideal for long layer names and reduces visual noise
- Increased size of layer panel
- Updated carto and node-mapnik dependencies, new CartoCSS commands available
- Remember last selected folder in new layer dialog
- Better compatibility with kosmtik, Tilemill mml project files should work out of the box with kosmtik (https://github.com/kosmtik)

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

# Readme

Tilemill is a modern map design studio powered by [Node.js](http://nodejs.org) and [Mapnik](http://mapnik.org).

# Build Status

TBD

### Key modules

- mapnik - [![Build Status](https://secure.travis-ci.org/mapnik/mapnik.png?branch=2.3.x)](https://travis-ci.org/mapnik/mapnik)
- node-mapnik - [![Build Status](https://secure.travis-ci.org/mapnik/node-mapnik.png)](https://travis-ci.org/mapnik/node-mapnik)
- carto - [![Build Status](https://secure.travis-ci.org/mapbox/carto.png)](http://travis-ci.org/mapbox/carto)
- tilelive - [![Build Status](https://secure.travis-ci.org/mapbox/tilelive.png)](https://travis-ci.org/mapbox/tilelive)
- tilelive-mapnik - [![Build Status](https://secure.travis-ci.org/mapbox/tilelive-mapnik.png)](https://travis-ci.org/mapbox/tilelive-mapnik)
- millstone - [![Build Status](https://secure.travis-ci.org/mapbox/millstone.png)](http://travis-ci.org/mapbox/millstone)
- node-mbtiles - [![Build Status](https://secure.travis-ci.org/mapbox/node-mbtiles.png)](http://travis-ci.org/mapbox/node-mbtiles)
- node-sqlite3 - [![Build Status](https://secure.travis-ci.org/mapbox/node-sqlite3.png)](http://travis-ci.org/mapbox/node-sqlite3)

# Depends

- Mapnik v3.6.2
- Node.js v8.x, v6.x, v4.x, v0.10.x or v0.8.x
- Protobuf: libprotobuf-lite and protoc

# Installation

Note: on Ubuntu make sure that you have the nodejs-legacy package installed!
=======
# Tileoven Previous README
TileOven is a maintained fork of TileMill, tested on Linux with Node 8.11.3 LTS
TileOven works only in server mode, no native packages are provided.
Platforms other than Linux should theoretically work, but aren't tested.

Changes from upstream are cherry-picked, last time on Apr 22, 2016.
>>>>>>> upstream/master


<<<<<<< HEAD
    git clone https://github.com/tilemill-project/tilemill.git
    cd tilemill
    nvm install lts/carbon
    nvm use lts/carbon
    npm install
=======
# Changelog since forking
>>>>>>> upstream/master

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
- Better compatibility with kosmtik, TileOven mml project files should work out of the box with kosmtik (https://github.com/kosmtik)

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

# Readme

TileOven is a modern map design studio powered by [Node.js](http://nodejs.org) and [Mapnik](http://mapnik.org).

Installation instructions, development docs and other information are available in the [Wiki](https://github.com/florianf/tileoven/wiki/Installation-Guide).

# Build Status

[![Build status](https://travis-ci.org/florianf/tileoven.svg)](https://travis-ci.org/florianf/tileoven)
[![Dependencies](https://david-dm.org/florianf/tileoven.svg)](https://david-dm.org/florianf/tileoven)

### Key modules

- mapnik - [![Build Status](https://secure.travis-ci.org/mapnik/mapnik.png?branch=2.3.x)](https://travis-ci.org/mapnik/mapnik)
- node-mapnik - [![Build Status](https://secure.travis-ci.org/mapnik/node-mapnik.png)](https://travis-ci.org/mapnik/node-mapnik)
- carto - [![Build Status](https://secure.travis-ci.org/mapbox/carto.png)](http://travis-ci.org/mapbox/carto)
- tilelive - [![Build Status](https://secure.travis-ci.org/mapbox/tilelive.png)](https://travis-ci.org/mapbox/tilelive)
- tilelive-mapnik - [![Build Status](https://secure.travis-ci.org/mapbox/tilelive-mapnik.png)](https://travis-ci.org/mapbox/tilelive-mapnik)
- millstone - [![Build Status](https://secure.travis-ci.org/mapbox/millstone.png)](http://travis-ci.org/mapbox/millstone)
- node-mbtiles - [![Build Status](https://secure.travis-ci.org/mapbox/node-mbtiles.png)](http://travis-ci.org/mapbox/node-mbtiles)
- node-sqlite3 - [![Build Status](https://secure.travis-ci.org/mapbox/node-sqlite3.png)](http://travis-ci.org/mapbox/node-sqlite3)

<<<<<<< HEAD
    npm start # and then view http://localhost:20009 in your web browser

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

TileMill's in-app reference available as the "Manual" (see below for syncing details) is a very small subset of docs for offline usage and is manually
sync'ed from the mb-pages branch.

To view all the TileMill documentation locally, first checkout the mb-pages branch:

    git checkout mb-pages

Then install Jekyll:

    sudo gem install jekyll

And run Jekyll:

    jekyll

Once Jekyll has started you should be able to view the docs in a browser at:

    http://localhost:4000/tilemill/

# Syncing manual
=======
# Depends

- Mapnik v2.3.0
- Node.js v6.x, v4.x, v0.10.x or v0.8.x
- Protobuf: libprotobuf-lite and protoc

However, node-mapnik (which depends on Mapnik and protobuf) is now packaged as a binary. So, you do not need an external Mapnik. See [Installation](#installation)

# Installation

Note: on Ubuntu make sure that you have the nodejs-legacy package installed!

To install from source just do:

    git clone https://github.com/florianf/tileoven.git
    cd tileoven
    npm install

Then to start TileMill do:

    ./index.js # and then view http://localhost:20009 in your web browser
>>>>>>> upstream/master

To sync the manual with mb-pages updates do:

<<<<<<< HEAD
=======
- [Install packages](http://mapbox.com/tilemill/docs/install/)
- [Build from source](http://mapbox.com/tilemill/docs/source/)

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

TileMill's in-app reference available as the "Manual" (see below for syncing details) is a very small subset of docs for offline usage and is manually
sync'ed from the mb-pages branch.

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

>>>>>>> upstream/master
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
