# TileMill OS X App

A wrapper around TileMill for OS X featuring: 

 * An easier launch and upgrade experience. 
 * Full screen mode support. 
 * Familiar keyboard shortcuts. 
 * Integration with Notification Center. 
 * Compliance with [App Nap](https://www.apple.com/osx/advanced-technologies/). 
 * Spotlight & QuickLook integration for [MBTiles](http://mbtiles.org) exports. 

# Requires

 * OS X 10.6 or higher (currently tested up to 10.10b4)
 * Xcode >= 5.0 (currently tested up to 6.0b4)

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

See `PACKAGE.md`. 
