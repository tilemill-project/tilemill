#!/bin/bash

### IMPORTANT - If you already have a version of mapnik2 installed, such as
### a version you compiled while installing a previous version of TileMill
### you must uninstall that version of mapnik2 in order to be able to use
### the packaged version of TileMill.  To uninstall, for example, go to
### the directory from where you installed mapnik2, such as 
### /home/ubuntu/mapnik and from within that directory run
### `sudo make uninstall` to uninstall that version of mapnik2.
### If you install the packaged version of TileMill using this script and
### then you see segmentation fault errors in the TileMill log in
### /var/log/tilemill/tilemill.log, then chances are you have a previously
### compiled version of mapnik2, in addition to the mapnik2 package required
### and which will be installed for you using this script.

DIST=`lsb_release -cs`

if [ -z "$DIST" ]; then
  echo "Your Ubuntu distribution version could not be determined."
  exit
fi

if [[ "$DIST" != "maverick" && "$DIST" != "natty" ]]; then
  echo "Your distribution $DIST is not supported."
  exit
fi

apt-add-repository ppa:developmentseed/mapbox
apt-add-repository ppa:chris-lea/node.js

apt-get update
apt-get install tilemill
