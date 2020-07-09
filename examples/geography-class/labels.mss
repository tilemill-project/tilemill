/* Fonts and font sets can be assigned to variables. The first font
   will be preferred, and fall back to subsequent fonts for characters
   that are not available, or if the entire font is not available to
   Mapnik. */
@futura_med: "Futura Medium","Function Pro Medium","Ubuntu Regular","Trebuchet MS Regular","DejaVu Sans Book";
@futura_italic: "Futura Medium Italic","Function Pro Medium Italic","Ubuntu Italic","Trebuchet MS Italic","DejaVu Sans Oblique";
@futura_bold: "Futura Bold","Function Pro Bold","Ubuntu Bold","Trebuchet MS Bold","DejaVu Sans Bold";

/* ---- Countries ---- */
#country-name {
  text-face-name: @futura_med;
  text-fill:@line * 0.6;
  text-size:9;
  text-transform:uppercase;
  text-halo-fill:rgba(255,255,255,0.5);
  text-halo-radius:1;
  text-line-spacing:1;
  text-wrap-width:20;
  text-name:"''"; /* hackish? */
  
  [ScaleRank<2][zoom=2] {
    text-name: "[ABBREV]";
  }
  [ScaleRank<3][zoom=3] {
    text-name: "[ABBREV]";
    text-size:10;
  }
  [ScaleRank<4][zoom=4] {
    text-name: "[NAME]";
    text-size:11;
  }
  [ScaleRank<5][zoom=5] {
    text-name: "[NAME]";
    text-size:12;
    text-character-spacing:1;
    text-line-spacing:1;
  }
  [ScaleRank<9][zoom>5] {
    text-name: "[NAME]";
    text-size:14;
    text-character-spacing:2;
    text-line-spacing:2;
  }

}

/* ---- CITIES ---- */
#cities[WORLDCITY=1][zoom>4] {
  text-name: "[NAME]";
  text-fill: @line * 0.3;
  text-face-name:@futura_med;
  text-size: 11;
  text-dy: -4;
  text-halo-fill: rgba(255,255,255,0.5);
  text-halo-radius: 1;
  point-file: url(icons/circle-7.png);
}

#cities[ADM0CAP=1][zoom>3] {
  text-name: "[NAME]";
  text-fill: @line * 0.3;
  text-face-name:@futura_med;
  text-size: 11;
  text-dy: -5;
  text-halo-fill: rgba(255,255,255,0.5);
  text-halo-radius: 1;
  point-file: url(icons/star-10.png);
}

/* ---- GEOGRAPHIC LINES ---- */
#geo-lines[zoom>1][ScaleRank<10]{ 
  text-dy:-7;
  text-name:"[Name]";
  text-face-name:@futura_med;
  text-fill:@line;
  text-placement:line;
  text-spacing:600;
}
