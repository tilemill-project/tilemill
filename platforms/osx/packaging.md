
# Packaging TileMill.app standalone

The are the steps to setup tilemill to be portable within an .app bundle.

This is only necessary for developers that wish to build a fully 
distributable tilemill.app without requiring any other installation steps.


## Compile Mapnik

Mapnik needs to be compiled such that all dependencies are either statically linked
or are linked using @rpath/@loader_path (and then all those dylib deps are included).

Obviously this approach is beyond the scope of tilemill. Contact @springmeyer for details.


## Compile tilemill C++ deps that have other depedencies

    npm install zlib sqlite3 zipfile srs mapnik


## Check zlib

We need to make sure node-zlib is linked against the system zlib

    otool -L node_modules/zlib/lib/zlib_bindings.node

## Setup static builds

We need an SDK of static libs of mapnik dependencies and mapnik compiled against them.

We need to set the path to that SDK directory:

    export MAPNIK_ROOT=/Users/dane/projects/mapnik-dev/trunk-build-static/osx/sources/
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

The goal here is to re-compile node-mapnik against the specially
prepared libmapnik2.a and plugins.

    cd ../mapnik/
    make clean

Configure:
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


## Build tilemill

Now we can build the remaining js deps of tilemill locally:

    cd ../../
    npm install .


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
