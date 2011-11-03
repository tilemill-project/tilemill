---
### This changelog is in YAML format and is a Jekyll post.
### It is the source file for the HTML changelog as well
### as the Sparkle appcast feed.
###
### The 'oldrev' is only needed for 0.5.0/0.5.1 since the
### Sparkle scheme changed for 0.6.0+ (see #730).
###
tag: changelog
layout: changelog
section: documentation
category: installation
title: Changelog
permalink: /docs/changelog
releases:

# - version x.x
#
# notes:
# - Fixed a bug in the Mac app where saving files such as exports would not obey custom filenames entered.
# - Ensured that saved files automatically contain the original file's extension if a custom filename is entered. 

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
  oldrev: 2917
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
  oldrev: 2875
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
