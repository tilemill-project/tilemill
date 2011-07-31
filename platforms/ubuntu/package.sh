#!/usr/bin/env sh

BUILD="build"
VERSION="tilemill-$1"
TARBALL="tilemill-$1.tar.gz"
ORIG="tilemill_$1.orig.tar.gz"

if [ -z "$1" ]; then
  echo "Please specify the version to package."
  exit
fi

if [ ! -f "../../package.json" ]; then
  echo "package.sh must be run from the platforms/ubuntu directory."
  exit
fi

if [ -d "$BUILD" ]; then
  echo "Build dir $BUILD already exists. Please remove it first."
  exit
fi

mkdir $BUILD

tar cfz "$BUILD/$TARBALL" ../../ \
--exclude=.git* \
--exclude=platforms \
--transform "s,^,$VERSION/," \
--show-transformed-names

cd $BUILD
tar zxvf $TARBALL

cd ..
cp "$BUILD/$TARBALL" "$BUILD/$ORIG"

cp -r debian "$BUILD/$VERSION"
cd "$BUILD/$VERSION/debian"

debuild -inode_modules\|.git\|.png\|.ttf -S -sa
