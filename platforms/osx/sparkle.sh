#!/bin/bash

urlbase="http://cloud.github.com/downloads/mapbox/tilemill/TileMill-==TAG==.zip"
privatekeyname="TileMill Sparkle Private Key"

tag=$( git describe --tags )
version=$( echo $tag | sed -e s/^v// )
echo
read -n 1 -p "Updating Sparkle for TileMill-$version. Proceed? " proceed
if [ $proceed != "y" ] && [ $proceed != "Y" ]; then
  clear
  exit 1
fi
echo
echo

zipurl=$( echo $urlbase | sed -e s/==TAG==/$version/ )
echo -n "Downloading $zipurl... "
curl -L -s $zipurl > /tmp/TileMill-$version.zip
if [ $? != 0 ]; then
  echo "Unable to download $zipurl. Aborting."
  exit 1
fi
echo "done."

zipfile="/tmp/TileMill-$version.zip"
if [ ! -f $zipfile ]; then
  echo "Unable to stat downloaded $zipfile. Aborting."
  exit 1
fi

zipsize=$( stat -f %z $zipfile )
echo "Zip size is $zipsize bytes."

echo -n "Generating DSA signature... "
privatekey=$( security find-generic-password -g -s "$privatekeyname" 2>&1 1>/dev/null | perl -pe '($_) = /"(.+)"/; s/\\012/\n/g' | perl -MXML::LibXML -e 'print XML::LibXML->new()->parse_file("-")->findvalue(q(//string[preceding-sibling::key[1] = "NOTE"]))' )
if [ -z "$privatekey" ]; then
  echo "Unable to find private key $privatekeyname in OS X keychain. Aborting."
  exit 1
fi
echo "$privatekey" > ./dsa_private.pem
signature=$( cat $zipfile | /usr/bin/openssl dgst -sha1 -binary | /usr/bin/openssl dgst -dss1 -sign ./dsa_private.pem | /usr/bin/openssl enc -base64 )
rm -f ./dsa_private.pem
echo "done."
echo

echo "Add the following to the CHANGELOG (_posts/0100-01-01-CHANGELOG.md)"
echo "    date: $( date "+%Y-%m-%d" )"
echo "    size: $zipsize"
echo "    sign: $signature"
