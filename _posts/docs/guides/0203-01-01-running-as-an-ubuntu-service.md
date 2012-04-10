---
layout: book
section: documentation
category: TileMill
tag: Guides
title: Running as an Ubuntu service
permalink: /docs/guides/ubuntu-service
---
By default, TileMill runs as a desktop-style application on Ubuntu. See the [Usage manual page](manual/usage/) for details on the desktop setup.

TileMill can also be run as a system-wide, server-only, headless service. If you have installed TileMill from packages (`apt-get install tilemill`) then the TileMill service can be managed with [upstart](http://upstart.ubuntu.com/):

- **Start** TileMill by running `sudo start tilemill`
- **Stop** TileMill by running `sudo stop tilemill`
- **Restart** TileMill by running `sudo restart tilemill`
- **Files** used by TileMill are in `/usr/share/mapbox`
- **Logs** are written to `/var/log/tilemill`
- **Preferences** can be changed by editing `/etc/tilemill/tilemill.config`

The TileMill service launched via upstart will use a custom config (`/etc/tilemill/tilemill.config`) installed via the package and will attach to `http://localhost:20009` and be viewable in a web browser, while internal process used for tile server will be attached to `http://localhost:20008`.

If you have installed TileMill from [source](source/) then startup can be done manually like:

    cd tilemill # source checkout
    # Instead of localhost, use the public hostname if you have one
    ./index.js --server=true --hostname=`hostname`
    # Or just use the machine's IP if no public hostname is configured
    ./index.js --server=true --hostname=`ifconfig eth0 | grep 'inet addr:' | cut -d: -f2 | awk '{ print $1}'`

## Advanced preferences

TileMill configuration options can be set on the command line, but ideally they should be configured in JSON format. A custom config file can be specified on the command line like: `./index.js --config=myconfig.json`. The configuration below, for example, tells the TileMill core server to listen on port 3001 and behave like a normal web server, allowing other users to access the application via LAN or the Internet:

    {
      "port": 3001,
      "listenHost": "0.0.0.0"
    }

The most commonly used options include:

- `port` the port that the server should listen on. Defaults to `20009`.
- `listenHost` Bind the server to the given host. Defaults to 127.0.0.1.

All default options can be seen in the default config base in `lib/config.defaults.json`.