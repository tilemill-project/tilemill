
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

I've built a bunch of libs statically and put in a custom folder.

We need to set that path now:

    export MAPNIK_DEPS=/Users/dane/projects/mapnik-dev/trunk-build-static/osx/sources

I also compiled mapnik against these static libs.

We need to set the path to that statically compiled mapnik directory:

    export MAPNIK_ROOT=/Users/dane/projects/mapnik-dev/trunk-build-static
    export PATH=$MAPNIK_ROOT/utils/mapnik-config:$PATH


## Rebuild node-sqlite

    cd node_modules/sqlite3

Add this line to wscript on line 17:

    conf.env.append_value("LINKFLAGS", ['-L/Users/dane/projects/mapnik-dev/trunk-build-static/osx/sources/lib','-Wl,-search_paths_first'])

Then rebuild:

    make clean
    export CXXFLAGS="-I$MAPNIK_ROOT/include"
    ./configure
    make
    
    # check that static compile worked (should not see libsqlite3 in output):
    otool -L lib/sqlite3_bindings.node

    
## Rebuild node-mapnik

The goal here is to re-compile node-mapnik against the specially
prepared libmapnik2.a and plugins.

    cd ../mapnik/
    make clean

Edit the wscript adding these lines before line 115:

    linkflags.append('-L/Users/dane/projects/mapnik-dev/trunk-build-static/osx/sources/lib')
    linkflags.append('-lboost_system')
    linkflags.append('-lboost_filesystem')
    linkflags.append('-lfreetype')
    linkflags.append('-lproj')
    linkflags.append('-lltdl')
    linkflags.append('-Wl,-search_paths_first')

Then build:

    export CXXFLAGS="-I$MAPNIK_ROOT/include"
    export JOBS=`sysctl -n hw.ncpu`
    ./configure
    make
    
    # confirm static linking
    otool -L lib/_mapnik.node

Now set up plugins:

    mkdir lib/input
    cp $MAPNIK_ROOT/plugins/input/*.input lib/input

    # check plugins
    otool -L lib/input/*input | grep /usr/local

    # edit settings
    vim lib/mapnik_settings.js
    
    var path = require('path');
    
    module.exports.paths = {
        'fonts': path.join(__dirname, 'fonts'),
        'input_plugins': path.join(__dirname, 'input'),
    };
    

And set up fonts:

    mkdir lib/fonts
    cp $MAPNIK_ROOT/fonts/*.ttf lib/fonts/
    cp $MAPNIK_ROOT/fonts/*/*/*.ttf lib/fonts/


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
      
Now test that the app still works
 
    ./index.js
