---
layout: docs
section: help
category: guides
tag: Guides
title: "Understanding Metatiles"
permalink: /docs/guides/metatiles
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
---

{% include prereq.html %}

TileMill displays maps in small seamless chunks referred to as [tiles](http://mapbox.com/developers/guide/#tiles_and_zoom_levels). Although displayed individually, TileMill generates groups of images at once in batches before separating them into the final tiles - this improves efficiency in various ways.

When designing maps in TileMill it is sometimes necessary to understand how metatiles work in order to create your style effectively and work around certain types of issues. Metatile settings play a particularly important role when working with labels, markers, and patterns in your stylesheet.

## Structure of a metatile

There are two main parts to a metatile: the tiles and the buffer. By default a metatile in TileMill consists of 4 tiles (arranged 2 wide and 2 high) and a _buffer_ of 256 pixels around the tiles.

<img src="/tilemill/assets/pages/metatile.png" width='50%' height='50%' alt='metatile diagram' />

The area within the buffer is drawn but never displayed - the purpose is to allow labels, markers, and other things that cross over the edge of a metatile to display correctly. Without a buffer you would notice many cut-off labels and icons along the seams between every other tile.

## Adjusting metatile settings

TileMill allows you to configure the number of tiles included in a metatile as well as the width of the buffer.

To adjust the number of tiles, open the project settings (wrench icon) and drag the MetaTile size slider to your desired size. The number represents how many tiles high and wide your metatile will be, thus the total number of tiles in each batch will be the square of this value.

Adjusting the width of the buffer is done in CartoCSS. Add a `buffer-size` property to your `Map` object. The value must be a whole number and represents pixel units. Example:

    Map {
      background-color: white;
      buffer-size: 256;
    }

<!-- TODO: Why & when; specific details -->
