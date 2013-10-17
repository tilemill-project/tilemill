# Packaging TileMill.app standalone

These are steps to setup tilemill to be portable within an .app bundle.

This is only necessary for developers that wish to build a fully
distributable tilemill.app without requiring any other installation steps.


## Build node

We build node with two cpu architectures, aka universal/fat to support older macs:

    wget http://nodejs.org/dist/node-v0.4.12.tar.gz
    tar xvf node-v0.4.12.tar.gz
    cd node-v0.4.12
    # ia32 == i386
    ./configure --without-snapshot --jobs=`sysctl -n hw.ncpu` --blddir=node-32 --dest-cpu=ia32
    make install # will install headers
    # x64 == x86_64
    ./configure --without-snapshot --jobs=`sysctl -n hw.ncpu` --blddir=node-64 --dest-cpu=x64
    make
    lipo -create node-32/default/node node-64/default/node -output node
    
    # then copy that node overwriting the previously installed uni-arch node
    # so it is default on your PATH
    cp node /usr/local/bin/node
    chmod +x /usr/local/bin/node
    
    # confirm it comes first
    which node | grep /usr/local/bin
    
    # should report two archs
    file `which node`


## Install latest npm

    curl http://npmjs.org/install.sh | sudo sh


## Build testing tools globally

This will keep these out of tilemill's local node_modules, avoid having to strip them
from the final package, and most importantly avoid any compile failures due to
custom flags we set later on.

    npm install -g jshint@0.2.x


## Build tilemill

Clear out any previous builds:

    cd tilemill
    rm -rf node_modules

Also ensure that you have no globally installed node modules (other than `jshint`).
You may need to check various node_modules depending on your $NODE_PATH.

Possible locations include:

    /usr/local/lib/node_modules/
    /usr/local/lib/node/

And the paths visible at:

    node -e "require.paths"

TODO: we should be able to avoid having to clear out node_modules by telling/tricking
npm to avoid finding them (just needs testing).


## Set up Mapnik SDK

For portbility with the tilemill.app bundle Mapnik needs to be compiled such that
all dependencies are either statically linked or are linked using @rpath/@loader_path
(and then all those dylib deps are included).

How to do this is beyond the scope of this document, but we use the scripts at <https://github.com/mapnik/mapnik-packaging/tree/master/osx> to pull this off.


## Change into tilemill dir

Now, in the same shell that you set the above environment settings
navigate to your tilemill development directory.

   cd ~/tilemill # or wherever you git cloned tilemill


## Fixup node-mapnik


Move to the node-mapnik directory:

    cd node_modules/mapnik/


Then fixup node-mapnik install so that the plugins work:

    export MAPNIK_INPUT_PLUGINS="path.join(__dirname, 'input')"
    export MAPNIK_FONTS="path.join(__dirname, 'fonts')"
    ./configure
    node-waf -v build
    cp $MAPNIK_ROOT/usr/local/lib/libmapnik.dylib lib/libmapnik.dylib
    install_name_tool -id libmapnik.dylib lib/libmapnik.dylib
    install_name_tool -change /usr/local/lib/libmapnik.dylib @loader_path/libmapnik.dylib lib/_mapnik.node

    mkdir -p lib/fonts
    rm lib/fonts/*
    cp -R $MAPNIK_ROOT/usr/local/lib/mapnik/fonts lib/
    
    mkdir -p lib/input
    rm lib/input/*.input
    cp $MAPNIK_ROOT/usr/local/lib/mapnik/input/*.input lib/input/
    for i in $(ls lib/input/*input);
    do install_name_tool -change /usr/local/lib/libmapnik.dylib @loader_path/../libmapnik.dylib $i;
    done;


Run the node-mapnik tests:

    make test

Note: you should see one failure like: `Error: failed to initialize projection with: '+init=epsg:4326'`

Check a few things:

    otool -L lib/_mapnik.node
    file lib/_mapnik.node

    # check plugins: should return nothing
    otool -L lib/input/*input | grep /usr/local


Now go back to the main tilemill directory:

    cd ../../


Remove cruft:

    rm node_modules/bones/node_modules/jquery/node_modules/htmlparser/libxmljs.node
    rm node_modules/mapnik/build/default/_mapnik.node


Test that the app works:

    ./index.js


Now go build and package the tilemill app:

    cd platforms/osx
    make clean
    make run # test and check version
    make zip # package

Then rename the TileMill.zip to TileMill-$VER.zip. For example:

   mv TileMill.zip TileMill-0.6.0.zip

Upload to https://github.com/mapbox/tilemill/downloads
