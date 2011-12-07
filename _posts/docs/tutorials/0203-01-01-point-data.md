---
layout: book
section: documentation
category: TileMill
tag: tutorials
title: Point data
permalink: /docs/tutorials/point-data
code1: |
  <strong>Total Funding: {{{Fund}}}</strong><br />
  <em>Type of Research: {{{Type}}}</em><br />
  Year: {{{Year}}}<br />
  Technological Sophistication: {{{Tech}}}<br />
  Number of Researchers: {{{Numb}}}<br />
---
Here's what we'll cover:

* Apply and adjust styles based on zoom levels
* Highlighting relationships within datasets

## Overview

Let's say you have point data representing research locations across the United States that have received funding from the Department of Energy. It came as a csv but you've converted it to geojson format. The attributes contain the following information (with their corresponding column headings):

* Total amount of funding awarded (FUND)
* Number of full-time researchers at this location (NUMB)
* Year(s) funding was provided (YEAR)
* Kind of research funded (i.e. solar power, wind, geo-thermal, etc.) (TYPE)
* Technological sophistication of the facility (TECH)

Note: this sample data can be downloaded as [geojson](https://tilemill-data.s3.amazonaws.com/tutorials/hypotheticaldoedata.geojson) and the original as [csv](https://tilemill-data.s3.amazonaws.com/tutorials/hypotheticaldoedata.csv).

You can represent all of this information using TileMill, but you will have to make your own decisions about how to emphasize different aspects of the data. The following examples of styling provide just *one* of many ways of doing this, and they are not particularly tailored to telling any real stories with this data (as, upon very brief inspection, it is very *fake*). The main purpose of this article is to expose some general syntactical and logical elements of Carto by discussing general styling issues along side this example, which should help inspire you to branch out from this with your own ideas or alternative stylings for your own projects.

## Getting Started

For instructions on installing and starting TileMill, visit [TileMill.com](http://tilemill.com).

First, create a new project and find the default is a world map with grey country outlines. Modify the styles as you wish. For help, remember to check the [MSS reference sheet](http://tilemill.com/pages/manual.html#code-editor) built into TileMill. To help visualize this sample data, we've also added in a basic line shapefile for the state boundaries.

Now, let's import the sample data by copying and pasting the url to the GeoJSON into the TileMill "Add Layer" window.

![](/tilemill/assets/pages/styling-points1.jpg)

Now we can jump into styling our data.

## Zoom Levels

One of the most powerful features of a good map is its ability to tell multiple stories from a general (in this case) nationwide perspective down to a local level, ideally as granular as possible. Consider the following Carto style for this example's data points:

    #data { 
        marker-height: 5;
        marker-line-color: #024d75;
        marker-fill: #024d75;
    }

This style will give every point the same radius at every zoom level, leaving you with a national view that (depending on the size of your data set) will be covered in blue circles, looking something like this: 

![](/tilemill/assets/pages/styling-points2.jpg)

While this looks cluttered at a national level, at a higher zoom level, the marker style looks more appropriate: 


![](/tilemill/assets/pages/styling-points3.jpg)


To avoid this ambiguous cluttering, tailor the way your data points are represented to each zoom level:

    #data {
        [zoom>9] { marker-height: 4; }
        [zoom>6][zoom<10] { marker-height: 3; }
        [zoom>3][zoom<7] { marker-height: 2; }
        [zoom<4] { marker-height: 1; }
    }

For those unfamiliar with Carto or CSS, these command lines are essentially "If/Then" conditional rules. You have a condition, say `[zoom>9]`, and if this is satisfied, then TileMill applies the subsequent command(s) contained within the curly braces. This code gives you marker heights increasing in radius as you zoom farther into the map, which allows for a cleaner presentation of the data at every level.

## Intra-data Relationships

Each dataset has its own nuances and certain kinds of information are better suited for a particular mode of presentation than others. Making decisions on how to highlight certain facets of the data requires careful consideration of how the facets relate to others in the dataset.

### Styling "Kinds" of Data

In this example, we have essentially two different "kinds" of data: quantitative and qualitative. Let's suppose you want to focus on the amount of funding each of these research centers received (quantitative data). One way to demonstrate this visually is by changing the radius of the markers based on the amount of funding associated with each data point. Using what we learned about conditional rules, we can use *nested* conditional rules (conditional rules within conditional rules) to vary marker height first by zoom level and then by amount of funding. Here is some sample text to demonstrate this:

    #data {
      [Fund<100000] {
        [zoom>0][zoom<5]{ marker-height: 2; }
        [zoom>4][zoom<10] { marker-height: 3; }
        [zoom>9] { marker-height: 4.5; }
        }
      [Fund>=1000000][Fund<5000000] {
        [zoom>0][zoom<5] { marker-height: 4; }
        [zoom>4][zoom<10] { marker-height: 6; }
        [zoom>9] { marker-height: 9; }
        }    
      [Fund>=5000000][Fund<8000000] {
        [zoom>0][zoom<5] {marker-height: 6; }
        [zoom>4][zoom<10] { marker-height: 8; }
        [zoom>9] { marker-height: 13.5; }
        } 
      [Fund>=8000000] { 
        [zoom>0][zoom<5] { marker-height: 8; }
        [zoom>4][zoom<10] { marker-height: 12; }
        [zoom>9] { marker-height: 18; }
        }
    }

This will allow you to compare recipient funding by basic geographic location. But what if you also wanted to compare recipient funding by type of research? Using color is a good way to compare qualitatively different sections of your data. An added bonus of using color is that it does not typically have to vary by zoom level, so we can put our color conditionals outside of the nested conditionals above (right after `#data {` and before `[Fund<100000]`). 

    [Type="Geo-thermal"] {
      marker-line-color: #7a0404;
      marker-fill: #7a0404;
    }
    [Type="Solar"] {
      marker-line-color: #855a03;
      marker-fill: #855a03;
    }

    [Type="Wind"] {
      marker-line-color: #2c7502;
      marker-fill: #2c7502;
    }
    [Type="Hydro-electric"] {
      marker-line-color: #2f389e;
      marker-fill: #2f389e;
    }
    [Type="Nuclear"] {
      marker-line-color: #2f9e95;
      marker-fill: #2f9e95;
    }

Adding this styling within #data{ } (and outside the nested conditionals) will give you a map with two main features: (1) five kinds of colors representing what kind of research each recipient is doing and (2) varying radiuses of your points based on the amount of money that recipient received from the DOE. You could easily show the amount of funding by year or technological sophistication instead by changing the conditions of these rules as well. 

###Overlapping Data

Typically, when you are working with point-data at fairly low zoom levels, you will have overlapping data points. TileMill only shows as many points as it can without overlapping any, so, to avoid losing your data a low zoom levels, you will have to manually allow point-data to overlap. You can change this with a style rule. You can also make the marker points transparent to give the viewer as sense of which clusters of points are more dense. Try these style rules:

    marker-allow-overlap: true;     /* allow markers to overlap      */
    marker-opacity: .5;             /* set the marker to 50% opacity */
    marker-line-opacity: .5;        /* set the line to 50% opacity   */

These commands could also apply well to all zoom levels, so put them outside your zoom level conditionals if you are okay with overlapping points at all zooms, otherwise you would need to nest the `marker-allow-overlap` within sections only pertaining to certain zoom levels.

###Interactivity

It is tempting to try and present the entire contents of a dataset visually on the map. Unfortunately, this usually gives the map a cluttered look and makes telling any individual story confusing.

To mitigate the tension between complex datasets and available space, TileMill provides an interactivity feature that allows users to reveal various aspects of the data as they hover over data points. By clicking on the interactivity section of the settings menu above and to the right of the style sheet, you can enter tokens for the column values you'd like to appear from a particular layer. Using some html, here's a basic sample of what you might use for the above example:

<pre>{{page.code1|xml_escape}}</pre>

With all of these suggestions implemented, you can come up with a map looking something like this, at a high zoom level:

![](/tilemill/assets/pages/styling-points4.jpg)

