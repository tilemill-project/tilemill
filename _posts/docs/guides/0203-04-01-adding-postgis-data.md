---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "Adding data from PostGIS"
permalink: /docs/guides/add-postgis
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/overview/)"
nextup:
- "[Using conditional styles](/tilemill/docs/crashcourse/conditional-styles/) to control the appearance of points based on data."
- "[Adding tooltips](/tilemill/docs/crashcourse/tooltips/) to your map."
- "[Exporting](/tilemill/docs/crashcourse/exporting/) your map."
code1: | `SELECT ST_EXTENT(the_geom) from malaria_color`
---

{% include prereq.html %} 

As we've worked through in adding CSV data and shapefiles to a TileMill project in previous articles here, you can also add data from a PostGIS database. 

[PostGIS](http://postgis.refractions.net/) is an extension for PostgreSQL databases for storing, manipulating, and retrieving spatial data. PostGIS (along with Mapnik) powers the main maps on openstreetmap.org (OSM) and open.mapquest.com.  

If you are not familiar with PostGIS or PostgreSQL, check out the documentation for both [PostgreSQL](http://www.postgresql.org/) and [PostGIS](http://postgis.refractions.net). These resources are great places to start if you are setting up a database for the first time.

For this example, we'll cover the basics of making a connection to a PostGIS database so it is recommended that you have an existing database set up. We'll begin with an existing database of data obtained from the [Malaria Atlas Project](http://www.map.ox.ac.uk/). 


1. To begin, we'll work with an existing TileMill project. We've called ours `global-malaria`.  
![step1](/tilemill/assets/pages/addpostgis-1.png)  
2. Click to add a new layer.  
3. Change the add layer type to `PostGIS`. You will see the fields change.  
![step3](/tilemill/assets/pages/addpostgis-3.png)  
4. Enter a name in the **ID** field. Here we will add the name `malaria`.  
![step4](/tilemill/assets/pages/addpostgis-4.png)  
5. Enter the connection parameters to connect with your local PostGIS database. You need to provide `host`, `port`, `user`, `password`, and `dbname` information. Here since we're working on a database locally, `host=localhost`. `Port=5432`, and we've named our database, `working-db`. Use the username and password for the authentication that is set up for your database.  
![step5](/tilemill/assets/pages/addpostgis-5.png)  
6. Enter the **Table or subquery** information to access your data. This is a query to select the data from your PostGIS database. This field acts as a subquery so the information must be entered in a subquery fashion: `( SELECT * from malaria_color ) AS malaria`. The name you specify after "AS" is arbitrary and does not affect the `ID` field you gave at the top. Here we've entered, `( SELECT gid, dn, the_geom from malaria_color ) as malaria`, to select the three columns we want to call from our database table.  
![step6](/tilemill/assets/pages/addpostgis-6.png)  
7. Enter the extent of your data. The coordinate system you use should match your data. The correct order is `left bottom right top`. This can be determined easily through a SQL query in your PostGIS database. In our example database, we would run the query:
<pre>{{page.code1}}</pre>  
8. Enter the **Unique Key Field** for your database feature. This is the database field containing a unique key for your table or feature. See below for a note about indexing and optimizing your PostGIS database.  
![step8](/tilemill/assets/pages/addpostgis-8.png)  
9. Enter the **Geometry Field** for your database feature. If you are using the shp2pgsql data loader for PostGIS, this default field name will be `the_geom`.  
![step9](/tilemill/assets/pages/addpostgis-9.png)  
10. Select the **Spatial Reference System (SRS)** for your feature. This will be the projection your data is in PostGIS. Our data is projected in the Web Mercator (EPSG:900913).  
![step10](/tilemill/assets/pages/addpostgis-10.png)  
11. Click **Save and Style** to save your connection and style with the default Carto settings.  
![step11](/tilemill/assets/pages/addpostgis-11.png)  
12. Preview the result in the map preview pane.   

<small class='note' markdown='1'>
<h3>Note: Indexing and Optimizing PostGIS data</h3>
To achieve fast and optimized results in TileMill, use good database management and index your data tables with both a unique index on your row ID and a gist index on your geometry column.  
</small>

{% include nextup.html %}