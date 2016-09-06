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
