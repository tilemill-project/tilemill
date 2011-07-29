@font_reg: "Ubuntu Regular","Arial Regular","DejaVu Sans Book";

/* ---- HIGHWAY ---- */

.highway-label {
  text-face-name:@font_reg;
  text-halo-radius:1;
  text-placement:line;
  text-name:"''";
  [TYPE='motorway'][zoom>=12] {
    text-name:"[NAME]";
    text-fill:spin(darken(@motorway,70),-15);
    text-halo-fill:lighten(@motorway,8);
    [zoom>=13] { text-size:11; }
    [zoom>=15] { text-size:12; }
  }
  [TYPE='trunk'][zoom>=12] {
    text-name:"[NAME]";
    text-fill:spin(darken(@trunk,70),-15);
    text-halo-fill:lighten(@trunk,8);
    [zoom>=15] { text-size:11; }
  }
  [TYPE='primary'][zoom>=13] {
    text-name:"[NAME]";
    text-fill:spin(darken(@primary,70),-15);
    text-halo-fill:lighten(@primary,8);
    [zoom>=15] { text-size:11; }
  }
  [TYPE='secondary'][zoom>=13] {
    text-name:"[NAME]";
    text-fill:spin(darken(@secondary,70),-15);
    text-halo-fill:lighten(@secondary,8);
    [zoom>=15] { text-size:11; }
  }
  [TYPE='residential'][zoom>=15],
  [TYPE='road'][zoom>=15],
  [TYPE='tertiary'][zoom>=15],
  [TYPE='unclassified'][zoom>=15] {
    text-name:"[NAME]";
    text-fill:#444;
    text-halo-fill:#fff;
  }
}

/* ---- LOCATION ---- */

.location[PLACE='city'][zoom>6][zoom<14] {
  text-face-name:@font_reg;
  text-name:"[NAME]";
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

.location[PLACE='town'][zoom>6][zoom<15] {
  text-face-name:@font_reg;
  text-name:"[NAME]";
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

.location[PLACE='hamlet'][zoom>14][zoom<18],
.location[PLACE='suburb'][zoom>14][zoom<18] {
  text-face-name:@font_reg;
  text-name:"[NAME]";
  text-fill:#555;
  text-halo-fill:rgba(255,255,255,0.8);
  text-halo-radius:2;
  text-wrap-width:100;
  [zoom=15] {
    text-size:11;
    text-character-spacing:2;
    text-wrap-width:50;
    text-line-spacing:2;
  }
  [zoom=16] {
    text-size:13;
    text-character-spacing:4;
    text-wrap-width:80;
    text-line-spacing:4;
  }
  [zoom=17] {
    text-size:15;
    text-character-spacing:8;
    text-wrap-width:100;
    text-line-spacing:8;
  }
}
