VERSION="0.2.5"
VENDOR_DIR="build"
SRC_DIR="$VENDOR_DIR/src"
NODE="node-v0.2.5"
RUN_DIR=`pwd`
! test -d $VENDOR_DIR && mkdir $VENDOR_DIR
! test -d $SRC_DIR && mkdir $SRC_DIR

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
    echo "... building node-mapnik"
    cd modules/node-mapnik
    $RUN_DIR/build/bin/node-waf --prefix=$RUN_DIR configure build
    $RUN_DIR/build/bin/node-waf install
    cd $RUN_DIR;
else
    echo "... already built node-mapnik"
fi
