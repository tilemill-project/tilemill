---
layout: book
section: documentation
category: TileMill
tag: Crash&nbsp;course
title: "Exporting your map"
permalink: /docs/crashcourse/exporting
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "[Reviewed](/tilemill/docs/crashcourse/introduction/) the Crash Course introduction."
- "[Added a CSV layer](/tilemill/docs/crashcourse/point-data) to your TileMill project."
- "[Styled](/tilemill/docs/crashcourse/styling/) your point data."
- "[Added tooltips and a legend](/tilemill/docs/crashcourse/tooltips/) to your map."
nextup:
- "[Upload](/hosting/uploading/) your map to the web."
- "[Sign up](/plans) for a Mapbox hosting account."
---

{% include prereq.html %}

Once you have your map looking good, it is time to export. TileMill can export to MBTiles, PNG, PDF, SVG, or Mapnik XML. [See here](/tilemill/docs/manual/exporting/) for a brief overview of these formats.

Previously, you [created a map of earthquakes](/tilemill/docs/crashcourse/point-data). You will now export that map as an MBTile to create a fully interactive map.

1. Click the **Export** button. A drop down menu will appear.
  ![](/tilemill/assets/pages/exporting-1.png)
2. Click **MBTiles**. The window will transition to the export tool.
  ![](/tilemill/assets/pages/exporting-2.png)
3. Choose a **Filename**. The name of the project will be placed here by default.
  ![](/tilemill/assets/pages/exporting-3.png)
4. Select **Zoom** levels. Set the furthest zoom to 1 by dragging the left end to the right. Set the closest zoom to 6 by dragging the right end to the left.
  ![](/tilemill/assets/pages/exporting-5.png)
You will notice the numbers below the slider update as you do this. These numbers indicate how large the exported file will be. The wider your **bounds** and the more **zoom levels** you have, the larger the final size of the MBTile file will be.
5. Select the **Center** of the map. This determines the starting center and zoom level of the map when it is first loaded. You can manually enter these values or click a point in the map preview. Zoom to level three and click the center of the United States.
  ![](/tilemill/assets/pages/exporting-6.png)
6. Select the map **Bounds**. This is the area of the map to be exported. By default the entire world is selected. If your map is allocated to a smaller region of the globe you can save processing time and disk space by **cropping** to that area. This can be done by manually entering values in the **Bounds** fields, or by holding the SHIFT key and clicking and dragging on the map. Leave the default value.
  ![](/tilemill/assets/pages/exporting-4.png)
6. Click **Export**.
  ![](/tilemill/assets/pages/exporting-7.png)
The window will transition back to your project and the exports panel will appear. Here is where you can access and find information about your exported files. The most recent will appear at the top of the list and display its progress as it is being processed.
  ![](/tilemill/assets/pages/exporting-8.png)
7. When the export process is complete, the progress bar will be replaced by a **Save** button. This will save a copy of the file locally to a specified location.
  ![](/tilemill/assets/pages/exporting-9.png)

### Congragulations!  
You have completed your first map in TileMill! Take advantage of our **free 7-day hosting** by [uploading it to MapBox](http://tiles.mapbox.com/upload/create/).

{% include nextup.html %}
