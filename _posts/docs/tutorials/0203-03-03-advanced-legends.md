---
layout: book
section: documentation
category: TileMill
tag: tutorials
title: "Advanced legends"
permalink: /docs/tutorials/advanced-legends
---

When designing a legend for TileMill that requires more than plain text, there are a few paths you can take. An image, html/css, or a combination. Both have their advantages and disadvantages.

### Insert an image

For complex graphics and those that feel more comfortable designing in a graphics editor. This involves creating a PNG or JPG and either serving it on the web and linking to it, or [base64-encoding it directly into the legend](/tilemill/docs/tutorials/images-in-tooltips/).

The advantage with images is that you have the ability to design every pixel and they can be as complex as you want. The drawback is that the image is static once it's in the map, and it may not be as easy to update, as you need the original file and software that can read it.

### HTML/CSS

For simpler, table-like designs and those that feel more comfortable designing with code.
This involves creating the layout and styling for the legend elements in the same way one would build a web page.

The advantage with html/css is that you can quickly make edits to the legend directly in TileMill, and maintain the ability to manipulate the legend styling with css even after the map has been exported to MBTile format. However, you are limited to right angles and solid colors, and may have to write many lines of code to create a relatively simple design.

Another big advantage with html/css is that you can easily pass the source code from project to project and person to person.