
# Packaging TileMill.app standalone

The are the steps to setup tilemill to be portable within an .app bundle.

This is only necessary if you wish to distribute tilemill.app without requiring
any other installation steps.


## Compile Mapnik

Mapnik needs to be compiled such that all dependencies are either statically linked
are linked using @rpath/@loader_path (and then all those dylib deps are included).

Obviously this approach is beyond the scope of tilemill. Contact @springmeyer for details.


## Build tilemill

Just like normal for the 0.3.x branch:

    export CXX=g++
    export CC=gcc
    ./ndistro


## Setup static builds

I built a bunch of libs statically and put in a custom folder.

We need to set that path now:

    export MAPNIK_DEPS=/Users/dane/projects/mapnik-dev/trunk-build-static/osx/sources

I also compiled mapnik against these static libs.

We need to set the path to that statically compiled mapnik directory:

    export MAPNIK_ROOT=/Users/dane/projects/mapnik-dev/trunk-build-static
    export PATH=$MAPNIK_ROOT/utils/mapnik-config:$PATH


## Rebuild node-sqlite

    cd modules/node-sqlite3
    vim wscript # comment lib check
    make clean
    export CXXFLAGS="-I$MAPNIK_DEPS/include"
    export LDFLAGS="-L$MAPNIK_DEPS/lib -Wl,-search_paths_first"
    ../../bin/node-waf --prefix=`pwd`/../../ -v configure build
    
    # check that static compile worked (should not see libsqlite3 in output):
    ldd lib/sqlite3_bindings.node

    
## Rebuild node-mapnik

The goal here is to re-compile node-mapnik against the specially
prepared libmapnik2.a and plugins.

    cd ../node-mapnik

Edit the wscript adding these lines:

        linkflags.append('-L//Users/dane/projects/mapnik-dev/trunk-build-static/osx/sources/lib')
        linkflags.append('-lboost_system')
        linkflags.append('-lboost_filesystem')
        linkflags.append('-lfreetype')
        linkflags.append('-lproj')
        linkflags.append('-lltdl')
        linkflags.append('-Wl,-search_paths_first')

Then build:

    make clean
    export CXXFLAGS="-I$MAPNIK_ROOT/include"
    export LDFLAGS="-L$MAPNIK_ROOT/lib -Wl,-search_paths_first"
    ../../bin/node-waf --prefix=`pwd`/../../ -v configure build
    
    # confirm static linking
    ldd lib/_mapnik.node

Now set up plugins:

    mkdir lib/input
    cp $MAPNIK_ROOT/plugins/input/*.input lib/input

    # check plugins
    ldd lib/input/*input | grep /usr/local

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


And check builds overall
    
    cd ../../
    ldd lib/node/*/*.node | grep usr/local


Now test that the app still works
 
    ./tilemill.js
