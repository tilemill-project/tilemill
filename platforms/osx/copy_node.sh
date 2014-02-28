if [ -z $( which node ) ]; then
  echo "Unable to find node binary"
  exit 1
fi

TARGET="$1/"
# copy node executable
rm -f $TARGET/node
cp `which node` $TARGET/TileMill # for OS X firewall dialogs
# change shebang to use local aliases node
sed -i.backup 's/#!\/usr\/bin\/env node/#!\.\/TileMill/' ${TARGET}index.js
rm ${TARGET}index.js.backup