---
section: documentation
layout: book
category: TileMill
tag: Installation
title: Troubleshooting
permalink: /docs/linux-troubleshooting
hidden: true
---
If TileMill isn't starting up or performing properly, try these troubleshooting steps. This page is for **Ubuntu**. We also have instructions for [Mac OS X](/tilemill/docs/mac-troubleshooting) and [Windows](/tilemill/docs/win-troubleshooting).

## Update or reinstall TileMill

Some problems can be fixed by downloading a fresh copy of TileMill and installing again. Open the Terminal and enter the following command to do so.

    sudo apt-get install tilemill

## Reset configuration and plugins

This will reset any customizations you have made to TileMill preferences and will remove any TileMill plugins you have installed.

1. Quit TileMill.
2. Open the Terminal, type `cd ~/.tilemill`, and press enter.
3. Remove the `config.json` file and the `node_modules` folder by entering the following commands:

        mv config.json config.json.backup
        mv node_modules node_modules.backup

## Remove projects and data cache

1. Quit TileMill.
2. Open your `Documents` directory in the file manager.
4. Rename the `MapBox` folder to `MapBox-backup` to backup your projects.
5. Start TileMill again and a fresh `MapBox` directory should be created. If the application now behaves properly, copy the `project` folder from `MapBox-backup` to the newly created `MapBox` folder to restore your projects.
6. If the problem returns after restoring your projects, check the logs and contact support.

## Check the logs

1. Open the Terminal, type `tail -2000 ~/.tilemill.log`, and press enter.
2. Copy the log contents and paste it into a [gist](https://gist.github.com/) to share it with [support staff](http://support.mapbox.com/discussions/tilemill).

