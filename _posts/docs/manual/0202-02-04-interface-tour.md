---
layout: book
section: documentation
category: manual
title: Interface tour
permalink: /docs/manual/interface-tour
---
When TileMill first starts it will display the project browser, where you will see a few example projects to give you an idea of what TileMill can do. If you click on one of the projects you will be taken to the editing interface:

![Screenshot]({{site.baseurl}}/assets/manual/project.png)

1. Main toolbar
2. Map preview
3. Layers list
4. Stylesheet editor

## Map preview

![Screenshot]({{site.baseurl}}/assets/manual/map.png)

1. Map preview
2. Zoom controls & full-page toggle

TileMill provides an interactive preview of the map as you are designing it. The map updates every time you save the project. 

You can pan around by clicking and dragging, and zoom in and out clicking on the + and - buttons. Zooming can also be controlled with your mouse wheel when the cursor is over the map, or by holding down the Shift key and drawing a box on the map of the area you wish to zoom to. The zoom level indicator displays the current zoom level, which is useful to know when designing and checking styles.

The full-page toggle button expands the size of the preview, and collapses it back once you are in the big-preview mode.

When you save a project TileMill also saves the position and scale you were viewing the map at, so if you are only mapping a small area such as a city you won’t have to zoom in there every time you reopen the project.

## Layers list

![Screenshot]({{site.baseurl}}/assets/manual/tools.png)

1. Add layer button
2. Geometry icon
3. IDs and classes
4. Inspect layer data
5. Edit layer
6. Delete layer

Clicking the add layer button opens a dialog where you can choose a shapefile, KML file, GeoJSON file, or GeoTIFF to add to the project. Each layer must have one ID (indicated by the `#` prefix), and may optionally have one or more classes (indicated by a `.` prefix). These are defined when the layer is added but can be changed any time by clicking the ‘Edit layer’ icon.

A layer can be easily reordered by clicking on the draggable geometry icon and moving it above or below another layer. Overlapping areas of layers will be rendered such that the highest layer on the list will cover layers beneath it.

For the purposes of styling, a layer can be one of four types of geometries - point, line, polygon, or raster. This is indicated by the geometry icon. Certain types of styles are only applicable to certain types of layers, so it’s good to know what each one is.

## Layer data inspector

![Screenshot]({{site.baseurl}}/assets/manual/inspector.png)

If you click on the magnifying glass icon of any layer, a drawer will slide in from the left and a table of data will appear. (It may take a few seconds for the data to show up if you are inspecting a complex file.)

## Code editor

![Screenshot]({{site.baseurl}}/assets/manual/editor.png)

1. Active stylesheet tab
2. Inactive stylesheet tabs
3. New stylesheet button
4. Line numbers
5. Text area
6. Color palette
7. Font reference
8. Carto reference


TileMill provides an integrated code editor for editing the map stylesheets. This editor will make sure you write valid code, coloring correctly formatted text as you write it (syntax highlighting) and highlighting any errors if you try to save an invalid file.

The TileMill editor supports autocomplete: when typing a property name like `polygon-fill`, you can type `polygon-` and immediately hit the tab key in order to get a list of available completions. This also works with values, like `line-join: miter`: typing `mi` and pressing tab will autocomplete `miter`. If you have variables like `@acolor` defined in your stylesheet, you can autocomplete them by typing `@` and tab. After the autocomplete menu is open, it can be navigated with the mouse, arrow keys, or with further presses of `tab` and `shift-tab` to go backwards. Press `enter` to accept an autocomplete suggestion.

**Stylesheets**

As your map style becomes more complex, you may wish to keep things organized by splitting the style across multiple files. New stylesheets can be added with the + button on the tab bar and entering a name for the file. Though not required, there is a convention of using the file extention `.mss` for ‘map stylesheet’. 

Stylesheets can be re-ordered by clicking and dragging their tabs within the tab bar. Note that just like CSS, the order can have an effect on the way a map is rendered - if two styles conflict, the one that is defined last will be applied. Here, ‘last’ means closest to the bottom of the file in the tab furthest to the right.

**Color palette**

TileMill keeps track of all the colors you use in a project and makes it easy to edit them with a color picker.

**Font reference**

Clicking on the ‘Font’ icon will display a list of all the system fonts Mapnik can find. Clicking on a font will highlight its name making it easy to copy & paste it into your stylesheet.

Unlike what you may be used to from CSS or common word processor interfaces, there are no distinct properties for a font’s family (eg ‘Arial’), weight (eg bold), and style (eg italic). This is why, for example, “Arial Regular”, “Arial Bold”, and “Arial Italic” are listed individually.

**Carto reference**

Clicking on the ‘Carto’ icon will display an abbreviated reference of the different properties you can use in your stylesheet.

