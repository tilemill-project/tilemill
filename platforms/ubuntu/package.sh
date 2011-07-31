#!/usr/bin/env sh

BUILD="build"
VERSION=`grep -m1 'tilemill ([0-9.-]*)' debian/changelog | sed 's/tilemill (\([0-9.]*\)[-0-9]*).*/\1/g'`
SOURCE="tilemill-$VERSION"
TARBALL="tilemill-$VERSION.tar.gz"
ORIG="tilemill_$VERSION.orig.tar.gz"

if [ -z "$VERSION" ]; then
  echo "Version could not be detected."
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

while true
do
  echo -n "Build $SOURCE (y/n)? "
  read CONFIRM
  if [ $CONFIRM = "y" ]; then
    break
  elif [ $CONFIRM = "n" ]; then
    echo "Aborting."
    exit
  fi
done

mkdir $BUILD

tar cfz "$BUILD/$TARBALL" ../../ \
--exclude=.git* \
--exclude=platforms \
--transform "s,^,$SOURCE/," \
--show-transformed-names

cd $BUILD
tar zxvf $TARBALL

cd ..
cp "$BUILD/$TARBALL" "$BUILD/$ORIG"

cp -r debian "$BUILD/$SOURCE"
cd "$BUILD/$SOURCE/debian"

debuild -inode_modules\|.git\|.png\|.ttf -S -sa
