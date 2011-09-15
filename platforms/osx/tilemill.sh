#!/bin/sh

#  This shell script is designed to be linked to someplace
#  like $HOME/bin so that TileMill can be easily invoked
#  from the command line.

#  Change to bundle directory.
cd `dirname $( readlink $0 )`

#  Run manually.
./index.js $@
