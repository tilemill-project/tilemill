---
layout: book
section: documentation
category: TileMill
tag: crashcourse
title: "Exporting Your Map"
permalink: /docs/crashcourse/exporting
prereq:
- "[Added an earthquake CSV layer](/tilemill/docs/crashcourse/point-data) to your TileMill project."
- "[Added tooltips](/tilemill/docs/crashcourse/tooltips) to your map."
- "[Added a legend](/tilemill/docs/crashcourse/legends) to your map."
nextup:
- "[Uploading](/tilemill/docs/crashcourse/uploading/) your map to the web."
---

{% include prereq.html %}

Once you have your map looking the way you want, it is time to export. TileMill can export to MBTiles, PNG, PDF, or SVG. [See here](/tilemill/docs/manual/exporting/) for a brief overview of these formats.

1. Click the **Export** button. A drop down menu will appear.
  ![](/tilemill/assets/pages/exporting-1.png)
2. Click **MBTiles**. The window will transition to the export tool.
  ![](/tilemill/assets/pages/exporting-2.png)
3. Choose a **Filename**. The name of the project will be placed here by default.
  ![](/tilemill/assets/pages/exporting-3.png)
4. Select the map **Bounds**. This is the area of the map to be exported. By default the entire world is selected. If your map is allocated to a smaller region of the globe you can save processing time and disk space by **cropping** to that area. This can be done by manually entering values in the **Bounds** fields, or by holding the SHIFT key and clicking and dragging on the map.
  ![](/tilemill/assets/pages/exporting-4.png)
5. Select **Zoom** levels. Set the furthest zoom to 1 by dragging the left end to the right. Set the closest zoom to 6 by dragging the right end to the left.
  ![](/tilemill/assets/pages/exporting-5.png)
You will notice the **Size** numbers update as you do this. These numbers indicate how large the exported file will be. The wider your **bounds** and the more **zoom levels** you have, the larger the final size of the MBTile file will be.
  ![](/tilemill/assets/pages/exporting-6.png)
6. Click **Export**.
  ![](/tilemill/assets/pages/exporting-7.png)
The window will transition back to your project and the exports panel will appear. Here is where you can access and find information about your exported files. The most recent will appear at the top of the list and display its progress as it is being processed.
  ![](/tilemill/assets/pages/exporting-8.png)
7. When the export process is complete, the progress bar will be replaced by **Upload** and **Save** buttons. **Upload** allows you to directly upload the map to TileStream, while **Save** will save a copy of the file locally to a specified location.
Click **Upload**.
  ![](/tilemill/assets/pages/exporting-9.png)

{% include nextup.html %}