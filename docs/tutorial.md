Tutorial - First Project
------------------------

This section will introduce you to the TileMill editing interface and
the Mess styling language.

### Interface tour ###

To begin, open up TileMill in your web browser. A default local
installation will run at <http://localhost:8889> — see the setup notes
for more information.

The main page gives you visual overview of all your TileMill projects.
With a fresh installation, this list will be empty.

Let’s start by making a Project. Enter a name like ‘hello-world’ into
the NAME box and click the ‘Add project’ button (or hit the Enter key).
We’re now in the editing interface for a new TileMill map - as you can
see a new project starts with an example layer and style. 

#### Main Toolbar

Along the top is the main toolbar. Here you can see the Project name,
view & edit basic information about it, save changes if any have been
made, and switch interface modes.

#### Layer manager & explorer

Here we can add and re-order different pieces of GIS data. Currently
TileMill can read ESRI Shapefiles and GeoJSON, but there are plans to
eventually add support for PostGIS databases, GeoTIFFs, and more. 

The data in each layer can also be explored by clicking on the
magnifying glass icon (this appears when you hover your cursor over the
layer). In the data explorer, you will see a list of all of the data
columns that exist in a particular source. Click on the eye icon of any
of these items to see a summary of the data they contain. 

For example, explore the default ‘#world’ layer and look at the summary
of the SUBREGION column. As noted by the italic text, this column
contains integer data - in other words, whole numbers. At the top of the
summary we see the smallest (MIN) and largest (MAX) numbers in this
column, and below that a list of all the unique values (some of these
might exist multiple times in the data set, but they will only be listed
once here).

Now explore the NAME section. This column contains string data - in
other words, free text. Again we see all of the unique values listed,
but the MIN and MAX rows work a bit differently here. For string data,
MIN will show you the column with the least number of characters, and
MAX shows the row with the most number of characters. (In the case of a
tie for character counts, only the first match is shown - see the ISO3
column, for example.)

The other type of data a column can contain is a float, or
floating-point number. This is a number that can contain digits after a
decimal point.

#### Map preview

Above the layer list on the left is a preview of the
map. This is a ‘slippy map’ - you can click and drag your mouse to move
the view around, and zoom in and out with your scrollwheel or trackpad.

The map preview tells you what zoom level it is currently showing (which
is useful to know when creating or testing styles) and also has a
full-page mode toggle so you can quickly get a bigger picture.

#### The editing pane

The biggest section on the screen is the editing pane where you will
edit Cascadenik stylesheets. It features syntax-highlighting including a
distinction between valid and invalid keywords, as well as a tabbed
interface so you can split complex styles across multiple files if you
wish.

Along the bottom of the the editing pane are some tools that should make
working with the stylesheet a bit easier - a color palette, a font list,
and a color selector.

The palette of swatches on the left displays all the colors already in
use in the stylesheet. Clicking on one of the swatches will insert it
into the stylesheet at the cursor’s position. This feature is useful
when you want to reuse a color from one rule in another, such as making
river lines the same color as lakes.

In the middle is a selector list of all the fonts available for use in
the stylesheet. Selecting a font from this list will insert it (quoted)
at the position of the cursor in the editing pane.

On the right is a color selector for getting hexadecimal color codes.
Click on the dropper icon and a color wheel will pop out of the corner.
Selecting a color will give you its six-digit hex code, which you can
then copy and paste into the editing pane.

### Editing the Cascadenik stylesheet ###

Take a look at the example stylesheet already in place. If you are
familiar with CSS, the format should look familiar, though the
properties are different:

    Map {
      background-color: #fff;
    }

    #world {
      polygon-fill: #eee;
      line-color: #ccc;
      line-width: 0.5;
    }

#### The Map background

The first line starts a new style that will be applied to the `<Map>`
element. This element (the container that every other part of the map
goes inside) only has one property in Cascadenik - `background-color`.  Right
now it is set to white (`#fff`) - go ahead and change it to something
else. If you are unfamiliar with hexadecimal color codes, click on the
eye-dropper in the bottom-right corner to bring up the color picker
wheel. Select and copy the resulting code, then paste it over the
original.

Notice that now that the document has been edited, a Save button has
appeared in the top toolbar. If you click it (or use the Control-S
keyboard shortcut) the document will save and the preview in the
bottom-right will be updated.

#### Line Styles

Line objects require 2 styles in Cascadenik to be drawn by Mapnik:

	.my-lines {
	    line-color: #863;
	    line-width: 2;
	}

@TODO: The rest of this section is totally wrong for mess.js

In Mapnik, it is possible to draw multiple line styles on a single line
object. In Cascadenik, this is not possible in the same way because of
the way rules cascade and can override each other. As a compromise,
Cascadenik gives us two extra sets of styles for lines - inlines and
outlines. 

_Inlines_ are lines that are drawn on top of the main line. They can be
dashed, transparent, and have different cap or join styles. They can
even be wider than the main line if you are trying to achieve a certain
effect.

_Outlines_ are lines that are drawn below the regular line. If your
line-opacity is set to less than 1, you will be able to see the rest of
the outline beneath. The value of the outline-width property is not the
width of the entire outline object, but the width of the amount each
side extends from underneath 

They syntax practically the same:

    .my-lines {
        line-color: #863
        line-width: 2;

        inline-color: #fff;
        inline-opacity: 0.5;
        inline-width: 0.6;

        outline-color: #000;
        outline-opacity: 0.25;
        outline-width: 1.2;
    }

Here is an example of a railroad track line style that makes use of both
inlines and outlines.

    Map { background-color: #fff; }

    .railroad {
        outline-color: #888;
        outline-width: 2;
        outline-dasharray: 1,8;

        line-color: #444;
        line-width: 4;

        inline-color: #fff;
        inline-width: 3;
    }

#### Polygon Styles

[explain styles that apply to line objects]

#### Point Styles

[points, marker-symbolizers]

#### Text Styles

blah

#### Shields

Shields combine icon and text to a single symbolizer. This is useful
when...

<!-- vim: set textwidth=72: -->
