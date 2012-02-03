---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "Working with PostGIS"
permalink: /docs/guides/postgis-work
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
nextup:
- "[Using conditional styles](/tilemill/docs/guides/conditional-styles/) to control the appearance of points based on data."
- "[Using MapBox](http://mapbox.com/hosting/docs/) to upload and composite your map."
code1: | 
  createdb dc-census
  createlang plpgsql dc-census
  psql -d dc-census -f postgis.sql
  psql -d dc-census -f spatial_ref_sys.sql
code2: | shp2pgsql -c -D -s 4269 -I tl_2010_1101_tract10.shp dc_census_tracts | psql -d dc-census
code3: | CREATE TABLE dc_census_data (GEOID varchar(11), SUMLEV varchar(3), STATE varchar(2), COUNTY varchar(3), CBSA varchar(5), CSA varchar(3), NECTA integer, CNECTA integer, NAME varchar(30), POP100 integer, HU100 integer, POP1002000 integer, HU1002000 integer, P001001 integer, P0010012000 integer);
code4: | cat all_140_in_11.P1.csv | psql -d dc-census -c 'COPY dc_census_data FROM STDIN WITH CSV HEADER'
code5: | SELECT ST_EXTENT(the_geom) from dc_census_tracts
code6: | SELECT * from dc_census_tracts JOIN data on dc_census_tracts.geoid10 = data.geoid

---

{% include prereq.html %} 

As we've worked through in adding CSV data and shapefiles to a TileMill project in previous articles here, you can also add data from a PostGIS database. 

[PostGIS](http://postgis.refractions.net/) is an extension for PostgreSQL databases for storing, manipulating, and retrieving spatial data. PostGIS (along with Mapnik) powers the main maps on openstreetmap.org (OSM) and open.mapquest.com.  

If you are not familiar with PostGIS or PostgreSQL, check out the documentation for both [PostgreSQL](http://www.postgresql.org/) and [PostGIS](http://postgis.refractions.net). These resources are great places to start if you are setting up a database for the first time.

For this example, we'll cover the basics of creating a simple PostGIS database and making a connection to the database in TileMill. We'll also cover joining data to add attribute data to your features. We'll use Census data for the District of Columbia Census Tracts for this example.  

## Download the data
1. To begin, download the [District of Columbia Census Tract TIGER/Line shapefile](http://www.census.gov/cgi-bin/geo/shapefiles2010/main) from the U.S. Census Bureau. Select `Census Tracts` and `District of Columbia` for Census Tract (2010). Choose `District of Columbia` in the final menu. A zipped shapefile will be downloaded.
2. Unzip the shapefile 
3. Download Census Tract data for the District of Columbia from the [CENSUS.IRE.ORG](http://census.ire.org/data/bulkdata.html?state=11&sumlev=140). Select  `P1. Total Population` and download as CSV. 
![step5a](/tilemill/assets/pages/postgis-3.png)
4. For a smooth import into a PostGIS database, we need to clean up the headers within the CSV. Open the CSV in a text editor. The first line is the header line. Within the header line, remove any periods ("."). Save your changes. 
![step4](/tilemill/assets/pages/postgis-4.png)

## Creating a simple PostGIS database  

1. After you've installed both PostgreSQL and PostGIS using the online documentation from both sites, you need to create a database for use with spatial data. Navigate to where your PostGIS configuration installed the SQL files, typically `[prefix]/share/contrib/`. See the [PostGIS reference manual](http://postgis.refractions.net/documentation/manual-1.5/) for installation details.  
2. Run the following commands: 
<pre>{{page.code1}}</pre>
3. Now that your database is spatially-enabled, you can use the shapefile uploader to load features into the database. Navigate to where you downloaded the shapefile, `tl_2010_11001_tract10.shp` and run:  
<pre>{{page.code2}}</pre>
4. Enter a psql terminal by typing `psql dc-census`.  
5. We now need to create a new table to insert the population data. From the psql terminal, run:  
<pre>{{page.code3}}</pre>
6. Exit the psql terminal by typing `\q`.  
7. Navigate to the location of the census data CSV file, `all_140_in_11.P1.csv`. 
8. We'll now copy the CSV file and insert it into the new table we just created in Step 5. Run: 
<pre>{{page.code4}}</pre>
9. Enter the psql terminal agin by typing `psql dc-census`. You can see your new tables by typing, `\d`.


## Adding data in TileMill  

1. Create a new TileMill project called `dc-census`. 
2. Click to add a new layer. 
3. Change the add layer type to **PostGIS**. You will see the fields change.  
4. Enter `dc-census` in the **ID** field.  
![step6](/tilemill/assets/pages/postgis-4b.png)  
5. Enter the connection parameters to connect with your local PostGIS database. You need to provide `host`, `port`, `user`, `password`, and `dbname` information. Here since we're working on a database locally, `host=localhost`. `Port=5432`, and we've named our database, `dc-census`. Use the username and password for the authentication that is set up for your database.
![step6](/tilemill/assets/pages/postgis-5b.png)  
6. Enter the **Table or subquery** information to access your data. This is a query to select the data from your PostGIS database. This field acts as a subquery so the information must be entered in a subquery fashion: `( SELECT * from dc_census_tracts ) AS tracts`. The name you specify after "AS" is arbitrary and does not affect the `ID` field you gave at the top. Here we've entered, `( SELECT * from dc_census_tracts ) as tracts`, which selects all the columns in the table. To only select the columns you want to call from our database table, omit the `*` and enter the column names directly.
![step6](/tilemill/assets/pages/postgis-6b.png)   
7. Enter the extent of your data. The coordinate system you use should match your data. The correct order is `left bottom right top`. This can be determined easily through a SQL query in your PostGIS database. In our example database, we would run the query:
><pre>{{page.code5}}</pre>
>Enter: `-77.119759,38.791645,-76.909393,38.995548`
![step7](/tilemill/assets/pages/postgis-7b.png)
8. Enter the **Unique Key Field** for your database feature. This is the database field containing a unique key for your table or feature. See below for a note about indexing and optimizing your PostGIS database.  
![step8](/tilemill/assets/pages/postgis-8b.png)
9. Enter the **Geometry Field** for your database feature. If you are using the shp2pgsql data loader for PostGIS, this default field name will be `the_geom`.  
![step9](/tilemill/assets/pages/postgis-9b.png)  
10. Select the **Spatial Reference System (SRS)** for your feature. This will be the projection your data is in PostGIS. Since the Census TIGER/Line data is projected in the NAD83 geographic projection (EPSG:4269), we will use custom parameters here for TileMill to assume the correct datum and ellipsoid for projecting data (we have provided the correct custom parameters here, but can also be obtained from [here](http://spatialreference.org/ref/epsg/4269/)). 
>
>Select **Custom** and enter `+proj=longlat +ellps=GRS80 +datum=NAD83 +no_defs`.
![step10](/tilemill/assets/pages/postgis-10b.png)  
11. Click **Save and Style** to save your connection and style with the default Carto settings.  
![step11](/tilemill/assets/pages/postgis-11b.png)  
12. Preview the result in the map preview pane.
![step12](/tilemill/assets/pages/postgis-12b.png)  

## Joining attribute data in TileMill  

1. From within the **Editor** window of the `dc-census` project, toggle on the layer selector and click **Edit** next to the `dc-census` layer you just added in the previous section.  
![step1c](/tilemill/assets/pages/postgis-1c.png)
2. Within the **Table or subquery** field, adjust the existing query to be:
><pre>{{page.code6}}</pre>  
>
>Here we are creating a SQL left join of the attribute data, `dc_census_data` with our geographic feature table, `dc_census_tracts`.  
![step4c](/tilemill/assets/pages/postgis-2c.png)
3. Click **Save** to save your changes. 
4. Within the layer menu, click the **Features** button to explore the data table. You will now see the attribute data columns.  
![step4c](/tilemill/assets/pages/postgis-4c.png)
![step4c](/tilemill/assets/pages/postgis-5c.png)
5. Click the **X** or hit the `esc` on your keyboard to exit out of the table view. You can now begin to use conditional styles or add additional data to your interactivity.

<small class='note' markdown='1'>
<h3>Note: Indexing and Optimizing PostGIS data</h3>
To achieve fast and optimized results in TileMill, use good database management by indexing your data tables with both a unique index on your row ID and a gist index on your geometry column. See the [Building Indexes](http://postgis.refractions.net/docs/ch04.html#id2628096) section of the PostGIS manual for a beginning reference.   
</small>

{% include nextup.html %}
