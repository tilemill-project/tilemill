---
layout: book
section: documentation
category: TileMill
tag: Guides
title: "Tips for Using Color in Maps"
permalink: /docs/guides/tips-for-color
prereq:
- "[Installed](/tilemill/docs/install) TileMill on your computer."
- "Reviewed [Crash Course](/tilemill/docs/crashcourse/introduction/)"
nextup:
- "[Using conditional styles](/tilemill/docs/guides/conditional-styles/) to control the appearance of points based on data."
- "[Adding tooltips](/tilemill/docs/crashcourse/tooltips/) to your map."
- "[Exporting](/tilemill/docs/crashcourse/exporting/) your map."
---
{% include prereq.html %}

## Color Theory and Mapping  

It's important to realize how much your choice of color on a map can affect the story you are trying to tell with your data. As a brief introduction to some theories behind how to use colors on maps, here are three primary scheming designs for mapping data.  

### Sequential Schemes  
Sequential schemes order data from high to low, accenting the highest as a dark shade and the lowest as a light shade (or vice versa). Sequential schemes are best if you are mapping quantitative data and do not want to focus on one particular range within your data.  
![sequential](/tilemill/assets/pages/sequential.png)

### Diverging Schemes  
Divergent schemes are best at highlighting a particular middle range of quantitative data. Pick two saturated contrasting colors for the extremes of the data, and the middle ranges blend into a lighter mix of the two. This is particularly great for accenting the mean of your data and exposing locations that significantly 'diverge' from the norm.  
![diverging](/tilemill/assets/pages/diverging.png)

### Qualitative Schemes  
If you are working with qualitative data, such as ethnicity or religion, you want to pick a series of 'unrelated' colors. The trick is to pick a really nice color theme so your map looks great. You can also accent particular aspects of your data by your choice of color. For example, one strong dark color among a group of lighter colors will 'pop' out of the map, highlighting that particular facet of your data against all others.  
![qualitative](/tilemill/assets/pages/qualitative.png)

## Sources for Color-Picking  
Fortunately a number of sites are available to explore color themes. Below are links to some of these with a brief synopsis of their main features that will help you more easily navigate the seas of storytelling via aesthetics. The section ends with two reviews of purchasable tools that you can use from your desktop.  

### 0_255  
0_255 is a great site for picking between different shades of one color, so it's ideal for sequential schemes. It gives you thirty options for any given color, allowing you to instantly copy the color's hex code. There is a large grid of colors to select from for an initial color, and then 0_255 visualizes a range of shades based on that color. If the grid does not have the color you want, you can pick your own color by pasting in the hex code of your chosen color.  
![0_255](/tilemill/assets/pages/0_255_0.jpg)

### Color Scheme Designer  
Color Scheme Designer allows you to select a color from a color wheel and presents several options for automatically generating colors complementary to your initial choice. Specifically, you can choose between: 

- Complements  
- Triads  
- Tetrads  
- Analogic  
- Accented Analogic  

Once you've chosen your color and scheme, you'll have a color table that gives you several variations of your colors and their corresponding hex codes.  

![colorscheme](/tilemill/assets/pages/colorschemedesigner_1.jpg)

### Colour Lovers  
Colour Lovers is great if you are looking for a design theme for mapping qualitative data. Active users contribute palettes to the site, and these palettes are searchable, browsable, and ready to be used on your project.  Colour Lovers users also post patterns if you need some spatial inspiration as well.  
![colourlovers](/tilemill/assets/pages/colourlovers_0.jpg)

### Kuler  
Kuler is a service similar to Colour Lovers offered by Adobe. A community of designers submit their own themes, which are available for RGB values and hex codes. The design of the site is a little less intuitive than Colour Lovers, but still worth checking out.  
![kuler](/tilemill/assets/pages/kuler_1.jpg)

There are a lot of great ideas being posted by an active community of contributing users. Kuler also provides extensive links to things like forums, help pages, as well as several articles on the importance of color and color theory.

### Colorbrewer  
Colorbrewer is great for contrasting the three kinds of color models mentioned in the first section of this article. It allows you to test out different color themes based on whether you want sequential, diverging, or qualitative schemes and to vary the number of color classes you want in your pallet (up to 12). It also provides some useful 'further reading' articles on these theories and other cartographic design ideas.  
![colorbrewer](/tilemill/assets/pages/colorbrewer.jpg)

### Pochade  
Pochade is a color picking program that allows you to determine the RGB value and hex code of any color you see on your screen. It also provides a few different ways of manipulating your color, such as changing its HSB, RGB, or CMYK values. This program is available for download for $9.99.  
![pochade](/tilemill/assets/pages/pochade_0.jpg)

### ColorSchemer Studio  
ColorSchemer Studio provides three main features: (1) a color class generator (up to 254 - many more than Color Brewer) based on two colors of your choice, (2) a 'PhotoSchemer', which allows you to upload a photo and determine up to ten different colors on your chosen photo and (3) integration with colourlovers, including a color browser and the ability to load colors into the first tool to manipulate on your own. ColorSchemer is a powerful tool for your desktop, available for the slightly higher price of $49.99.  

{% include nextup.html %}