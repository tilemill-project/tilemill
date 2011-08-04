# Packaging TileMill.app standalone

The are the steps to setup tilemill to be portable within an .app bundle.

This is only necessary for developers that wish to build a fully
distributable tilemill.app without requiring any other installation steps.


## Caveats

1) Until a new SDK is posted if you are not using clang++ to compile things (likely just using g++)
then you will need to remove the text of "-Wno-unused-function -Wno-uninitialized -Wno-array-bounds -Wno-parentheses -Wno-char-subscripts" from $MAPNIK_ROOT/usr/local/bin/mapnik-config below

2) Where npm installs zlib, sqlite3, and node-mapnik depends on where these
modules are defined in each depdencies package.json. The instructions below
may differ slightly in terms of where in node-modules you need to look to find
each module depending on how you installed them.


## Build tilemill

Build tilemill normally:

    npm install .


The above ensures the latest release are in the first level of node_modules/. But
be sure to check that tilemill's package.json uses the latest tags.


This will drop all tilemill depedencies in node_modules/. Now the task is to check on a few
and rebuild a few.


## Check zlib

We need to make sure node-zlib is linked against the system zlib

    otool -L node_modules/zlib/lib/zlib_bindings.node


## Set up Mapnik SDK

Mapnik needs to be compiled such that all dependencies are either statically linked
or are linked using @rpath/@loader_path (and then all those dylib deps are included).

An experimental SDK includes these dependencies and can be tested.

To set up the SDK do:

    mkdir tmp-build
    cd tmp-build
    wget http://tilemill-osx.s3.amazonaws.com/mapnik-static-sdk.zip
    unzip -d mapnik-static-sdk mapnik-static-sdk.zip
    export MAPNIK_ROOT=`pwd`/mapnik-static-sdk/sources
    export PATH=$MAPNIK_ROOT/usr/local/bin:$PATH


## Rebuild node-sqlite

    cd node_modules/sqlite3


Configure:

    make clean
    export CXXFLAGS="-I$MAPNIK_ROOT/include"
    export LINKFLAGS="-L$MAPNIK_ROOT/lib -Wl,-search_paths_first"
    ./configure


Then rebuild:

    make

    # check that static compile worked (should not see libsqlite3 in output):
    otool -L lib/sqlite3_bindings.node


## Rebuild node-mapnik


Configure:

    cd ../mapnik/
    make clean
    export JOBS=`sysctl -n hw.ncpu`
    export MAPNIK_INPUT_PLUGINS="path.join(__dirname, 'input')"
    export MAPNIK_FONTS="path.join(__dirname, 'fonts')"
    export CXXFLAGS="-I$MAPNIK_ROOT/include -I$MAPNIK_ROOT/usr/local/include"
    export LINKFLAGS="-L$MAPNIK_ROOT/lib -lboost_system -lboost_thread -lboost_regex -lboost_filesystem -lfreetype -lproj -lpng12 -ljpeg -lltdl -lz -lxml2 -licucore -Wl,-search_paths_first -L$MAPNIK_ROOT/usr/local/lib"


Then build:

    ./configure
    make

    # confirm static linking
    otool -L lib/_mapnik.node


Now set up plugins:

    mkdir lib/input
    cp $MAPNIK_ROOT/usr/local/lib/mapnik2/input/*.input lib/input/

    # check plugins
    otool -L lib/input/*input | grep /usr/local


And set up fonts:

    mkdir lib/fonts
    cp -R $MAPNIK_ROOT/usr/local/lib/mapnik2/fonts lib/


Now go back to the main tilemill directory:

    cd ../../


And check builds overall

    # for reference see all the C++ module depedencies
    for i in $(find . -name '*.node'); do otool -L $i; done;

    # should return nothing
    for i in $(find . -name '*.node'); do otool -L $i | grep local; done;

    # dump out file to inspect if problems
    for i in $(find . -name '*.node'); do otool -L $i >>t.txt; done;


Clean up crap:

    rm ./node_modules/bones/node_modules/jquery/node_modules/htmlparser/libxmljs.node


Test that the app still works

    ./index.js


Now go build and package the tilemill app:

    make clean
    make run # test
    make tar # package
