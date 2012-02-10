---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "Using Maki Icons"
permalink: /docs/guides/advanced-legends
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "[Reviewed](/tilemill/docs/crashcourse/introduction) the Crash Course."
- "[Used conditional styles](/tilemill/docs/guides/conditional-styles/) to control the appearance of points based on data."
nextup:
- "[Using MapBox](http://mapbox.com/hosting/docs/) to upload and composite your map."
---

{% include prereq.html %}

### About Maki
[Maki](http://mapbox.com/maki) is a point of interest (POI) icon set for TileMill. On a typical base map, POIs provide context by highlighting things like schools, businesses, and parks. POI icons can be used to display a wide range of specific data points on your map. Maki icons are unobtrusive, clear, recognizable, and work well with a wide range of map types. 

<>(image of Maki)

Each symbol comes in three sizes: 24px, 18px, and 12px. They are designed to look sharp even at the smallest size. All the icons have a white outline so they are legible against both dark and light backgrounds. Currently Maki covers most of the basics and we plan to continually expand the range of symbols.

Maki icons

### Using Maki in TileMill

Here's a step-by-step walkthrough for creating a basic icon overlay in TileMill to composite with any base map.

1. [Download the Maki icon set](https://github.com/mapbox/maki/raw/master/maki.zip), unzip it, and place the Maki folder in a convenient location like `Documents/MapBox/`. You will need to reference the individual icon files later using Carto.

2. Create a new project in TileMill. You're going to be making a map of Washington, DC, so center the map over the Washington, DC area but leave all the defaults alone for now.
![]()
3. Next, you need geodata in order to place icons on your map. [This CSV](#) based on CloudMade's OpenStreetMap POI data should serve us well. Once it's finished downloading, place combined_poi.csv in your project's data folder, then import it as a layer in TileMill. Set the layer ID to 'poi'.
![]()
4. Time to lay down the basic styles for your data. Select the #POI layer and then use a conditional style to select only cafes within that layer. You'll need to reference the icon with a URL path, and this this case, you need to move back two steps to the `MapBox/` directory, then move into the `Maki/` folder and specify the icon you want.
![]()
5. Take advantage of Maki's size variations to scale your icons based on your map's zoom level. To do this, we need to add conditional statements to adjust which image you use based on zoom level.
![]()
6. Explore the data and experiment with your conditional statements. On my map, I decided to show bars in addition to cafes.
![]()
7. It's easy to make these points interactive based on the data contained in the CSV. Just use output markup to display the name of the business associated with each icon. 
![]()
8. Delete the map background so the icons can be used as an overlay, then follow these instructions to upload to MapBox hosting.

{% include nextup.html %}