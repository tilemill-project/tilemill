---
layout: book
section: documentation
category: TileMill
tag: Guides
title: Running as an Ubuntu service
permalink: /docs/tutorials/ubuntu-service
---
By default, TileMill runs as a desktop-style application on Ubuntu, but it can also run as a system-wide service managed by [upstart](http://upstart.ubuntu.com/).

- **Start** TileMill by running `sudo start tilemill`
- **Stop** TileMill by running `sudo stop tilemill`
- **Restart** TileMill by running `sudo restart tilemill`
- **Files** used by TileMill are in `/usr/share/mapbox`
- **Logs** are written to `/var/log/tilemill`
- **Preferences** can be changed by editing `/usr/share/mapbox/.tilemill.json`

Once TileMill has started you can access the interface in your web browser at `http://localhost:20009`.

