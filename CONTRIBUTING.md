# Build Status

### Key modules

[![Build Status](https://secure.travis-ci.org/mapbox/tilemill.png)](https://travis-ci.org/mapbox/tilemill)
[![Build status](https://ci.appveyor.com/api/projects/status/hw3rqpyd7bj0cb03?svg=true)](https://ci.appveyor.com/project/Mapbox/tilemill)
[![Dependencies](https://david-dm.org/mapbox/tilemill.png)](https://david-dm.org/mapbox/tilemill)
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

If you do not have a template_postgis create one like:

    createdb -E UTF8 template_postgis
    psql -c "CREATE EXTENSION postgis" template_postgis

For more detailed info, see the [Using Open Street Map (OSM) Data in TileMill section of the installation guide](https://tilemill-project.github.io/tilemill/docs/install/#useosm).
For more info see: http://postgis.net/docs/manual-1.5/ch02.html

1. Debug the project data by running TileMill with

    ./index.js --files=./test/fixtures/files/

2. Try clearing the cache of test data:

    rm -rf ./test/fixtures/files/


# Documentation

TileMill documentation is kept in the gh-pages branch, which is independently managed and not merged with master.

TileMill's in-app reference available as the "Manual" (see below for syncing details) is a very small subset of docs for offline usage and is manually sync'ed from the gh-pages branch.

To checkout the g-pages branch, do the following:

    cd ~
    git clone -b gh-pages https://github.com/tilemill-project/tilemill.git tilemill-gh-pages

You can find more info about how to keep the documentation up to date in the CONTRIBUTING.md file within the tilemill-gh-pages directory.
