---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "Using Maki Icons"
permalink: /docs/guides/using-maki-icons
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

![](/tilemill/assets/pages/maki-1.png)

Each symbol comes in three sizes: 24px, 18px, and 12px. They are designed to look sharp even at the smallest size. All the icons have a white outline so they are legible against both dark and light backgrounds. Currently Maki covers most of the basics and we plan to continually expand the range of symbols.

### Using Maki in TileMill

Here's a step-by-step walkthrough for creating a basic icon overlay in TileMill to composite with any base map.

1. [Download the Maki icon set](https://github.com/mapbox/maki/raw/master/maki.zip), unzip it, and place the Maki folder in a convenient location like `Documents/MapBox/`. You will need to reference the individual icon files later using Carto.

2. Create a new project in TileMill called maki-overlay. You're going to be making a map of Washington, DC, so adjust your project settings to include zoom levels up to 20, and center the map over the Washington, DC area.

3. Next, you need geodata in order to place icons on your map. [This CSV](https://github.com/mapbox/tilemill/raw/maki-docs/assets/pages/combined_poi.csv) based on CloudMade's OpenStreetMap POI data should serve you well. Once it's finished downloading, place combined_poi.csv in your project's data folder, then import it as a layer in TileMill. Set the layer ID to 'poi'.
![](/tilemill/assets/pages/maki-2.png)

4. Time to write the basic styles for your data. Using Carto, select the #POI layer and then use a conditional style to filter for cafes within that layer. You'll need to reference the icon with a URL path, and this this case, you need to move back two steps to the `MapBox/` directory, then move into the `Maki/` folder and specify the icon you want.
![](/tilemill/assets/pages/maki-3.png)
> Your map should now look like this:
![](/tilemill/assets/pages/maki-3-2.png) 

5. Take advantage of Maki's size variations to scale the cafe icon based on your map's zoom level. To do this, you need to add conditional statements to adjust which image you use based on zoom level. Usually point of interest icons are only visible at higher zoom levels, as they start to clutter maps as you zoom out. For this example, lets leave the visible as a frame of reference because there's not much of a base map.
![](/tilemill/assets/pages/maki-4.png)
6. Explore the data by clicking on the magnifying glass in the layers palette and experiment with your conditional statements. On my map, I decided to show pubs in addition to cafes.
![](/tilemill/assets/pages/maki-5.png)
> Now your map should like this this: 
![](/tilemill/assets/pages/maki-5-2.png)

7. It's easy to make your icons interactive based on the data contained in the CSV. Open the interactivity palette, click on the 'Teaser' tab, and then type `{{{name}}}`, which is output markup that will display the content of the 'name' column in the .csv in a pop-up when you hover over an icon.
![](/tilemill/assets/pages/maki-6.png)

8. Finally, delete the Map #countries styles so the icons are on a transparent background. Your map is now ready to be used as an overlay. Follow instructions to [upload this overlay to MapBox hosting](http://mapbox.com/hosting/uploading/) and [composite it with another map](http://mapbox.com/hosting/compositing/). Composited with [Mapbox Light](https://tiles.mapbox.com/mapbox/map/mapbox-light), your map could look like this:
![](/tilemill/assets/pages/maki-8.png)

{% include nextup.html %}