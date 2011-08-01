#!/usr/bin/env sh

BUILD="build"
PROJECT="tilemill"
USER="developmentseed"
PPA="mapbox"

CWD=`pwd`
VERSION=`grep -m1 "$PROJECT ([0-9.-]*)" debian/changelog | sed "s/$PROJECT (\([0-9.-]*\)).*/\1/g"`
TAG=`echo $VERSION | sed "s/\([0-9.]*\).*/\1/g"`


if [ -z "$VERSION" ]; then
  echo "Version could not be determined from debian/changelog."
  exit
fi

if [ ! -f "$CWD/../../package.json" ]; then
  echo "package.sh must be run from the platforms/ubuntu directory."
  exit
fi

if [ -d "$BUILD" ]; then
  echo "Build dir $BUILD already exists. Please remove it first."
  exit
fi

while true
do
  echo -n "Build $PROJECT-$TAG (y/n)? "
  read CONFIRM
  if [ $CONFIRM = "y" ]; then
    break
  elif [ $CONFIRM = "n" ]; then
    echo "Aborting."
    exit
  fi
done

mkdir "$CWD/$BUILD"

tar cfz "$CWD/$BUILD/$PROJECT-$TAG.tar.gz" "../../" \
--exclude=.git* \
--exclude=*.mbtiles \
--exclude=*.zip \
--exclude=*.node \
--exclude=build \
--exclude=platforms \
--exclude=node_modules/jshint \
--exclude=node_modules/expresso \
--exclude=test \
--transform "s,^,$PROJECT-$TAG/,"

cd "$CWD/$BUILD"
tar zxvf "$CWD/$BUILD/$PROJECT-$TAG.tar.gz"
cp "$CWD/$BUILD/$PROJECT-$TAG.tar.gz" "$CWD/$BUILD/${PROJECT}_${TAG}.orig.tar.gz"

cp -r "$CWD/debian" "$CWD/$BUILD/$PROJECT-$TAG"
cd "$CWD/$BUILD/$PROJECT-$TAG/debian"

CHANGES="source.changes"

debuild -inode_modules\|.git\|.png\|.ttf -S -sa &&
cd "$CWD/$BUILD" &&
dput "ppa:$USER/$PPA" "${PROJECT}_${VERSION}_${CHANGES}"

