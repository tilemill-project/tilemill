---
layout: docs
section: help
category: reference
tag: Reference
title: Exporting
permalink: /docs/manual/exporting
---
Once you've finished a map design, you can export your map for use in other applications. You can export the entire world or choose a smaller region by setting the bounding box. TileMill can export a variety of formats and each has different advantages.

With a TileMill project open, the export menu at the top-right of the window and presents a number of options.

![TileMill export menu](/tilemill/assets/pages/export.png)

## Interactive, multiscale exports

The __Upload__ and __MBTiles__ options will export pannable, zoomable maps just like the preview you see in TileMill. Any legends and interactive elements will be included. Depending on what you are exporting, this process can take up considerable time and disk space.

The MBTiles option creates a package of [tiles](http://mapbox.com/developers/guide/) that can be used in a variety of ways. You can upload them to a MapBox account, host them yourself with [TileStream](https://github.com/mapbox/tilestream) or transfer them to [MapBox for iPad](http://mapbox.com/ipad/) for offline access. Technical details about MBTiles files can be found in the [MapBox developers documentation](http://mapbox.com/developers/mbtiles/).

If you have a [MapBox account](http://mapbox.com/plans/) you can connect it with your TileMill installation and use the Upload export to streamline the process of creating an MBTiles file and uploading it to MapBox.

<!-- TODO: Export options -->

## Static image exports

The __PNG__, __PDF__, and __SVG__ export options allow you to export specific views of your map. If your project includes legends or interactive elements they will not be included for these types of exports.

Use PNG to export a static image of your map. This format is useful if you want to add a snapshot to a word processor.

PDF and SVG provide vector-based exports of your map, which are useful if you're designing maps for printed material or need to make further edits to the design or layout. Both PDF and SVG output should contain very similar content but SVG is often supported by drawing programs natively (does not require conversion upon import).

<!-- TODO: Export options -->

## Mapnik XML export

TileMill's __Mapnik XML__ export option is aimed at advanced users who are familiar with [Mapnik](http://mapnik.org/), the software that TileMill uses under the hood to handles rendering your maps.

TileMill uses [CartoCSS](https://github.com/mapbox/carto) to translate your CSS styles and layer definitions into the XML format that Mapnik can read each time you save your project. Most users will not need to directly use this underlying Mapnik XML, but it is easy to leverage if you want to move your raw map styles out of TileMill to set up for rendering directly with Mapnik, or other tools that work with Mapnik like [TileStache](http://tilestache.org/) and [Invar](https://github.com/onyxfish/invar/).

<small class='note' markdown='1'>
__Note:__ If you export a Mapnik XML file into a TileMill project directory, this XML style will __override__ all of the layers and stylesheets for that project. Any changes you make to the project in TileMill will not be visible until the XML file is moved.
</small>

## Exports from the command line

TileMill can be invoked from a terminal shell. This is useful for running exports on headless servers or scripting batch exports. To do this you'll need to find and execute TileMill's `index.js` file, the specifics of which will depend on your platform.

### Mac OS X

    cd /Applications/TileMill.app/Contents/Resources/
    ./index.js export --help

### Ubuntu

    node /usr/share/tilemill/index.js export --help

<small class='note' markdown='1'>
For other Linux distribution or for custom-compiled TileMill installation, you'll can to navigate to the directory where TileMill is installed and execute `./index.js export --help` from there.
</small>

### Windows

    cd "C:\Program Files (x86)\TileMill-v0.10.0\tilemill"
    .\node.exe .\index.js export --help

### Export examples

To export an mbtiles file into `~/Documents/MapBox/export` (the same folder the TileMill user interface will use)
from the `geography-class` project for a restricted set of zoom levels do:

    ./index.js export geography-class ~/Documents/MapBox/export/geography-class.mbtiles --minzoom=0 --maxzoom=5

To export a single png image from the `geography-class`	project for a bounding box representing the USA do:

    ./index.js export geography-class ~/Documents/MapBox/export/geography-class.png --format=png --width=600 --height=400 --bbox="-131.4844,20.3034,-62.5781,51.3992"

### How to make the export less verbose

By default Millstone outputs a lot of debugging information, but this can be disabled on the fly by doing:

    export NODE_ENV=production

Do this in the shell in which you run the export command.

You can also pass `--verbose=off` to reduce the amount of output from TileMill's export script.

### Command line export options

Usage:

    index.js export [options] <project> <export_file>

Options:

<table style='table-layout:auto'>
<tr><td><strong>--format=</strong>[format]                 </td><td>Export format (png|jpeg|tiff|pdf|svg|mbtiles|upload|sync). (Default: undefined)</td></tr>
<tr><td><strong>--bbox=</strong>[xmin,ymin,xmax,ymax]      </td><td>Comma separated coordinates of bounding box to export. (Default: undefined)</td></tr>
<tr><td><strong>--minzoom=</strong>[zoom]                  </td><td>MBTiles: minimum zoom level to export. (Default: undefined)</td></tr>
<tr><td><strong>--maxzoom=</strong>[zoom]                  </td><td>MBTiles: maximum zoom level to export. (Default: undefined)</td></tr>
<tr><td><strong>--width=</strong>[width]                   </td><td>Image: image width in pixels. (Default: 400)</td></tr>
<tr><td><strong>--height=</strong>[height]                 </td><td>Image: image height in pixels. (Default: 400)</td></tr>
<tr><td><strong>--url=</strong>[url]                       </td><td>URL to PUT updates to. (Default: undefined)</td></tr>
<tr><td><strong>--log</strong>                             </td><td>Write crash logs to destination directory. (Default: undefined)</td></tr>
<tr><td><strong>--quiet</strong>                           </td><td>Suppresses progress output. (Default: undefined)</td></tr>
<tr><td><strong>--scheme=</strong>[scanline|pyramid|file]  </td><td>Enumeration scheme that defines the order in which tiles will be rendered. (Default: "scanline")</td></tr>
<tr><td><strong>--job=</strong>[file]                      </td><td>Store state in this file. If it exists, that job will be resumed. (Default: false)</td></tr>
<tr><td><strong>--list=</strong>[file]                     </td><td>Provide a list file for filescheme render. (Default: false)</td></tr>
<tr><td><strong>--metatile=</strong>[num]                  </td><td>Metatile size. (Default: undefined)</td></tr>
<tr><td><strong>--scale=</strong>[num]                     </td><td>Scale factor (Default: undefined)</td></tr>
<tr><td><strong>--concurrency=</strong>[num]               </td><td>Number of exports that can be run concurrently. (Default: 4)</td></tr>
<tr><td><strong>--files=</strong>[path]                    </td><td>Path to files directory. (Default: "/home/aj/Documents/MapBox")</td></tr>
<tr><td><strong>--syncAPI=</strong>[URL]                   </td><td>Mapbox API URL. (Default: "http://api.tiles.mapbox.com")</td></tr>
<tr><td><strong>--syncURL=</strong>[URL]                   </td><td>Mapbox sync URL. (Default: "https://tiles.mapbox.com")</td></tr>
<tr><td><strong>--syncAccount=</strong>[account]           </td><td>Mapbox account name. (Default: "")</td></tr>
<tr><td><strong>--syncAccessToken=</strong>[token]         </td><td>Mapbox access token. (Default: "")</td></tr>
<tr><td><strong>--verbose=</strong>on|off                  </td><td>verbose logging (Default: "on")</td></tr>
<tr><td><strong>--config=</strong>[path]                   </td><td>Path to JSON configuration file.</td></tr>
</table>

