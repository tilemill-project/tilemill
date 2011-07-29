# TileMill OSX App

A first pass at a simple debug UI around tilemill as a child process

# Requires

 * Snow Leopard or Lion
 * XCode >= 4
 * Fully built TileMill 0.3.x


# Building

This command will create `build/Release/tilemill.app`:

    make


# Setup

The app bundle expects the tilemill node sources to live in:

    tilemill.app/Contents/Resources/

You must manually copy your tilemill sources folder there after compiling tilemill.app

And it must be named 'tilemill' so you'll have a file like:

    tilemill.app/Contents/Resources/tilemill/tilemill.js


# Running

   open build/Release/tilemill.app 


# Standalone packaging

  See packaging.md
