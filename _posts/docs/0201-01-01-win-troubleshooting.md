---
section: documentation
layout: book
category: TileMill
tag: Installation
title: Troubleshooting
permalink: /docs/win-troubleshooting
hidden: true
---
If TileMill isn't starting up or performing properly, try these troubleshooting steps. This page is for **Windows**. We also have instructions for [Ubuntu](/tilemill/docs/linux-troubleshooting) and [Mac OS X](/tilemill/docs/mac-troubleshooting).

## Run TileMill as an administrator

Navigate to the TileMill item in the Start menu. Right click on the menu item and choose "Run as administrator".

## Update or reinstall TileMill

Some problems can be fixed by [downloading](http://mapbox.com/tilemill/) a fresh copy of TileMill and installing it again.

## Reset configuration and plugins

This will reset any customizations you have made to TileMill preferences and will remove any TileMill plugins you have installed.

1. Quit TileMill.
2. Right click on the "Start" button and choose "Open Windows Explorer" from the menu.
3. Naviate to `C:\Users` or `C:\Documents and Settings` depending on your Windows version.
4. Open the folder for you Windows user.
5. Open the `.tilemill` folder.
4. Remove the `config.json` file, the `cache-cefclient` folder, and the `node_modules` folder or rename them to back them up.

## Remove projects and data cache

1. Quit TileMill.
2. Right click on the "Start" button and choose "Open Windows Explorer" from the menu.
3. Open the "Documents" folder.
4. Rename the `MapBox` folder to `MapBox-backup` to backup your projects.
5. Start TileMill again and a fresh `MapBox` directory should be created. If the application now behaves properly, copy the `project` folder from `MapBox-backup` to the newly created `MapBox` folder to restore your projects.
6. If the problem returns after restoring your projects, check the logs and contact support.

## Check the logs

1. Right click on the "Start" button and choose "Open Windows Explorer" from the menu.
2. Naviate to `C:\Users` or `C:\Documents and Settings` depending on your Windows version.
3. Open the folder for you Windows user.
4. Inspect the `tilemill.log` file or attach it to a [support dicussion](http://support.mapbox.com/discussions/tilemill).
