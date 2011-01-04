TileMill
--------
TileMill is a map style editor and simple data visualization tool. It currently
provides

- management of layers with shapefile-based datasources and stylesheets in a
Mapnik/Cascadenik MML file,
- an interface for editing Mapnik/Cascadenik MSS files,
- inspection of metadata in datasources including field data types, sample
values, and so on,
- a set of sensible visualization tools for labeling and shading maps to quickly
explore a datasource.

Requirements
------------
* **TileMill client**: A modern, standards compliant web browser.
  * Tested: Chrome 6+
  * Tested: Firefox 3+
  * Target: IE7+
  * May work: Opera 11
* **TileMill server**
  * ndistro
  * node 2.5
  * Mapnik 2 [SVN Revision 2488](http://svn.mapnik.org/trunk)
  * [node-mapnik](https://github.com/mapnik/node-mapnik)

Setup
-----

## Building

* Build and install Mapnik 2.
* Install node.js 2.5 using a package manager or building from source.
* Install node-mapnik using a package manager or building from source.
* Install [ndistro](https://github.com/visionmedia/ndistro)
* Build TileMill dependencies by running ndistro from the TileMill directory

        cd TileMill
        ndistro

## Configuration

* Optional. Edit the file 'settings.js', including the directory where you'd
  like to keep TileMill's working files (projects and stylesheets). These can
  be in your main documents directory or near other TileMill files.
* Include your s3 credentials or remove the s3 section if you don't want to use
  that functionality.
* Include the directory where you want to store shapefiles and other data, or
  remove the section in configuration.

## Running

    node tilemill.js

TileMill should now be running on http://localhost:8889/

Architecture
------------
@TODO out of date. Update to reflect recent consolidation.

TileMill is based on [TileLive](http://github.com/developmentseed/TileLive) and
follows its lead by making the interaction between the map storage backend, map
editing client, and map rasterizer/inspector RESTful. A typical TileMill
installation thus divides its tasks into three separate components:

- The TileMill client consists of HTML and JavaScript that provides the editing
and visualization interface that users interact with.
- The TileMill server provides the storage and retrieval mechanism for the MML
and MSS files that the client creates and edits. The TileMill server **must** be
accessible via HTTP to both the TileMill client and the rasterizer.
- The rasterizer (in this case TileLiteLive) renders maps based on the data
sources and styles described by MML files on the TileMill server. The rasterizer
**must** be accessible via HTTP to the TileMill client.

In addition, references to MSS files, image resources, shapefile datasources,
and so on must all be available to the rasterizer via HTTP. While this is a
significant departure from many "typical" map designing workflows, it allows
TileMill projects to be portable between clients if set up properly.

Authors
-------
- Dmitri Gaskin (dmitrig01)
- Young Hahn (yhahn)
- Tom MacWright (tmcw)
- AJ Ashton (ajashton)
