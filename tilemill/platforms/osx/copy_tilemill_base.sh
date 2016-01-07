if [ ! -d ../../node_modules ]; then
  echo "The underlying TileMill engine needs to be built first. Please see PACKAGE.md or http://mapbox.com/tilemill/docs/source/"
  exit 1
fi

TARGET="$1/"

#
# Copy each source item into the bundle if we haven't already.
# Exclude platform-specific stuff since that's for building.
#
for i in $( ls ../.. | grep -v platforms | grep -v npm-debug.log )
do
  if [ ! -f $TARGET/$i -a ! -d $TARGET/$i ]; then
    cp -r ../../$i $TARGET
  fi
done