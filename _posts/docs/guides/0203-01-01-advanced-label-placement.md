---
layout: docs
section: help
category: guides
tag: Guides
title: "Advanced Label Placement"
permalink: /docs/guides/labels-advanced
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
- "Practiced basic [label styling](/tilemill/docs/guides/styling-labels/)"
- "Become familiar with [PostgreSQL and PostGIS](/tilemill/docs/guides/postgis-work)"
---

{% include prereq.html %}

## Trying multiple positions

Recent versions of TileMill include two methods to choose for placing labels on
points. The choice is made via the `text-placement-type` CartoCSS property. The
default, original method is called `none`, and the newer, more advanced method
is called `simple`. 

The `simple` method allows the designer to specify multiple potential positions
on or around a central point, as well as multiple sizes of text to choose from.
If the first attempt at placing a label is blocked by another label that has
already been placed, it can look at this list to try the next position.

A full CartoCSS example of the syntax looks like this:

    #labels {
      text-name: "[name]";
      text-face-name: "OpenSans Regular";
      text-placement-type: simple;
      text-placements: "N,S,E,W,NE,SE,NW,SW,16,14,12";
      text-dy: 3;
      text-dx: 3;
    }

This will first attempt to place a label above a point, then below the point,
then to the right, and so on with a text size of 16 until it finds a position
that fits. If no labels fit at size 16, the positions will all be retried at a
text size of 14, and then 12. If none of these fit the label will be skipped.

The `text-dx` and `text-dy` properties specify how far away (in pixels) the
label should be placed from the point.

## Improved direction distribution: random approach

It's great to try different placements for a label, but the previous example
will always try the same position (North) first. This may not always be the
best choice, even if the label happens to fit there. And it may be better for
the overall map design to distribute the different placement positions better,
rather than letting a single position dominate.

Something as simple as randomly assigning a direction bias can help even out
the look of the labels. For example, you could create a PostGIS query that
creates a column called `dir` which is randomly assigned a value of either `0`
or `1`.

    ( select *, floor(random()*2) as dir from city_points ) as data

You could then set up your CartoCSS to favor East placement for the `0`s and
West placement for the `1`s.

    #labels {
      text-name: "[name]";
      text-face-name: "OpenSans Regular";
      text-placement-type: simple;
      text-placements: "E,NE,SE,W,NW,SW";
      [dir=1] { text-placements: "W,NW,SW,E,NE,SE"; }
    }

## Improved direction distribution: avoiding nearby neighbors

Using PostGIS its possible to come up with something smarter than random
distribution to improve the look of simple label placement. One possibility is
to calculate the direction of the nearest object of a certain type, and then
try to avoid that. For example you could bias city lable placement away from
the next nearest city, or county label placement away from the largest city in
the county. These aren't perfect solutions, but can be a quick way to make your
labels more correct in more cases.

For labels on points-of-interest along a city block at high zoom level, the
area most likely to have room for the label is away from the street. Placing
labels here also keeps the street clear for its own labels and one-way arrows.

So for each label we need to find the nearest city street and its direction
relative to the point. Service streets, tracks, footways, and cycleways will be
ignored for this logic, but you could adjust it to account for whatever you
feel is appropriat. For a basic use case fine if our label sits on top of an
alley or park path; the goal is to avoid the main city grid.

Here are some of the spatial functions of PostGIS that will help determine this
information:

- [ST_Distance](http://www.postgis.org/docs/ST_Distance.html) will help us find
  the closest street to a POI
- [ST_ClosestPoint](http://www.postgis.org/docs/ST_ClosestPoint.html) will tell
  us the closest point along the closest street, and
- [ST_Azimuth](http://www.postgis.org/docs/ST_Azimuth.html) will help us
  determine the angle between the POI and the closest point.

We can put all these together as a user-defined PostreSQL function:

    create or replace function poi_ldir(geometry)
        returns double precision as
    $$
        select degrees(st_azimuth(st_closestpoint(way, $1),$1)) as angle
        from planet_osm_line
        where way && st_expand($1, 100)
            and highway in ('motorway', 'trunk', 'primary', 'secondary', 'tertiary',
                'unclassified', 'residential', 'living_street', 'pedestrian')
        order by st_distance(way, $1) asc
        limit 1
    $$
    language 'sql'
    stable;

This particular function assumes you are working with a standard OpenStreetMap
rendering database generated by
[osm2pgsql](http://wiki.openstreetmap.org/wiki/Osm2pgsql) (you can adjust it to
be used with other schemas). The first two lines set up a function with a
name, argument, and return value. `$$` starts the function. The result of the
function, when given a point geometry as an argument, will be a number between
0 and 360 representing the angle between that point and the nearest street of
any of the types defined in the `where` clause. (`ST_Azimuth()` returns a value
in radians, but we convert that to degrees to make it easier to work with in
CartoCSS.)

To use the above function to your database, copy its contents to a file (for
example, `poi_ldir.sql` on your Desktop). Then run a command from the terminal
to load it into your database:

    psql -f ~/Desktop/poi_ldir.sql -d <your_database_name>

You can then use the function in your TileMill select statements. This
selection will retrieve all amenity and shop points from the database, their
names, and column named `ldir` that is the result of the `poi_ldir` function on
the geometry for each point.

    ( select way, name, poi_ldir(way) as ldir
      from planet_osm_point
      where amenity is not null or shop is not null
    ) as pois

To use the `ldir` column in a stylesheet, set up a label style with the simple
text placement type and nest some filters within that that adjust the
`text-placements` parameter depending on the `ldir` value. This example will
only try each label at one position:

    #poi[zoom > 15] {
      text-name: '[name]';
      text-face-name: @sans_medium;
      text-size: 12;
      text-fill: #222;
      text-wrap-width: 60;
      text-wrap-before: true;
      text-halo-radius: 2;
      text-halo-fill: #fff;
      text-min-distance: 2;
      text-placement-type: simple;
      text-dx: 5;
      text-dy: 5;
      text-placements: 'N';
      [ldir >= 45][ldir < 135] { text-placements: 'E'; }
      [ldir >= 135][ldir < 225] { text-placements: 'S'; }
      [ldir >= 225][ldir < 315] { text-placements: 'W'; }
    }

After integrating this style into a more complete OSM stylesheet you can see
that most of the point labels are now avoiding the roads.

![](/tilemill/assets/pages/labels-ldir.png)

