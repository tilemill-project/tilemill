# Packaging TileMill.app standalone

The are the steps to setup tilemill to be portable within an .app bundle.

This is only necessary for developers that wish to build a fully
distributable tilemill.app without requiring any other installation steps.


## Caveats

1) Where npm installs zlib, sqlite3, and node-mapnik depends on where these
modules are defined in each depdencies package.json. The instructions below
may differ slightly in terms of where in node-modules you need to look to find
each module depending on how you installed them.


## Build node

We build node with two cpu architectures, aka universal/fat to support older macs:

    wget http://nodejs.org/dist/node-v0.4.10.tar.gz
    tar xvf node-v0.4.10.tar.gz
    cd node-v0.4.10
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
from the final package, and most importantly avoid any compile failures do to the
custom flags we set later on.

    npm install -g jshint expresso
    

## Build tilemill

Clear out any previous builds:

    rm -rf node_modules
    

Also ensure that you have no globally installed node modules (or at least they are not on NODE_PATH).

The, build tilemill with a few custom flags:

    export CORE_CXXFLAGS="-O3 -arch x86_64 -arch i386 -mmacosx-version-min=10.6 -isysroot /Developer/SDKs/MacOSX10.6.sdk"
    export CORE_LINKFLAGS="-arch x86_64 -arch i386 -Wl,-syslibroot,/Developer/SDKs/MacOSX10.6.sdk"
    export CXXFLAGS=$CORE_LINKFLAGS
    export LINKFLAGS=$CORE_LINKFLAGS
    export JOBS=`sysctl -n hw.ncpu`
    npm install . --verbose

As long as you don't have any globally installed modules, this should deposit all 
tilemill dependencies in node_modules/. Now the task is to check on a few and rebuild a few.


## Check node-zlib

We need to make sure node-zlib is linked against the system zlib. The output of
the command below should be similar to https://gist.github.com/1125399.

    otool -L node_modules/mbtiles/node_modules/zlib/lib/zlib_bindings.node

We also need to make sure that node-zlib and other C++ addons were compiled universal (both 32/64 bit).
The command output should look like https://gist.github.com/1132771.

    file node_modules/mbtiles/node_modules/zlib/lib/zlib_bindings.node


## Check, node-srs, node-zipfile, and node-eio

We need to do the same linking and architecture test for 3 more modules:

    # eio
    otool -L node_modules/tilelive-mapnik/node_modules/eio/build/default/eio.node
    file node_modules/tilelive-mapnik/node_modules/eio/build/default/eio.node
    
    # srs
    otool -L ./node_modules/millstone/node_modules/srs/lib/_srs.node
    file ./node_modules/millstone/node_modules/srs/lib/_srs.node
    
    # zipfile
    otool -L ./node_modules/millstone/node_modules/zipfile/lib/_zipfile.node
    file ./node_modules/millstone/node_modules/zipfile/lib/_zipfile.node


Search for others with:

    for i in $(find . -name '*.node'); do echo $i; done


## Uninstall any globally installed libmapnik2.dylib

   cd src/mapnik-trunk # or wherever your mapnik sources are
   sudo make uninstall


## Set up Mapnik SDK

@TODO - THIS STEP IS BROKEN AT THE MOMENT

Mapnik needs to be compiled such that all dependencies are either statically linked
or are linked using @rpath/@loader_path (and then all those dylib deps are included).

An experimental SDK includes these dependencies as static libs and can be tested.

To set up the SDK do:

    # optionally, create a tmp working directory
    mkdir tmp-build
    cd tmp-build

    # grab and unpack the sdk
    wget http://tilemill-osx.s3.amazonaws.com/mapnik-static-sdk.zip
    unzip -d mapnik-static-sdk mapnik-static-sdk.zip

    # set critical shell env settings
    export MAPNIK_ROOT=`pwd`/mapnik-static-sdk/mapnik-static-sdk/sources
    export PATH=$MAPNIK_ROOT/usr/local/bin:$PATH

Confirm the SDK is working by checking mapnik-config presence at that path:

    # this should produce a line of output pointing to valid mapnik-config
    which mapnik-config | grep $MAPNIK_ROOT

## Change into tilemill dir

Now, in the same shell that you set the above environment settings
navigate to your tilemill development directory.

   cd ~/tilemill # or wherever you git clone tilemill


## Rebuild node-sqlite

First we will rebuild node-sqlite3.

    cd node_modules/mbtiles/node_modules/sqlite3/


Configure:

    make clean
    export CXXFLAGS="-I$MAPNIK_ROOT/include $CORE_CXXFLAGS"
    export LINKFLAGS="-L$MAPNIK_ROOT/lib -Wl,-search_paths_first $CORE_LINKFLAGS"
    ./configure


Then rebuild:

    make

    # check that static compile worked (you should not see libsqlite3.dylib in output):
    otool -L lib/sqlite3_bindings.node
    
    # check for multi-arch
    file lib/sqlite3_bindings.node


## Rebuild node-mapnik


Configure:

    cd ../../../mapnik/
    make clean
    export MAPNIK_INPUT_PLUGINS="path.join(__dirname, 'input')"
    export MAPNIK_FONTS="path.join(__dirname, 'fonts')"

If mapnik does not have cairo support:

    export CXXFLAGS="-I$MAPNIK_ROOT/include -I$MAPNIK_ROOT/include/freetype2 -I$MAPNIK_ROOT/usr/local/include $CORE_CXXFLAGS"
    export LINKFLAGS="-L$MAPNIK_ROOT/lib -lboost_system -lboost_thread -lboost_regex -lboost_filesystem -lfreetype -lproj -lpng12 -ljpeg -lltdl -lz -lxml2 -licucore -Wl,-search_paths_first -L$MAPNIK_ROOT/usr/local/lib $CORE_LINKFLAGS"
    

If mapnik has cairo support (-lcairo in `mapnik-config --libs`) instead do:


    export CXXFLAGS="-I$MAPNIK_ROOT/include -I$MAPNIK_ROOT/include/freetype2  -I$MAPNIK_ROOT/include/fontconfig -I$MAPNIK_ROOT/include/sigc++-2.0 -I$MAPNIK_ROOT/lib/sigc++-2.0/include  -I$MAPNIK_ROOT/usr/local/include $CORE_CXXFLAGS"
    export LINKFLAGS="-L$MAPNIK_ROOT/lib -lboost_system -lboost_thread -lboost_regex -lboost_filesystem -lfreetype -lproj -lpng -ljpeg -lcairomm-1.0 -lcairo -lpixman-1 -lsigc-2.0 -lfontconfig -lexpat -liconv -lltdl -lz -lxml2 -licucore -lexpat -Wl,-search_paths_first -L$MAPNIK_ROOT/usr/local/lib $CORE_LINKFLAGS"
    export DYLD_LIBRARY_PATH=$MAPNIK_ROOT/usr/local/lib


Then build:

    ./configure
    node-waf -v build

    # confirm no linking to libmapnik2.dylib and only links to libs in /usr/lib
    # avoiding linking to libmapnik2 may require removing /usr/local/lib/libmapnik2.dylib 
    # and /usr/local/include/mapnik if they exist
    otool -L lib/_mapnik.node
    file lib/_mapnik.node


Now set up plugins:

    mkdir lib/input
    cp $MAPNIK_ROOT/usr/local/lib/mapnik2/input/*.input lib/input/

    # check plugins: should return nothing
    otool -L lib/input/*input | grep /usr/local


And set up fonts:

    mkdir lib/fonts
    cp -R $MAPNIK_ROOT/usr/local/lib/mapnik2/fonts lib/


Now go back to the main tilemill directory:

    cd ../../


And check builds overall

    # for reference see all the C++ module dependencies
    for i in $(find . -name '*.node'); do otool -L $i; done;

    # should return nothing
    for i in $(find . -name '*.node'); do otool -L $i | grep local; done;

    # dump out file to inspect if problems
    for i in $(find . -name '*.node'); do otool -L $i >>t.txt; done;


Test that the app still works

    ./index.js


Now go build and package the tilemill app:

    cd platforms/osx
    make clean
    make run # test
    make tar # package
