---
layout: book
section: documentation
category: TileMill
tag: Crash&nbsp;course
title: "Importing data"
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


TileMill makes it easy to design maps from data in a CSV spreadsheet.

Before you begin, you'll need a CSV with column headings on the first row. The CSV must have a column with the heading **lat** and another column with the heading **lon**. These columns should contain geographic coordinates in degrees.

If your CSV contains place names or addresses instead of lat/lon coordinates, you can geocode that data so it works in TileMill. We have a [handy plugin for Google Docs](http://developmentseed.org/blog/2011/10/12/mapping-google-doc-spreadsheet/) that makes geocoding easy.

You can prepare your own CSV or you can use [earthquake data from the USGS](http://earthquake.usgs.gov/earthquakes/catalogs/) for practice. With this data, you can make a map that shows a point for each earthquake.

1. Start TileMill and click on the **Add project** button on the main screen.
  ![Add project](/tilemill/assets/pages/csv-1.png)
2. Enter a name for your project and click **Add**. You can leave the other fields alone for now.
  ![Add project](/tilemill/assets/pages/csv-2.png)
3. Click on the new project to open it. The project contains a default layer called `#countries` styled with some example Carto code.
4. To add a CSV layer, first click the **layers button** located on the bottom left to bring up the **Layers** panel.
  ![Add layer](/tilemill/assets/pages/csv-3.png)
5. Now click **Add layer**.
  ![Add layer](/tilemill/assets/pages/csv-4.png)
6. Enter `earthquakes` in the **ID** field. You'll use this ID to to reference this layer in Carto selectors.
7. Enter the URL `http://earthquake.usgs.gov/earthquakes/catalogs/eqs7day-M2.5.txt` into the **Datasource** field.
8. Click the **Save & Style** button. This will add the layer to your project and insert a default Carto rule for the layer.
  ![Add layer](/tilemill/assets/pages/csv-7.png)
9. Preview the result in the map preview pane.
  ![Styled map](/tilemill/assets/pages/earthquake-map.png)

{% include nextup.html %}
