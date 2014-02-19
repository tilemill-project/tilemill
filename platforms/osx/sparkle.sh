#!/bin/bash

# ensure that coreutils from homebrew
# is not preferred otherwise stat will break
export PATH=/usr/bin/:$PATH

urlbase="http://tilemill.s3.amazonaws.com/dev/TileMill-==TAG==.zip"

tag=$( git describe --tags )
version=$( echo $tag | sed -e 's/^v//' | sed -e 's/-/./' | sed -e 's/-.*//' )
echo
read -n 1 -p "Updating Sparkle for TileMill-$tag. Proceed? " proceed
if [ $proceed != "y" ] && [ $proceed != "Y" ]; then
  clear
  exit 1
fi
echo
echo

zipurl=$( echo $urlbase | sed -e s/==TAG==/$tag/ )
zipfile="./tmp/TileMill-$tag.zip"
mkdir -p ./tmp/
echo "Downloading $zipurl... to $zipfile"
curl -L -s -S $zipurl > $zipfile
if [ $? != 0 ]; then
  echo "Unable to download $zipurl. Aborting."
  exit 1
fi
echo "done."

if [ ! -f $zipfile ]; then
  echo "Unable to stat downloaded $zipfile. Aborting."
  exit 1
fi

zipsize=$( stat -f %z $zipfile )
echo "Zip size is $zipsize bytes."

echo "Add the following to the CHANGELOG (_posts/0100-01-01-CHANGELOG.md)"
echo "- version: $version"
echo "  tag: $tag"
echo "  dev: true"
echo "  date: $( date "+%Y-%m-%d" )"
echo "  size: $zipsize"
