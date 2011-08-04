# Packaging TileMill.app standalone

The are the steps to setup tilemill to be portable within an .app bundle.

This is only necessary for developers that wish to build a fully
distributable tilemill.app without requiring any other installation steps.


## Caveats

1) Where npm installs zlib, sqlite3, and node-mapnik depends on where these
modules are defined in each depdencies package.json. The instructions below
may differ slightly in terms of where in node-modules you need to look to find
each module depending on how you installed them.


## Build tilemill

Build tilemill normally:

    npm install .

This will drop all tilemill dependencies in node_modules/. Now the task is to check on a few
and rebuild a few.


## Check zlib

We need to make sure node-zlib is linked against the system zlib. The output of
the command below should be similar to https://gist.github.com/1125399.

    otool -L node_modules/mbtiles/node_modules/zlib/lib/zlib_bindings.node


## Set up Mapnik SDK

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

## Change into tilemill dir

Now, in the same shell that you set the above environment settings
navigate to your tilemill development directory.

   cd ~/tilemill # or wherever you git clone tilemill


## Rebuild node-sqlite

First we will rebuild node-sqlite3.

    cd node_modules/mbtiles/node_modules/sqlite3/


Configure:

    make clean
    export CXXFLAGS="-I$MAPNIK_ROOT/include"
    export LINKFLAGS="-L$MAPNIK_ROOT/lib -Wl,-search_paths_first"
    ./configure


Then rebuild:

    make

    # check that static compile worked (you should not see libsqlite3.dylib in output):
    otool -L lib/sqlite3_bindings.node


## Rebuild node-mapnik


Configure:

    cd ../../../mapnik/
    make clean
    export JOBS=`sysctl -n hw.ncpu`
    export MAPNIK_INPUT_PLUGINS="path.join(__dirname, 'input')"
    export MAPNIK_FONTS="path.join(__dirname, 'fonts')"

If mapnik does not have cairo support:

    export CXXFLAGS="-I$MAPNIK_ROOT/include -I$MAPNIK_ROOT/include/freetype2 -I$MAPNIK_ROOT/usr/local/include"
    export LINKFLAGS="-L$MAPNIK_ROOT/lib -lboost_system -lboost_thread -lboost_regex -lboost_filesystem -lfreetype -lproj -lpng12 -ljpeg -lltdl -lz -lxml2 -licucore -Wl,-search_paths_first -L$MAPNIK_ROOT/usr/local/lib"
    

If mapnik has cairo support (-lcairo in `mapnik-config --libs`) instead do:


    export CXXFLAGS="-I$MAPNIK_ROOT/include -I$MAPNIK_ROOT/include/freetype2  -I$MAPNIK_ROOT/include/fontconfig -I$MAPNIK_ROOT/include/sigc++-2.0 -I$MAPNIK_ROOT/lib/sigc++-2.0/include  -I$MAPNIK_ROOT/usr/local/include"
    export LINKFLAGS="-L$MAPNIK_ROOT/lib -lboost_system -lboost_thread -lboost_regex -lboost_filesystem -lfreetype -lproj -lpng12 -ljpeg -lcairomm-1.0 -lcairo -lpixman-1 -lsigc-2.0 -lfontconfig -lexpat -liconv -lltdl -lz -lxml2 -licucore -lexpat -Wl,-search_paths_first -L$MAPNIK_ROOT/usr/local/lib"
    export DYLD_LIBRARY_PATH=$MAPNIK_ROOT/usr/local/lib


Then build:

    ./configure
    make

    # confirm no linking to libmapnik2.dylib and only links to libs in /usr/lib
    # avoiding linking to libmapnik2 may require removing /usr/local/lib/libmapnik2.dylib 
    # and /usr/local/include/mapnik if they exist
    otool -L lib/_mapnik.node


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

    # for reference see all the C++ module depedencies
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
