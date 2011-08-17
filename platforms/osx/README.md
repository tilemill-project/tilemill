# TileMill OSX App

A simple wrapper around tilemill for OSX.


# Requires

 * Snow Leopard or Lion
 * XCode >= 4
 * Fully built TileMill (run `npm install` in the top-level folder)
 * `git submodule update --init` to initialize dependent Git submodules


# Notes

 When building for personal use, the Spotlight & QuickLook plugins may not get 
 properly registered. To manually register them: 

  - `/usr/bin/mdimport -r /path/to/TileMill.app/Contents/Library/Spotlight/MBTiles.mdimporter`
  - `/usr/bin/qlmanage -r`

# Build and test

Compile and run the OSX App:

    make && make run


# Standalone packaging

  See packaging.md
