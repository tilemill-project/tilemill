---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "Adding a shapefile layer"
permalink: /docs/guides/add-shapefile
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
nextup:
- "[Using conditional styles](/tilemill/docs/guides/conditional-styles/) to control the appearance of points based on data."
- "[Adding tooltips](/tilemill/docs/crashcourse/tooltips/) to your map."
- "[Exporting](/tilemill/docs/crashcourse/exporting/) your map."
---

{% include prereq.html %}

Before you begin, you will need a shapefile (a set of four files with the extensions: .shp, .dbf, ,shx, and .prj) that contains the data that you want to map. TileMill supports a number of the most commonly used geospatial formats, you can read more about the types of supported layers [here](http://mapbox.com/tilemill/docs/manual/adding-layers/).  

There are a number of resources to obtain shapefile data for the area or issue you want to map. You may also have generated your own data in shapefile format and want to map it alongside other data.  

If you need to do additional manipulation or edit your shapefile, you can use free open-source software like [QuantumGIS](http://www.qgis.org/) to work with shapefiles. [LibreOffice](http://www.libreoffice.org/) (or OpenOffice) are also free and allow you to edit the `.dbf` file, or the file with attribute data.  

For practice, we'll add a tectonic plates boundary shapefile downloaded from the [Institute for Geophysics at University of Texas](http://www.ig.utexas.edu/research/projects/plates/data.htm). 

1. Start TileMill and click on the **Add project** button.  
![Add Project](/tilemill/assets/pages/shapefile-1.png)
2. Enter a name for your project and click **Add**. You can leave the other fields alone for now.  
![Add Project](/tilemill/assets/pages/shapefile-2.png)
3. Click on the new project to open it. The project contains a default layer called `#countries` styled with some example Carto code.
4. To add a shapefile layer, click **Add layer**. 
![Add Layer](/tilemill/assets/pages/csv-4.png)
5. Enter `plates` in the **ID** field. You'll use this ID to reference this layer in Carto selectors.  
![Add Name](/tilemill/assets/pages/shapefile-5.png)
6. For the **Datasource** field, click **Browse** to find the `trench.shp` shapefile located on your computer. You can browse your folders to find the source of your shapefile.  
![shapefile](/tilemill/assets/pages/shapefile-6.png)
7. Click your file to fill in the **Datasource** field and then click **Done** to confirm your selection.  
8. Click the **Save & Style** button. This will add the layer to your project and insert a default Carto rule for the layer.  
![Save and Style](/tilemill/assets/pages/shapefile-8.png)
9. Preview the result in the map preview pane.  
![Preview](/tilemill/assets/pages/shapefile-9.png)
{% include nextup.html %}