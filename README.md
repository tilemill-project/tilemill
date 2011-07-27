TileMill
--------
TileMill is a modern map design studio powered by open source technology.


Features
--------
- Access datasources on the local filesystem or online
- Manage map layers with file-based datasources (shapefiles, rasters)
- Load data stored in PostGIS databases
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

[Report bugs on GitHub][issues] or get support at [support.mapbox.com][support]. Join us
in the #mapbox IRC channel on irc.freenode.net.


Prerequisites for Mac OS X 10.6 & 10.7
--------------------------------------
Install [Xcode][xcode] for Mac OS X. Version 3 or 4 will work.

- [Download Xcode 3](https://connect.apple.com/cgi-bin/WebObjects/MemberSite.woa/wa/getSoftware?bundleID=20792)
- [Download Xcode 4](http://itunes.apple.com/us/app/xcode/id448457090?mt=12)


[Download Mapnik 2.0.0 r3030](http://dbsgeo.com/downloads/mapnik/snow/intel/2.0.0-r3030.dmg) and install

Install [node][node] 0.4.9 or greater.


Prerequisites for Ubuntu 10.10
------------------------------
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
    sudo apt-get install curl

Install `mapnik` from source:

    svn checkout -r 3030 http://svn.mapnik.org/trunk mapnik2
    cd mapnik2
    python scons/scons.py configure
    python scons/scons.py
    sudo python scons/scons.py install

Install [node][node] 0.4.9 or greater.

    git clone --depth 1 git://github.com/joyent/node.git
    cd node
    git checkout v0.4.9
    export JOBS=2 # optional, sets number of parallel commands.
    mkdir ~/local
    ./configure --prefix=$HOME/local/node
    make
    make install
    echo 'export PATH=$HOME/local/node/bin:$PATH' >> ~/.profile
    source ~/.profile


Install TileMill
----------------
Install [npm][npm]:

    curl http://npmjs.org/install.sh | sh

Install TileMill:

    npm install -g tilemill

Start TileMill:

    tilemill

TileMill should now be accessible from a browser at `http://localhost:8889`.


Upgrading (0.3.x to 0.4.x)
--------------------------
TileMill will now keep its files by default in your user's home directory
at `~/Documents/TileMill`. After running `tilemill` for the first time this
directory will be created. Move your old projects to
`~/Documents/TileMill/project`.


Configuration
-------------
Run `tilemill --help` to learn about available configuration options.


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

Install TileMill with npm:

    cd tilemill
    npm install

Start TileMill:

    ./index.js

To update your dev version, clean your copy and rebuild:

    cd tilemill
    git pull
    rm -rf node_modules
    npm install


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


[xcode]:http://developer.apple.com/technologies/tools/xcode.html
[issues]:https://github.com/mapbox/tilemill/issues
[support]:http://support.mapbox.com/kb/tilemill/where-can-i-get-help-with-tilemill
[node]:https://github.com/joyent/node/wiki/Installation
[npm]:http://npmjs.org/
