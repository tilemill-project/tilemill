---
section: documentation
layout: book
category: TileMill
tag: Installation
title: Troubleshooting
permalink: /docs/mac-troubleshooting
hidden: true
---
If TileMill isn't starting up or performing properly, try these troubleshooting steps. This page is for **Mac OS X**. We also have instructions for [Ubuntu](/tilemill/docs/linux-troubleshooting) and [Windows](/tilemill/docs/win-troubleshooting).

## Update TileMill

Start TileMill, choose "Check For Updates..." from the "TileMill" menu, and download any available updates. If TileMill won't start, you can update by [downloading](http://mapbox.com/tilemill/) and installing the application again.

## Reinstall TileMill

Some problems can be fixed by [downloading](http://mapbox.com/tilemill/) a fresh copy of TileMill and installing it again.

## Reset configuration and plugins

This will reset any customizations you have made to TileMill preferences and will remove any TileMill plugins you have installed.

1. Quit TileMill.
2. In the Finder choose "Go to folder" from the "Go" menu.
3. Type `~/.tilemill` into the "Go to the folder" field and press the "Go" button.
4. Remove the `config.json` file and the `node_modules` folder or rename them to back them up.

## Remove projects and data cache

1. Quit TileMill.
2. In the Finder choose "Go to folder" from the "Go" menu.
3. Type `~/Documents` into the "Go to the folder" field and press the "Go" button.
4. Rename the `MapBox` folder to `MapBox-backup` to backup your projects.
5. Start TileMill again and a fresh `MapBox` directory should be created. If the application now behaves properly, copy the `project` folder from `MapBox-backup` to the newly created `MapBox` folder to restore your projects.
6. If the problem returns after restoring your projects, check the logs and contact support.

## Check for, and stop, any runaway processes

If TileMill crashes it is possible that some of its internal processes may continue running. While this is a top priority to fix in upcoming releases so that it never occurs, in the meantime users may need to know how to manually stop these "runaway" processes.

A startup error about ports not being available is a common symptom of runaway processes.

To stop them open the "Activity Monitor.app". This application is located in `/Applications/Utilities/Activity Monitor.app`.

After opening Activity Monitor you should see a listing of all running processes in an "Activity Monitor" window. If you do not see this then choose Window > Activity Monitor from the applications top menu.

Click on the "Process Name" column to sort by process name. Click to highlight any processes named "node", "tilemill", or ".mbtiles" then click the "Quit Process" button in the upper left and choose "Force Quit".

## Check the logs

1. If TileMill is open, choose "Console" from the "Window" menu. If TileMill isn't open and won't start up, open the "Console" application by going to "Applications > Utilities".
2. Once the Console application is open, select "TileMill.log" from the list.
    ![Open the Console to see the logs](/tilemill/assets/pages/mac-console.png)
3. Copy the log contents and paste it into a [gist](https://gist.github.com/) to share it with [support staff](http://support.mapbox.com/discussions/tilemill).

