---
### This changelog is in YAML format and is a Jekyll post.
### It is the source file for the HTML changelog as well
### as the Sparkle appcast feed.
###
tag: Installation
layout: changelog
section: documentation
category: TileMill
date: 0201-01-30
title: Changelog
permalink: /docs/changelog
releases:

- version: 0.9.0
  date: 2011-01-24
  size: 65347719
  sign: MC4CFQDPatJHVsDgppDQ3bNS9Tw2BugtFAIVAMiRfz1eankHivWHy/+xsWRJnRYO

  notes:
  - Plugin system for UI components.
  - Core app & tile servers are now separate processes.
  - Redesigned UI with global sidebar navigation.
  - Redesigned UI for export and project settings.
  - Native webkitgtk based browser window for Linux version.
  - Native CEF (chromium embedded) browser window for Windows version.
  - Added `server` commandline/config option for running TileMill without a window.
  - Datasource downloads and other mapnik-intensive operations can now be cancelled.
  - Upload export command for rendering and uploading at once.
  - Project thumbnails are now cached at save time to a `.thumb.png` file local to each project.
  - Improvements to full screen mode behavior on Mac OS X 10.7 Lion.

- version: 0.8.0.472
  dev: true
  date: 2012-01-17
  size: 76880853
  sign: MC4CFQDhjCmHBnnXuzEut5rtHfIheQsvUwIVAIwKTSx17+zp1udVCiutw1IJjm4L

- version: 0.8.0.310
  dev: true
  date: 2012-01-11
  size: 71410877
  sign: MC0CFQDPH3pDCc+OxigU4y6Skl1pmOwU9gIUCsj6sTu6OM5RPsTJIMgTtEO1cJ4=

- version: 0.8.0.121
  dev: true
  date: 2011-12-23
  size: 68527190
  sign: MCwCFEh+2SzQwW+STC95ACdR2enIcn+JAhQlv0CElazUN/DXn+T+/gkVASbZ7Q==

- version: 0.8.0
  date: 2011-12-22
  size: 65764517
  sign: MC0CFDfyJkCrtSXzuLJzZPT2WZuuQoBPAhUAv+h15+NxowY8w2S9hOrnpv0hj+c=

  notes:
  - Added preference pane and about box to main app.
  - Added ability to authenticate with MapBox to upload directly to your hosting account.
  - Support for inverted sections in Mustache tooltip templates.
  - File browser now defaults to the user's home directory.
  - No longer create a data directory in the MapBox folder.
  - Centerpoint is included in exports if it is valid.
  - More reasonable default zoom settings for new projects.
  - Added option to update to development builds.
  - Moved preferences to `~/.tilemill/config.json`.
  - Changed default server port to 20009.
  - Better logging/error reporting from export command.

- version: 0.7.2.138
  dev: true
  date: 2011-12-16
  size: 65733750
  sign: MC0CFFsb8XVpMkV6QLqdBYVIS2auqnPEAhUAsrITOLkRr6VxZAL9Mz85rWAuhKI=

- version: 0.7.2.86
  dev: true
  date: 2011-12-12
  size: 65432672
  sign: MC4CFQDaC2AahRX82nBst/jhLKjhSAWxeQIVANNP652ch5Nyjkaw+rO8QOV74r0F

- version: 0.7.2
  date: 2011-12-08
  size: 66311839
  sign: MCwCFDWWlHhqrcFhiHgHy37TIRuUtjHdAhRv05/olYM9cMRa+6gsM987fpxiyQ==

  notes:
  - Fix jitter in Carto editor.
  - Add support for conditionals in Mustache templates.
  - Better first run experiance for Ubuntu users.

- version: 0.7.1
  date: 2011-12-07
  size: 62158055
  sign: MC0CFEGZ1Mtuw4vP9bX1tFVNEJhkzYNLAhUAyGRM9UXA/piCPo21kIizDvt0mS0=

  notes:
  - Introduces Save & Style, an option to automatically add an appropriate
    style for a layer when you add it to your project.
  - Updates CodeMirror, fixing a Safari glitch.
  - Fixes a performance problem related to computing colors
    while typing stylesheets.
  - Improves error formatting for technical errors.
  - Fixes location formatter in exports.
  - Allows for Linux Mint 11 Katya in Linux install script.
  - Improves performance of front page listing and project
    opening.
  - Improved autocompletion of selectors, properties,
    and values.
  - Updated default project and default stylesheet to use
    Natural Earth 1.4, with proper Sudan borders.
  - Adjusted Sparkle Mac OS X updating system.

- version: 0.7.0
  date: 2011-11-20
  size: 58399816
  sign: MC0CFCDhkHU1BTJ32n/AWGv+vDSREAFKAhUAjhIqAUqtqlfhhBltAxJFBa0f/gg=

  notes:
  - Fixed a bug in the Mac app where saving files such as exports would not obey custom filenames entered.
  - Ensured that saved files automatically contain the original file's extension if a custom filename is entered.
  - Added autocomplete in Carto editor for properties, variables and values. Press 'tab' to activate.
  - Upload MBTiles to MapBox Hosting directly from export menu.
  - Includes SQLite fixes from Mapnik which ensure features are not missing and all join types are supported.
  - Significant changes to how interactivity is authored and exported.
    [Mustache](http://mustache.github.com/) templates are now used instead of pure JavaScript.
  - Add ability to browse entire local filesystem when adding or editing a layer.

- version: 0.6.2
  date: 2011-11-01
  size: 61254835
  sign: MC0CFAbq548a+BiNZwA8qTgyLXxymJg3AhUAvTIEXn2OEKc2pFYA4Fsfcm45xBs=

  notes:
  - Fixed a bug that would prevent interactivity behavior from the first row in an imported CSV from working.
  - Fixed a bug where highlighted syntax errors in the Carto editor would not show tooltips properly.
  - Fixed a bug in the Mac app that would prevent some alert and confirmation dialogs from working properly.
  - Fixed a bug in the Mac app where the user wouldn't be prompted to save their work at app quit time.
  - Removed behavior in datasource panel that would force the SRS for certain file extensions.
  - Custom SRS strings are supported for CSV files, but the default remains WGS84.
  - More robust CSV parsing.

- version: 0.6.1
  date: 2011-10-26
  size: 61268451
  sign: MCwCFFKfoN3MIscOoz4i5TsMfYrqizEsAhR2bLWoXnhwYQjQJx9wvNr85FCQMA==

  notes:
  - Fixed several bugs with the Mac OS X interface that prevented the user from clicking links.

- version: 0.6.0
  date: 2011-10-25
  size: 61176469
  sign: MC0CFB4RKbv0zmzp8z0s+4QnOLtNEGrvAhUA13NNcox2vTa2yv0FpQLaX3LCMoM=

  notes:
  - Added a native Mac OS X user interface.
  - Ubuntu app redesigned to feel more like a desktop application. See [upgrade
    notes](http://mapbox.com/tilemill/docs/upgrade/) for important migration information.
  - Added support for CSV datasources.
  - Added support for export to SVG.
  - Added support for downloading remote datasources over HTTPS.
  - For remote datasources, TileMill can now use the Content-Disposition HTTP
    header to automatically identify the datasource type.
  - By default, connections are now only accepted from the loopback interface.
  - Fixed bug in Carto where the pound sign in an ID selector was optional.

- version: 0.5.1
  date: 2011-09-07
  size: 54341919
  sign: MC4CFQDCvneOlUKcQneRCNIfy/vrs+ZBIQIVAOUD6mzQrITdBNSrv86XJO7WauXt

  notes:
  - Fixed bug in OS X app that would activate the "Launch Browser" button before TileMill was ready.
  - Update to CodeMirror 2.13.
  - Better line-by-line error reporting for Carto files.
  - Fixed bug that would break conditional styles on some PostGIS layers.
  - Faster rendering thanks to performance improvements in Mapnik.

- version: 0.5.0
  date: 2011-08-25
  size: 54966410
  sign: MC0CFQDYZwPKnPQfMz9Sa+6FJr6bVZxu4gIUJFa/5mBuKzqKq4X2bBB6vF0uD7s=

  notes:
  - SQLite/SpatiaLite datasource support.
  - Fixed bug in manual breadcrumb.
  - Autocorrect common id/class entry errors.
  - Handy preference panel in Mac OS X application.
  - Advanced field for datasources.
  - Fixed sytax error in Ubuntu install script.
  - New projects can optionally empty to save bandwith.
  - Better wording of buttons in modal confirmation dialogs.
  - Fix for bug that would cause Safari 5.1 to crash.
  - Fix for frequent "Forbidden" errors in Safari.
  - Automatic updates for Mac OS X app.


- version: 0.4.2
  notes:
  - Bugfixes.


- version: 0.4.1
  notes:
  - Bugfixes.


- version: 0.4.0
  notes:
  - Major rewrite of application.
  - app.db file from previous versions is not compatible with 0.4
  - Default files directory is now ~/Documents/MapBox


- version: 0.3.0
  notes:
  - Basic PostGIS layer support
  - New opacity features in Carto
  - Fix bug that prevent rendering non-interactive tilesets in some cases


- version: 0.2.1
  notes:
  - Fix bug with S3 bucket listing


- version: 0.2.0
  notes:
  - Upgrading requires an upgraded version of Mapnik. See the installation section of the README for Mapnik version and installation instructions.
  - Interactivity authoring
  - Use Modest Maps for map preview
  - Improved performance
  - Bug fixes


- version: 0.1.4
  notes:
  - Initial public release
---
