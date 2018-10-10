Maintenance status:

TileMill has shifted to an [open source](http://openopensource.org/) contributor model and moved to its own organization, `tilemill-project`.

## Alternatives to TileMill

**Mapbox**

* [Mapbox Studio](https://www.mapbox.com/mapbox-studio/): the official, supported successor to TileMill

**Community**

* [Kosmtik](https://github.com/kosmtik/kosmtik): alternative to TileMill
* [TileOven](https://github.com/florianf/tileoven): fork of TileMill with Node 4 support

## Installation

To install from source just do:

    git clone https://github.com/tilemill-project/tilemill.git
    cd tilemill
    npm install

Then to start TileMill do:

As a Desktop application:

    ./index.js 

To run the **web version** pass `server=true`: 
	
    ./index.js --server=true

and then go to `localhost:20009` in your web browser


For more extended details follow:

- [Install packages](http://mapbox.com/tilemill/docs/install/)
- [Build from source](http://mapbox.com/tilemill/docs/source/)
