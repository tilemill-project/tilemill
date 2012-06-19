# TileMill OSX App

A simple wrapper around tilemill for OSX.

# Requires

 * Snow Leopard or Lion
 * XCode >= 4
 * Mapnik Static SDK (see PACKAGE.md)

# Notes

 When building for personal use, the Spotlight & QuickLook plugins may not get 
 properly registered. To manually register them: 

    /usr/bin/mdimport -r TileMill.app/Contents/Library/Spotlight/MBTiles.mdimporter
    /usr/bin/qlmanage -r

# Build and test

Compile and run the OSX App:

    cd platforms/osx
    make && make run

# Standalone packaging

  See packaging.md
