#!/bin/sh

#  tilemill.sh
#  TileMill
#
#  Created by Justin Miller on 9/14/11.
#  Copyright 2011 Development Seed. All rights reserved.
#
#  This shell script is designed to be linked to someplace
#  like $HOME/bin so that TileMill can be easily invoked 
#  from the command line. 

#  Kill existing node process.
#
kill $( ps ax | grep -i TileMill.app | grep index.js | sed -n 1p | awk '{ print $1 }' )

#  Kill existing Mac app.
#
kill $( ps ax | grep -i TileMill.app | grep MacOS    | sed -n 1p | awk '{ print $1 }' )

#  Change to bundle directory.
#
cd `dirname $( readlink $0 )`

#  Run manually.
#
./index.js