TileMill
--------
TileMill is a map style editor. It currently provides

- management of layers with file-based datasources (shapefiles, rasters, etc.)
  and stylesheets in a mess.js MML file
- an interface for editing mess.js MSS files,
- inspection of metadata in datasources including field data types and values,
- export of maps to PNG, PDF and MBTiles formats.

Requirements
------------
- **TileMill client**: A modern, standards compliant web browser.
  - Tested: Chrome 6+
  - Tested: Firefox 3+
  - Tested: IE8+
  - May work: Opera 11
- **TileMill server**
  - ndistro >= 0.4.0 or latest version
  - node 2.5
  - Mapnik 2 [at least revision 2488](http://svn.mapnik.org/trunk)
  - node-mapnik [latest master](https://github.com/mapnik/node-mapnik)

Setup
-----

## Prerequisites

- make
- Python 2.4 or better
- libzip (deb packages: libzip-dev libzip1)
- libsqlite3 (deb packages: libsqlite3-dev libsqlite3-0)

## Building

- Build and install Mapnik 2 (latest trunk)
- Install [ndistro](https://github.com/visionmedia/ndistro)

        cd /usr/local/bin && curl https://github.com/visionmedia/ndistro/raw/master/install | sh

- Build TileMill dependencies by running ndistro from the TileMill directory

        cd TileMill
        ndistro

## Configuration

- Optional. Edit `settings.js` to change server settings including port, files
  directories, and enabled asset providers.

## Running

    ./tilemill.js

TileMill should now be running on http://localhost:8889/

Authors
-------
- Dmitri Gaskin (dmitrig01)
- Young Hahn (yhahn)
- Tom MacWright (tmcw)
- Tristen Brown (tristen)
- Will White (willwhite)
- AJ Ashton (ajashton)
- Konstantin Käfer (kkaefer)
- Dane Springmeyer (springmeyer)

