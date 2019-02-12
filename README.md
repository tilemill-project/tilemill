# Latest Status - Jan 22, 2019

# General Info
TileMill is a modern map design studio powered by [Node.js](https://nodejs.org) and [Mapnik](https://mapnik.org).

- TileMill is tested on Linux with Node 8.11.3 LTS, and partially tested on MacOS 10.14 with Node 8.15.0 lts/carbon
- TileMill currently only works in server mode, there is no standalone GUI.  Your browser is used for the interface.
- There are no native packages provided. Installation requires cloning this repo. See details below under *Installation*.
- Tilemill should theoretically work on the Windows platform, but it isn't tested.


# Dependencies

- Mapnik v2.3.0 (initial tests have worked on Mapnik 3.6.2, you'll need to update package.json)
- Node.js v6.x, v4.x, v0.10.x or v0.8.x (initial tests have worked on Node 8.15 lts/carbon, but you'll need to update other packages as well)
- Protobuf: libprotobuf-lite and protoc


# Installation

[Installation instructions can be found in the TileMill Documentation](https://tilemill-project.github.io/tilemill/docs/install/).


# Build Status, Running Tests, Updating Documentation

See CONTRIBUTING.md
