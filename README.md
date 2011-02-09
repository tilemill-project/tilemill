TileMill
--------
TileMill is a full-featured map design studio powered by open source
technology.


Features
--------
- Access datasources on the local filesystem or through Amazon S3
- Manage map layers with file-based datasources (shapefiles, rasters)
- Edit `carto` stylesheets directly in the browser
- Edit `carto` stylesheets with a custom editor like `vim` in *Minimal mode*
- Preview map tiles instantly while editing stylesheets
- Inspect datasource field values and data types
- Export maps to PNG, PDF and MBTiles formats


Requirements
------------
- *TileMill client*
  - Tested: Chrome 6+, Firefox 3+, IE8+
  - May work: Opera 11
- *TileMill server*
  - Tested: Mac OS X 10.6, Ubuntu 10.10
  - At least 2GB memory
  - May work: Older versions, other POSIX-compliant systems

Installation: Mac OS X 10.6
---------------------------
Install Xcode for Mac OS X:

- [Xcode](http://developer.apple.com/technologies/tools/xcode.html)

Install `Mapnik 2.0` from [OS X package](http://dbsgeo.com/downloads/#mapnik-2.0.0):

- [mapnik 2.0 ](http://dbsgeo.com/downloads/mapnik/snow/intel/2.0.0.dmg)

Install `ndistro`:

    cd /usr/local/bin
    curl https://github.com/visionmedia/ndistro/raw/master/install | sudo sh

Install TileMill:

    git clone git@github.com:developmentseed/TileMill.git
    cd TileMill
    ndistro

Start TileMill:

    ./tilemill.js

TileMill should now be accessible from a browser at `http://localhost:8889`.


Installation: Ubuntu 10.10
--------------------------
Install build requirements:

    # Mapnik dependencies
    sudo apt-get install -y g++ cpp \
    libboost-filesystem1.42-dev \
    libboost-iostreams1.42-dev libboost-program-options1.42-dev \
    libboost-python1.42-dev libboost-regex1.42-dev \
    libboost-system1.42-dev libboost-thread1.42-dev \
    python-dev libxml2 libxml2-dev \
    libfreetype6 libfreetype6-dev \
    libjpeg62 libjpeg62-dev \
    libltdl7 libltdl-dev \
    libpng12-0 libpng12-dev \
    libgeotiff-dev libtiff4 libtiff4-dev libtiffxx0c2 \
    libcairo2 libcairo2-dev python-cairo python-cairo-dev \
    libcairomm-1.0-1 libcairomm-1.0-dev \
    ttf-unifont ttf-dejavu ttf-dejavu-core ttf-dejavu-extra \
    subversion build-essential python-nose

    # Mapnik plugin dependencies
    sudo apt-get install libgdal1-dev python-gdal \
    postgresql-8.4 postgresql-server-dev-8.4 postgresql-contrib-8.4 postgresql-8.4-postgis \
    libsqlite3-0 libsqlite3-dev

    # TileMill dependencies
    sudo apt-get install libzip1 libzip-dev

Install `mapnik` from source:

    svn checkout http://svn.mapnik.org/trunk mapnik
    cd mapnik
    python scons/scons.py configure
    python scons/scons.py
    sudo python scons/scons.py install
    sudo ldconfig

Install `ndistro`:

    cd /usr/local/bin
    curl https://github.com/visionmedia/ndistro/raw/master/install | sudo sh

Install TileMill:

    git clone git@github.com:developmentseed/TileMill.git
    cd TileMill
    ndistro

Start TileMill:

    ./tilemill.js

TileMill should now be accessible from a browser at `http://localhost:8889`.


Configuration
-------------
Optional. Edit `settings.js` to change server settings including port, files
directories, and enabled asset providers.


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
