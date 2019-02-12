# Changelog

A summary of changes to TileMill can be found in the [TileMill Documentation Upgrade Notes](https://tilemill-project.github.io/tilemill/docs/upgrade/). Detailed dev notes about changes can be found below.

## [v1.0.0] - 2019-02-??

Tilemill has now been updated from the great work of [TileOven](https://github.com/florianf/tileoven), which was merged back into this project.  The current goal is to update TileMill's dependencies to current versions and bring back GUI apps for each platform using Electron.

Changes from [TileOven](https://github.com/florianf/tileoven) were pulled on Jan 20, 2019. Changes pulled from Tileoven, since original fork from Tilemill

### Features

- Forked millstone, tilelive, node-srs dependencies, Node 8 now supported
- Support for Node 8, thanks to patches and updated dependencies of @paulovieira
- Added layer selection to map panel for fast comparisons with OSM and to save render time for low zoom levels
- Added search field to layer panel
- Added search field to styles panel
- Added cloning of layers to layer panel
- Layer actions only shown on hover, ideal for long layer names and reduces visual noise
- Increased size of layer panel
- Updated carto and node-mapnik dependencies, new CartoCSS commands available
- Remember last selected folder in new layer dialog
- Better compatibility with kosmtik, TileMill mml project files should work out of the box with kosmtik (https://github.com/kosmtik)

### Bugfixes

- Removed topcube and other obsolete dependencies
- Removed windowed mode, only server mode is supported
- Fixed Tab indentation in editor window
- Fixed "Close" button bugs in Google Chrome (https://github.com/mapbox/tilemill/issues/2534)
- Fixed mbtiles preview map
- Removed Mapbox integration
- Fixed CartoCSS variable auto completion
- Fixed creation of job file in export if it doesn't exist
- Fixed multiple output of CartoCSS errors to update to latest version

## [v0.10.1] - date

### Added
- description

### Changed
- description

### Deleted
- description
