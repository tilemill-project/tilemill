---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "Going from Data to Map"
permalink: /docs/guides/data-to-map
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
---
{% include prereq.html %}

You have a lot of options making a data-driven map, based on you want
to convey, what data is available, and what kind of data it is. The popular
symbolization styles like choropleth maps, point density, and scaled points
all have advantages and disadvantages, and certain uses that are more
natural than others. Here's a quick guide for where to go.

Let's start with the kind of data that you have:

## Non-Geographic Data

Non-geographic data is data that doesn't have explicit geographic information.
It might have implicit geographical information, like addresses or country
names, but it doesn't have the coordinates of addresses or the borders
of countries.

You'll need to preprocess this data for it to be usable by TileMill or any
other geospatial software. Usually this data starts out in a spreadsheet,
so that's where we'll start. For turn addresses into useful data, you can use
[geo-googledocs](http://mapbox.com/blog/mapping-google-doc-spreadsheet/) to
run a [geocoder](http://en.wikipedia.org/wiki/Geocoder) over each address,
finding its latitude and longitude. [Our documentation on processing data with
Google Docs covers this task](http://mapbox.com/tilemill/docs/guides/google-docs/).

## Points

Geographic points are like [euclidean points](http://ds.io/IJnRdl) -
they have no area. Points at addresses are simply a single position
at that address.

There are several ways to represent points, and these depend on
what they represent and what you want to present:

### Density

![](http://farm6.staticflickr.com/5040/7173396034_7f38edb250_z.jpg)

[Heat maps](http://en.wikipedia.org/wiki/Heat_map) are popular ways to
show how dense or popular areas are. [You can design heat maps in QGIS
and use them in TileMill](http://mapbox.com/tilemill/docs/guides/designing-heat-maps/).

Heat maps are most appropriate for data that affects a certain radius
and has falloff: for instance, light pollution, radio waves, or
incidences of crime. Some heat maps are _weighted_ - certain values
make the map more colorful or darker than others - but typically they
simply represent density.

[Binning is another option for representing point density](http://indiemaps.com/blog/2011/10/hexbins/).
It can end with a cleaner look than heatmaps, and you can adjust
the size of the bins to match something like the area you think
is affected - like a neighborhood or block size.

### Absolute value

Absolute value means a value that comes from zero and represents something
that happened 'at' a point. For instance, a map of political donations by
individual donors which shows dollar amounts shows absolute value.

![](http://mapbox.com/tilemill/assets/pages/conditional-style-1.png)

Points with absolute values are typically represented as [scaled points](http://mapbox.com/tilemill/docs/crashcourse/styling/),
as they are in the crashcourse, which uses the example of the richter scale
(which is [logarithmic for sticklers](http://en.wikipedia.org/wiki/Richter_magnitude_scale)).
However, they can also be represented by points of different colors, or by
another symbol.

## Polygons

### Relative value

The classic symbolization for polygons is the [choropleth map](http://en.wikipedia.org/wiki/Choropleth_map),
which represents *relative* values with color differences.
For instance, an appropriate choropleth map would show
population density or percentage support for a political candidate.
Population density is _per-square-mile_ and political support
is _per-average-citizen_: using a choropleth map to show
total population would be inappropriate, because larger countries
would be overemphasized and the map becomes a simple proxy for
showing country size via population.

### Absolute value

Polygons representing absolute value are often turned into points -
whether by centroid or simple center - and then represented as scaled
points.
