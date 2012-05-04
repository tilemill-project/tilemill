---
layout: book
section: documentation
category: TileMill
tag: Crash&nbsp;course
title: "Importing a spreadsheet"
permalink: /docs/crashcourse/point-data
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "[Reviewed](/tilemill/docs/crashcourse/introduction/) the Crash Course introduction."
nextup:
- "[Styling](/tilemill/docs/crashcourse/styling/) your point data."
- "[Adding tooltips and a legend](/tilemill/docs/crashcourse/tooltips/) to your map."
- "[Exporting](/tilemill/docs/crashcourse/exporting/) your map."
---

{% include prereq.html %}

One of the [many geo formats](/tilemill/docs/manual/adding-layers/) that TileMill supports is a spreadsheet, specifically a [comma-separated values (CSV) file](http://en.wikipedia.org/wiki/Comma-separated_values). We want to start by working with a basic spreadsheet to show how easy it is to make a simple point map.  

## Your CSV spreadsheet
To import data into TileMill as a CSV file you need column headings on the first row. The CSV must also contain columns with latitude and longitude geographic coordinates. We have hard coded TileMill to look at the column headers for any mention of "lat" or "latitude", so something like "geo_longitude" will even work. 

If your CSV contains place names or addresses instead of lat/lon coordinates, you will have to geocode the data before it will work in TileMill. We have a [plugin for Google Docs](http://developmentseed.org/blog/2011/10/12/mapping-google-doc-spreadsheet/) that makes geocoding easy.

In this crash course, we'll use [earthquake data from the USGS](http://earthquake.usgs.gov/earthquakes/catalogs/) to make a map showing points for earthquakes that have occurred. 

1. Start TileMill and click on the "New project" button on the main screen.
  ![Add project](/tilemill/assets/pages/csv-1.png)
2. Enter a "Filename" for your project and click "Add". You can leave the other fields alone for now.
  ![Add project](/tilemill/assets/pages/csv-2.png)
3. Click on the new project to open it. The project contains a default layer called `#countries` styled with some example Carto code.
4. To add a CSV layer, first click the "Layers" button located on the bottom left to bring up the Layers panel.
  ![Add layer](/tilemill/assets/pages/csv-3.png)
5. Now click "Add layer".
  ![Add layer](/tilemill/assets/pages/csv-4.png)
6. Enter `earthquakes` in the "ID" field. You'll use this ID to to reference this layer in Carto selectors.
7. Enter the URL `http://earthquake.usgs.gov/earthquakes/catalogs/eqs7day-M2.5.txt` into the "Datasource" field.
8. Click the "Save & Style" button. This will add the layer to your project and insert a default Carto rule for the layer.
  ![Add layer](/tilemill/assets/pages/csv-7.png)
9. Preview the result in the map preview pane.
  ![Styled map](/tilemill/assets/pages/earthquake-map.png)

{% include nextup.html %}
