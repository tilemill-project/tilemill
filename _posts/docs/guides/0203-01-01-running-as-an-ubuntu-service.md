---
layout: docs
section: help
category: guides
tag: Guides
title: Running as an Ubuntu service
permalink: /docs/guides/ubuntu-service
prereq:
- "[Installed TileMill](/tilemill/docs/install) on your computer."
---
{% include prereq.html %}

By default, TileMill runs as a desktop-style application on Ubuntu. See the [Usage manual page](/tilemill/docs/manual/usage/) for details on the desktop setup.

TileMill can also be run as a system-wide, server-only service simply by making a single modification to the default config options.

    {
      "server": true
    }

If you try to launch tilemill without providing `server=true` on a machine without a desktop graphics display you will see an error like:

    Error parsing options: Cannot open display:
    Exiting [tilemill]

If `server` is `true` then TileMill will not attempt to launch a native UI process.

Also, TileMill defaults to reading data from the `~/Documents/MapBox` directory of the user running the process. For a system-wide TileMill service a global location with special permissions should be used.

### Launching service using Upstart

If you have installed TileMill from packages (`apt-get install tilemill`) then [upstart](http://upstart.ubuntu.com/) can be used to launch TileMill as the `mapbox` user using a the package-installed config of:

    {
      "files": "/usr/share/mapbox",
      "server": true
    }

_This config file is installed at `/etc/tilemill/tilemill.config`_

These commands can be used to manage TileMill through upstart:

- **Start** TileMill by running `sudo start tilemill`
- **Stop** TileMill by running `sudo stop tilemill`
- **Restart** TileMill by running `sudo restart tilemill`
- **Files** used by TileMill are in `/usr/share/mapbox`
- **Logs** are written to `/var/log/tilemill`
- **Preferences** can be changed by editing `/etc/tilemill/tilemill.config`

To manually start a TileMill installed from packages you can find the launch script at `/usr/share/tilemill/index.js` and then follow the instructions below for launching the server from a source build.

### Launching service from source build

If you have installed TileMill from [source](source/) then startup can be done manually like:

    ./index.js --server=true # server=true prevents the UI from opening

Upon the first run of TileMill, a config file will be created in your user's home directory, if one does not already exist and if you are not pointing to a custom config location in the command line arguments.

_All default options can be seen (BUT DO NOT EDIT THESE) in the default config base in `lib/config.defaults.json`._

You can add `server: true` to a custom config and read it instead:

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

But, be careful. Only take this step if you do not have sensitive data and you are fully aware of the consequences of your maps being public.

The configuration below tells the TileMill core server to listen on the default ports but to also respond to traffic like a normal web server, allowing users to access the application via LAN or the Internet:

    {
      "listenHost": "0.0.0.0"
      "coreUrl": "<TILEMILL_HOST>:20009",
      "tileUrl": "<TILEMILL_HOST>:20008",
      "server": true
    }

Note: the `<TILEMILL_HOST>` value above needs to be exchanged either with your IP or hostname. For example, to expose TileMill publicly by hostname you could do:

    TILEMILL_HOST="example.com"
    ./index.js --server=true --listenHost=0.0.0.0 --coreUrl=${TILEMILL_HOST}:20009 --tileUrl=${TILEMILL_HOST}:20008


And to expose by raw ip you could do:

    TILEMILL_HOST=`ifconfig eth0 | grep 'inet addr:'| cut -d: -f2 | awk '{ print $1}'`
    ./index.js --server=true --listenHost=0.0.0.0 --coreUrl=${TILEMILL_HOST}:20009 --tileUrl=${TILEMILL_HOST}:20008
