TileMill
--------
TileMill is a modern map design studio powered by open source technology.


Features
--------
- Access datasources on the local filesystem or through Amazon S3
- Manage map layers with file-based datasources (shapefiles, rasters)
- Edit `carto` stylesheets directly in the browser
- Edit `carto` stylesheets with a custom editor like `vim` in *Minimal mode*
- Preview map tiles instantly while editing stylesheets
- Inspect datasource field values and data types
- Export maps to PNG, PDF and [MBTiles](http://www.mbtiles.org) formats


Requirements
------------
- *TileMill client*
  - Tested: Chrome 6+, Firefox 3+, IE8+
  - May work: Opera 11
- *TileMill server*
  - Tested: Mac OS X 10.6, Ubuntu 10.10, Centos 5.5 
  - At least 2GB memory
  - May work: Older versions, other POSIX-compliant systems


Support
-------

[Report bugs on GitHub][1] or get support at [support.mapbox.com][2]. Join us
in the #mapbox IRC channel on irc.freenode.net.

[1]:https://github.com/mapbox/tilemill/issues
[2]:http://support.mapbox.com/kb/tilemill/where-can-i-get-help-with-tilemill


Installation: Mac OS X 10.6
---------------------------
Install [Xcode][xcode] for Mac OS X. Version 3 or 4 will work.

- [Download Xcode 3](https://connect.apple.com/cgi-bin/WebObjects/MemberSite.woa/wa/getSoftware?bundleID=20792)
- [Download Xcode 4](http://developer.apple.com/xcode/) (Apple charges a fee for this download)

[xcode]:http://developer.apple.com/technologies/tools/xcode.html

Install the latest `Mapnik 2.0` build:

- [Download mapnik 2.0](http://dbsgeo.com/downloads/mapnik/snow/intel/2.0.0-r2898.dmg)

[Download TileMill](https://github.com/mapbox/tilemill/downloads) and unpack the archive.

Open Terminal and change to unpacked directory:

    cd mapbox-tilemill

Build & install:

    ./ndistro

Start TileMill:

    ./tilemill.js

TileMill should now be accessible from a browser at [http://localhost:8889](http://localhost:8889).


Installation: Ubuntu 10.10
--------------------------
Install build requirements:

    # Mapnik dependencies
    sudo apt-get install -y g++ cpp \
    libboost-filesystem1.42-dev \
    libboost-program-options1.42-dev \
    libboost-python1.42-dev libboost-regex1.42-dev \
    libboost-system1.42-dev libboost-thread1.42-dev \
    python-dev libxml2 libxml2-dev \
    libfreetype6 libfreetype6-dev \
    libjpeg62 libjpeg62-dev \
    libltdl7 libltdl-dev \
    libproj-dev libproj0 \
    libpng12-0 libpng12-dev \
    libtiff4 libtiff4-dev libtiffxx0c2 \
    libcairo2 libcairo2-dev python-cairo python-cairo-dev \
    libcairomm-1.0-1 libcairomm-1.0-dev \
    ttf-unifont ttf-dejavu ttf-dejavu-core ttf-dejavu-extra \
    subversion build-essential python-nose

    # Mapnik plugin dependencies
    sudo apt-get install libgdal1-dev python-gdal \
    postgresql-8.4 postgresql-server-dev-8.4 postgresql-contrib-8.4 postgresql-8.4-postgis \
    libsqlite3-0 libsqlite3-dev

    # TileMill dependencies
    sudo apt-get install curl unzip

Install `mapnik` from source:

    svn checkout -r 2898 http://svn.mapnik.org/trunk mapnik2
    cd mapnik2
    python scons/scons.py configure
    python scons/scons.py
    sudo python scons/scons.py install

[Download TileMill](https://github.com/mapbox/tilemill/downloads) and unpack the archive.

Open Terminal and change to unpacked directory:

    cd mapbox-tilemill

Build & install:

    ./ndistro

Start TileMill:

    ./tilemill.js

TileMill should now be accessible from a browser at [http://localhost:8889](http://localhost:8889).


Upgrading
---------
Refer to CHANGELOG.md for information about the new version. This file will
indicate if a Mapnik upgrade is required. To upgrade TileMill, use the
installation instructions to install the new version TileMill in a separate
directory. Once the new installation is complete, manually copy the `files/`
directory and the `settings.js` file from the old installation to the new
installation. This will migrate your projects, settings, and data.


Configuration
-------------
Optional. Edit `settings.js` to change server settings including port, files
directories, and enabled asset providers.


Development
-----------
TileMill development is moving fast and we intend to create tags as soon as we
get to usable stopping points. If you are interested in keeping up with or
helping with development here are some steps to get setup:

Replace your TileMill directory with a git clone:

    mv tilemill tilemill.old
    git clone git@github.com:mapbox/tilemill.git

Bring your `files` directory with you - it contains all projects, exports and
settings:

    cp -r tilemill.old/files tilemill

Install TileMill as usual:

    cd tilemill
    ./ndistro

To update your dev version, clean your copy and rebuild:

    git pull
    ./ndistro clean
    ./ndistro


Contributors
------------
- [Dmitri Gaskin](http://github.com/dmitrig01)
- [Young Hahn](http://github.com/yhahn)
- [Tom MacWright](http://github.com/tmcw)
- [Will White](http://github.com/willwhite)
- [Tristen Brown](http://github.com/tristen)
- [AJ Ashton](http://github.com/ajashton)
- [Konstantin Käfer](http://github.com/kkaefer)
- [Dane Springmeyer](http://github.com/springmeyer)
