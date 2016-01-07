---
layout: docs
section: help
category: reference
tag: Reference
title: Project settings
permalink: /docs/manual/project-settings
---
You can adjust a variety project settings using the **Settings** panel. The panel is divided into three sections.

## Project

You can set the name, description, bounding box and other metadata for the project on the **Project** tab.

## Tooltips

The **Tooltips** tab allows you to make your maps interactive with dynamic tooltips that appear when you hover or click on a feature (any point or polygon). The tooltips can contain HTML and are useful for revealing additional data or images about the data on the map.

First, select the **Layer** that you would like to use for interaction data. TileMill only supports one interactive layer at a time. After selecting a layer, the available data fields for the layer will be listed in the form of [Mustache](http://mustache.github.com/) tags.

These tags can be used in Location, Teaser, or Full fields and they will be replaced with the appropriate value when you interact with the map.

By default, the **Teaser** content appears when you hover over a feature and the **Full** content appears when you click on the feature.

You can use the **Location** field to define a URL to be loaded when a feature is clicked.

### Allowed HTML

For security, unsafe HTML in tooltips is sanitized and JavaScript code is removed. If you want to build sophisticated map interaction with JavaScript on your own website, you can write custom code using the [Wax](http://mapbox.com/wax/) library.

## Legend

The **Legend** tab allows to you to create a legend for your map. Use it to explain what the colors and symbols used in your map mean. By default, the legend is always visible.

![Example legend]({{site.baseurl}}/assets/manual/legend.png)

Like tooltips, the HTML in legends is sanitized for security.

