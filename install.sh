VERSION="0.2.5"
VENDOR_DIR="build"
SRC_DIR="$VENDOR_DIR/src"
NODE="node-v0.2.5"
RUN_DIR=`pwd`
! test -d $VENDOR_DIR && mkdir $VENDOR_DIR
! test -d $SRC_DIR && mkdir $SRC_DIR

# wget/curl trick borrowed from ndistro
GET=
which wget > /dev/null && GET="wget -q -O-"
which curl > /dev/null && GET="curl -# -L"

abort() {
  echo "Error: $@" && exit 1
}

test -z "$GET" && abort "curl or wget required"

if ! [ -f $RUN_DIR/bin/node ]; then
    cd $SRC_DIR
    echo "... installing node $VERSION"
    wget -q http://nodejs.org/dist/node-v$VERSION.tar.gz
    tar -zxf node-v$VERSION.tar.gz
    cd node-v$VERSION
    ./configure --prefix=$RUN_DIR/build
    make
    make install
    cd $RUN_DIR
    cp $VENDOR_DIR/bin/node $RUN_DIR/bin/node
else
    echo "... already installed node $VERSION"
fi

if ! [ -f "lib/node/mapnik/_mapnik.node" ]; then
    echo "... fetching node-mapnik"
    cd modules
    url="https://github.com/mapnik/node-mapnik/tarball/master"
    mkdir -p node-mapnik
    cd node-mapnik
    echo "... building node-mapnik"
    $GET $url | \
    tar -xz --strip 1
    $RUN_DIR/build/bin/node-waf -v --prefix=$RUN_DIR configure build
    $RUN_DIR/build/bin/node-waf -v install
    cd $RUN_DIR;
else
    echo "... already built node-mapnik"
fi

if ! [ -f "lib/node/srs/_srs.node" ]; then
    echo "... fetching node-srs"
    cd modules
    url="https://github.com/springmeyer/node-srs/tarball/master"
    mkdir -p node-srs
    cd node-srs
    echo "... building node-srs"
    $GET $url | \
    tar -xz --strip 1
    $RUN_DIR/build/bin/node-waf -v --prefix=$RUN_DIR configure build
    $RUN_DIR/build/bin/node-waf -v install
    cd $RUN_DIR;
else
    echo "... already built node-srs"
fi

# Create local data directory and populate with sample data
if ! [ -d "files/local_data" ]; then
    mkdir -p files/local_data
    wget -q -O example_data.zip http://tilemill-data.s3.amazonaws.com/example_data.zip
    unzip -q -d files/local_data example_data.zip
    rm example_data.zip
else
    echo "... example data already downloaded"
fi
