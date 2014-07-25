# Packaging TileMill.app standalone

These are steps to setup the TileMill node.js app to be portable within a Mac OS X .app bundle.

This is only necessary for developers that wish to build a fully distributable TileMill.app without requiring any other installation steps.

## Requirements

 - Mac OS X machine with updated xcode and modern/64 bit hardware
 - Most recently tested on OS X 10.9.3

## Install Node.js

Install node however you want: either homebrew or nvm works fine. Just make sure to grab the latest 64 bit node version of the 0.10.x series.

Just make sure its on your PATH before you continue.

NOTE: we used to support duel-arch (also 32 bit) but this is no longer needed.
We build node with two cpu architectures, aka universal/fat to support older macs:

## Build tilemill

Clear out any previous builds:

    cd tilemill
    rm -rf node_modules

Build:

    npm install

Test that the app works:

    ./index.js

Now go build and package the tilemill app:

    cd platforms/osx
    make clean
    make run # test and check version
    make zip # package

Then rename the TileMill.zip to TileMill-$VER.zip. For example:

   mv TileMill.zip TileMill-0.6.0.zip
