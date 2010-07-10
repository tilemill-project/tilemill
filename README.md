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

- `files`: The location of the files directory for TileMill. This directory
  must be readable and writable by the TileMill process. The default
  location for this directory is `files`.

To run the TileMill server run `tilemill.py`.

To run the client, open the client/index.html in your web browser.

## Projects

Projects in TileLive are directories in the files directory containing an
`.mml` file with a name matching the project directory name. They must also
contain the project type (project or visualization). For example, a path could
be `files/project/world_map/` with a corresponding `files/project/world_map/world_map.mml`
The project `.mml` file may contain references to layers with shapefile
datasources and to `.mss` stylesheets. However there are several requirements
 to the format of the `.mml` file:

- References to shapefiles and .mss files must be URLs reachable by the
  TileLive server. Examples:
  - `http://cascadenik-sampledata.s3.amazonaws.com/world_borders.zip`
  - `http://localhost:8889/projects/mss?id=example&filename=example`
