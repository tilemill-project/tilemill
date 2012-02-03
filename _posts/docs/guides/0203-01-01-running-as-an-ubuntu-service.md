---
layout: book
section: documentation
category: TileMill
tag: Guides
title: Running as an Ubuntu service
permalink: /docs/guides/ubuntu-service
---
By default, TileMill runs as a desktop-style application on Ubuntu, but it can also run as a system-wide service managed by [upstart](http://upstart.ubuntu.com/).

- **Start** TileMill by running `sudo start tilemill`
- **Stop** TileMill by running `sudo stop tilemill`
- **Restart** TileMill by running `sudo restart tilemill`
- **Files** used by TileMill are in `/usr/share/mapbox`
- **Logs** are written to `/var/log/tilemill`
- **Preferences** can be changed by editing `/etc/tilemill/tilemill.config`

Once TileMill has started you can access the interface in your web browser at `http://localhost:20009`.

## Advanced preferences

TileMill configuration should be provided in JSON format. The configuration below, for example, tells the TileMill to listen on port 3001 and behave like a normal web server, allowing other users to access the application via LAN or the Internet:

    {
      "port": 3001,
      "listenHost": "0.0.0.0"
    }

The most commonly used options include:

- `port` the port that the server should listen on. Defaults to `20009`.
- `listenHost` Bind the server to the given host. Defaults to 127.0.0.1.
