---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "Conditional styles"
permalink: /docs/guides/conditional-styles
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "[Added an earthquake CSV layer](/tilemill/docs/crashcourse/point-data) from the Crash Course."
nextup:
- "[Adding tooltips](/tilemill/docs/crashcourse/tooltips/) to your map."
- "[Exporting](/tilemill/docs/crashcourse/exporting/) your map."
---

{% include prereq.html %}

You can use conditional Carto styles to change the appearance of the points on your map based on attributes in the data. In the [tutorial on adding layers](/tilemill/docs/tutorials/point-data), you created a map of earthquakes. Here, you can customize those earthquake points based on the magnitude of the quake.

1. Review the available data for the layer in the feature inspector.
  ![Feature inspector](/tilemill/assets/pages/feature-inspector-1.png)
2. Find the column called `Magnitude` and examine the range of values. This will help you decide how to scale the points.
  ![Feature inspector](/tilemill/assets/pages/feature-inspector-2.png)
3. Add the following Carto rule to the bottom of your stylesheet. The `marker-width` property controls the size of the point. This Carto rule sets a larger `marker-width` for features that have a larger `Magnitude` value.

        #earthquakes {
          [Magnitude >= 2.5] { marker-width:3; }
          [Magnitude >= 3]   { marker-width:4; }
          [Magnitude >= 3.5] { marker-width:5; }
          [Magnitude >= 4]   { marker-width:6; }
          [Magnitude >= 4.5] { marker-width:7; }
          [Magnitude >= 5]   { marker-width:8; }
          [Magnitude >= 5.5] { marker-width:9; }
          [Magnitude >= 6]   { marker-width:10; }
        }

4. Click the **Save** button to save your project and trigger the map preview to update.
  ![Save project](/tilemill/assets/pages/save-project.png)
5. Use the map preview to confirm that the style is working. Adjust the Carto rule until you are satisfied.
  ![Conditional style](/tilemill/assets/pages/conditional-style-1.png)

{% include nextup.html %}
