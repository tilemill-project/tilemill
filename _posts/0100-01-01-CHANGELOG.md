---
### This changelog is in YAML format and is a Jekyll post.
### It is the source file for the HTML changelog as well
### as the Sparkle appcast feed.
tag: changelog
layout: changelog
section: developers
category: TileMill
title: Changelog
permalink: /docs/changelog
releases:


- version: 0.5.1
  date: 2011-09-07
  size: 54341919
  sign: MCwCFESkb0ub6SL6KGrMgPEVW22E9aIJAhRlTbXR3jcjWBLi07PK3ks4OmW71Q==

  notes:
  - Fixed bug in OS X app that would activate the "Launch Browser" button before TileMill was ready.
  - Update to CodeMirror 2.13.
  - Better line-by-line error reporting for Carto files.
  - Fixed bug that would break conditional styles on some PostGIS layers.
  - Faster rendering thanks to performance improvements in Mapnik.

- version: 0.5.0
  date: 2011-08-25
  size: 54966410
  sign: MC0CFD5JLjVnLtoMNh8RpN4qIk93oelbAhUA+ODVplRgaNSYhpRQoM/1+qEKIF0=

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
