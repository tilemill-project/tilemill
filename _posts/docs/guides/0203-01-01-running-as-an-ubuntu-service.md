---
layout: book
section: documentation
category: TileMill
tag: Guides
title: Running as an Ubuntu service
permalink: /docs/guides/ubuntu-service
---
By default, TileMill runs as a desktop-style application on Ubuntu. See the [Usage manual page](manual/usage/) for details on the desktop setup.

TileMill can also be run as a system-wide, server-only service simply by making a single modification to the default config options.

    {
      "server": true
    }


_All default options can be seen in the default config base in `lib/config.defaults.json`._

If `server` is `true` then TileMill will not attempt to launch a native UI process (which it does by default).

Also, TileMill defaults to reading data from the `~/Documents/MapBox` directory of the user running the process. For a system-wide TileMill service a global location with special permissions should be used.

### Launching service using Upstart

If you have installed TileMill from packages (`apt-get install tilemill`) then [upstart](http://upstart.ubuntu.com/) can be used to launch TileMill easily as the `mapbox` user using a default config (`/etc/tilemill/tilemill.config`) of:

    {
      "files": "/usr/share/mapbox",
      "server": true
    }

These commands can be used to manage TileMill through upstart:

- **Start** TileMill by running `sudo start tilemill`
- **Stop** TileMill by running `sudo stop tilemill`
- **Restart** TileMill by running `sudo restart tilemill`
- **Files** used by TileMill are in `/usr/share/mapbox`
- **Logs** are written to `/var/log/tilemill`
- **Preferences** can be changed by editing `/etc/tilemill/tilemill.config`

### Launching service from source build

If you have installed TileMill from [source](source/) then startup can be done manually like:

    cd tilemill
    ./index.js --server=true # server=true prevents the UI from opening

Or you can add `server: true` to a custom config:

    echo '{"server":true}' > myconfig.json
    ./index.js --config=myconfig.json


## Accessing TileMill from remote install

Like in desktop mode (`server=false`), even if `server` is true, TileMill will only attach to `http://localhost:20009` (while the tile server process will attach to `http://localhost:20008`) and therefore will only be viewable locally.

### SSH connection forwarding

If you have ssh access to the remote machine and simply want to view your TileMill server, without opening any ports to the outside, you can (with caution!) use ssh connection forwarding.

    # first start TileMill on the remote machine
    # then from your local machine do:
    ssh -CA <your user>@<your-remote-ip> -L 20009:localhost:20009 -L 20008:localhost:20008
    # now you can access http://localhost:20009 in your local browser

This connection forwarding will also work with aws machines. For example, if you are using one of the AMIs fro EC2 from http://alestic.com then you can do (exchanging the correct keypair and public DNS):

    ssh -i ec2-keypair.pem -CA ubuntu@ec2.amazonaws.com -L 20009:localhost:20009 -L 20008:localhost:20008

Note: if you see an error like `channel 7: open failed: connect failed: Connection refused` it means you need to start TileMill (on the server) with `server=true`.

### Configuring to listen for public traffic

For some remote, headless deploys you may wish to have TileMill listen on more than localhost.

Of course only take this step if you do not have sensitive data and you are fully aware of the consequences of your maps being public.

The configuration below tells the TileMill core server to listen on the default ports but to also respond to traffic like a normal web server, allowing users to access the application via LAN or the Internet:

    {
      "listenHost": "0.0.0.0"
      "coreUrl": "<your ip>:20009",
      "tileUrl": "<your ip>:20008",
    }
