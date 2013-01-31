---
layout: docs
section: help
category: guides
tag: Guides
title: "Styling Lines"
permalink: /docs/guides/styling-lines
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
---

{% include prereq.html %}

Line styles can be applied to both line and polygon layers. The simplest line styles have just a `line-width` (in pixels) and a `line-color` making a single solid line. The default values for these properties are `1` and `black` respectively if they are not specified.

<img src='/tilemill/assets/pages/styling-lines-1.png' class='fig-right' />

    // country land borders
    #admin_0_lines {
      line-width: 0.75;
      line-color: #426;
    }
    
## Dashed lines
    
Simple dashed lines can be created with the `line-dasharray` property. The value of this property is a comma-separated list of pixel widths that will alternatively be applied to dashes and spaces. This style draws a line with 10 pixel dashes separated by 4 pixel spaces:

<img src='/tilemill/assets/pages/styling-lines-2.png' class='fig-right' />

    #admin_1_line {
      line-width: 0.5;
      line-color: #426;
      line-dasharray: 10, 4;
    }
    
You can make your dash patterns as complex as you want, with the limitation that the dasharray values must all be whole numbers.

<img src='/tilemill/assets/pages/styling-lines-3.png' class='fig-right' />

    #admin_1_line {
      line-width: 0.5;
      line-color: #426;
      line-dasharray: 10, 3, 2, 3;
    }
    
## Caps & Joins

With thicker line widths you'll notice long points at sharp angles and odd gaps on small polygons

<img src='/tilemill/assets/pages/styling-lines-4.png' class='fig-right' />

    #countries::bigoutline {
      line-color: #9ed1dc;
      line-width: 20;
    }

You can adjust the angles with the `line-join` property: `round` or `square` them off (the default is called `miter`). The gaps can be filled by setting `line-cap` to `round` or `square` (the default is called `butt`).

<img src='/tilemill/assets/pages/styling-lines-5.png' class='fig-right' />

    #countries::bigoutline {
      line-color: #9ed1dc;
      line-width: 20;
      line-join: round;
      line-cap: round;
    }

For dashed lines, line-caps are applied to each dash and their additional length is not included in the dasharray definition. Notice how the following style creates almost-solid lines despite the dasharray defining a gap of 4 pixels.

<img src='/tilemill/assets/pages/styling-lines-6.png' class='fig-right' />

    #layer {
      line-width: 4;
      line-cap: round;
      line-dasharray: 10, 4;
    }

<!-- TODO: ## Roads with casing -->

<!-- TODO: ## Tunnels and railroads -->
