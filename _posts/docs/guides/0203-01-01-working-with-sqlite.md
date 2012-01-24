---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "Working with SQLite"
permalink: /docs/tutorials/sqlite-work
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
nextup:
- "[Using conditional styles](/tilemill/docs/guides/conditional-styles/) to control the appearance of points based on data."
- "[Using MapBox](http://mapbox.com/hosting/docs/) to upload and composite your map."
code1: | `( SELECT * from dc_census_tracts JOIN data on dc_census_tracts.geoid10 = data.geoid )`  
---
{% include prereq.html %}

In this guide, we will walk through the steps to add a layer from a SQLite database and join additional attribute data to the geographic information. TileMill supports using SQLite databases as geographic datasources and thus offers an alternative to shapefiles. 

If you are not familiar with SQLite, check out their [documentation resources](http://www.sqlite.org/docs.html). SQLite databases can store geographic features along with non-geographic attribute data. SQLite files can be edited with any SQLite client, including free GIS tools like [Quantum GIS](http://www.qgis.org/) or [SQLite Database Browser](http://sqlitebrowser.sourceforge.net/). See note in Step 7 about downloading a SQLite editor to work with your files.

We'll begin by adding polygon features of the District of Columbia Census tract boundary downloaded from the U.S. Census Bureau [TIGER/Line database](http://www.census.gov/geo/www/tiger/shp.html). The original files were downloaded as shapefiles, but we've used [QGIS](http://www.qgis.org/) to convert and save as a SQLite database. We'll begin there and create a new database. 

## Creating SQLite database files  

1. To begin, download the [2010 District of Columbia Census Tract TIGER/Line shapefile](http://www.census.gov/cgi-bin/geo/shapefiles2010/main) from the U.S. Census Bureau. Select `Census Tracts` and `District of Columbia` for Census Tract (2010). Choose `District of Columbia` in the final menu. A zipped shapefile will be downloaded.
2. Unzip the shapefile and open it up in [QGIS](http://www.qgis.org/).
3. Right-click on the layer named `tl_2010_11001_tract10` within the **Layers** window. Click **Save As**.
![step3a](/tilemill/assets/pages/addsqlite-3a.png)
4. Select **SQLite** for the **Format**, and enter `dc-census-tracts` for the **Save as** name. You can browse to select the directory to save the file. 
![step4a](/tilemill/assets/pages/addsqlite-4a.png)
5. Download Census Tract data for the District of Columbia from the [CENSUS.IRE.ORG](http://census.ire.org/data/bulkdata.html?state=11&sumlev=140). Select  `P1. Total Population` and download as CSV. 
![step5a](/tilemill/assets/pages/addsqlite-5a.png)
6. For a smooth import into a SQLite database, we need to clean up the headers within the CSV. Open the CSV in a text editor. The first line is the header line. Within the header line, remove any periods ("."). Save your changes. 
![step6a](/tilemill/assets/pages/addsqlite-6a.png)
7. To work with an SQLite file, we need an editor to create, edit, and browse through the database files. There are several free or inexpensive programs. One open source, free program is the *[SQLite Database Browser](http://sqlitebrowser.sourceforge.net/)*. It is available for Mac OSX, Linux, or Windows. [Download](http://sourceforge.net/projects/sqlitebrowser/files/sqlitebrowser/1.3/), unzip, and run the file to install. 
>
<small class='note' markdown='1'>
<h3>Note: SQLite Editors</h3>
There are many spreadsheet-like GUI editors available for OSX, Linux, and Windows. You can download an editor to work with your SQLite files, or alternatively, you can edit and manipulate SQLite through the [command-line utility](http://www.sqlite.org/sqlite.html) named, `sqlite3` (`sqlite3.exe` on Windows).   
</small>
8. Open SQLite Browser and create a new database by choosing **File > New** from the menu. Save your new database as `dc-census-data.sqlite`. A create table window will pop up and ask you to create a table, click `Cancel` to by-pass this step.
9. Choose **File > Import > Table from CSV File** from the menu. Locate the `all_140_in_11.P1.csv` file and click **Open**.
10. Enter `data` in the **New table name** field and check the box for **Extract field names from first line**. Click **Create**. Save your changes.  
![step10a](/tilemill/assets/pages/addsqlite-9a.png)
11. Move your newly creating SQLite files to the `/Mapbox/Data/` folder for use in TileMill. 

## Adding SQLite layers

1. To begin, we'll work with an existing TileMill project. We've called ours `dc-census`.
2. Click to add a new layer.
3. Change the add layer type to `SQLite`. You will see the fields change. 
4. Enter `dc` in the **ID** field.
![step4b](/tilemill/assets/pages/addsqlite-4b.png)
5. For the **Datasource** field, click **Browse** to find the SQLite files located on your computer. Browse to the `/Mapbox/Data/` folder.
6. Select the SQLite file with your geographic features, `dc-census-tracts.sqlite` to fill in the **Datasource** field and then click **Done** to confirm your selection.  
7. For the **Table or subquery** field, enter `( SELECT * from dc_census_tracts )`. This is a query to select the data from table `dc-census-tracts` within your SQLite database. This field acts as a subquery so the information must be entered in a subquery fashion. The name you specify after "AS" is arbitrary and does not affect the `ID` field you gave at the top.
![step7b](/tilemill/assets/pages/addsqlite-7b.png)
    We'll skip the **Attach DB** field at the moment, and pick it up below when adding attribute data to your geographic features in the section below.  
8. 	Select the **Spatial Reference System (SRS)** for your feature. This will be the projection your data is in PostGIS. Since the Census TIGER/Line data is projected in the NAD83 geographic projection (EPSG:4269), we will use custom parameters here for TileMill to assume the correct datum and ellipsoid for projecting data (we have provided the correct custom parameters here, but can also be obtained from [here](http://spatialreference.org/ref/epsg/4269/)). 
>
>Select **Custom** and enter `+proj=longlat +ellps=GRS80 +datum=NAD83 +no_defs`.
![step8b](/tilemill/assets/pages/addsqlite-8b.png)
9. Click **Save and Style** to add your layer with the default Carto settings.
10. Preview the result in the map preview pane.

## Add attribute data (SQLite Join)

1. From within the **Editor** window of the `dc-census-tracts` project, toggle on the layer selector and click **Edit** next to the `dc` layer you just added in the previous section.  
![step1c](/tilemill/assets/pages/addsqlite-1c.png)
2. Move down to the **Attach DB** field. This is the field for attaching additional databases to base an SQL join statement on to add attribute data to your geographic features.  
3. Enter `data@[ path to your ]/MapBox/data/dc-census-data.sqlite` to provide the path information to the SQLite file we created from the Census total population data for the District of Columbia.  
![step3c](/tilemill/assets/pages/addsqlite-3c.png)
4. Within the **Table or subquery** field, adjust the existing query to be:
<pre>{{page.code1}}</pre>  
![step4c](/tilemill/assets/pages/addsqlite-4c.png)
5. Click **Save** to save your changes. 
6. Within the layer menu, click the **Features** button to explore the data table. You will now see the attribute data columns.  
![step6c](/tilemill/assets/pages/addsqlite-6c.png)
![step6c](/tilemill/assets/pages/addsqlite-7c.png)
7. Click the **X** or hit the `esc` on your keyboard to exit out of the table view. You can now begin to use conditional styles or add additional data to your interactivity.

{% include nextup.html %}
