# TileMill

## Requirements

    wget http://www.tornadoweb.org/static/tornado-0.2.tar.gz
    tar xvzf tornado-0.2.tar.gz
    cd tornado-0.2
    python setup.py build
    sudo python setup.py install

## Setup

Options in `tilemill.cfg` you should review in order to setup TileMill:

- `port`: The port that TileMill should use. Defaults to 8889.

- `projects`: The location of the projects directory for TileMill. This
  directory must be readable and writable by the TileMill process. The default
  location for this directory is `tilemill/projects`.

- `tilelive_server`: URL to the TileLive server. The default URL for the server
  is http://localhost:8888/.

To run the TileMill server run `tilemill.py` and open http://localhost:8889.
in your web browser.

## Projects

Projects in TileLive are directories in the projects directory containing an
`.mml` file with a name matching the project directory name (eg. `world_map/`
and `world_map/world_map.mml`). The project `.mml` file may contain references
to layers with shapefile datasources and to `.mss` stylesheets. However there
are several requirements to the format of the `.mml` file:

- References to shapefiles must be URLs reachable by the TileLive server. Examples:
  - http://cascadenik-sampledata.s3.amazonaws.com/world_borders.zip

- References to `.mss` files must be TileMill URLs or simple filename
  references to files in the project directory. Examples:
  - http://localhost:8889/projects/mss?id=example&filename=example
  - `example.mss`
