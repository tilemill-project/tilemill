# TileMill OSX App

A first pass at a simple debug UI around tilemill as a child process

# Requires

Snow Leopard or Lion
XCode >= 4
Fully built TileMill 0.3.x

# Developer Setup

The app bundle expects the tilemill node sources to live in:

    tilemill.app/Contents/Resources/

You must manually copy your tilemill sources folder there after compiling tilemill.app

And it must be named 'tilemill' so you'll have a file like:

    tilemill.app/Contents/Resources/tilemill/tilemill.js


# Building

This command will create `build/Release/tilemill.app`:

    make

# Running

   open build/Release/tilemill.app 
