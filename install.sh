VERSION="0.2.5"
VENDOR_DIR="build"
SRC_DIR="$VENDOR_DIR/src"
NODE="node-v0.2.5"
ADDONS_DIR="addons"
RUN_DIR=`pwd`
! test -d $VENDOR_DIR && mkdir $VENDOR_DIR
! test -d $SRC_DIR && mkdir $SRC_DIR
! test -d $ADDONS_DIR && mkdir $ADDONS_DIR

# wget/curl trick borrowed from ndistro
GET=
which wget > /dev/null && GET="wget -q -O-"
which curl > /dev/null && GET="curl -# -L"

abort() {
  echo "Error: $@" && exit 1
}

test -z "$GET" && abort "curl or wget required"

if ! [ -f "$RUN_DIR/bin/node" ]; then
    cd $SRC_DIR
    echo "... installing node $VERSION"
    curl -O -q http://nodejs.org/dist/node-v$VERSION.tar.gz
    tar -zxf node-v$VERSION.tar.gz
    cd node-v$VERSION
    ./configure --prefix="$RUN_DIR/build"
    make
    make install
    cd "$RUN_DIR"
    cp $VENDOR_DIR/bin/node "$RUN_DIR/bin/node"
else
    echo "... already installed node $VERSION"
fi

build_addon_no_git() {
    REPO=$1
    NAME=$2
    TAG=$3
    CHECK_FILE=$4
    if ! [ -f "CHECK_FILE" ]; then
        cd $ADDONS_DIR
        if ! [ -a "$NAME" ]; then
            echo "... fetching $NAME"
            url="https://github.com/$REPO/$NAME/tarball/$TAG"
            mkdir -p $NAME
            cd $NAME
            echo "... un-packing $NAME"
            $GET $url | \
            tar -xz --strip 1
        else
            cd $NAME
        fi
        "$RUN_DIR/build/bin/node-waf" --prefix="$RUN_DIR" configure build
        "$RUN_DIR/build/bin/node-waf" install
        cd "$RUN_DIR";
    else
        echo "... already built $NAME"
    fi
}

build_addon_git() {
    REPO=$1
    NAME=$2
    CHECK_FILE=$4
    if ! [ -f "CHECK_FILE" ]; then
        cd $ADDONS_DIR
        if ! [ -a "$NAME" ]; then
            echo "... fetching $NAME"
            git clone git://github.com/$REPO/$NAME.git
            cd $NAME
        else
            cd $NAME
            git pull
        fi
        "$RUN_DIR/build/bin/node-waf" --prefix="$RUN_DIR" configure build
        "$RUN_DIR/build/bin/node-waf" install
        cd "$RUN_DIR";
    else
        echo "... already built $NAME"
    fi
}

# <repo> <module> <tag> <file to check to decide about re-download>
build_addon_no_git "mapnik" "node-mapnik" "master" "lib/node/mapnik/_mapnik.node"
build_addon_no_git "springmeyer" "node-srs" "0.1.1" "lib/node/srs/_srs.node"
build_addon_no_git "springmeyer" "node-zipfile" "0.1.5" "lib/node/zipfile/_zipfile.node"
build_addon_no_git "developmentseed" "node-sqlite" "0.0.1" "lib/node/sqlite/sqlite3_bindings.node"

# Create local data directory and populate with sample data
if ! [ -d "files/data" ]; then
    echo "... fetching example data"
    mkdir -p files/data
    curl -O http://tilemill-data.s3.amazonaws.com/example_data.zip
    unzip -q -d files/data example_data.zip
    rm example_data.zip
else
    echo "... already fetched example data"
fi

# Create local resources directory and populate with stock images
if ! [ -d "files/resources" ]; then
    echo "... fetching stock resources"
    mkdir -p files/resources
    curl -O http://tilemill-data.s3.amazonaws.com/tilemill_resources.zip
    unzip -q -d files/resources tilemill_resources.zip
    rm tilemill_resources.zip
else
    echo "... already fetched stock resources"
fi

if ! [ -d "files/project" ]; then
    echo "... fetching example projects"
    mkdir -p files/project
    cd files/project
    $GET https://github.com/mapbox/tilemill_examples/tarball/master | \
    tar -xz --strip 1
    cd "$RUN_DIR";
else
    echo "... already fetched example projects"
fi
