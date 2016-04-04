TileMill is a modern map design studio powered by [Node.js](http://nodejs.org) and [Mapnik](http://mapnik.org).

Installation instructions, development docs and other information are available on the [TileMill website](https://mapbox.com/tilemill).

**[Mapbox Studio](https://www.mapbox.com/mapbox-studio/) is the modern alternative to TileMill**: if you're starting out and creating a map today, we recommend starting with [Mapbox Studio](https://www.mapbox.com/mapbox-studio/) rather than TileMill.

# Build Status

[![Build Status](https://secure.travis-ci.org/mapbox/tilemill.png)](https://travis-ci.org/mapbox/tilemill)
[![Build status](https://ci.appveyor.com/api/projects/status/hw3rqpyd7bj0cb03?svg=true)](https://ci.appveyor.com/project/Mapbox/tilemill)
[![Dependencies](https://david-dm.org/mapbox/tilemill.png)](https://david-dm.org/mapbox/tilemill)

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

- Mapnik v2.3.0
- Node.js v0.10.x or v0.8.x
- Protobuf: libprotobuf-lite and protoc

However, node-mapnik (which depends on Mapnik and protobuf) is now packaged as a binary. So, you do not need an external Mapnik. See [Installation](#installation)

# Installation

To install from source just do:

    git clone https://github.com/mapbox/tilemill.git
    cd tilemill
    npm install

Then to start TileMill do:

    ./index.js # and then view http://localhost:20009 in your web browser

For more extended details follow:

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
