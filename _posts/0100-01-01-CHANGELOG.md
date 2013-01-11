---
### This changelog is in YAML format and is a Jekyll post.
### It is the source file for the HTML changelog as well
### as the Sparkle appcast feed.
### NOTE - do not use colon otherwise you'll get an error like private method gsub called for #
###
tag: Installation
layout: changelog
section: tilemill
category: TileMill
date: 0201-01-30
title: Changelog
permalink: /changelog
releases:

# - version: 0.10.2
#
#  notes:
#  - TileMill/Mapnik - added support for filtering on 64 bit integers in datasource attributes
#  - TileMill/Mapnik - filtering out all values not equal to null is now possible like: `#layer[attr!=null];`
#  - TileMill/node-mapnik - null values in feature attributes are now correctly reported as `null` in the data table (rather than `undefined`). This helps users filter properly in their CartoCSS styles since this works `#layer[attr=null];` but not `#layer[attr=undefined];`
#  - TileMill - Fixed performance of map loading (previous 0.10.x versions saw slowdown with large styles)
#  - TileMill - Files cached by Mapnik are now cleared when a project is saved (like shapefile references and symbol files) allowing for better usability (can re-load files easier) and reduced memory usage (shapefiles no longer uses are dropped from memory)
#  - Tilemill - Added menu-based support for text undo/redo
#  - Millstone - Fixed handling of files with mixed or uppercase extensions like `test.CSV` or `aerial.geoTIFF`
#  - Millstone - Fixed handling of zip archives created by Mac OS X users (that contain special __MACOSX hidden directory)
#  - Millstone - You can now reference zip archives locally (not just as remote downloads)
#  - Millstone - You can now reference any files inside zip archives (not just shapefiles)
#  - Millstone - Improved error reporting when layer data files cannot be found
#  - Millstone - Added support for referencing (and downloading) remote images symbols that do not have a file extension in their url.
#  - CartoCSS - Various improved error reporting fixes
#  - CartoCSS - Fixed regex nesting inheritance
#  - Mapnik - Fixed possible high CPU hang on reading malformed GeoJSON
#  - Mapnik - added `marker-multi-policy` option to control marker rendering on multigeometries
#  - Mapnik - Fixed handling of ArcGIS/FME produced pointzm (3d) shapefiles
#  - Mapnik - Improved handling of shapefiles with null geometries
#  - Mapnik - Improved robustness of shapefile reader in the face of corrupt shapefiles (whose offsets do not match between the .shp and .shx)

- version: 0.10.1
  date: 2012-10-10
  size: 65709334
  sign: MC4CFQCv7b/Bm5GW3D4mxltyES0AJ++WkgIVAJyz95B3ZUnTznGE6czgQ2Ao0120

  notes:
  - TileMill - Fixed file handling behavior on windows to avoid symlink errors when run as non-admin
  - TileMill - autostyle now works against active stylesheet
  - TileMill - fixed crash when using relative paths to layers (like in open-streets-dc project)
  - TileMill - Enabled interactivity display in mbtiles export preview window
  - TileMill - Fixed tabs switching on plugins load
  - TileMill - Fixed handling of metatile setting in exports (ce6e7fc45e7517cba34f2075442d268d2b253db4)
  - Carto - Allows text-face-name properties to be unquoted
  - Carto - Detects inline Format XML tags in text-name and passes such output straight to XML for advanced text names.
  - Carto - Fixes bugs around concatenation of strings in expressions
  - Carto - Fixes parsing of comments in between selectors
  - Carto - Fixes parsing of whitespace in calls
  - Carto - Improved error messages for unknown properties - advises user on the property name most closely matching the incorrect input.
  - Carto - Improved errors for calls, advises user on number of arguments
  - Millstone - Will now throw if files do not exist (instead of throwing on missing/unknown srs)
  - Millstone - Fixed support for loading layer datasource files from alternative windows drives
  - Millstone - Moved to no-symlink/no-copy behavior on all windows versions
  - Millstone - Updated node-srs version
  - Millstone - Improved handling of known file extensions to better support guessing extensions via headers
  - Millstone - Fixed handling of sqlite attach with absolute paths
  - Millstone - Fixed missing error handling when localizing Carto URIs
  - Mapnik - Fixed handling of raster alpha blending with high quality resampling methods like bilinear
  - Mapnik - Reduced memory allocations for reading rasters for better raster rendering performance
  - Mapnik - Fixed RGB-HSV conversion used in `saturation` compositing operation
  - Mapnik - Improved support for CSV files with mixed newlines
  - Mapnik - CSV parsing speed up by avoiding adding WKT/JSON geometry data to attributes

- version: 0.10.0
  date: 2012-09-19
  size: 61721032
  sign: MCwCFH2IL/KIjgGnhj+c6vy3gVOuVCfKAhRAVM8UZMnKknNoXEjINyXOQ8vVcw==

  notes:
  - Support for Mapnik compositing at style level `comp-op` and feature level `polygon-comp-op` (porter-duff plus many more custom blend modes are supported)
  - Support for Mapnik image-filters like blur, emboss, and sharpen
  - Ability to turn on and off geometry clipping at feature level
  - Ability to smooth lines with `line-smooth`;
  - `marker-width` and `marker-height` are now expressions
  - `building-height` is now an expression
  - Added support for regex in carto filters like `#world[name =~ "A.*"]`
  - Added support for quotes in carto filter values like `#world[name2="Sa'ad"]`
  - Carto parsing now provides better errors for unmatched parens
  - Improved support for autodetection of geojson from the cartodb api (node-srs)
  - Added support for escaped URLs to remote datasources (for cartodb)
  - The raster-mode property has been renamed to raster-comp-op and now supports all SVG compositing operations (but uses dashes instead of underscores - so grain_merge is now grain-merge) (Mapnik)
  - Support for OS X 10.8 (Mountain Lion)
  - OS X app is now signed with Developer ID (Gatekeeper)
  - Interactivity now works on features that have negative or zero primary key values
  - Fixed a bug where interactivity templates broke when they ended in a number value
  - Version update checking no longer blocks application startup.
  - Column names in CSV datasources named 'lng' are now automatically recognized as the longitude column
  - Added ability to zoom to layer extents
  - Added ability to toggle layer visibility
  - Added ability to trigger opening http links by clicking on features using 'location' template
  - Added ability to set the metatile size in the project settings
  - Added ability to set the Map `buffer-size` size in CartoCSS
  - Added support for http proxies
  - Added support for remote icons (millstone)
  - Improved support for handling remote csv and kml files (millstone)
  - Added more raster resampling methods like windowed filters of 'blackman' and 'hanning'
  - Added ability to upgrade plugins
  - Fixed a bug where compatible plugin versions did not show up if there were newer incompatible versions
  - TileMill now supports reading CSVs with a column named either 'WKT' or 'GEOJSON' and encoded as either Well Known Text or GeoJSON, respectively. This allows CSV files to support more geometry types than just points.
  - New Verbose mode for getting more detailed information in the TileMill logs of project loading status
  - Symlinks are now used on Windows Vista and above to speed up project loading and data handling efficiency
  - Data now should automatically update when a project is saved on Windows (no longer a need to rename the #id or filename)
  - SVG/PDF export with labels should work again on Windows
  - Support for filtering by geometry type like `#countries['mapnik::geometry_type'=polygon]`. Both `point`, `polygon`, `linestring`, and `collection` are supported keywords that match geometry types. Collection means that a feature stores mixed types, like both a `point` and a `polygon`.

- version: 0.9.1.350
  dev: true
  date: 2012-09-17
  size: 61720731
  sign: MC0CFBm+WUfNenkZ3VCNXzrMpqJdNBhSAhUA2x4oAY4V4SNdLEAK6kpEOszub7M=
  notes:
  - New Project status reporting and verbose mode
  - Various Millstone fixes.
  - Mapnik [updates since 302](https://github.com/mapnik/mapnik/compare/d054178a75c...2d5287c298)
  - TileMill [updates since 302](https://github.com/mapbox/tilemill/compare/75a7e9fa4a...761968af68)

- version: 0.9.1.302
  dev: true
  date: 2012-08-31
  size: 81080340
  sign: MC4CFQCW1hdDNq/DY+3m7k9ldmupjZ/mOgIVANAabRI+ZASlVddHzxO4ZswNm/NS
  notes:
  - Development snapshot of TileMill 0.10.0-pre
  - Various fixes to CSV reading support
  - PostGIS extent can be auto-calculated
  - Proxy support was improved
  - Markers grid rendering has been improved
  - Numerous Mapnik fixes to compositing operations, alpha handling, and clipping behavior
  - Mapnik 2.1 is [now being used](http://mapnik.org/news/2012/08/24/release-2.1.0/)
  - Mapnik [updates since 276](https://github.com/mapnik/mapnik/compare/b43697fd5de...d054178a75c)
  - TileMill [updates since 276](https://github.com/mapbox/tilemill/compare/1b6ba21f75...75a7e9fa4a)

- version: 0.9.1.276
  dev: true
  date: 2012-08-03
  size: 81943211
  sign: MC4CFQC+hYVSiaU51n8iKaTx1kzkyTsx2gIVAOiKxz6shYoCf4Xf91vD0O/UoH1S
  notes:
  - Development snapshot of TileMill 0.10.0-pre
  - Mapnik [updates since 247](https//github.com/mapnik/mapnik/compare/e62739d14...b43697fd5de)
  - TileMill [updates since 247](https//github.com/mapbox/tilemill/compare/754818b365...1b6ba21f75)

- version: 0.9.1.267
  dev: true
  date: 2012-08-02
  size: 81944423
  sign: MC0CFQCSmh8ULR585Y3ajCI5kHKrclosHAIULum/ZhrtQvYcftH6JHGdhUh4zLw=
  notes:
  - Development snapshot of TileMill 0.10.0-pre
  - Mapnik [updates since 247](https://github.com/mapnik/mapnik/compare/39a1477eb...e62739d14)
  - TileMill [updates since 247](https://github.com/mapbox/tilemill/compare/66ab53a19...754818b365)

- version: 0.9.1.247
  dev: true
  date: 2012-07-31
  size: 81976072
  sign: MC4CFQC4/NVVDbDiZPcQCf2UTV5pSkXfJwIVAM29+CqLnP98nV9+aGXDl4OJSuAt
  notes:
  - Development snapshot of TileMill 0.10.0-pre
  - The 0.9.1.213 dev build newly supported the experimental 'composite-operation' keyword which has now been renamed to 'comp-op'

- version: 0.9.1.213
  dev: true
  date: 2012-07-16
  size: 82080336
  sign: MCwCFGdG5k5WTaO3Ilg7jh4VE9TmZAcaAhQ8OM3V910YKD9m6DsNOBGdJnqquw==

  notes:
  - Development snapshot of TileMill 0.10.0-pre
  - Available only if "Install Developer Builds" is checked in "Updates Preferences"

- version: 0.9.1
  date: 2012-05-07
  size: 83455965
  sign: MC4CFQDvaV9w+7IyMfsd3XZnNOadT70jfAIVAJq14ThnQ4CWG4zs1TwB/zWNTLS2

  notes:
  - Now using Node v0.6.17 (previous 0.9.0 release used Node v0.4.12)
  - Now using Mapnik 2.1.0-pre at 113f3937cf (previous 0.9.0 release used Mapnik 2.1.0-pre at b8632c20)
  - Better error output in logs if a crash occurs during rendering or exports
  - Supports PostGIS 2.0 (Mapnik)
  - Interactivity UI now warns about the need for users to provide a unique key for PostGIS layers.
  - Invalid fonts no longer prevent startup (Mapnik)
  - Better reporting of Carto parse errors to UI
  - Faster exports by detecting solid tiles and avoiding duplicate encoding and storage
  - Faster refresh after saving (Mapnik)
  - Fully 64-bit build on Mac OS X (dual 64/32-bit support dropped)
  - Better support for GDAL rasters - larger rasters can be loaded now without hitting "bad:alloc"
  - Supports zooming up to z22 (fixed by new Mapnik clipping and ModestMaps respecting project settings)
  - Now supports epsg projection syntax so that "+init=epsg:4326" can be used as shorthand for "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs" (proj epsg lookup tables now packaged)
  - Doc fixes to make it clearer how to run a headless [Ubuntu server](http://mapbox.com/tilemill/docs/guides/ubuntu-service)
  - Grid interactivity rendering faster (using async callbacks in node-mapnik)
  - KML now supported in Windows build (Mapnik uses OGR built with expat support)
  - PDF/SVG support now supports markers fully (Mapnik)
  - Reading interlaced PNG images now works (Mapnik)
  - Multigeometries are now labeled properly (Mapnik)
  - Improved support for rendering svg icons from [sjjb](http://www.sjjb.co.uk/mapicons) (Mapnik)

- version: 0.9.0.378
  dev: true
  date: 2012-05-02
  size: 85532293
  sign: MC0CFQCtx51v+JBQN0M2jCqCdrKLcL+GagIUQve5iGQr4memAnYO1mLTNriHVqA=

- version: 0.9.0.141
  dev: true
  date: 2012-04-24
  size: 82793436
  sign: MC4CFQDzIVUGGWA9LguQtoA0N1QrKSMuBQIVAKa8mlfzFAotbt6wInGGIs4pPe0G

- version: 0.9.0
  date: 2012-01-24
  size: 66944371
  sign: MCwCFCb/WtaUAuRc16A7Z4MacOODB4uiAhQkPXw+QKnD9UxX/pJ0BaN+asqqKw==

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
