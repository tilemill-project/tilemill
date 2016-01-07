@font_reg: "Ubuntu Regular","Arial Regular","DejaVu Sans Book";

/* ---- HIGHWAY ---- */

#road-label {
  text-face-name:@font_reg;
  text-halo-radius:1;
  text-placement:line;
  text-name:"''";
  [type='motorway'][zoom>=12] {
    text-name:"[name]";
    text-fill:spin(darken(@motorway,50),-15);
    text-halo-fill:lighten(@motorway,15);
    [zoom>=13] { text-size:11; }
    [zoom>=15] { text-size:12; }
  }
  [type='trunk'][zoom>=12] {
    text-name:"[name]";
    text-fill:spin(darken(@trunk,50),-15);
    text-halo-fill:lighten(@trunk,15);
    [zoom>=15] { text-size:11; }
  }
  [type='primary'][zoom>=13] {
    text-name:"[name]";
    text-fill:spin(darken(@primary,50),-15);
    text-halo-fill:lighten(@primary,15);
    [zoom>=15] { text-size:11; }
  }
  [type='secondary'][zoom>=13] {
    text-name:"[name]";
    text-fill:spin(darken(@secondary,50),-15);
    text-halo-fill:lighten(@secondary,15);
    [zoom>=15] { text-size:11; }
  }
  [type='residential'][zoom>=15],
  [type='road'][zoom>=15],
  [type='tertiary'][zoom>=15],
  [type='unclassified'][zoom>=15] {
    text-name:"[name]";
    text-fill:#444;
    text-halo-fill:#fff;
  }
}

/* ---- LOCATION ---- */

#places[type='city'][zoom>6][zoom<14] {
  text-face-name:@font_reg;
  text-name:"[name]";
  text-fill:#444;
  text-halo-fill:rgba(255,255,255,0.8);
  text-halo-radius:2;
  text-transform:uppercase;
  [zoom=11] {
    text-size:12;
    text-character-spacing:2;
  }
  [zoom=12] {
    text-size:14;
    text-character-spacing:4;
  }
  [zoom=13] {
    text-size:16;
    text-character-spacing:8;
  }
}

#places[type='town'][zoom>6][zoom<15] {
  text-face-name:@font_reg;
  text-name:"[name]";
  text-fill:#444;
  text-halo-fill:rgba(255,255,255,0.8);
  text-halo-radius:2;
  text-transform:uppercase;
  text-size:9;
  [zoom=11] {
    text-size:10;
    text-character-spacing:1;
  }
  [zoom=12] {
    text-size:11;
    text-character-spacing:2;
  }
  [zoom=13] {
    text-size:12;
    text-character-spacing:3;
  }
  [zoom=14] {
    text-size:14;
    text-character-spacing:4;
  }
}

#places[type='hamlet'][zoom>13][zoom<18],
#places[type='suburb'][zoom>13][zoom<18],
#places[type='neighbourhood'][zoom>14][zoom<18] {
  text-face-name:@font_reg;
  text-name:"[name]";
  text-fill:#555;
  text-halo-fill:rgba(255,255,255,0.8);
  text-halo-radius:2;
  text-wrap-width:100;
  text-wrap-before:true;
  [zoom=15] {
    text-size:11;
    text-character-spacing:1;
    text-wrap-width:50;
    text-line-spacing:1;
  }
  [zoom=16] {
    text-size:13;
    text-character-spacing:2;
    text-wrap-width:80;
    text-line-spacing:2;
  }
  [zoom=17] {
    text-size:15;
    text-character-spacing:4;
    text-wrap-width:100;
    text-line-spacing:4;
  }
}
