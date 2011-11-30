/***********************************************************************

'Road Trip'
===========

A map of the United States inspired by the impossible-to-fold maps in
your glovebox.

***********************************************************************/

@land: #fff1cf;
@water: #C0E0F8;
@waterline: #8CE;

Map {
  background-color:@water;
}

#countries::outline {
  line-color:@waterline;
  line-width:1.6;
}
#countries::fill {
  polygon-fill:@land;
  polygon-gamma:0.75;
  [ADM0_A3='USA'] { polygon-fill:lighten(@land, 7); }
}

#lake[zoom>=0][ScaleRank<=2],
#lake[zoom>=1][ScaleRank=3],
#lake[zoom>=2][ScaleRank=4],
#lake[zoom>=3][ScaleRank=5],
#lake[zoom>=4][ScaleRank=6],
#lake[zoom>=5][ScaleRank=7],
#lake[zoom>=6][ScaleRank=8],
#lake[zoom>=7][ScaleRank=9] {
  ::outline { line-color:@waterline; }
  ::fill { polygon-fill:@water; }
}

.park { line-color:#AD9; }
.park.area { polygon-fill:#DEB; }

#country_border::glow[zoom>2] {
  line-color:#F60;
  line-opacity:0.33;
  line-width:4;
}

#country_border { line-color:#408; }
#country_border[zoom<3] { line-width:0.4; }
#country_border[zoom=3] { line-width:0.6; }
#country_border[zoom=4] { line-width:0.8; }
#country_border[zoom=5] { line-width:1.0; }

#country_border_marine {
  line-color:#A06;
  line-dasharray:8,2;
  line-opacity:0.3;
  line-width:0.8;
}

#state_line::glow[ADM0_A3='USA'],
#state_line::glow[ADM0_A3='CAN'] {
  [zoom>2] {
    line-color:#FD0;
    line-opacity:0.2;
    line-width:3;
  }
}
#state_line[ADM0_A3='USA'],
#state_line[ADM0_A3='CAN'] {
  [zoom>2] {
    line-dasharray:2,2,10,2;
    line-width:0.6;
  }
}
