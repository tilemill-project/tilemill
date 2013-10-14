---
layout: docs
section: help
category: guides
tag: Guides
title: "High-Resolution Tiles"
permalink: /docs/guides/high-resolution-tiles
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
---

{% include prereq.html %}

<!-- WIP, feel free to chip in -->

TileMill includes a number of features that make it easy to create high-resolution versions of map designs, for example to display on Apple Retina displays. Providing an alternative, high-resolution tileset will allow you to keep your maps looking crisp and readable on phones, tablets, and other devices with very high pixel density. You can use client-side code (eg. MapBox.js) to detect devices that report high pixel density and display your high-resolution version, while falling back to normal tiles for all other clients.

To create a higher-resolution set of tiles, go to your TileMill project's settings (via the wrench icon at the top-right) and look for the slider named **Scale Factor**. Increasing this will increase the thickness of lines, scale of icons, and size of text. It will also adjust zoom level filters to help account for these changes (keeping similar feature density, relative sizes, etc).

## Clipped labels and markers

Increasing the **Scale Factor** also increases the likelihood of clipped labels and markers. To help avoid this, add a `buffer-size` property to your project's `Map` object. The default value is `128`, so try doubling that to start. Eg:

    Map {
        background-color: #fff;
        buffer-size: 256;
    }

You can also increase the *MetaTile size* property in the project settings. See [Understanding metatiles](/tilemill/docs/guides/metatiles/) for full details.

## Patterns & Textures

Scale Factor will not make adjustments for line-patterns or polygon-patterns. If you want these to be scaled up for your Retina version, you should include double-scale assets in your project and swap them out when you do your retina export. For example you could have two folders for images, `images_1x` and `images_2x`, then use a [symbolic link](http://en.wikipedia.org/wiki/Symbolic_link) to create a virtual folder named `images` that your TileMill project can reference. You would then adjust the reference location of the symlink to match your current scale factor.
