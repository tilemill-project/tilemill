---
layout: docs
section: help
category: guides
tag: Guides
title: "Complex 3D Structures"
permalink: /docs/guides/tilemill-complex-3d-structures
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
- "[Set up GDAL](/tilemill/docs/guides/gdal/) for processing raster data in the terminal."
nextup:
- "[Pansharpening](/tilemill/docs/guides/gdal)"
---

{% include prereq.html %}

TileMill's ability to map 3D complex structures continues to improve. This guide builds on our [experiments in the 3rd dimension](http://mapbox.com/blog/experiments-3rd-dimension/) blog post using Mapnik's [Building Symbolizer](https://github.com/mapnik/mapnik/wiki/BuildingSymbolizer) to render building polygons with a height attribute in TileMill.

The District of Columbia, as part of its open government data program, publishes a [building polygons](http://dcatlas.dcgis.dc.gov/metadata/BldgPly.html) dataset and a [3D Buildings](http://dcatlas.dcgis.dc.gov/metadata/BldgPly_3D.html) dataset. The main differences between the two datasets are the level of detail and the geometry type. I'm going to be working with the 3D Buildings layer, which contains highly detailed structures and uses [ESRI's Multipatch Geometry Type](http://www.esri.com/library/whitepapers/pdfs/multipatch-geometry-type.pdf).

Because the Multipatch geometry type is not as broadly supported in [GDAL](http://gdal.org) as are 2 dimensional geometries, we need to include an additional flag <code>-nlt "MULTIPOLYGON25D"</code> in our script to convert the Shapefile to a PostGIS layer using the command line utility [ogr2ogr](http://www.gdal.org/ogr2ogr.html).

    #!/bin/bash

    PG_GDAL="user=postgres host=localhost port=5432 dbname=postgis"

    ogr2ogr \
       -f PostgreSQL \
       -t_srs EPSG:900913  \
       PG:"$PG_GDAL" \
       BldgPly_3D.shp \
       -nln building_3d \
       -nlt "MULTIPOLYGON25D"

By including the <code>-nlt</code> option, we ensure that the new PostGIS table's geometry column contains latitude, longitude, and altitude for each multipolygon. This allows us to use [PostGIS' 3D Spatial Functions](http://postgis.net/docs/manual-2.0/PostGIS_Special_Functions_Index.html#PostGIS_3D_Functions).

As explained in the [TileMill 3D blog post](http://mapbox.com/blog/experiments-3rd-dimension/) by Dave Cole, we use CartoCSS to control how TileMill renders the buildings. First, we need to pull out the altitude value from each geometry, and add it to a new column in our table for TileMill. It's easy to add a height column to the table using the PostGIS [ST_ZMax()](http://postgis.net/docs/manual-2.0/ST_ZMax.html) function. We found the buildings rendered most accurately when we divided the altitude by 2. Below is the SQL script to create a table ready for loading in TileMill.

    DROP TABLE tilemill_buildings;
    CREATE TABLE tilemill_buildings
    AS SELECT
    ogc_fid,
    CAST(size_sqm AS INT) as size_sqm,
    CAST(ROUND(CAST(ST_ZMax(wkb_geometry)/2 AS NUMERIC),0) AS INT) AS z_xlarge,
    CAST(ROUND(CAST(ST_ZMax(wkb_geometry)/2.5 AS NUMERIC),0) AS INT) AS z_large,
    CAST(ROUND(CAST(ST_ZMax(wkb_geometry)/3 AS NUMERIC),0) AS INT) AS z_med,
    CAST(ROUND(CAST(ST_ZMax(wkb_geometry)/4 AS NUMERIC),0) AS INT) AS z_small,
    wkb_geometry AS wkb_geometry
    FROM building_3d
    ORDER BY
    ST_YMax(Box3D(wkb_geometry)) DESC;


The last `ORDER BY` part is important, controlling the order in which TileMill renders each building/element. From here, it's a matter of loading the layer in TileMill, and styling with CartoCSS.

![DC Buildings | TileMill Building Symbolizer](http://farm9.staticflickr.com/8509/8486512820_78b8f449da_o.png)


    @polygon:rgb(100,100,100);
    @building:rgba(189,168,144,.9);

    #buildings {
      [size_sqm > 50][zoom < 15] {
      line-color:transparent;
      polygon-fill:@building;
      }
      [zoom = 12] {polygon-opacity:.2;}
      [zoom = 13] {polygon-opacity:.4;}
      [zoom = 14] {polygon-opacity:.9;}
      [zoom > 15] {
        polygon-fill:transparent;
        building-fill:@building;
        building-fill-opacity:1;
        [zoom = 15][size_sqm > 100] {
          building-height: '[z_small]';
        }
        [zoom = 16] {
          building-height: '[z_med]';
        }
        [zoom >= 17] {
          building-height: '[z_xlarge]';
        }
      }
    }

![DC Buildings | TileMill Building Symbolizer](http://farm9.staticflickr.com/8517/8485364827_2a81a7d918_o.png)

### Building Skeletons ###

These DC Building  Skeletons help visualize what's going on in TileMill as it renders these incredibly complex structures.

![Building Skeletons in TileMill](http://farm9.staticflickr.com/8366/8485445163_9891fd62df_o.png)

    @building:rgba(0,255,255,1);
    @under:rgb(0,0,0);

    #buildings {
      [size_sqm > 50][zoom <= 15] {
      ::under {
        polygon-fill:rgba(255,255,255,.5);
        polygon-comp-op:color-burn;
      }
      line-color:transparent;
      polygon-fill:@building;
      polygon-opacity:.3;
      }
      [zoom = 12] {polygon-opacity:.2;}
      [zoom = 13] {polygon-opacity:.4;}
      [zoom = 15] {polygon-opacity:.5;}
      [zoom > 15]{polygon-opacity:0;}
      [zoom > 15]::under {
        building-fill:@under;
        building-fill-opacity:.1;
        [zoom = 16 ][size_sqm > 100] {
          building-height: '[z_small]';
        }
        [zoom = 17] {
          building-height: '[z_large]';
        }
        [zoom > 17] {
          building-height: '[z_xlarge]';
        }
      }
      [zoom > 15] {
        polygon-fill:transparent;
        line-color:transparent;
        building-fill:@building;
        building-fill-opacity:.8;
        [zoom = 16 ][size_sqm > 100] {
          building-height: '[z_small]';
        }
        [zoom = 17] {
          building-height: '[z_large]';
        }
        [zoom > 17] {
          building-height: '[z_xlarge]';
        }
      }
    }

Each rendered building is actually a collection of many smaller polygons, each with individual geometry and elevation values, that are sequentially rendered on top of one another.

![DC Building Skeletons | TileMill Building Symbolizer](http://farm9.staticflickr.com/8376/8486426452_1f6537c29a_o.png)

{% include prereq.html %}