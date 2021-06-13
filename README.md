# Latest Status - June 13, 2021

We are looking for people to get involved!  Take a look at some of the current Feature Request Issues, and let us know if you can help.

- Create Docker for Tilemill releases: https://github.com/tilemill-project/tilemill/issues/2742
- Create Survey of Users: https://github.com/tilemill-project/tilemill/issues/2743
- Get Funding for Tilemill: https://github.com/tilemill-project/tilemill/issues/2744


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
### Quick installation instructions for OSX:

    git clone https://github.com/tilemill-project/tilemill.git
    cd tilemill
    nvm install lts/carbon
    nvm use v8.15.0
    npm install
    npm start

### Installation Scripts 
Scripts have been created that will do most everything for you. They were written for MacOS, but may still be usable for Ubunto and Windows with some modification.  (If you are successful with Ubunto and Windows, please post an Issue to let us know!)

[Installation Script Instructions](https://tilemill-project.github.io/tilemill/docs/mac-install/)


[Full Installation instructions can be found in the TileMill Documentation](https://tilemill-project.github.io/tilemill/docs/install/).


# Build Status, Running Tests, Updating Documentation

See CONTRIBUTING.md
