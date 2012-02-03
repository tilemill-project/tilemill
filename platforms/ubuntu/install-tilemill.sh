#!/bin/bash

### IMPORTANT - If you already have a version of mapnik installed, such as
### a version you compiled while installing a previous version of TileMill
### you must uninstall that version of mapnik in order to be able to use
### the packaged version of TileMill.  To uninstall, for example, go to
### the directory from where you installed mapnik, such as 
### /home/ubuntu/mapnik and from within that directory run
### `sudo make uninstall` to uninstall that version of mapnik.
### If you install the packaged version of TileMill using this script and
### then you see segmentation fault errors in the TileMill log in
### /var/log/tilemill/tilemill.log, then chances are you have a previously
### compiled version of mapnik, in addition to the mapnik package required
### and which will be installed for you using this script.

DIST=`lsb_release -cs`

if [ -z "$DIST" ]; then
  echo "Your Ubuntu distribution version could not be determined."
  exit
fi

if [[ "$DIST" != "natty" && "$DIST" != "oneiric" && "$DIST" != "katya" ]]; then
  echo "Your distribution $DIST is not supported."
  exit
fi

pkexec /bin/bash -c "apt-get update --yes &&
    apt-get install --yes python-software-properties &&
    yes | apt-add-repository ppa:developmentseed/mapbox &&
    apt-get update --yes &&
    apt-get install --yes tilemill"

read -sp "Press [ENTER] to quit."
