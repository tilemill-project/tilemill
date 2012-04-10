/* ---- PALETTE ---- */

@motorway: #F8D6E0; /* #90BFE0 */
@trunk: #FFFABB;
@primary: @trunk;
@secondary: @trunk;
@road: #bbb;
@track: @road;
@footway: #6B9;
@cycleway: #69B;

/* ---- ROAD COLORS ---- */

/*.highway.line { line-color: #f00; } /* debug */

.highway[TYPE='motorway'] {
  .line[zoom>=7]  { 
    line-color:spin(darken(@motorway,36),-10);
    line-cap:round;
    line-join:round;
  }
  .fill[zoom>=10] {
    line-color:@motorway;
    line-cap:round;
    line-join:round;
  }
}

.highway[TYPE='motorway_link'] {
  .line[zoom>=7]  { 
    line-color:spin(darken(@motorway,36),-10);
    line-cap:round;
    line-join:round;
  }
  .fill[zoom>=12] {
    line-color:@motorway;
    line-cap:round;
    line-join:round;
  }
}

.highway[TYPE='trunk'],
.highway[TYPE='trunk_link'] {
  .line[zoom>=7] {
    line-color:spin(darken(@trunk,36),-10);
    line-cap:round;
    line-join:round;
  }
  .fill[zoom>=11] {
    line-color:@trunk;
    line-cap:round;
    line-join:round;
  }
}

.highway[TYPE='primary'],
.highway[TYPE='primary_link'] {
  .line[zoom>=7] {
    line-color:spin(darken(@primary,36),-10);
    line-cap:round;
    line-join:round;
  }
  .fill[zoom>=12] {
    line-color:@primary;
    line-cap:round;
    line-join:round;
  }
}

.highway[TYPE='secondary'] {
  .line[zoom>=8] {
    line-color:spin(darken(@secondary,36),-10);
    line-cap:round;
    line-join:round;
  }
  .fill[zoom>=12] {
    line-color:@secondary;
    line-cap:round;
    line-join:round;
  }
}

.highway[TYPE='secondary_link'] {
  .line[zoom>=12] {
    line-color:spin(darken(@secondary,36),-10);
    line-cap:round;
    line-join:round;
  }
  .fill[zoom>=14] {
    line-color:@secondary;
    line-cap:round;
    line-join:round;
  }
}

.highway[TYPE='living_street'],
.highway[TYPE='residential'],
.highway[TYPE='road'],
.highway[TYPE='tertiary'],
.highway[TYPE='unclassified'] {
  .line[zoom>=10] {
    line-color:@road;
    line-cap:round;
    line-join:round;
  }
  .fill[zoom>=14] {
    line-color:#fff;
    line-cap:round;
    line-join:round;
  }
}

.highway[TYPE='service'] {
  .line[zoom>=13] {
    line-color:@road;
    line-cap:round;
    line-join:round;
  }
  .fill[zoom>=16] {
    line-color:#fff;
    line-cap:round;
    line-join:round;
  }
}

.highway[TYPE='track'] {
  .line[zoom>=13] {
    line-color:@track;
    line-cap:round;
    line-join:round;
  }
}

.highway[TYPE='footway'],
.highway[TYPE='path'],
.highway[TYPE='pedestrian'] {
  .line[zoom>=14] {
    line-color:@footway;
    line-cap:round;
    line-join:round;
  }
}

.highway[TYPE='cycleway'] {
  .line[zoom>=14] {
    line-color:@cycleway;
    line-cap:round;
    line-join:round;
  }
}

/* ---- ROAD WIDTHS ---- */

.highway[zoom=7] {
  .line[TYPE='motorway'] { line-width: 1.0; }
  .line[TYPE='trunk']    { line-width: 0.8; }
  .line[TYPE='primary']  { line-width: 0.6; }
}

.highway[zoom=8] {
  .line[TYPE='motorway'] { line-width: 1.0; }
  .line[TYPE='trunk']    { line-width: 0.8; }
  .line[TYPE='primary']  { line-width: 0.5; }
  .line[TYPE='secondary']{ line-width: 0.3; }
}

.highway[zoom=9] {
  .line[TYPE='motorway'] { line-width: 1.0; }
  .line[TYPE='trunk']    { line-width: 0.8; }
  .line[TYPE='primary']  { line-width: 0.6; }
  .line[TYPE='secondary']{ line-width: 0.4; }
}

.highway[zoom=10] {
  .line[TYPE='motorway'] { line-width: 0.8 + 1.6; }
  .fill[TYPE='motorway'] { line-width: 0.8; }
  
  .line[TYPE='trunk']    { line-width: 1.4; }
  
  .line[TYPE='primary']  { line-width: 1.2; }
  
  .line[TYPE='secondary']{ line-width: 0.8; }
  
  .line[TYPE='living_street'],
  .line[TYPE='residential'],
  .line[TYPE='road'],
  .line[TYPE='tertiary'],
  .line[TYPE='unclassified'] { line-width: 0.2; }
}

.highway[zoom=11] {
  .line[TYPE='motorway']      { line-width: 1.0 + 1.8; }
  .fill[TYPE='motorway']      { line-width: 1.0; }
  .line[TYPE='trunk']         { line-width: 0.8 + 1.6; }
  .fill[TYPE='trunk']         { line-width: 0.8; }
  .line[TYPE='primary']       { line-width: 1.4; }
  .line[TYPE='secondary']     { line-width: 1.0; }
  
  .line[TYPE='motorway_link'] { line-width: 0.6; }
  .line[TYPE='trunk_link']    { line-width: 0.5; }
  .line[TYPE='primary_link']  { line-width: 0.4; }
  
  .line[TYPE='living_street'],
  .line[TYPE='residential'],
  .line[TYPE='road'],
  .line[TYPE='tertiary'],
  .line[TYPE='unclassified'] { line-width: 0.4; }
}

.highway[zoom=12] {
  .line[TYPE='motorway']      { line-width: 1.2 + 2; }
  .fill[TYPE='motorway']      { line-width: 1.2; }
  .line[TYPE='trunk']         { line-width: 1.0 + 1.8; }
  .fill[TYPE='trunk']         { line-width: 1.0; }
  .line[TYPE='primary']       { line-width: 0.8 + 1.6; }
  .fill[TYPE='primary']       { line-width: 0.8; }
  .line[TYPE='secondary']     { line-width: 0.8 + 1.6; }
  .fill[TYPE='secondary']     { line-width: 0.8; }
  
  .line[TYPE='motorway_link'] { line-width: 1.0 + 1.8; }
  .fill[TYPE='motorway_link'] { line-width: 1.0; }
  .line[TYPE='trunk_link']    { line-width: 0.8 + 1.6; }
  .fill[TYPE='trunk_link']    { line-width: 0.8; }
  .line[TYPE='primary_link']  { line-width: 0.8 + 1.6; }
  .fill[TYPE='primary_link']  { line-width: 0.8; }
  .line[TYPE='secondary_link']  { line-width: 0.8; }
  
  .line[TYPE='living_street'],
  .line[TYPE='residential'],
  .line[TYPE='road'],
  .line[TYPE='tertiary'],
  .line[TYPE='unclassified']  { line-width: 0.6; }
}

.highway[zoom=13] {
  .line[TYPE='motorway']      { line-width: 2.0 + 2; }
  .fill[TYPE='motorway']      { line-width: 2.0; }
  .line[TYPE='trunk']         { line-width: 1.4 + 2; }
  .fill[TYPE='trunk']         { line-width: 1.4; }
  .line[TYPE='primary']       { line-width: 1.2 + 2; }
  .fill[TYPE='primary']       { line-width: 1.2; }
  .line[TYPE='primary_link'],
  .line[TYPE='secondary']     { line-width: 1.0 + 2; }
  .fill[TYPE='primary_link'],
  .fill[TYPE='secondary']     { line-width: 1.0; }
  
  .line[TYPE='motorway_link'] { line-width: 1.0 + 2; }
  .fill[TYPE='motorway_link'] { line-width: 1.0; }
  .line[TYPE='trunk_link']    { line-width: 1.0 + 2; }
  .fill[TYPE='trunk_link']    { line-width: 1.0; }
  .line[TYPE='primary_link']  { line-width: 1.0 + 2; }
  .fill[TYPE='primary_link']  { line-width: 1.0; }
  .line[TYPE='secondary_link']{ line-width: 0.8; }
  
  .line[TYPE='living_street'],
  .line[TYPE='residential'],
  .line[TYPE='road'],
  .line[TYPE='tertiary'],
  .line[TYPE='unclassified']  { line-width: 1.0; }
  .line[TYPE='service']       { line-width: 0.5; }
  
  .line[TYPE='track']         { line-width: 0.5; line-dasharray:2,3; }
}

.highway[zoom=14] {
  .line[TYPE='motorway']      { line-width: 4 + 2; }
  .fill[TYPE='motorway']      { line-width: 4; }
  .line[TYPE='trunk']         { line-width: 3 + 2; }
  .fill[TYPE='trunk']         { line-width: 3; }
  .line[TYPE='primary']       { line-width: 2 + 2; }
  .fill[TYPE='primary']       { line-width: 2; }
  .line[TYPE='secondary']     { line-width: 2 + 2; }
  .fill[TYPE='secondary']     { line-width: 2; }
  
  .line[TYPE='motorway_link'] { line-width: 1.4 + 2; }
  .fill[TYPE='motorway_link'] { line-width: 1.4; }
  .line[TYPE='trunk_link']    { line-width: 1.2 + 2; }
  .fill[TYPE='trunk_link']    { line-width: 1.2; }
  .line[TYPE='primary_link']  { line-width: 1.0 + 2; }
  .fill[TYPE='primary_link']  { line-width: 1.0; }
  .line[TYPE='secondary_link']{ line-width: 0.8 + 2; }
  .fill[TYPE='secondary_link']{ line-width: 0.8; }
  
  .line[TYPE='living_street'],
  .line[TYPE='residential'],
  .line[TYPE='road'],
  .line[TYPE='tertiary'],
  .line[TYPE='unclassified']  { line-width: 1.6 + 1.6; }
  .fill[TYPE='living_street'],
  .fill[TYPE='residential'],
  .fill[TYPE='road'],
  .fill[TYPE='tertiary'],
  .fill[TYPE='unclassified']  { line-width: 1.6; }
  .line[TYPE='service']       { line-width: 0.6; }
  
  .line[TYPE='track']         { line-width: 0.6; line-dasharray:2,3; }
  
  .line[TYPE='cycleway'],
  .line[TYPE='footway'],
  .line[TYPE='path'],
  .line[TYPE='pedestrian'] {
    line-dasharray:1,2;
    line-width:0.6;
  }
}

.highway[zoom=15] {
  .line[TYPE='motorway']      { line-width: 6 + 2; }
  .fill[TYPE='motorway']      { line-width: 6; }
  .line[TYPE='trunk']         { line-width: 5 + 2; }
  .fill[TYPE='trunk']         { line-width: 5; }
  .line[TYPE='primary']       { line-width: 4 + 2; }
  .fill[TYPE='primary']       { line-width: 4; }
  .line[TYPE='secondary']     { line-width: 4 + 2; }
  .fill[TYPE='secondary']     { line-width: 4; }
  
  .line[TYPE='motorway_link'] { line-width: 2 + 2; }
  .fill[TYPE='motorway_link'] { line-width: 2; }
  .line[TYPE='trunk_link']    { line-width: 1.6 + 2; }
  .fill[TYPE='trunk_link']    { line-width: 1.6; }
  .line[TYPE='primary_link']  { line-width: 1.4 + 2; }
  .fill[TYPE='primary_link']  { line-width: 1.4; }
  .line[TYPE='secondary_link']{ line-width: 1.0 + 2; }
  .fill[TYPE='secondary_link']{ line-width: 1.0; }
  
  .line[TYPE='living_street'],
  .line[TYPE='residential'],
  .line[TYPE='road'],
  .line[TYPE='tertiary'],
  .line[TYPE='unclassified']  { line-width: 4 + 2; }
  .fill[TYPE='living_street'],
  .fill[TYPE='residential'],
  .fill[TYPE='road'],
  .fill[TYPE='tertiary'],
  .fill[TYPE='unclassified']  { line-width: 4; }
  .line[TYPE='service']       { line-width: 1; }
  
  .line[TYPE='track']         { line-width: 1; line-dasharray:2,3; }
  
  .line[TYPE='cycleway'],
  .line[TYPE='footway'],
  .line[TYPE='path'],
  .line[TYPE='pedestrian'] {
    line-dasharray:1,2;
    line-width:0.8;
  }
}

.highway[zoom=16] {
  .line[TYPE='motorway']      { line-width: 9 + 3; }
  .fill[TYPE='motorway']      { line-width: 9; }
  .line[TYPE='trunk']         { line-width: 8 + 2.5; }
  .fill[TYPE='trunk']         { line-width: 8; }
  .line[TYPE='primary']       { line-width: 7 + 2; }
  .fill[TYPE='primary']       { line-width: 7; }
  .line[TYPE='secondary']     { line-width: 6 + 2; }
  .fill[TYPE='secondary']     { line-width: 6; }
  
  .line[TYPE='motorway_link'] { line-width: 3 + 2.5; }
  .fill[TYPE='motorway_link'] { line-width: 3; }
  .line[TYPE='trunk_link']    { line-width: 2 + 2; }
  .fill[TYPE='trunk_link']    { line-width: 2; }
  .line[TYPE='primary_link']  { line-width: 1.8 + 2; }
  .fill[TYPE='primary_link']  { line-width: 1.8; }
  .line[TYPE='secondary_link']{ line-width: 1.4 + 2; }
  .fill[TYPE='secondary_link']{ line-width: 1.4; }
  
  .line[TYPE='living_street'],
  .line[TYPE='residential'],
  .line[TYPE='road'],
  .line[TYPE='tertiary'],
  .line[TYPE='unclassified']  { line-width: 6 + 2; }
  .fill[TYPE='living_street'],
  .fill[TYPE='residential'],
  .fill[TYPE='road'],
  .fill[TYPE='tertiary'],
  .fill[TYPE='unclassified']  { line-width: 6; }
  .line[TYPE='service']       { line-width: 1.4 + 2; }
  .fill[TYPE='service']       { line-width: 1.4; }
  
  .line[TYPE='track']         { line-width: 1.2; line-dasharray:2,3; }
  
  .line[TYPE='cycleway'],
  .line[TYPE='footway'],
  .line[TYPE='path'],
  .line[TYPE='pedestrian'] {
    line-dasharray:1,2;
    line-width:1.0;
  }
}

.highway[zoom>=17] {
  .line[TYPE='motorway']      { line-width: 13 + 3; }
  .fill[TYPE='motorway']      { line-width: 13; }
  .line[TYPE='trunk']         { line-width: 10 + 2.5; }
  .fill[TYPE='trunk']         { line-width: 10; }
  .line[TYPE='primary']       { line-width: 9 + 2; }
  .fill[TYPE='primary']       { line-width: 9; }
  .line[TYPE='secondary']     { line-width: 8 + 2; }
  .fill[TYPE='secondary']     { line-width: 8; }
  
  .line[TYPE='motorway_link'] { line-width: 4 + 2.5; }
  .fill[TYPE='motorway_link'] { line-width: 4; }
  .line[TYPE='trunk_link']    { line-width: 3.5 + 2; }
  .fill[TYPE='trunk_link']    { line-width: 3.5; }
  .line[TYPE='primary_link']  { line-width: 3 + 2; }
  .fill[TYPE='primary_link']  { line-width: 3; }
  .line[TYPE='secondary_link']{ line-width: 2.5 + 2; }
  .fill[TYPE='secondary_link']{ line-width: 2.5; }
  
  .line[TYPE='living_street'],
  .line[TYPE='residential'],
  .line[TYPE='road'],
  .line[TYPE='tertiary'],
  .line[TYPE='unclassified']  { line-width: 8 + 2; }
  .fill[TYPE='living_street'],
  .fill[TYPE='residential'],
  .fill[TYPE='road'],
  .fill[TYPE='tertiary'],
  .fill[TYPE='unclassified']  { line-width: 8; }
  
  .line[TYPE='service']       { line-width: 2 + 2; }
  .fill[TYPE='service']       { line-width: 2; }
  
  .line[TYPE='track']         { line-width: 1.4; line-dasharray:2,3; }
  
  .line[TYPE='cycleway'],
  .line[TYPE='footway'],
  .line[TYPE='path'],
  .line[TYPE='pedestrian'] {
    line-dasharray:2,3;
    line-width:1.2;
  }
}

/* ---- ONE WAY ARROWS ---- */

.highway.fill::oneway_arrow[zoom>15][ONEWAY='yes'] {
  marker-type:arrow;
  marker-width:2;
  marker-line-width:1;
  marker-line-opacity:0.5;
  marker-line-color:#fff;
  marker-spacing: 200;
  marker-fill:spin(darken(@motorway,50),-10);
  marker-opacity:0.8;
}
