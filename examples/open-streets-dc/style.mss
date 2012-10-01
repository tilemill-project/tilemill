/**********************************************************

Open Streets, DC
================

*An example of street-level map design.*

Data used by this map is © OpenStreetMap contributors, 
CC-BY-SA. See <http://openstreetmap.org> for more info.

This map makes use of OpenStreetMap-based shapefiles
provided by Mike Migurski at <http://metro.teczno.com>.
You can swap out the DC data with any other shapefiles 
provided by CloudMade to get a map of your area.

Data was clipped to the DC boundary with the following command:

    for i in *.shp; do
        ogr2ogr -clipsrc DcQuadPly_900913.shp \
        $(echo $i | sed 's/[a-z\-]*\.//') $i
    done


***********************************************************/

/* ---- PALETTE ---- */

@water:#c0d8ff;
@park:#cea;
@land:#f3faff;

Map {
  background-color:@land;
}

#water {
  polygon-fill:@water;
  polygon-gamma:0.5; // reduces gaps between shapes
}

#landusages[zoom>6] {
  [type='forest'],
  [type='wood'] {
    polygon-fill:@park;
    polygon-pattern-file:url(images/wood.png);
    polygon-pattern-comp-op:multiply;
  }
  [type='cemetery'],
  [type='common'],
  [type='golf_course'],
  [type='park'],
  [type='pitch'],
  [type='recreation_ground'],
  [type='village_green'] {
    polygon-fill:@park;
  }
}

#landusages[zoom>=12] {
  [type='school'],
  [type='college'],
  [type='university'] {
    polygon-fill: #f8e8c8;
  }
}
