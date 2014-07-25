# Packaging TileMill.app standalone

These are steps to setup the TileMill Node.js app to be portable within an OS X application bundle.

This is only necessary for developers who wish to build a fully distributable `TileMill.app` without requiring any other installation steps.

## Requirements

 - OS X machine with updated Xcode and modern/64-bit hardware. 

## Install Node.js

Install `node` however you want: either [Homebrew](http://brew.sh) or [nvm](https://github.com/creationix/nvm) works fine. Just make sure to grab the latest 64-bit version of the `0.10.x` series. You can confirm this with output like the following: 

    $ node -v
    v0.10.29
    $ file `which node`
    /usr/local/bin/node: Mach-O 64-bit executable x86_64

Also make sure that `node` is in your `$PATH` (run `which node`) before you continue.

**NOTE:** We used to support dual-arch (both 64-bit and 32-bit), but this is no longer needed.

## Build tilemill

Clear out any previous builds:

    cd tilemill
    rm -rf node_modules

Build:

    npm install

Test that the app works:

    ./index.js

You should see it listening on a port and reachable at that port over HTTP. 

Now go build and package the TileMill OS X wrapper app:

    cd platforms/osx
    make clean
    make run # test and check version
    make zip # package

Then rename the `TileMill.zip` to `TileMill-$VER.zip`. For example:

    mv TileMill.zip TileMill-0.6.0.zip
