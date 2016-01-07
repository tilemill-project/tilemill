#!/bin/sh
 
if [ -z "$1" ]; then
  echo "Usage: $0 <TileMill.zip>"
  exit 1
fi
 
privatekeyname="TileMill Sparkle Private Key"
privatekey=$( security find-generic-password -g -s "$privatekeyname" 2>&1 1>/dev/null | perl -pe '($_) = /"(.+)"/; s/\\012/\n/g' | perl -MXML::LibXML -e 'print XML::LibXML->new()->parse_file("-")->findvalue(q(//string[preceding-sibling::key[1] = "NOTE"]))' )
echo "$privatekey" > ./dsa_private.pem
signature=$( cat $1 | /usr/bin/openssl dgst -sha1 -binary | /usr/bin/openssl dgst -dss1 -sign ./dsa_private.pem | /usr/bin/openssl enc -base64 )
rm dsa_private.pem
echo "DSA signature: $signature"