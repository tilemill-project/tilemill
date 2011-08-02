#!/bin/bash

LIST="/etc/apt/sources.list.d/tilemill.list"
DIST=`grep DISTRIB_CODENAME /etc/lsb-release | sed "s/DISTRIB_CODENAME=\(.*\)/\1/g"`

if [ -z "$DIST" ]; then
  echo "Your Ubuntu distribution version could not be determined."
  exit
fi

if [ "$DIST" != "maverick" && "$DIST" != "natty" ]; then
  echo "Your distribution $DIST is not supported."
  exit
fi

echo "
deb http://ppa.launchpad.net/developmentseed/mapbox/ubuntu $DIST main
deb-src http://ppa.launchpad.net/developmentseed/mapbox/ubuntu $DIST main

deb http://ppa.launchpad.net/chris-lea/node.js/ubuntu $DIST main
deb-src http://ppa.launchpad.net/chris-lea/node.js/ubuntu $DIST main
" > $LIST

# Mapbox key
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 0FB81AF3
# Node.js key
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys C7917B12

apt-get update
apt-get install tilemill
