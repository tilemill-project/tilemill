# Changelog

A summary of changes to TileMill can be found in the [TileMill Documentation Upgrade Notes](https://tilemill-project.github.io/tilemill/docs/upgrade/). Detailed dev notes about changes can be found below.

## [v1.1.0] - 2019-05-30

- Boxselector enhancements from Wax allowing box to be moved relative to the map without changing the box size.
- Support for aspect ratio and locked aspect ratio in export and project settings.
- Added better instructions within export.
- Added delete all, search, and new fields in export list.
- Added ability to reload the export settings from a previous export.

## [v1.0.1] - 2019-02-25

- Fix to a test issue in the abilities test. Did not impact the TileMill app.

## [v1.0.0] - 2019-02-23

Tilemill has now been updated from the great work of [TileOven](https://github.com/florianf/tileoven), which was merged back into this project.  The current goal is to update TileMill's dependencies to current versions and bring back GUI apps for each platform using Electron.

**Implemented enhancements:**

- Update all references that point to Mapbox [\#2665](https://github.com/tilemill-project/tilemill/issues/2665)
- Update tilelive-mapnik to latest version [\#2660](https://github.com/tilemill-project/tilemill/issues/2660)
- Update semver version to latest. [\#2658](https://github.com/tilemill-project/tilemill/issues/2658)
- Update as many easy dependent module versions as possible [\#2653](https://github.com/tilemill-project/tilemill/issues/2653)
- Update semver, JSV, backbone dependency versions [\#2651](https://github.com/tilemill-project/tilemill/issues/2651)
- Upgrade Carto to newer version [\#2649](https://github.com/tilemill-project/tilemill/issues/2649)
- Hardcode dependency versions in package.json [\#2639](https://github.com/tilemill-project/tilemill/issues/2639)
- Update Mapnik to use v3.7.2? [\#2636](https://github.com/tilemill-project/tilemill/issues/2636)

**Fixed bugs:**

- Fix security vulnerabilities [\#2647](https://github.com/tilemill-project/tilemill/issues/2647)
- Update Mocha Tests [\#2644](https://github.com/tilemill-project/tilemill/issues/2644)

**Merged pull requests:**

- Replace references to Mapbox [\#2666](https://github.com/tilemill-project/tilemill/pull/2666) ([csytsma](https://github.com/csytsma))
- Update mapnik to v3.7.2 [\#2664](https://github.com/tilemill-project/tilemill/pull/2664) ([csytsma](https://github.com/csytsma))
- Upgraded tilelive-mapnik to latest version. [\#2663](https://github.com/tilemill-project/tilemill/pull/2663) ([tpotter7](https://github.com/tpotter7))
- Update Carto to v1.0.1 for issue 2649 [\#2662](https://github.com/tilemill-project/tilemill/pull/2662) ([csytsma](https://github.com/csytsma))
- Updated tilelive-mapnik version. [\#2661](https://github.com/tilemill-project/tilemill/pull/2661) ([tpotter7](https://github.com/tpotter7))
- Updating semver from 5.0.0 to 5.6.0. [\#2659](https://github.com/tilemill-project/tilemill/pull/2659) ([tpotter7](https://github.com/tpotter7))
- Issue 2653: update easy dependent module versions. [\#2657](https://github.com/tilemill-project/tilemill/pull/2657) ([tpotter7](https://github.com/tpotter7))
- Issue \#2651: Updated versions of semver, JSV, and backbone [\#2652](https://github.com/tilemill-project/tilemill/pull/2652) ([tpotter7](https://github.com/tpotter7))
- Fix security vulnerabilities from Github [\#2648](https://github.com/tilemill-project/tilemill/pull/2648) ([csytsma](https://github.com/csytsma))
- Fixes issue 2644 [\#2646](https://github.com/tilemill-project/tilemill/pull/2646) ([csytsma](https://github.com/csytsma))
- Update README.md for TileOven merge [\#2643](https://github.com/tilemill-project/tilemill/pull/2643) ([csytsma](https://github.com/csytsma))
- Update to README [\#2642](https://github.com/tilemill-project/tilemill/pull/2642) ([tpotter7](https://github.com/tpotter7))
- Issue 2639 [\#2641](https://github.com/tilemill-project/tilemill/pull/2641) ([csytsma](https://github.com/csytsma))
- Pull Tileoven back to Tilemill [\#2637](https://github.com/tilemill-project/tilemill/pull/2637) ([csytsma](https://github.com/csytsma))

## [v0.11.0-deprecated] - 2019-01-20
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