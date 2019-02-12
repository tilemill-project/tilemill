# Latest Status - Jan 22, 2019

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

[Installation instructions can be found in the TileMill Documentation](https://tilemill-project.github.io/tilemill/docs/install/).


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
database called `template_postgis`. To install these, see the [Using Open Street Map (OSM) Data in TileMill section of the installation guide](https://tilemill-project.github.io/tilemill/docs/install/#useosm).
For more info see: http://postgis.net/docs/manual-1.5/ch02.html

If you experience failing tests here are two tips:

1. Debug the project data by running TileMill with

    ./index.js --files=./test/fixtures/files/

2. Try clearing the cache of test data:

    rm -rf ./test/fixtures/files/


# Documentation

TileMill documentation is kept in the gh-pages branch, which is independently managed and not merged with master.

TileMill's in-app reference available as the "Manual" (see below for syncing details) is a very small subset of docs for offline usage and is manually sync'ed from the gh-pages branch.

To view all the TileMill documentation locally, first checkout the gh-pages branch:

    git clone -b gh-pages https://github.com/tilemill-project/tilemill.git tilemill-gh-pages

Check your Ruby version. If the version is not V2.X.X or higher, then you need to upgrade your Ruby installation:

    ruby --version

Install Jekyll and bundler:

    sudo gem install jekyll bundler
    cd tilemill-gh-pages

Create/update Gemfile. If you have a Gemfile, add the following lines to it. If you don't, then create a file named "Gemfile" and add the following lines to it.:
    source 'https://rubygems.org'
    gem 'github-pages', group: :jekyll_plugins

Install the site:

    bundle install

And run Jekyll:

    bundle exec jekyll serve

Once Jekyll has started you should be able to view the docs in a browser at:

    [http://127.0.0.1:4000/tilemill/](http://127.0.0.1:4000/tilemill/)

If you have problems, you can check out this reference [Setting Up GitHub Pages with Jekyll](https://help.github.com/articles/setting-up-your-github-pages-site-locally-with-jekyll). You just don't need to do the git steps where they are creating a new git branch or documentation files since those already exist.

# Syncing manual from gh_pages into the TileMill application

This assumes that you already have tilemill checked out in your HOME directory. If you don't have the gh-pages branch checked out, start by checking it out:

    cd ${HOME}
    git clone -b gh-pages https://github.com/mapbox/tilemill tilemill-gh-pages

To sync the manual in the app with gh-pages updates do:

    export TILEMILL_SOURCES="${HOME}/tilemill"
    export TILEMILL_GHPAGES="${HOME}/tilemill-gh-pages"
    cd ${TILEMILL_SOURCES}
    rm -rf ${TILEMILL_SOURCES}/assets/manual
    mkdir -p ${TILEMILL_SOURCES}/assets/manual
    cp -r ${TILEMILL_GHPAGES}/assets/manual/* ${TILEMILL_SOURCES}/assets/manual/
    git add ${TILEMILL_SOURCES}/assets/manual/*
    rm -rf ${TILEMILL_SOURCES}/_posts/docs/reference
    mkdir -p ${TILEMILL_SOURCES}/_posts/docs/reference
    cp -r ${TILEMILL_GHPAGES}/_posts/docs/reference/* ${TILEMILL_SOURCES}/_posts/docs/reference/
    git add ${TILEMILL_SOURCES}/_posts/docs/reference/*
