# Latest Status - Feb 12, 2019

# General Info
TileMill is a modern map design studio powered by [Node.js](https://nodejs.org) and [Mapnik](https://mapnik.org).

- TileMill is tested on Linux with Node 8.11.3 LTS, and on MacOS 10.14 with Node 8.15.0 lts/carbon
- TileMill currently only works in server mode, there is no standalone GUI.  Your browser is used for the interface.
- There are no native packages provided. Installation requires cloning this repo. See details below under *Installation*.
- Tilemill should theoretically work on the Windows platform, but it isn't tested.


# Dependencies

- Mapnik > v3.6.2 (but may work on earlier versions)
- Node.js:  (earlier Node.js versions may work, but are not tested)
	- Ubuntu: v8.11.x
	- OSX: v8.15.x lts/carbon
- Protobuf: Ubunto: these need to be installed: libprotobuf-lite and protoc


# Installation
Quick installation instructions for OSX:

    git clone https://github.com/tilemill-project/tilemill.git
    cd tilemill
    nvm install lts/carbon
    nvm use v8.15.0
    npm install
    npm start

[Full Installation instructions can be found in the TileMill Documentation](https://tilemill-project.github.io/tilemill/docs/install/).


# Build Status, Running Tests, Updating Documentation

See CONTRIBUTING.md
