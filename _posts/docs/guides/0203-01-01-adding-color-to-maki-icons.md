---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "Adding color to Maki icons"
permalink: /docs/guides/adding-colors-to-maki-icons
prereq:
- "[Reviewed](/tilemill/docs/guides/using-maki-icons) using Maki icons."
nextup:
- "[Tips for using color in maps.](http://mapbox.com/tilemill/docs/guides/tips-for-color)"
---
{% include prereq.html %}

If you have read, [_Using Maki Icons_](http://mapbox.com/tilemill/docs/guides/using-maki-icons) you know that [Maki](http://mapbox.com/maki) is a point of interest (POI) icon set designed to be used on maps. This section demonstrates a recommend approach of adding color to them. 

### 1. Download Maki and open the source file

[Download Maki](http://mapbox.com/maki/maki-icon-source/maki.zip), unzip it, and check out the file labeled __maki-icons.svg__. The .svg extension stands for, "Scalable Vector Graphics" - a file format all common vector graphic applications support. For a solid application we recommend [Inkscape](http://inkscape.org), a free to install, open source graphics editor. Ths tutorial walks through manipulating color using Inkscape although the steps are easily translatable to other applications.

### 2. Create a new icon fill

Let's first set a couple things up in Inkscape:

- Open up the _Layers_ window by pressing __ctrl+shift+l__
- Open up the _Fill and Stroke_ window by pressing __ctrl+shift+f__

Your screen should now look something like this:

![Setting up Inkscape](/tilemill/assets/pages/adding-colors-to-maki-icons-1.png)

Each icon set is grouped together by a unique id. Because of this its important to use
the _Edit paths by node tool_ to select the icon to change its fill
color. This tool is located just below the selection tool on the left
hand pane or by selecting __F2:__ 

![Edit paths by node tool](/tilemill/assets/pages/adding-colors-to-maki-icons-2.png)

With the icons you want selected, You can change the color by
adjusting the fills from the _Fill and Stroke_ window or by selecting
a pre existing swatch from the fill options below. In this example
I have selected each of the three icons in the park set and given these
icons a green color:

![Changing color](/tilemill/assets/pages/adding-colors-to-maki-icons-3.png)

<small class='note' markdown='1'>
<h3>Selecting all icons at once</h3>
Using the __Find tool (ctrl+f)__ you can select all of the icons at
once. By default the icon fills are set to __#444444__ add this value
into the _Style:_ input and press _Find_.
</small>

### 3. Batch export the icons

- On the _icons_ layer select all by pressing __ctrl+a__
- Go to __File -> Export Bitmap__ and __check off 'hide all' and 'batch export'__. These options are located at the bottom of the dialog page just before export.
- Press Export

The icons will batch render themselves as .png's in the same directory the .svg is located in.

<small class='note' markdown='1'>
<h3>Note</h3>
For export purposes, each icon set is grouped by a unique id. If you would like to retain the naming of the icons the sets should not be ungrouped. You can view the naming of each id by right clicking on an object.
</small>

{% include nextup.html %}
